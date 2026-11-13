// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

let diagnostics: typeof import('./diagnostics');
let request: typeof import('./diagnosticRequests');
let stop: () => void;
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers();
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }) });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')));
  diagnostics = await import('./diagnostics'); request = await import('./diagnosticRequests');
  stop = diagnostics.initializeDiagnostics();
  await diagnostics.flushBrowserDiagnostics(); vi.clearAllMocks();
});
afterEach(() => { stop(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('keeps healthy polling and assets silent, and adds no storage or logging requests on the operation path', async () => {
  const storage = vi.spyOn(localStorage, 'setItem');
  for (let i = 0; i < 1000; i++) await request.diagnosticFetch('/motion-api/project/status?projectId=private-project');
  expect(fetch).toHaveBeenCalledTimes(1000); expect(storage).not.toHaveBeenCalled();
  expect(diagnostics.browserDiagnostics().filter(event => event.kind === 'activity_request')).toHaveLength(0);
  await request.diagnosticFetch('/api/projects/private-project/selection', { method: 'POST', body: 'secret-selection' });
  await request.diagnosticFetch('https://private.example/api/projects/x/files/private-name', { method: 'PUT' });
  expect(diagnostics.browserDiagnostics().filter(event => event.kind === 'activity_request')).toHaveLength(0);
  await request.diagnosticFetch('/api/projects/private-project/files/private-file.html?token=private-query', { method: 'PUT', body: 'private-content', headers: { Authorization: 'private-key' } });
  expect(storage).not.toHaveBeenCalled(); expect(fetch).toHaveBeenCalledTimes(1003);
  const events = diagnostics.browserDiagnostics().filter(event => event.kind === 'activity_request');
  expect(events).toHaveLength(2); expect(events[0].message).toContain('outcome=started');
  expect(events[1].message).toContain('status=200'); expect(events[1].message).toContain('durationMs=');
  expect(events[0].message.match(/request=([^ ]+)/)?.[1]).toBe(events[1].message.match(/request=([^ ]+)/)?.[1]);
  expect(JSON.stringify(events)).not.toContain('private-');
  await vi.advanceTimersByTimeAsync(5000);
  expect(storage).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledTimes(1004);
  expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toBe('/motion-api/diagnostics/events');
});

it('retains response and error identity, records HTTP/network/slow results, and ignores cancelled reads', async () => {
  const response = new Response('private-response', { status: 503 });
  vi.mocked(fetch).mockResolvedValue(response);
  expect(await request.diagnosticFetch('/motion-api/project/status')).toBe(response);
  expect(await response.text()).toBe('private-response');
  const failure = new TypeError('private-network-detail'); vi.mocked(fetch).mockRejectedValue(failure);
  await expect(request.diagnosticFetch('/api/projects/private/files/private')).rejects.toBe(failure);
  vi.mocked(fetch).mockRejectedValue(new DOMException('cancelled', 'AbortError'));
  const count = diagnostics.browserDiagnostics().length;
  await expect(request.diagnosticFetch('/motion-api/projects')).rejects.toHaveProperty('name', 'AbortError');
  expect(diagnostics.browserDiagnostics()).toHaveLength(count);
  vi.mocked(fetch).mockImplementation(async () => { vi.advanceTimersByTime(2100); return new Response('ok'); });
  await request.diagnosticFetch('/motion-api/runtime');
  const text = JSON.stringify(diagnostics.browserDiagnostics());
  expect(text).toContain('status=503'); expect(text).toContain('outcome=network_error'); expect(text).toContain('durationMs=2100');
  expect(text).not.toContain('private');
});

it('coalesces repeated errors, bounds a flood, preserves errors separately and reports dropped records', async () => {
  const storage = vi.spyOn(localStorage, 'setItem');
  for (let i = 0; i < 100; i++) diagnostics.recordBrowserDiagnostic('failure', 'api_key=fixture-private repeated');
  expect(diagnostics.browserDiagnostics().filter(event => event.kind === 'failure')).toHaveLength(1);
  for (let i = 0; i < 100; i++) diagnostics.recordBrowserDiagnostic('activity_request', `request=${i} ` + 'detail '.repeat(1000));
  const events = diagnostics.browserDiagnostics();
  expect(events.some(event => event.kind === 'failure')).toBe(true);
  expect(events.length).toBeLessThanOrEqual(60);
  expect(new TextEncoder().encode(JSON.stringify(events)).length).toBeLessThanOrEqual(24 * 1024);
  expect(events.at(-1)?.message).toContain('"repeated":99');
  expect(events.at(-1)?.message).not.toContain('"rateLimited":0');
  expect(storage).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(5000);
  expect(storage).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(fetch).mock.calls)).not.toContain('fixture-private');
  expect(new TextEncoder().encode(localStorage.getItem('motion.local-diagnostics.v1')!).length).toBeLessThanOrEqual(24 * 1024);
});

it('never overlaps logging requests, bounds its timeout, drops failed delivery without retrying, and survives denied storage', async () => {
  vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  vi.mocked(fetch).mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')));
  }));
  diagnostics.recordBrowserDiagnostic('failure', 'first');
  const first = diagnostics.flushBrowserDiagnostics();
  diagnostics.recordBrowserDiagnostic('failure', 'second');
  expect(diagnostics.flushBrowserDiagnostics()).toBe(first); expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(3000); await first;
  expect(diagnostics.browserDiagnostics().at(-1)?.message).toContain('"delivery":1');
  vi.mocked(fetch).mockResolvedValue(new Response('ok'));
  await vi.advanceTimersByTimeAsync(5000);
  expect(fetch).toHaveBeenCalledTimes(2);
  const body = String(vi.mocked(fetch).mock.calls[1][1]?.body);
  expect(body).toContain('second'); expect(body).not.toContain('first');
  await vi.advanceTimersByTimeAsync(60_000); expect(fetch).toHaveBeenCalledTimes(2);
});

it('flushes pending records on page exit and reloads the bounded local fallback', async () => {
  diagnostics.recordBrowserDiagnostic('failure', 'api_key=fixture-secret');
  window.dispatchEvent(new Event('pagehide'));
  await diagnostics.flushBrowserDiagnostics();
  expect(fetch).toHaveBeenCalledTimes(1);
  stop(); vi.resetModules();
  const reloaded = await import('./diagnostics');
  expect(reloaded.browserDiagnostics().some(event => event.kind === 'failure')).toBe(true);
  expect(JSON.stringify(reloaded.browserDiagnostics())).not.toContain('fixture-secret');
});

it('measures polling overhead without network or storage side effects', async () => {
  vi.useRealTimers();
  const response = new Response('ok'); vi.mocked(fetch).mockResolvedValue(response);
  const measure = async (operation: () => Promise<Response>) => {
    for (let i = 0; i < 1000; i++) await operation();
    const samples: number[] = [];
    for (let sample = 0; sample < 5; sample++) {
      const start = performance.now();
      for (let i = 0; i < 2000; i++) await operation();
      samples.push((performance.now() - start) / 2000);
    }
    return samples.sort((a, b) => a - b)[2];
  };
  const baselineMs = await measure(() => fetch('/motion-api/project/status'));
  const instrumentedMs = await measure(() => request.diagnosticFetch('/motion-api/project/status'));
  expect(localStorage.setItem).not.toHaveBeenCalled();
  expect(vi.mocked(fetch).mock.calls.every(([url]) => url === '/motion-api/project/status')).toBe(true);
  process.stdout.write('DIAGNOSTIC_OVERHEAD ' + JSON.stringify({ scope: 'mocked healthy request, median of 5 x 2000 calls; not a playback benchmark', baselineMs, instrumentedMs, addedMs: instrumentedMs - baselineMs }) + '\n');
});
