// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { editorEntryVisibility, allEditorEntriesVisible, visibleEditorPanels, type EditorEntryVisibility } from './editorEntryVisibility';
import { StudioHostContext } from './StudioHost';
import { PANEL_IDS } from '../components/dock/panelRegistry';
import { ContextMenu } from '../components/sidebar/AssetContextMenu';
import { PropertyPanelEmptyState } from '../components/editor/PropertyPanelEmptyState';
import { PropertyPanelFlatFooter } from '../components/editor/PropertyPanelFlatFooter';
import { GpuEncodingToggle } from '../components/renders/GpuEncodingToggle';
import { TimelineToolbar } from '../components/TimelineToolbar';
import { usePlayerStore } from '../player/store/playerStore';

vi.mock('../contexts/StudioContext', () => ({ useStudioShellContextOptional: () => ({
  previewIframeRef: { current: null }, editHistory: { canUndo: true, canRedo: true }, handleUndo: vi.fn(), handleRedo: vi.fn(),
}) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const roots: Root[] = [];
afterEach(() => { act(() => roots.splice(0).forEach(root => root.unmount())); document.body.innerHTML = ''; });
function render(children: React.ReactNode, entries: EditorEntryVisibility = editorEntryVisibility) {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); roots.push(root);
  act(() => root.render(<StudioHostContext.Provider value={{ entryVisibility: entries }}>{children}</StudioHostContext.Provider>));
  return { host, root };
}
it('retains native IDs and required panels, excludes only configured panels, and restores them', () => {
  const ids = [...PANEL_IDS];
  expect(visibleEditorPanels(editorEntryVisibility)).toEqual(PANEL_IDS.filter(id => !['code', 'variables', 'motionBlur', 'history'].includes(id)));
  expect(visibleEditorPanels(allEditorEntriesVisible)).toEqual(ids);
  expect(visibleEditorPanels({ ...editorEntryVisibility, codePanel: true })).toContain('code');
  expect(PANEL_IDS).toEqual(ids);
});
it('hides recording in both the empty inspector and footer while retaining Ask Agent', () => {
  const ask = vi.fn(), record = vi.fn();
  const { host } = render(<><PropertyPanelEmptyState multiSelectCount={0} flat /><PropertyPanelFlatFooter onAskAgent={ask} onToggleRecording={record} /></>);
  expect(host.textContent).not.toContain('Record a gesture');
  expect(host.querySelector('[data-flat-footer-record]')).toBeNull();
  act(() => host.querySelector<HTMLButtonElement>('[data-flat-footer-ask]')!.click());
  expect(ask).toHaveBeenCalledOnce(); expect(record).not.toHaveBeenCalled();
});
it('restores recording controls using the complete configuration', () => {
  const { host } = render(<PropertyPanelFlatFooter onToggleRecording={vi.fn()} />, allEditorEntriesVisible);
  expect(host.querySelector('[data-flat-footer-record]')).not.toBeNull();
});
it('hides extra asset actions without removing rename and delete', () => {
  const { host } = render(<ContextMenu x={0} y={0} asset="image.png" onClose={vi.fn()} onCopy={vi.fn()} onPreview={vi.fn()} onAddAtPlayhead={vi.fn()} onRename={vi.fn()} onDelete={vi.fn()} downloadUrl="/image.png" />);
  expect([...host.querySelectorAll('[role="menuitem"]')].map(el => el.textContent?.trim())).toEqual(['Rename', 'Delete']);
});
it('hides GPU and timeline controls while leaving recording state unchanged', () => {
  usePlayerStore.setState({ autoKeyframeEnabled: true });
  const { host } = render(<><GpuEncodingToggle format="mp4" checked onToggle={vi.fn()} disabled={false} /><TimelineToolbar /></>);
  expect(host.textContent).not.toContain('Use GPU encoding');
  for (const label of ['Toggle ripple edit', 'Auto-record manual edits as keyframes', 'Toggle linked selection', 'Undo']) {
    expect(host.querySelector(`[aria-label="${label}"]`)).toBeNull();
  }
  expect(usePlayerStore.getState().autoKeyframeEnabled).toBe(true);
  expect(host.querySelector('[aria-label="Toggle timeline snapping"]')).not.toBeNull();
});
