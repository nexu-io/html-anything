import { createTracker } from './core.ts';
import type { Registry } from './core.ts';
export function createBrowserTracking<const R extends Registry>(options: { endpoint: string; registry: R; enabled: boolean; flushIntervalMs?: number }) {
  const endpoint = new URL(options.endpoint, window.location.href);
  if (endpoint.origin !== window.location.origin || endpoint.username || endpoint.password) throw new Error('SAME_ORIGIN_REQUIRED');
  return createTracker({ ...options, entrypoint: 'studio', send: async (events, signal) => {
    try {
      const response = await fetch(endpoint, { method: 'POST', redirect: 'error', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events }), keepalive: true, signal: AbortSignal.any([signal, AbortSignal.timeout(1000)]) });
      return response.ok ? 'accepted' : response.status >= 500 || response.status === 429 ? 'retry' : 'drop';
    } catch { return 'retry'; }
  } });
}
