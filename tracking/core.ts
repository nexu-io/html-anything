export type Rule = 'uuid' | 'code' | 'slug' | 'boolean' | 'integer' | readonly string[];
export type Registry = Record<string, { fields: Record<string, Rule>; required: readonly string[] }>;
export type Fields = Record<string, string | number | boolean>;
type RuleValue<R> = R extends readonly string[] ? R[number] : R extends 'boolean' ? boolean : R extends 'integer' ? number : string;
export type EventFields<S extends Registry[string]> =
  { [K in S['required'][number]]: K extends keyof S['fields'] ? RuleValue<S['fields'][K]> : never } &
  { [K in Exclude<keyof S['fields'], S['required'][number]>]?: RuleValue<S['fields'][K]> };
export type Entry = 'mcp' | 'studio' | 'webmcp' | 'installer' | 'worker';
export type PendingEvent = {
  event: string; event_id: string; occurred_at: string; entrypoint: Entry;
  device_timezone: string | null; utc_offset_minutes: number; properties: Fields;
};
export type Receipt = 'accepted' | 'retry' | 'drop';
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const code = /^[A-Za-z0-9_.-]{1,128}$/;
// A catalogue resource id: letters, digits and single hyphens between them, at most 64 characters.
// No dots, slashes, spaces or underscores, so a path, URL, file name or title cannot pass.
export const slug = /^(?=.{1,64}$)[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
export function deviceContext() {
  return { device_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    utc_offset_minutes: -new Date().getTimezoneOffset() };
}
export function validProperties(registry: Registry, event: string, raw: unknown): raw is Fields {
  if (!Object.hasOwn(registry, event) || !raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const spec = registry[event], values = raw as Fields;
  if (spec.required.some(key => !Object.hasOwn(values, key))) return false;
  return Object.entries(values).every(([key, value]) => {
    if (!Object.hasOwn(spec.fields, key)) return false;
    const rule = spec.fields[key];
    if (Array.isArray(rule)) return typeof value === 'string' && rule.includes(value);
    if (rule === 'boolean') return typeof value === 'boolean';
    if (rule === 'integer') return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 86_400_000;
    return typeof value === 'string' && (rule === 'uuid' ? uuid : rule === 'slug' ? slug : code).test(value);
  });
}
export function validPending(registry: Registry, value: unknown): value is PendingEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const e = value as PendingEvent;
  if (Object.keys(e).some(k => !['event','event_id','occurred_at','entrypoint','device_timezone','utc_offset_minutes','properties'].includes(k))) return false;
  if (typeof e.occurred_at !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(e.occurred_at)) return false;
  const time = Date.parse(e.occurred_at), age = Date.now() - time;
  if (!uuid.test(e.event_id) || !Number.isFinite(time) || age < -300_000 || age > 86_400_000) return false;
  if (!['mcp','studio','webmcp','installer','worker'].includes(e.entrypoint)) return false;
  if (!Number.isInteger(e.utc_offset_minutes) || Math.abs(e.utc_offset_minutes) > 840) return false;
  if (e.device_timezone !== null) {
    if (typeof e.device_timezone !== 'string' || e.device_timezone.length > 64) return false;
    try { new Intl.DateTimeFormat('en', { timeZone: e.device_timezone }); } catch { return false; }
  }
  return validProperties(registry, e.event, e.properties) && JSON.stringify(e).length <= 4096;
}

export function createTracker<const R extends Registry>(options: {
  registry: R; entrypoint: Entry; enabled: boolean;
  send: (events: readonly PendingEvent[], signal: AbortSignal) => Promise<Receipt>;
  maxQueue?: number; flushIntervalMs?: number; isEnabled?: () => boolean;
}) {
  let enabled = options.enabled, queue: PendingEvent[] = [], timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<Receipt | 'disabled' | 'empty'> | undefined, controller: AbortController | undefined;
  const seen = new Set<string>(), maxQueue = options.maxQueue ?? 64;
  let failures = 0;
  function discard() { queue = []; seen.clear(); if (timer) clearTimeout(timer); timer = undefined; controller?.abort(); }
  function active() {
    let allowed = enabled;
    try { allowed = allowed && (options.isEnabled?.() ?? true); } catch { allowed = false; }
    if (!allowed) discard();
    return allowed;
  }
  function schedule() {
    if (!active() || timer || options.flushIntervalMs === 0) return;
    timer = setTimeout(() => { timer = undefined; void flush(); }, Math.min(60_000, (options.flushIntervalMs ?? 1000) * 2 ** failures));
    (timer as unknown as { unref?: () => void }).unref?.();
  }
  function ingest(raw: unknown) {
    if (!active()) return 'disabled';
    if (!validPending(options.registry, raw)) return 'invalid';
    if (seen.has(raw.event_id)) return 'duplicate';
    if (queue.length >= maxQueue) return 'full';
    queue.push(structuredClone(raw)); seen.add(raw.event_id);
    // shortcut: process-local queue and dedup; add durable storage only if crash recovery is required.
    if (seen.size > 2048) seen.delete(seen.values().next().value!);
    schedule(); return 'queued';
  }
  function track<E extends keyof R & string>(event: E, properties: EventFields<R[E]>, eventId: string = crypto.randomUUID(), entrypoint: Entry = options.entrypoint) {
    if (!active()) return 'disabled';
    try { return ingest({ event, properties, event_id: eventId, occurred_at: new Date().toISOString(),
      entrypoint, ...deviceContext() }); } catch { return 'invalid'; }
  }
  function setEnabled(next: boolean) {
    enabled = next;
    if (!next) discard();
  }
  function flush(): Promise<Receipt | 'disabled' | 'empty'> {
    if (!active()) return Promise.resolve('disabled');
    if (inFlight) return inFlight;
    if (!queue.length) return Promise.resolve('empty');
    if (timer) clearTimeout(timer); timer = undefined;
    queue = queue.filter(event => Date.now() - Date.parse(event.occurred_at) <= 86_400_000);
    if (!queue.length) return Promise.resolve('empty');
    const snapshot = queue.slice(0, 16), request = new AbortController(); controller = request;
    inFlight = (async () => {
      let receipt: Receipt;
      try { receipt = await options.send(snapshot, request.signal); } catch { receipt = 'retry'; }
      if (!active()) return 'disabled' as const;
      failures = receipt === 'retry' ? Math.min(6, failures + 1) : 0;
      if (receipt !== 'retry') { const ids = new Set(snapshot.map(e => e.event_id)); queue = queue.filter(e => !ids.has(e.event_id)); }
      return receipt;
    })().finally(() => { inFlight = undefined; controller = undefined; if (queue.length) schedule(); });
    return inFlight;
  }
  return { track, ingest, flush, setEnabled, enabled: active, pending: () => queue.length,
    close: () => { setEnabled(false); } };
}
