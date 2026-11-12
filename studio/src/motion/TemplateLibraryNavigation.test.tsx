// @vitest-environment happy-dom
import React, { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { MotionApp } from './MotionApp';
import { I18nProvider } from '../i18n/I18n';
import { useWorkspaceChrome } from './WorkspaceFrame';

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

function workspace(existing: boolean) {
  const projectId = existing ? '11111111-1111-1111-1111-111111111111' : 'project';
  const sessionId = existing ? '22222222-2222-2222-2222-222222222222' : 'project';
  const artifact = { id: 'artifact', kind: 'motion-project', projectId, title: 'Original project' };
  const session = { id: sessionId, artifacts: [artifact] };
  const catalog = { activeId: projectId, projects: [{ id: projectId }], sessions: [session] };
  const fetcher = vi.fn(async (url: string) => Response.json(
    url.includes('/template-catalog') ? { items: [], next: null, catalogVersion: 'test' }
    : url.endsWith('/projects') ? catalog
    : url.includes('/sessions/') ? session : { projectId, revision: 'r' },
  ));
  vi.stubGlobal('fetch', fetcher);
  return { projectId, sessionId, fetcher };
}

async function closeLibrary(container: HTMLElement, method: string) {
  await act(async () => {
    if (method === 'escape') container.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    else container.querySelector<HTMLButtonElement>('button[aria-label="Close template library"]')!.click();
  });
}

it.each([false, true])('returns the installation library to the root editor (existing=%s)', async existing => {
  workspace(existing);
  const assign = vi.spyOn(location, 'assign').mockImplementation(() => {});
  const replace = vi.spyOn(location, 'replace').mockImplementation(() => {});
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    for (const method of ['close', 'escape']) {
      assign.mockClear(); replace.mockClear();
      history.replaceState(null, '', '/?templates=1&embed=1');
      await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp key={method} /></I18nProvider>));
      expect(container.querySelector('dialog[aria-label="Template library"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="editor"]')).toBeNull();
      await closeLibrary(container, method);
      expect(replace).toHaveBeenLastCalledWith('/?embed=1');
      expect(assign).not.toHaveBeenCalled();
      // Follow the document navigation, including the first-run default project.
      history.replaceState(null, '', replace.mock.lastCall![0]);
      await act(async () => root.render(<I18nProvider initialLocale="en"><MotionApp key={`${method}-home`} /></I18nProvider>));
      expect(container.querySelector('[data-testid="editor"]')).not.toBeNull();
      expect(container.querySelector('dialog[aria-label="Template library"]')).toBeNull();
      expect(container.querySelector('[role="alert"]')).toBeNull();
    }
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
