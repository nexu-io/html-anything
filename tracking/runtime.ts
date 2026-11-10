import path from 'node:path';
import { readFileSync, watch } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { createTracker } from './core.ts';
import type { Entry } from './core.ts';
import { createPosthogSender, loadIdentity } from './node.ts';
import { omEvents } from './events.ts';
export { validateSource } from './node.ts';
export type OmTracking = ReturnType<typeof createTracker<typeof omEvents>>;

export function trackingLocked() {
  return ['0', 'false', 'off'].includes(process.env.OPENMOTION_TELEMETRY?.toLowerCase() ?? '') || process.env.DO_NOT_TRACK === '1';
}
export function trackingPreference(directory: string): boolean {
  try { return JSON.parse(readFileSync(path.join(directory, 'tracking/preferences.json'), 'utf8')).enabled === true; }
  catch (error) { return (error as NodeJS.ErrnoException).code === 'ENOENT'; }
}
export async function saveTrackingPreference(directory: string, enabled: boolean) {
  const folder = path.join(directory, 'tracking'); await mkdir(folder, { recursive: true, mode: 0o700 });
  const temporary = path.join(folder, 'preferences.' + crypto.randomUUID() + '.tmp');
  try {
    await writeFile(temporary, JSON.stringify({ enabled }), { mode: 0o600, flag: 'wx' });
    await rename(temporary, path.join(folder, 'preferences.json'));
  } finally { await rm(temporary, { force: true }); }
}

export async function createTracking(directory: string, entrypoint: Entry, appVersion: string, source?: string): Promise<OmTracking> {
  const disabled = () => createTracker({ registry: omEvents, entrypoint, enabled: false, send: async () => 'drop' });
  if (trackingLocked()) return disabled();
  try {
    const testing = Boolean(process.env.NODE_TEST_CONTEXT) || process.env.NODE_ENV === 'test';
    if (testing && !process.env.OPENMOTION_TRACKING_TEST_RUN_ID) return disabled();
    const env = process.env.OPENMOTION_TRACKING_ENV ?? (testing ? 'test' : 'production');
    if (!['development', 'test', 'production'].includes(env)) return disabled();
    const custom = process.env.OPENMOTION_POSTHOG_HOST !== undefined || process.env.OPENMOTION_POSTHOG_KEY !== undefined;
    // Public write-only configuration only; malformed/missing configuration disables telemetry, not the application.
    const config = custom ? { host: process.env.OPENMOTION_POSTHOG_HOST, token: process.env.OPENMOTION_POSTHOG_KEY,
      geoip: process.env.OPENMOTION_GEOIP === '1' } : JSON.parse(readFileSync(new URL('../shared/tracking-config.json', import.meta.url), 'utf8'));
    if (!config.host || !config.token) return disabled();
    const allowed = () => !trackingLocked() && trackingPreference(directory);
    let identity = allowed() ? await loadIdentity(path.join(directory, 'tracking'), source) : undefined;
    let sender = identity ? createPosthogSender({ ...config, identity, appVersion,
      env: env as 'development' | 'test' | 'production', testRunId: process.env.OPENMOTION_TRACKING_TEST_RUN_ID }) : undefined;
    const tracking = createTracker({ registry: omEvents, entrypoint, enabled: true, isEnabled: allowed,
      send: async (events, signal) => {
        if (!allowed()) return 'drop';
        if (!sender) {
          identity = await loadIdentity(path.join(directory, 'tracking'));
          sender = createPosthogSender({ ...config, identity, appVersion,
            env: env as 'development' | 'test' | 'production', testRunId: process.env.OPENMOTION_TRACKING_TEST_RUN_ID });
        }
        return sender(events, signal);
      } });
    const changes = watch(path.join(directory, 'tracking'), { persistent: false }, () => { tracking.enabled(); });
    changes.on('error', () => tracking.setEnabled(false));
    const close = tracking.close;
    tracking.close = () => { changes.close(); close(); };
    return tracking;
  } catch { return disabled(); }
}

export async function closeTracking(tracking?: OmTracking) {
  if (!tracking) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => { while (tracking.pending()) { if (await tracking.flush() !== 'accepted') break; } })(),
      new Promise<void>(resolve => { timer = setTimeout(resolve, 2000); }),
    ]);
  } finally { if (timer) clearTimeout(timer); tracking.close(); }
}
