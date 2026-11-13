// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { useFfmpegStatus } from './useFfmpegStatus';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
it('polls background readiness and restores export without reload or another download request', async () => {
  vi.useFakeTimers();
  let ready = false, result: ReturnType<typeof useFfmpegStatus>;
  const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ managed: true, components: [{ id: 'browser', stage: ready ? 'ready' : 'downloading' }], capabilities: { capture: ready, media: true, export: ready } })));
  function View() { result = useFfmpegStatus(); return <span>{String(result.status?.ok)}</span>; }
  const host = document.createElement('div'), root = createRoot(host);
  await act(async () => { root.render(<View />); });
  expect(result!.status?.ok).toBe(false);
  ready = true;
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(result!.status?.ok).toBe(true);
  expect(fetch.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
  act(() => root.unmount());
});

it('keeps a completed retry when an older status request finishes later', async () => {
  let ready = false, reads = 0, release: (response: Response) => void;
  let result: ReturnType<typeof useFfmpegStatus>;
  const response = (available: boolean) => new Response(JSON.stringify({
    managed: true, components: [{ id: 'browser', stage: available ? 'ready' : 'failed' }],
    capabilities: { capture: available, media: true, export: available },
  }));
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    if (init?.method === 'POST') { ready = true; return response(true); }
    if (++reads === 2) return new Promise(resolve => { release = resolve; });
    return response(ready);
  });
  function View() { result = useFfmpegStatus(); return null; }
  const host = document.createElement('div'), root = createRoot(host);
  try {
    await act(async () => { root.render(<View />); });
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await act(async () => { result!.recheck(); });
    expect(result!.status?.ok).toBe(true);
    await act(async () => { release!(response(false)); });
    expect(result!.status?.ok).toBe(true);
  } finally { act(() => root.unmount()); }
});
