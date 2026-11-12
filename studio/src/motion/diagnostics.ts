import { redactDiagnostic } from '../../../scripts/diagnostic-redaction.mjs';

const storageKey = 'motion.local-diagnostics.v1';
type DiagnosticEvent = { time: string; kind: string; message: string; stack: string };
type Ring = { entries: { event: DiagnosticEvent; bytes: number }[]; bytes: number };
const errors: Ring = { entries: [], bytes: 0 }, activity: Ring = { entries: [], bytes: 0 }, pending: Ring = { entries: [], bytes: 0 };
const encoder = new TextEncoder();
const losses = { rateLimited: 0, repeated: 0, evicted: 0, delivery: 0 };
const recent = new Map<string, number>();
let loaded = false, active = false, timer: ReturnType<typeof setTimeout> | undefined, sending: Promise<void> | undefined;
let windowStart = 0, errorCount = 0, activityCount = 0;
let sequence = 0;
const session = crypto.randomUUID();

function push(ring: Ring, event: DiagnosticEvent, count: number, bytes: number) {
  const size = encoder.encode(JSON.stringify(event)).length + 1;
  ring.entries.push({ event, bytes: size }); ring.bytes += size;
  while (ring.entries.length > count || ring.bytes > bytes) {
    ring.bytes -= ring.entries.shift()!.bytes; losses.evicted++;
  }
}
function retain(event: DiagnosticEvent) {
  if (event.kind.startsWith('activity_')) push(activity, event, 39, 7 * 1024);
  else push(errors, event, 20, 16 * 1024);
}
function load() {
  if (loaded) return;
  loaded = true;
  try {
    const text = localStorage.getItem(storageKey) || '[]';
    if (text.length > 24 * 1024) return;
    const entries: unknown = JSON.parse(text);
    if (!Array.isArray(entries)) return;
    for (const entry of entries.slice(-60)) {
      if (entry && typeof entry === 'object' && Object.keys(entry).length === 4
        && ['time', 'kind', 'message', 'stack'].every(key => typeof entry[key] === 'string' && entry[key].length <= 4096)) retain(entry);
    }
  } catch { /* Storage is optional; the in-memory ring still works. */ }
}
export function browserDiagnostics(): DiagnosticEvent[] {
  load();
  return [...errors.entries, ...activity.entries].map(item => item.event).sort((a, b) => a.time.localeCompare(b.time)).concat({
    time: new Date().toISOString(), kind: 'activity_summary', message: JSON.stringify({ session, ...losses }), stack: '',
  });
}
function schedule() {
  if (!timer && !sending && pending.entries.length) timer = setTimeout(() => { void flushBrowserDiagnostics(); }, 5000);
}
export function flushBrowserDiagnostics(): Promise<void> {
  clearTimeout(timer); timer = undefined;
  if (sending) return sending;
  if (!pending.entries.length) return Promise.resolve();
  try { localStorage.setItem(storageKey, JSON.stringify(browserDiagnostics().filter(event => event.kind !== 'activity_summary'))); } catch { /* Best effort. */ }
  const batch = pending.entries.splice(0, 20);
  pending.bytes -= batch.reduce((sum, item) => sum + item.bytes, 0);
  // Logging has its own deadline and never shares the caller's signal or response body.
  const controller = new AbortController(), deadline = setTimeout(() => controller.abort(), 3000);
  sending = (async () => {
    try {
      const response = await fetch('/motion-api/diagnostics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: batch.map(item => item.event) }), signal: controller.signal, keepalive: true });
      if (!response.ok) losses.delivery += batch.length;
    } catch { losses.delivery += batch.length; }
    finally { clearTimeout(deadline); }
  })().finally(() => { sending = undefined; schedule(); });
  return sending;
}
export function recordBrowserDiagnostic(kind: string, message: string, stack = '', deduplicationKey?: string) {
  try {
    load();
    const now = Date.now(), isActivity = kind.startsWith('activity_');
    if (now - windowStart >= 60_000) { windowStart = now; errorCount = 0; activityCount = 0; }
    if ((isActivity ? activityCount >= 40 : errorCount >= 20)) { losses.rateLimited++; return; }
    const clean = (text: string) => redactDiagnostic(text.slice(0, 8192)).slice(0, 4096);
    const event = { time: new Date(now).toISOString(), kind: clean(kind).slice(0, 64), message: clean(message), stack: clean(stack) };
    const key = deduplicationKey ?? (!isActivity ? event.kind + event.message : undefined);
    if (key && now - (recent.get(key) ?? -Infinity) < 30_000) { losses.repeated++; return; }
    if (key) { if (recent.size >= 32) recent.delete(recent.keys().next().value!); recent.set(key, now); }
    if (isActivity) activityCount++; else errorCount++;
    retain(event); push(pending, event, 60, 24 * 1024 - 2); schedule();
  } catch { /* Diagnostic capture must not break the editor or recurse on failures. */ }
}
export function diagnosticsActive() { return active; }
export function nextDiagnosticRequest() { return `${session}:${++sequence}`; }
export function initializeDiagnostics() {
  active = true;
  const browser = navigator.userAgent.match(/(?:Edg|Firefox)\/[\d.]+/)?.[0]
    ?? navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0]
    ?? navigator.userAgent.match(/Version\/[\d.]+/)?.[0]?.replace('Version/', 'Safari/') ?? 'unknown';
  recordBrowserDiagnostic('activity_session', `session=${session} browser=${browser} inFrame=${window.self !== window.top} viewport=${innerWidth}x${innerHeight}`);
  const hide = () => { void flushBrowserDiagnostics(); };
  const visibility = () => { if (document.visibilityState === 'hidden') hide(); };
  window.addEventListener('pagehide', hide); document.addEventListener('visibilitychange', visibility);
  return () => {
    active = false; window.removeEventListener('pagehide', hide); document.removeEventListener('visibilitychange', visibility);
    clearTimeout(timer); timer = undefined;
  };
}
