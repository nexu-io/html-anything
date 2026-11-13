import { trackStudioUsage, flushStudioUsage } from '../motion/studioTracking';
interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

// Existing callers share OpenMotion's installation identity, queue and opt-out controls.
export function trackStudioEvent(event: string, properties: EventProperties = {}): void { trackStudioUsage(event, properties); }
export function flushViaBeacon(): void { flushStudioUsage(); }
