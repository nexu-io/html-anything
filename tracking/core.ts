export type Rule = 'uuid' | 'code' | 'timestamp' | 'boolean' | 'integer' | readonly string[];
export type Registry = Record<string, { fields: Record<string, Rule>; required: readonly string[]; countEvent?: string }>;
export type CountAggregation<R extends Registry> = Partial<Record<{
  [E in keyof R]: R[E] extends { countEvent: string } ? E : never
}[keyof R], false | { windowMs: number }>>;
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
const timestamp = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
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
    if (rule === 'timestamp') return typeof value === 'string' && timestamp.test(value) && Number.isFinite(Date.parse(value));
    return typeof value === 'string' && (rule === 'uuid' ? uuid : code).test(value);
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
  maxQueue?: number; flushIntervalMs?: number; isEnabled?: () => boolean; aggregation?: CountAggregation<R>;
}) {
  const countRules = new Map<string, { event: string; windowMs: number }>();
  const countEvents = new Set(Object.values(options.registry).map(spec => spec.countEvent).filter(Boolean));
  if (options.aggregation !== undefined) {
    if (!options.aggregation || typeof options.aggregation !== 'object' || Array.isArray(options.aggregation)) throw new Error('INVALID_COUNT_AGGREGATION');
    for (const [name, rule] of Object.entries(options.aggregation)) {
      const spec = Object.hasOwn(options.registry, name) ? options.registry[name] : undefined;
      const target = spec?.countEvent && Object.hasOwn(options.registry, spec.countEvent) ? options.registry[spec.countEvent] : undefined;
      if (!spec || !target || target.countEvent) throw new Error('EVENT_NOT_COUNTABLE');
      if (rule === false) continue;
      const config = rule as { windowMs: number };
      if (!config || typeof config !== 'object' || Object.keys(config).length !== 1
        || !Number.isInteger(config.windowMs) || config.windowMs < 1000 || config.windowMs > 60_000 || 60_000 % config.windowMs !== 0) throw new Error('INVALID_COUNT_WINDOW');
      const extra = { count: 'integer', window_start: 'timestamp', window_end: 'timestamp' };
      if (Object.keys(extra).some(key => Object.hasOwn(spec.fields, key))
        || Object.keys(target.fields).length !== Object.keys(spec.fields).length + 3
        || Object.entries({ ...spec.fields, ...extra }).some(([key, value]) => JSON.stringify(target.fields[key]) !== JSON.stringify(value))
        || JSON.stringify([...target.required].sort()) !== JSON.stringify([...spec.required, ...Object.keys(extra)].sort())) throw new Error('INVALID_COUNT_SCHEMA');
      countRules.set(name, { event: spec.countEvent!, windowMs: config.windowMs });
    }
  }
  let enabled = options.enabled, queue: PendingEvent[] = [], timer: ReturnType<typeof setTimeout> | undefined;
  let timerAt = 0;
  let inFlight: Promise<Receipt | 'disabled' | 'empty'> | undefined, controller: AbortController | undefined;
  const seen = new Set<string>(), maxQueue = options.maxQueue ?? 64;
  const groups = new Map<string, PendingEvent>(), due = new Map<string, number>();
  let failures = 0;
  function discard() { queue = []; seen.clear(); groups.clear(); due.clear(); if (timer) clearTimeout(timer); timer = undefined; timerAt = 0; controller?.abort(); }
  function active() {
    let allowed = enabled;
    try { allowed = allowed && (options.isEnabled?.() ?? true); } catch { allowed = false; }
    if (!allowed) discard();
    return allowed;
  }
  function schedule() {
    if (!active() || options.flushIntervalMs === 0) return;
    const nextDue = Math.min(...queue.map(event => due.get(event.event_id) ?? 0));
    const delay = Math.max(0, nextDue - Date.now(), Math.min(60_000, (options.flushIntervalMs ?? 1000) * 2 ** failures));
    if (timer && timerAt <= Date.now() + delay) return;
    if (timer) clearTimeout(timer);
    timerAt = Date.now() + delay;
    timer = setTimeout(() => { timer = undefined; timerAt = 0; void flush(false); }, delay);
    (timer as unknown as { unref?: () => void }).unref?.();
  }
  function ingest(raw: unknown) {
    if (!active()) return 'disabled';
    if (!validPending(options.registry, raw)) return 'invalid';
    if (countEvents.has(raw.event)) return 'invalid';
    if (seen.has(raw.event_id)) return 'duplicate';
    const rule = countRules.get(raw.event);
    if (rule) {
      const start = Math.floor(Date.parse(raw.occurred_at) / rule.windowMs) * rule.windowMs;
      const key = JSON.stringify([raw.event, raw.entrypoint, raw.device_timezone, raw.utc_offset_minutes, start,
        Object.entries(raw.properties).sort(([a], [b]) => a.localeCompare(b))]);
      let group = groups.get(key);
      if (!group || Number(group.properties.count) >= 86_400_000) {
        if (queue.length >= maxQueue) return 'full';
        group = { ...structuredClone(raw), event: rule.event, event_id: crypto.randomUUID(), occurred_at: new Date(start).toISOString(),
          properties: { ...raw.properties, count: 0, window_start: new Date(start).toISOString(), window_end: new Date(start + rule.windowMs).toISOString() } };
        groups.set(key, group); queue.push(group); due.set(group.event_id, start + rule.windowMs);
      }
      group.properties.count = Number(group.properties.count) + 1;
    } else {
      if (queue.length >= maxQueue) return 'full';
      queue.push(structuredClone(raw));
    }
    seen.add(raw.event_id);
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
  function flush(force = true): Promise<Receipt | 'disabled' | 'empty'> {
    if (!active()) return Promise.resolve('disabled');
    if (inFlight) return inFlight;
    if (!queue.length) return Promise.resolve('empty');
    if (timer) clearTimeout(timer); timer = undefined;
    queue = queue.filter(event => Date.now() - Date.parse(event.occurred_at) <= 86_400_000);
    const retained = new Set(queue.map(event => event.event_id));
    for (const [key, event] of groups) if (!retained.has(event.event_id)) groups.delete(key);
    for (const id of due.keys()) if (!retained.has(id)) due.delete(id);
    if (!queue.length) return Promise.resolve('empty');
    const snapshot = queue.filter(event => force || (due.get(event.event_id) ?? 0) <= Date.now()).slice(0, 16);
    if (!snapshot.length) { schedule(); return Promise.resolve('empty'); }
    const ids = new Set(snapshot.map(event => event.event_id));
    // Freeze a summary before its first send; later calls must never change a retried UUID's count.
    for (const [key, event] of groups) if (ids.has(event.event_id)) groups.delete(key);
    for (const id of ids) due.delete(id);
    const request = new AbortController(); controller = request;
    inFlight = (async () => {
      let receipt: Receipt;
      try { receipt = await options.send(snapshot, request.signal); } catch { receipt = 'retry'; }
      if (!active()) return 'disabled' as const;
      failures = receipt === 'retry' ? Math.min(6, failures + 1) : 0;
      if (receipt !== 'retry') queue = queue.filter(e => !ids.has(e.event_id));
      return receipt;
    })().finally(() => { inFlight = undefined; controller = undefined; if (queue.length) schedule(); });
    return inFlight;
  }
  return { track, ingest, flush: () => flush(), setEnabled, enabled: active, pending: () => queue.length,
    close: () => { setEnabled(false); } };
}
