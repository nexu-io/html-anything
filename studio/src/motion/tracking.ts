import { createBrowserTracking } from '../../../tracking/browser.ts';
import { omEvents } from '../../../tracking/events.ts';
import type { EventFields } from '../../../tracking/core.ts';

const tracking = createBrowserTracking({ registry: omEvents, endpoint: '/motion-api/tracking', enabled: false });
let initialization: Promise<void> | undefined;
let preference: boolean | undefined;
export function initializeTracking() {
  initialization ??= fetch('/motion-api/tracking', { signal: AbortSignal.timeout(1000) }).then(async response => {
    if (!response.ok) return;
    const config = await response.json();
    tracking.setEnabled((preference ?? config.enabled === true) && navigator.doNotTrack !== '1');
  }).catch(() => {});
  return initialization;
}
export async function trackMotion<E extends keyof typeof omEvents>(event: E, properties: EventFields<typeof omEvents[E]>) {
  await initializeTracking();
  tracking.track(event, properties);
}
export function flushMotionTracking() { return tracking.flush(); }
export function setMotionTrackingEnabled(enabled: boolean) { preference = enabled; tracking.setEnabled(enabled && navigator.doNotTrack !== '1'); }

window.addEventListener('pagehide', () => { void tracking.flush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void tracking.flush(); });
