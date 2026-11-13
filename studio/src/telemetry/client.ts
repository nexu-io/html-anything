import { trackStudioUsage } from '../motion/studioTracking';
type EventProperties = Record<string, string | number | boolean | undefined>;

// Upstream measurement stays disabled; explicit events use OpenMotion's own policy and transport.
export function shouldTrack(): boolean { return false; }
export function trackEvent(event: string, properties: EventProperties = {}): void { trackStudioUsage(event, properties); }
