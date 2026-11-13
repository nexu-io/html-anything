// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { studioTrackingFixtures } from '../../../tests/studio-tracking-fixtures';

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
afterEach(() => {
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'doNotTrack');
});
function collector() {
  const packets: any[] = [], urls: string[] = [];
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    urls.push(String(url));
    if (init?.body) packets.push(...JSON.parse(String(init.body)).events);
    return Response.json({ enabled: true });
  });
  vi.stubGlobal('fetch', fetcher);
  return { packets, urls, fetcher };
}

it('real editor helpers reach only same-origin tracking with coalescing and safe fields', async () => {
  const { packets, urls } = collector();
  const { trackStudioEvent } = await import('../utils/studioTelemetry');
  const { trackPreviewFirstFrame, trackStudioTimelinePerformance } = await import('../telemetry/events');
  const { trackDesignInput } = await import('../utils/designInputTracking');
  const { trackParamCommitted } = await import('../components/editor/audioFxTelemetry');
  const { flushStudioUsage } = await import('./studioTracking');
  trackStudioEvent('playback', { action: 'play', prompt: 'PRIVATE_PROMPT' });
  trackPreviewFirstFrame({ duration_ms: 15.5, composition_seconds: 12.5, clip_count: 2, media_clip_count: 1, studio_version: '0.9.7' });
  for (let i = 0; i < 3; i++) trackDesignInput({ ui: 'flat', section: 'Style', control: 'slider', name: 'Opacity' });
  trackParamCommitted('compressor', 'threshold', -18.5, 'details', { trackKind: 'voice' });
  trackStudioTimelinePerformance({ total_clip_count: 3, mounted_clip_count: 3, total_row_count: 1, timeline_dom_node_count: 20,
    viewport_width: 1000, viewport_height: 300, zoom_mode: 'fit', scroll_sample_count: 2,
    scroll_frame_latency_p95_ms: 10.5, scroll_frame_latency_max_ms: 11.5 });
  await flushStudioUsage();
  expect(packets.map(row => row.event)).toEqual(['playback', 'preview_first_frame', 'design_input', 'audio_fx_param_committed', 'studio_timeline_performance']);
  expect(packets[2].properties).toEqual({ ui: 'flat', section: 'style', control: 'slider', name: 'opacity' });
  expect(packets[3].properties.value).toBe(-18.5);
  expect(urls.every(url => { const target = new URL(url, location.href); return target.origin === location.origin && target.pathname === '/motion-api/tracking'; })).toBe(true);
  expect(JSON.stringify(packets)).not.toMatch(/PRIVATE|api_key|installation_id|distinct_id|phc_/);
});

it('both existing public entry points deliver all 78 migrated producer payloads', async () => {
  const { packets } = collector();
  const { trackStudioEvent } = await import('../utils/studioTelemetry');
  const { trackEvent } = await import('../telemetry/client');
  const { flushStudioUsage } = await import('./studioTracking');
  const entries = Object.entries(studioTrackingFixtures);
  for (let i = 0; i < entries.length; i += 16) {
    for (const [name, properties] of entries.slice(i, i + 16)) {
      if (name.startsWith('studio_') || name.startsWith('webmcp')) trackEvent(name, properties as Record<string, string | number | boolean>);
      else trackStudioEvent(name, properties as Record<string, string | number | boolean>);
    }
    await flushStudioUsage();
  }
  expect(packets).toHaveLength(78);
  expect(new Set(packets.map(row => row.event)).size).toBe(78);
  expect(JSON.stringify(packets)).not.toContain('PRIVATE');
});

it('opt-out during configuration clears old calls; re-enable accepts only new operations', async () => {
  let finish!: (response: Response) => void;
  const packets: any[] = [];
  const fetcher = vi.fn((_: string, init?: RequestInit) => {
    if (!init?.body) return new Promise<Response>(resolve => { finish = resolve; });
    packets.push(...JSON.parse(String(init.body)).events); return Promise.resolve(Response.json({ enabled: true }));
  });
  vi.stubGlobal('fetch', fetcher);
  const tracking = await import('./tracking');
  const { trackStudioEvent } = await import('../utils/studioTelemetry');
  const { flushStudioUsage } = await import('./studioTracking');
  const initializing = tracking.initializeTracking();
  trackStudioEvent('playback', { action: 'play' });
  tracking.setMotionTrackingEnabled(false); finish(Response.json({ enabled: true }));
  await initializing; await flushStudioUsage(); expect(packets).toHaveLength(0);
  tracking.setMotionTrackingEnabled(true);
  trackStudioEvent('playback', { action: 'pause' }); await flushStudioUsage();
  expect(packets.map(row => row.properties.action)).toEqual(['pause']);
});

it('browser Do Not Track blocks the migrated paths without creating requests', async () => {
  Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
  const { fetcher } = collector();
  const { trackStudioEvent } = await import('../utils/studioTelemetry');
  const { trackEvent } = await import('../telemetry/client');
  const { flushStudioUsage } = await import('./studioTracking');
  trackStudioEvent('playback', { action: 'play' }); trackEvent('studio_session_start', { has_project: true });
  await flushStudioUsage(); expect(fetcher).not.toHaveBeenCalled();
});

it('bounds calls waiting for configuration and retains the opening-page context', async () => {
  const token = '11111111-1111-4111-8111-111111111111';
  history.replaceState(null, '', '/?tracking_context=' + token);
  const { packets, urls } = collector();
  const { trackStudioEvent } = await import('../utils/studioTelemetry');
  const { flushStudioUsage } = await import('./studioTracking');
  const tracking = await import('./tracking');
  for (let i = 0; i < 1000; i++) trackStudioEvent('playback', { action: 'play' });
  await flushStudioUsage();
  expect(packets).toHaveLength(16);
  expect(tracking.getMotionTrackingStatus().pending).toBe(48);
  expect(urls.some(url => new URL(url, location.href).searchParams.get('context') === token)).toBe(true);
  tracking.setMotionTrackingEnabled(false); history.replaceState(null, '', '/');
});
