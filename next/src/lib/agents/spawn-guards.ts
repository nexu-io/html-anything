/**
 * Process-wide guards shared by the agent spawn routes (/api/convert,
 * /api/draft). Those routes spawn the user's coding-agent CLI with
 * maximally-permissive flags (bypassPermissions / workspace-write / --yolo),
 * so the server owns three safety knobs:
 *
 *   1. A concurrency cap — at most MAX_INFLIGHT agent processes at once.
 *      Without it a caller (or a runaway client loop) can fork-bomb the host.
 *   2. A hard wall-clock timeout — agent CLIs occasionally hang on an
 *      interactive login prompt or a stalled network resource; without a
 *      watchdog the SSE connection and the child stay resident forever.
 *   3. A request-body size cap — reject oversized payloads before parsing.
 *
 * Acquire is non-blocking: when at capacity the route returns 503 instead of
 * queuing, so a wedged slot surfaces immediately instead of piling up
 * connections. Each route pairs tryAcquireSpawnSlot with a finally/cancel
 * cleanup that calls releaseSpawnSlot exactly once.
 */

export const MAX_INFLIGHT = 2;
export const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MiB request payload cap
export const MAX_PROMPT_BYTES = 1 * 1024 * 1024; // 1 MiB cap on the assembled prompt
export const SPAWN_TIMEOUT_MS = 10 * 60 * 1000; // 10 min hard cap per spawn

let inflight = 0;

/** Try to take a spawn slot. Returns false (→ route should 503) if at capacity. */
export function tryAcquireSpawnSlot(): boolean {
  if (inflight >= MAX_INFLIGHT) return false;
  inflight++;
  return true;
}

/** Release a slot acquired via tryAcquireSpawnSlot. Idempotent guard is the
 *  caller's responsibility (use a released flag) — see the routes. */
export function releaseSpawnSlot(): void {
  inflight = Math.max(0, inflight - 1);
}
