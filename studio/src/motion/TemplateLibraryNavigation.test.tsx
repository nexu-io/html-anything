// @vitest-environment happy-dom
import React, { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { MotionApp } from './MotionApp';
import { I18nProvider } from '../i18n/I18n';
import { WorkspaceFrame, useWorkspaceChrome } from './WorkspaceFrame';

const editor = vi.hoisted(() => ({ mounts: 0, unmounts: 0 }));
vi.mock('./tracking', () => ({ trackMotion: vi.fn() }));
// Keep workspace routing, polling and the library real; replace only the native editor.
vi.mock('./ArtifactViewer', () => ({ ArtifactViewer: () => {
  const { openLibrary } = useWorkspaceChrome();
  useEffect(() => { editor.mounts++; return () => { editor.unmounts++; }; }, []);
  return <div data-testid="editor"><input aria-label="Editor draft" defaultValue="Unsaved edit" />
    <button onClick={event => openLibrary(event.currentTarget)}>Open template library</button></div>;
} }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); history.replaceState(null, '', '/'); });

function workspace(existing: boolean, options: { status?: 'failed' | 'pending'; create?: () => Promise<Response> } = {}) {
  const projectId = existing ? '11111111-1111-1111-1111-111111111111' : 'project';
  const sessionId = existing ? '22222222-2222-2222-2222-222222222222' : 'project';
  const artifact = { id: 'artifact', kind: 'motion-project', projectId, title: 'Original project' };
  const session = { id: sessionId, artifacts: [artifact] };
  const catalog = { activeId: projectId, projects: [{ id: projectId }], sessions: [session] };
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/project/status')) {
      if (options.status === 'failed') return Response.json({ error: 'Status unavailable' }, { status: 503 });
      if (options.status === 'pending') return new Promise<Response>(() => {});
    }
    if (url.endsWith('/sessions') && init?.method === 'POST' && options.create) return options.create();
    return Response.json(
    url.includes('/template-catalog') ? { items: [{ id: 'product-promo', title: 'Product Promo', kind: 'builtin', tags: [] }], next: null, catalogVersion: 'test' }
    : url.endsWith('/projects') ? catalog
    : url.includes('/sessions/') ? session : { projectId, revision: 'r' },
    );
  });
  vi.stubGlobal('fetch', fetcher);
  return { projectId, sessionId, fetcher };
}

async function closeLibrary(container: HTMLElement, method: string) {
  await act(async () => {
    if (method === 'escape') container.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    else container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.click();
  });
}

it.each([false, true])('dismisses the installation library in place without remounting a prepared editor (existing=%s)', async existing => {
  const { fetcher } = workspace(existing);
  const assign = vi.spyOn(location, 'assign').mockImplementation(() => {});
  const replace = vi.spyOn(location, 'replace').mockImplementation(() => {});
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    for (const method of ['close', 'escape']) {
      assign.mockClear(); replace.mockClear();
      editor.mounts = 0; editor.unmounts = 0; fetcher.mockClear();
      history.replaceState(null, '', '/?templates=1&embed=1');
      await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp key={method} /></I18nProvider>));
      expect(container.querySelector('dialog[aria-label="Template library"]')).not.toBeNull();
      const preparedEditor = container.querySelector('[data-testid="editor"]');
      if (existing) expect(preparedEditor).not.toBeNull();
      else {
        expect(preparedEditor).toBeNull();
        expect(fetcher.mock.calls.some(([url]) => url.includes('/preview/open'))).toBe(false);
      }
      const previewRequests = () => fetcher.mock.calls.filter(([url]) => url.includes('/preview/open')).length;
      const preparedRequests = previewRequests();
      await closeLibrary(container, method);
      if (preparedEditor) expect(previewRequests()).toBe(preparedRequests);
      expect(replace).not.toHaveBeenCalled(); expect(assign).not.toHaveBeenCalled();
      expect(new URLSearchParams(location.search).has('templates')).toBe(false);
      expect(new URLSearchParams(location.search).get('embed')).toBe('1');
      expect(container.querySelector('[data-testid="editor"]')).not.toBeNull();
      if (preparedEditor) expect(container.querySelector('[data-testid="editor"]')).toBe(preparedEditor);
      expect(container.querySelector('dialog[aria-label="Template library"]')).toBeNull();
      expect(container.querySelector('[role="alert"]')).toBeNull();
    }
  } finally { act(() => root.unmount()); container.remove(); }
});

it.each(['failed', 'pending'] as const)('allows installation-library dismissal while status is %s without enabling project creation', async status => {
  const { fetcher } = workspace(false, { status });
  const replace = vi.spyOn(location, 'replace').mockImplementation(() => {});
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    for (const method of ['close', 'escape']) {
      replace.mockClear(); history.replaceState(null, '', '/?templates=1&embed=1');
      await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp key={method} /></I18nProvider>));
      expect(container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.disabled).toBe(false);
      expect(container.textContent).not.toContain('Preparing editable project…');
      if (status === 'failed') expect(container.textContent).toContain('Status unavailable');
      await act(async () => container.querySelector<HTMLButtonElement>('[data-template-id="product-promo"] button')!.click());
      const open = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('Open and edit'))!;
      expect(open.disabled).toBe(true);
      await act(async () => { open.click(); container.querySelector<HTMLButtonElement>('button[aria-label="Close template preview"]')!.click(); });
      await closeLibrary(container, method);
      expect(container.querySelector('dialog[aria-label="Template library"]')).toBeNull();
      expect(replace).not.toHaveBeenCalled();
      expect(new URLSearchParams(location.search).has('templates')).toBe(false);
    }
    expect(fetcher.mock.calls.some(([url, init]) => init?.method === 'POST' && !url.includes('/preview/open'))).toBe(false);
  } finally { act(() => root.unmount()); container.remove(); }
});

it('still blocks dismissal while project creation is in flight and allows it after failure', async () => {
  let finish!: (response: Response) => void;
  workspace(false, { create: () => new Promise(resolve => { finish = resolve; }) });
  history.replaceState(null, '', '/?templates=1&embed=1');
  const replace = vi.spyOn(location, 'replace').mockImplementation(() => {});
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp /></I18nProvider>));
    await act(async () => container.querySelector<HTMLButtonElement>('[data-template-id="product-promo"] button')!.click());
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes('Open and edit'))!.click());
    expect(container.textContent).toContain('Preparing editable project…');
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.disabled).toBe(true);
    await closeLibrary(container, 'escape');
    expect(container.querySelector('dialog[aria-label="Template library"]')).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
    await act(async () => finish(Response.json({ error: 'Creation failed' }, { status: 503 })));
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.disabled).toBe(false);
    await closeLibrary(container, 'close');
    expect(replace).not.toHaveBeenCalled();
    expect(new URLSearchParams(location.search).has('templates')).toBe(false);
  } finally { act(() => root.unmount()); container.remove(); }
});

it('keeps the editor write guard active while the template library is open', async () => {
  workspace(true); history.replaceState(null, '', '/?templates=1&embed=1');
  const onClose = vi.fn(), container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider initialLocale="en"><WorkspaceFrame blocked waitForSaves={async () => {}} onLibraryClose={onClose}>Editor</WorkspaceFrame></I18nProvider>));
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.disabled).toBe(true);
    await closeLibrary(container, 'close'); await closeLibrary(container, 'escape');
    expect(container.querySelector('dialog[aria-label="Template library"]')).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  } finally { act(() => root.unmount()); container.remove(); }
});

it.each([false, true])('keeps the original editor mounted when its library closes (embedded=%s)', async embedded => {
  const { projectId, sessionId, fetcher } = workspace(true);
  const url = `/?session=${sessionId}&project=${projectId}${embedded ? '&embed=1' : ''}#project/${projectId}`;
  history.replaceState(null, '', url);
  const assign = vi.spyOn(location, 'assign').mockImplementation(() => {});
  const replace = vi.spyOn(location, 'replace').mockImplementation(() => {});
  editor.mounts = 0; editor.unmounts = 0;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp /></I18nProvider>));
    const draft = container.querySelector<HTMLInputElement>('input[aria-label="Editor draft"]')!;
    draft.value = 'Keep my unsaved edit';
    const trigger = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Open template library')!;
    const requests = fetcher.mock.calls.length;
    for (const method of ['close', 'escape']) {
      await act(async () => trigger.click());
      expect(container.querySelector('dialog[aria-label="Template library"]')).not.toBeNull();
      await closeLibrary(container, method);
      expect(container.querySelector('dialog[aria-label="Template library"]')).toBeNull();
      expect(container.querySelector('input[aria-label="Editor draft"]')).toBe(draft);
      expect(draft.value).toBe('Keep my unsaved edit');
      expect(document.activeElement).toBe(trigger);
      expect(location.search + location.hash).toBe(url.slice(1));
    }
    expect(editor).toEqual({ mounts: 1, unmounts: 0 });
    expect(assign).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled();
    expect(fetcher.mock.calls.slice(requests).some(([url]) => url.includes('/preview/open') || url.includes('/sessions/'))).toBe(false);
  } finally { act(() => root.unmount()); container.remove(); }
});
