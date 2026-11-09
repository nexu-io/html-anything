// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.resetModules(); });

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
  await tracking.trackMotion('ui_click', { page_name: 'home', area: 'workspace', element: 'new_creation' });
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
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
  Reflect.deleteProperty(navigator, 'doNotTrack');
});
