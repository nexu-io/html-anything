// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { resolveWorkspaceProject } from './MotionApp';

vi.mock('../App', () => ({ StudioApp: () => null }));
const id = '11111111-1111-1111-1111-111111111111';
afterEach(() => vi.unstubAllGlobals());
it('resolves a bookmark without switching another page globally', async () => {
  const fetcher = vi.fn(async (url: string, _init?: RequestInit) => new Response(JSON.stringify(url.endsWith('/projects') ? { activeId: 'project', projects: [{ id }, { id: 'project' }] } : { projectId: id })));
  vi.stubGlobal('fetch', fetcher);
  await resolveWorkspaceProject(id, new AbortController().signal);
  expect(fetcher.mock.calls.map(call => call[0])).toEqual(['/motion-api/projects', `/motion-api/preview/open?projectId=${id}`]);
  expect(fetcher.mock.calls[1][1]).toEqual({ method: 'POST', signal: expect.any(AbortSignal) });
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
