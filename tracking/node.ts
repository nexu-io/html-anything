import { link, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createTracker, uuid } from './core.ts';
import type { Entry, Registry, PendingEvent, Receipt } from './core.ts';
import { unknownHost } from './host.ts';
import { unknownDevice } from './device.ts';
import type { DeviceIdentity } from './device.ts';

export type Identity = { installation_id: string; utm_source: string | null; created_at: string };
const sourcePattern = /^[A-Za-z0-9_.-]{1,64}$/;

export async function loadIdentity(directory: string, source?: string): Promise<Identity> {
  if (source !== undefined && (typeof source !== 'string' || !sourcePattern.test(source))) throw new Error('INVALID_SOURCE');
  const file = path.join(directory, 'identity.json');
  async function read(): Promise<Identity> {
    const value = JSON.parse(await readFile(file, 'utf8'));
    if (typeof value.installation_id !== 'string' || !uuid.test(value.installation_id)
      || (value.utm_source !== null && (typeof value.utm_source !== 'string' || !sourcePattern.test(value.utm_source)))
      || !Number.isFinite(Date.parse(value.created_at))) throw new Error('INVALID_IDENTITY');
    return value;
  }
  try { return await read(); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const identity: Identity = { installation_id: crypto.randomUUID(), utm_source: source ?? null, created_at: new Date().toISOString() };
  const temporary = file + '.' + crypto.randomUUID();
  try {
    await writeFile(temporary, JSON.stringify(identity), { mode: 0o600, flag: 'wx' });
    // Publish a complete file exclusively; concurrent processes read the winning identity.
    try { await link(temporary, file); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    return await read();
  } finally { await rm(temporary, { force: true }); }
}

export function createPosthogSender(options: {
  host: string; token: string; identity: Identity; appVersion: string; device?: () => Promise<DeviceIdentity>;
  env: 'development' | 'test' | 'production'; testRunId?: string; timeoutMs?: number; fetch?: typeof fetch; geoip?: boolean;
}) {
  const url = new URL(options.host);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('INVALID_INGEST_HOST');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('INVALID_INGEST_HOST');
  if (!/^phc_[A-Za-z0-9_]+$/.test(options.token)) throw new Error('PUBLIC_PROJECT_TOKEN_REQUIRED');
  if (options.testRunId && (!uuid.test(options.testRunId) || options.env !== 'test')) throw new Error('INVALID_TEST_RUN');
  return async (events: readonly PendingEvent[], signal: AbortSignal): Promise<Receipt> => {
    const device = options.device ? await options.device() : unknownDevice;
    if (signal.aborted) return 'drop';
    const batch = events.map(event => ({ event: event.event, uuid: event.event_id, timestamp: event.occurred_at,
      properties: { ...event.properties, event_schema_version: 1, schema_version: 1, product: 'openmotion',
        ...(event.host_context ?? unknownHost),
        app_version: options.appVersion, env: options.env, channel: 'standalone',
        ...(options.testRunId ? { test_run_id: options.testRunId } : {}),
        event_id: event.event_id, $insert_id: event.event_id, occurred_at: event.occurred_at,
        installation_id: options.identity.installation_id, ...device,
        distinct_id: device.device_id_source === 'platform' ? device.device_id : options.identity.installation_id,
        utm_source: options.identity.utm_source,
        entrypoint: event.entrypoint, runtime: event.entrypoint === 'studio' ? 'browser' : 'node',
        capture_source: 'explicit', client_type: event.entrypoint === 'studio' ? 'web' : 'local',
        platform: os.platform(), arch: os.arch(), $os: os.type(), $os_version: os.release(),
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        device_timezone: event.device_timezone, utc_offset_minutes: event.utc_offset_minutes,
        // GeoIP requires an ingress that discards IP after enrichment; custom collectors default to zero-IP mode.
        ...(options.geoip ? { location_source: 'geoip', $geoip_disable: false }
          : { location_source: 'unknown', $geoip_disable: true, $ip: '0.0.0.0' }), $process_person_profile: false } }));
    const body = JSON.stringify({ api_key: options.token, batch });
    if (Buffer.byteLength(body) > 64 * 1024) return 'drop';
    try {
      const response = await (options.fetch ?? fetch)(new URL('/batch/', url), {
        method: 'POST', redirect: 'error', headers: { 'content-type': 'application/json' }, body,
        signal: AbortSignal.any([signal, AbortSignal.timeout(options.timeoutMs ?? 1500)]) });
      if (!response.ok) return response.status === 429 || response.status >= 500 ? 'retry' : 'drop';
      const receipt = await response.json() as { status?: number | string; quota_limited?: unknown };
      const limited = receipt.quota_limited;
      const quotaLimited = Array.isArray(limited) ? limited.length > 0
        : limited && typeof limited === 'object' ? Object.keys(limited).length > 0 : !!limited;
      return (receipt.status === 1 || receipt.status === 'Ok') && !quotaLimited ? 'accepted' : 'retry';
    } catch { return 'retry'; }
  };
}

export function createNodeTracking<const R extends Registry>(options: {
  registry: R; identity: Identity; host: string; token?: string; appVersion: string; device?: () => Promise<DeviceIdentity>;
  env: 'development' | 'test' | 'production'; testRunId?: string; entrypoint: Entry;
  enabled: boolean; timeoutMs?: number; flushIntervalMs?: number; maxQueue?: number; geoip?: boolean; isEnabled?: () => boolean;
}) {
  const enabled = options.enabled && !!options.token;
  const send = enabled ? createPosthogSender({ ...options, token: options.token! }) : async () => 'drop' as const;
  return createTracker({ ...options, enabled, send });
}
