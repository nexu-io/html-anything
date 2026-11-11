// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const click = { page_name: 'home', area: 'workspace', element: 'new_creation' } as const;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => {
  vi.clearAllTimers(); vi.useRealTimers(); Reflect.deleteProperty(navigator, 'doNotTrack');
  vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules();
});

it('keeps the project token out of browser packets and sends only explicitly invoked events', async () => {
  const requests: Array<{ url: string; body?: string }> = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    requests.push({ url, body: init?.body as string | undefined });
    return new Response(JSON.stringify({ enabled: true }));
  }));
  const tracking = await import('./tracking');
  await tracking.initializeTracking();
  expect(requests).toHaveLength(1);
  document.body.click(); await tracking.flushMotionTracking(); expect(requests).toHaveLength(1);
  expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
  expect(tracking.getMotionTrackingStatus()).toEqual({ configuration: 'ready', enabled: true, pending: 1, retryAfterMs: 0 });
  await tracking.flushMotionTracking();
  expect(requests).toHaveLength(2);
  const payload = JSON.parse(requests[1].body!);
  expect(payload.events[0].entrypoint).toBe('studio');
  expect(JSON.stringify(payload)).not.toMatch(/api_key|installation_id|distinct_id|utm_source|phc_/);
});

it('honors both local disablement and browser Do Not Track', async () => {
  for (const [enabled, dnt] of [[false, '0'], [true, '1']] as const) {
    vi.resetModules();
    Object.defineProperty(navigator, 'doNotTrack', { value: dnt, configurable: true });
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ enabled })));
    vi.stubGlobal('fetch', fetcher);
    const tracking = await import('./tracking');
    await tracking.trackMotion('ui_click', { page_name: 'home', area: 'workspace', element: 'new_creation' });
    await tracking.flushMotionTracking();
    expect(fetcher).toHaveBeenCalledTimes(dnt === '1' ? 0 : 1);
  }
  Reflect.deleteProperty(navigator, 'doNotTrack');
});

it('does not let a stale configuration response undo a user opt-out', async () => {
  let resolve!: (value: Response) => void;
  const fetcher = vi.fn(() => new Promise<Response>(done => { resolve = done; })); vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking'), pending = tracking.initializeTracking();
  tracking.setMotionTrackingEnabled(false); resolve(Response.json({ enabled: true })); await pending;
  await tracking.trackMotion('ui_click', { page_name: 'home', area: 'workspace', element: 'new_creation' });
  await tracking.flushMotionTracking(); expect(fetcher).toHaveBeenCalledTimes(1);
});

it('shares initialization and recovers the original calls after a transient configuration failure', async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('PRIVATE_FAILURE'))
    .mockImplementation(async () => Response.json({ enabled: true }));
  vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking');
  const first = tracking.trackMotion('ui_click', click), second = tracking.trackMotion('ui_click', click);
  await vi.advanceTimersByTimeAsync(999);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(tracking.getMotionTrackingStatus()).toMatchObject({ configuration: 'loading', enabled: false, pending: 0 });
  await vi.advanceTimersByTimeAsync(1);
  expect(await Promise.all([first, second])).toEqual(['queued', 'queued']);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(await tracking.flushMotionTracking()).toBe('accepted');
  expect(JSON.parse(fetcher.mock.calls[2][1].body).events).toHaveLength(2);
});

it.each(['network', 'http', 'json', 'shape'])('bounds %s configuration failures and retries on a later call after cooldown', async failure => {
  let failed = true;
  const fetcher = vi.fn(async () => {
    if (!failed) return Response.json({ enabled: true });
    if (failure === 'network') throw new Error('PRIVATE_URL_AND_SECRET');
    if (failure === 'http') return new Response('', { status: 503 });
    if (failure === 'json') return new Response('not json');
    return Response.json({ enabled: 'true' });
  });
  vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking'), pending = tracking.trackMotion('ui_click', click);
  await vi.advanceTimersByTimeAsync(3000);
  expect(await pending).toBe('config_unavailable');
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(tracking.getMotionTrackingStatus()).toEqual({ configuration: 'unavailable', enabled: false, pending: 0, retryAfterMs: 30_000 });
  expect(await tracking.flushMotionTracking()).toBe('disabled');
  expect(await tracking.trackMotion('ui_click', click)).toBe('config_unavailable');
  await vi.advanceTimersByTimeAsync(29_999);
  expect(await tracking.trackMotion('ui_click', click)).toBe('config_unavailable');
  expect(fetcher).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(1); failed = false;
  expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(await tracking.flushMotionTracking()).toBe('accepted');
});

it('treats a policy disablement as final and stops retries when the user opts out', async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error('offline')); vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking'), pending = tracking.trackMotion('ui_click', click);
  await vi.advanceTimersByTimeAsync(500);
  tracking.setMotionTrackingEnabled(false);
  expect(await pending).toBe('disabled');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(await tracking.trackMotion('ui_click', click)).toBe('disabled');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(tracking.getMotionTrackingStatus()).toEqual({ configuration: 'disabled', enabled: false, pending: 0, retryAfterMs: 0 });
});

it('does not retry a server opt-out and allows a confirmed preference change to re-enable', async () => {
  const fetcher = vi.fn(async () => Response.json({ enabled: false })); vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking');
  expect(await tracking.trackMotion('ui_click', click)).toBe('disabled');
  await vi.advanceTimersByTimeAsync(60_000);
  expect(await tracking.trackMotion('ui_click', click)).toBe('disabled');
  expect(fetcher).toHaveBeenCalledTimes(1);
  tracking.setMotionTrackingEnabled(true);
  expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
  await tracking.flushMotionTracking();
  expect(await tracking.trackMotion('ui_click', click)).toBe('disabled');
});

it('resumes reporting new events after repeated opt-out and re-enable cycles', async () => {
  const bodies: any[] = [];
  vi.stubGlobal('fetch', vi.fn(async (_url, init?: RequestInit) => {
    if (init?.body) bodies.push(JSON.parse(String(init.body)));
    return Response.json({ enabled: true });
  }));
  const tracking = await import('./tracking');
  for (let cycle = 0; cycle < 3; cycle++) {
    tracking.setMotionTrackingEnabled(true);
    expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
    expect(await tracking.flushMotionTracking()).toBe('accepted');
    expect(bodies).toHaveLength(cycle + 1);
    expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
    tracking.setMotionTrackingEnabled(false);
    expect(await tracking.trackMotion('ui_click', click)).toBe('disabled');
    expect(await tracking.flushMotionTracking()).toBe('disabled');
    expect(tracking.getMotionTrackingStatus().pending).toBe(0);
  }
  expect(new Set(bodies.map(body => body.events[0].event_id)).size).toBe(3);
});

it('exposes safe queue and delivery statuses while rejecting private or non-Studio payloads', async () => {
  let failing = true;
  const fetcher = vi.fn(async (_url, init?: RequestInit) => init?.method === 'POST' && failing
    ? new Response('', { status: 503 }) : Response.json({ enabled: true }));
  vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking');
  expect(await tracking.trackMotion('ui_click', { ...click, prompt: 'PRIVATE_CONTENT' } as any)).toBe('invalid');
  expect(await tracking.trackMotion('mcp_tool_started' as any, {
    tool_name: 'motion_get_project', call_id: crypto.randomUUID(), accepted: true,
  } as any)).toBe('invalid');
  for (let i = 0; i < 64; i++) expect(await tracking.trackMotion('ui_click', click)).toBe('queued');
  expect(await tracking.trackMotion('ui_click', click)).toBe('full');
  expect(await tracking.flushMotionTracking()).toBe('retry');
  failing = false;
  expect(await tracking.flushMotionTracking()).toBe('accepted');
  expect(JSON.parse(fetcher.mock.calls[1][1]!.body as string)).toEqual(JSON.parse(fetcher.mock.calls[2][1]!.body as string));
  expect(JSON.stringify(tracking.getMotionTrackingStatus())).not.toMatch(/PRIVATE|prompt|properties/);
  tracking.setMotionTrackingEnabled(false);
  expect(await tracking.flushMotionTracking()).toBe('disabled');
  expect(tracking.getMotionTrackingStatus().pending).toBe(0);
});
