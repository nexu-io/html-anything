// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionApp, resolveWorkspaceProject } from './MotionApp';
import { I18nProvider } from '../i18n/I18n';
import { trackMotion } from './tracking';

vi.mock('../App', () => ({ StudioApp: () => null }));
vi.mock('./tracking', () => ({ trackMotion: vi.fn() }));
const id = '11111111-1111-1111-1111-111111111111';
afterEach(() => vi.unstubAllGlobals());
it('resolves a bookmark without switching another page globally', async () => {
  const fetcher = vi.fn(async (url: string, _init?: RequestInit) => new Response(JSON.stringify(url.endsWith('/projects') ? { activeId: 'project', projects: [{ id }, { id: 'project' }] } : { projectId: id })));
  vi.stubGlobal('fetch', fetcher);
  await resolveWorkspaceProject(id, new AbortController().signal);
  expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/motion-api/projects', `/motion-api/preview/open?projectId=${id}`]);
  expect(fetcher.mock.calls[1][1]).toEqual({ method: 'POST', signal: expect.any(AbortSignal) });
});

it('records the root editor as Studio after its active project resolves', async () => {
  const artifact = { id: 'project', kind: 'motion-project', projectId: 'project', title: 'Existing project' };
  const catalog = { activeId: 'project', projects: [{ id: 'project', title: 'Existing project' }], sessions: [{ id: 'project', artifacts: [artifact] }] };
  history.replaceState(null, '', '/');
  vi.mocked(trackMotion).mockClear();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url.endsWith('/projects') ? catalog : url.includes('/sessions/') ? { id: 'project', artifacts: [artifact] } : { projectId: 'project', revision: 'r' },
  ))));
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider><MotionApp /></I18nProvider>));
    expect(trackMotion).toHaveBeenCalledExactlyOnceWith('page_view', expect.objectContaining({ page_name: 'studio', has_project: true }));
  } finally {
    act(() => root.unmount());
    container.remove();
    history.replaceState(null, '', '/');
  }
});
it('invalid, deleted and conflicting links cannot silently open a different project', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ activeId: 'project', projects: [{ id: 'project' }] })));
  vi.stubGlobal('fetch', fetcher);
  await expect(resolveWorkspaceProject('../escape', new AbortController().signal)).rejects.toThrow('项目链接无效');
  expect(fetcher).not.toHaveBeenCalled();
  await expect(resolveWorkspaceProject(id, new AbortController().signal)).rejects.toThrow('项目不存在');
  expect(fetcher).toHaveBeenCalledOnce();
  fetcher.mockImplementation(async () => new Response(JSON.stringify({ error: '正在切换' }), { status: 409 }));
  await expect(resolveWorkspaceProject('project', new AbortController().signal)).rejects.toThrow('正在切换');
});
it('warms an already selected bookmark before mounting its editor', async () => {
  const fetcher = vi.fn(async (_url: string) => new Response(JSON.stringify({ activeId: id, projects: [{ id }] })));
  vi.stubGlobal('fetch', fetcher);
  await resolveWorkspaceProject(id, new AbortController().signal);
  expect(fetcher.mock.calls[1][0]).toBe(`/motion-api/preview/open?projectId=${id}`);
});
it('does not mount a bookmark when its scoped native context cannot open', async () => {
  const fetcher = vi.fn(async (url: string) => new Response(JSON.stringify(url.endsWith('/projects') ? { projects: [{ id }] } : { error: 'Native opening timed out' }), { status: url.endsWith('/projects') ? 200 : 400 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(resolveWorkspaceProject(id, new AbortController().signal)).rejects.toThrow('Native opening timed out');
});

it.each(['deleted project', 'empty session'])('keeps the project drawer reachable from a %s', async route => {
  const artifact = { id: 'project', kind: 'motion-project', projectId: 'project', title: 'Existing project' };
  const catalog = { activeId: 'project', projects: [{ id: 'project', title: 'Existing project' }], sessions: [{ id: 'project', artifacts: [artifact] }] };
  history.replaceState(null, '', route === 'empty session' ? `/?session=${id}` : `/?project=${id}`);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url.endsWith('/projects') ? catalog : url.includes('/sessions/') ? { id, artifacts: [] } : { projectId: 'project', revision: 'r' },
  ))));
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider><MotionApp /></I18nProvider>));
    const toggle = container.querySelector<HTMLButtonElement>('.motion-workspace-menu');
    expect(toggle).not.toBeNull();
    await act(async () => toggle!.click());
    expect(document.querySelector('.motion-session')?.textContent).toContain('Existing project');
  } finally {
    act(() => root.unmount());
    container.remove();
    history.replaceState(null, '', '/');
  }
});

it('shows the brand while opening and exposes failures instead of leaving the splash stuck', async () => {
  let fail!: (error: Error) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((_resolve, reject) => { fail = reject; })));
  history.replaceState(null, '', '/?project=project');
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<I18nProvider><MotionApp /></I18nProvider>));
    expect(container.querySelector('[role="status"] .motion-loading-mark')).not.toBeNull();
    await act(async () => fail(new Error('Project unavailable')));
    expect(container.querySelector('.motion-loading')).toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Project unavailable');
  } finally {
    act(() => root.unmount());
    container.remove();
    history.replaceState(null, '', '/');
  }
});
