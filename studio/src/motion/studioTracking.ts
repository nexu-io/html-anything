import { studioUsageProperties } from '../../../tracking/studio-properties.ts';
import type { StudioEvent, studioEvents } from '../../../tracking/events.ts';
import type { EventFields } from '../../../tracking/core.ts';

const pending = new Set<Promise<unknown>>();

export function trackStudioUsage(event: string, properties: Record<string, unknown> = {}): void {
  try {
    const safe = studioUsageProperties(event, properties);
    if (!safe || pending.size >= 64) return;
    const call = import('./tracking').then(({ trackMotion }) =>
      trackMotion(event as StudioEvent, safe as EventFields<typeof studioEvents[StudioEvent]>));
    pending.add(call);
    void call.finally(() => pending.delete(call)).catch(() => {});
  } catch { /* Measurement never changes an editor operation's result. */ }
}
export async function flushStudioUsage(): Promise<void> {
  try {
    await Promise.allSettled([...pending]);
    const { flushMotionTracking } = await import('./tracking');
    await flushMotionTracking();
  } catch { /* A page-close flush is best effort. */ }
}
