// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MotionEditorFrame, MotionStudioHost } from './MotionStudioHost';
import { StudioHeader } from '../components/StudioHeader';
import { useMotionHistoryOperation } from './MotionHistoryState';

const state = vi.hoisted(() => ({
  renderQueue: { isRendering: false, ffmpegMissing: false },
  open: vi.fn(), export: vi.fn(), setTab: vi.fn(), setCollapsed: vi.fn(),
  undo: vi.fn(), redo: vi.fn(), create: vi.fn(), home: vi.fn(), rename: vi.fn(),
}));
vi.mock('../contexts/StudioContext', () => ({ useStudioShellContext: () => ({
  projectId: 'demo', renderQueue: state.renderQueue, waitForPendingDomEditSaves: async () => {},
}), useStudioShellContextOptional: () => ({
  editHistory: { canUndo: true, canRedo: true }, handleUndo: state.undo, handleRedo: state.redo,
}) }));
vi.mock('../contexts/PanelLayoutContext', () => ({ usePanelLayoutContext: () => ({
  rightCollapsed: false, setRightCollapsed: state.setCollapsed, setRightPanelTab: state.setTab,
}) }));
vi.mock('../components/dock/Dock', () => ({ Dock: { WindowMenu: () => <button>Window</button>, Panel: () => null } }));
vi.mock('../utils/studioTelemetry', () => ({ trackStudioEvent: vi.fn() }));
vi.mock('./useWorkspace', () => ({ useWorkspace: () => ({
  status: { projectId: 'demo' }, projects: [{ id: 'demo', title: 'Demo' }, { id: 'second', title: 'Second' }],
  busy: false, error: '', clearError: vi.fn(), open: state.open, openSession: state.open, startSession: state.create, create: state.create, home: state.home, rename: state.rename,
}) }));
vi.mock('./ConnectionDialog', () => ({ ConnectionDialog: ({ open, section, busy, onOpen }: { open: boolean; section: string; busy: boolean; onOpen: (id: string) => void }) =>
  open ? <div role="dialog" aria-label="MCP connections" data-section={section}>
    <button disabled={busy} onClick={() => onOpen('product-promo')}>Open Product Promo</button>
  </div> : null }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  state.renderQueue.isRendering = false;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function HistoryOperationState({ busy }: { busy: boolean }) {
  const { setBusy } = useMotionHistoryOperation();
  React.useEffect(() => setBusy(busy), [busy, setBusy]);
  return null;
}
function render(historyBusy = false) {
  act(() => root.render(<MotionStudioHost><HistoryOperationState busy={historyBusy} /><MotionEditorFrame><StudioHeader captureFrameHref="/frame.png" captureFrameFilename="frame.png"
    handleCaptureFrameClick={vi.fn()} refreshCaptureFrameTime={vi.fn()} inspectorButtonActive={false}
    inspectorPanelActive={false} onExport={state.export} /></MotionEditorFrame></MotionStudioHost>));
}
function openSidebar() {
  act(() => container.querySelector<HTMLButtonElement>('.motion-workspace-menu')!.click());
}
const button = (text: string) => [...container.querySelectorAll('button')].find(el => el.textContent === text)!;

it('keeps project switching, templates, history actions and native export in the MVP', () => {
  render();
  const header = container.querySelector('.motion-studio-header')!;
  openSidebar();
  const project = document.querySelector<HTMLButtonElement>('.motion-session[title="Second"]')!;
  expect(header.contains(project)).toBe(false);
  expect(document.querySelector('.motion-session[aria-current="page"]')?.textContent).toContain('Demo');
  for (const text of ['模板库', '导出']) expect(header.contains(button(text))).toBe(true);
  expect(container.querySelector('.motion-workspace-topbar')).toBeNull();
  for (const text of ['预览', '布局', '历史', '连接 Agent', '新建会话', '首页']) expect(button(text)).toBeUndefined();
  expect(container.querySelector('.motion-save-state')).toBeNull();
  expect(container.querySelector('a[download]')).toBeNull();
  expect(document.querySelector('.motion-brand')?.tagName).toBe('DIV');
  expect(document.querySelector('.motion-sidebar-settings [aria-label="模型设置"]')).toBeNull();
  expect(document.querySelector('.motion-sidebar-settings [aria-label="隐私设置"]')).not.toBeNull();
  expect(header.querySelector('[aria-label="语言"]')).toBeNull();
  expect(document.querySelector('.motion-sidebar-settings [aria-label="语言"]')).not.toBeNull();
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="撤销"]')!.click());
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="重做"]')!.click());
  expect(state.undo).toHaveBeenCalledOnce();
  expect(state.redo).toHaveBeenCalledOnce();
  act(() => button('导出').click());
  expect(state.setTab).toHaveBeenCalledWith('renders');
  expect(state.setCollapsed).toHaveBeenCalledWith(false);
  expect(state.export).toHaveBeenCalledOnce();
  act(() => project.click());
  expect(state.open).toHaveBeenCalledWith('projects', 'second');
  act(() => button('模板库').click());
  expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(container.querySelector('[role="dialog"]')!.getAttribute('data-section')).toBe('templates');
  act(() => button('Open Product Promo').click());
  expect(state.create).toHaveBeenCalledWith(undefined, 'product-promo');
});

it('prevents project replacement during a native render', () => {
  state.renderQueue.isRendering = true;
  render();
  openSidebar();
  expect(document.querySelector<HTMLButtonElement>('.motion-session')!.disabled).toBe(true);
  expect(document.querySelector<HTMLButtonElement>('[aria-label="新建项目"]')!.disabled).toBe(true);
  expect(button('模板库').disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[data-testid="header-export"]')!.disabled).toBe(true);
  expect(container.textContent).toContain('正在渲染…');
});

it('prevents switching projects or issuing competing header undo while a version operation is running', () => {
  render(true);
  openSidebar();
  expect(document.querySelector<HTMLButtonElement>('.motion-session')!.disabled).toBe(true);
  expect(document.querySelector<HTMLButtonElement>('[aria-label="新建项目"]')!.disabled).toBe(true);
  expect(button('模板库').disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="撤销"]')!.disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="重做"]')!.disabled).toBe(true);
  expect(container.textContent).toContain('正在处理版本…');
});

it('searches projects in an overlay and closes it without removing the header brand', () => {
  render();
  expect(document.querySelector('.motion-sidebar-drawer')).toBeNull();
  expect(container.querySelector('.motion-header-brand img')?.getAttribute('alt')).toBe('OpenDesign');
  expect(container.querySelector<HTMLInputElement>('.motion-header-project input')?.value).toBe('Demo');
  openSidebar();
  const drawer = document.querySelector('.motion-sidebar-drawer')!;
  expect(container.contains(drawer)).toBe(false);
  const search = drawer.querySelector<HTMLInputElement>('[aria-label="搜索项目"]')!;
  act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search, 'Second'); search.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(drawer.querySelectorAll('.motion-session')).toHaveLength(1);
  expect(drawer.querySelector('.motion-session')?.textContent).toContain('Second');
  act(() => drawer.querySelector<HTMLButtonElement>('[aria-label="关闭项目列表"]')!.click());
  expect(drawer.hasAttribute('data-closed')).toBe(true);
  expect(container.querySelector('.motion-header-brand img')).not.toBeNull();
});

it('starts with a closed drawer in embeds regardless of the former collapse preference', () => {
  history.replaceState(null, '', '/?embed=1');
  localStorage.setItem('motion.workspace.sidebar.v1', 'expanded');
  render();
  expect(document.querySelector('.motion-sidebar-drawer')).toBeNull();
  expect(container.querySelector('.motion-studio-header .motion-workspace-menu')).not.toBeNull();
  openSidebar();
  expect(document.querySelector('.motion-sidebar-drawer')).not.toBeNull();
  expect(container.querySelector('.motion-studio-header .motion-workspace-menu')).not.toBeNull();
  history.replaceState(null, '', '/');
});

it('saves a project name on blur and keeps empty or cancelled edits from replacing it', async () => {
  state.rename.mockResolvedValue(true);
  render();
  const edit = () => {
    const input = container.querySelector<HTMLInputElement>('[aria-label="项目名称"]')!;
    act(() => input.focus());
    return input;
  };
  const change = (input: HTMLInputElement, value: string) => act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  let input = edit();
  expect(container.querySelector('[aria-label="保存项目名称"]')).toBeNull();
  change(input, ' Updated project ');
  await act(async () => input.blur());
  expect(state.rename).toHaveBeenCalledExactlyOnceWith('demo', 'Updated project');
  expect(container.querySelector('[aria-label="项目名称"]')).toBe(input);
  expect(input.value).toBe('Demo');
  input = edit();
  change(input, '   ');
  await act(async () => input.blur());
  expect(state.rename).toHaveBeenCalledTimes(1);
  input = edit();
  change(input, 'Discard this');
  act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(state.rename).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="项目名称"]')).toBe(input);
  expect(input.value).toBe('Demo');
  input = edit();
  change(input, 'Enter saves');
  await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  expect(state.rename).toHaveBeenLastCalledWith('demo', 'Enter saves');
  expect(state.rename).toHaveBeenCalledTimes(2);
  expect(document.activeElement).not.toBe(input);
  expect(container.querySelector('[aria-label="项目名称"]')).toBe(input);
});
