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
