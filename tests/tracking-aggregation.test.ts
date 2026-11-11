import test from 'node:test';
import assert from 'node:assert/strict';
import { createTracker, deviceContext, validPending } from '../tracking/core.ts';
import type { PendingEvent } from '../tracking/core.ts';
import { createNodeTracking } from '../tracking/node.ts';
import { omEvents } from '../tracking/events.ts';
import { closeTracking, createAppTracking } from '../shared/tracking.ts';
import { fixture } from './fixtures.ts';
import { transport } from './http.ts';

const click = { page_name: 'home', area: 'workspace', element: 'new_creation' } as const;
const aggregation = { ui_click: { windowMs: 60_000 } } as const;
function packet(properties = click): PendingEvent {
  return { event: 'ui_click', event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(),
    entrypoint: 'studio', ...deviceContext(), properties: { ...properties } };
}
function options(send: Parameters<typeof createTracker>[0]['send']) {
  return { registry: omEvents, entrypoint: 'mcp' as const, enabled: true, flushIntervalMs: 0, send };
}
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

test('count aggregation is opt-in and unsupported events or malformed windows fail before collection', async () => {
  for (const policy of [undefined, { ui_click: false }] as const) {
    const events: PendingEvent[] = [];
    const tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), aggregation: policy });
    try {
      for (let i = 0; i < 5; i++) assert.equal(tracker.ingest(packet()), 'queued');
      assert.equal(await tracker.flush(), 'accepted');
      assert.equal(events.length, 5); assert(events.every(event => event.event === 'ui_click'));
    } finally { tracker.close(); }
  }
  for (const policy of [null, [], true, { unknown: false }, { project_create_result: { windowMs: 60_000 } },
    { ui_click: true }, { ui_click: { windowMs: 999 } }, { ui_click: { windowMs: 70_000 } },
    { ui_click: { windowMs: 7000 } }, { ui_click: { windowMs: 60_000, groupBy: [] } }]) {
    assert.throws(() => createTracker({ ...options(async () => 'accepted'), aggregation: policy as any }), /COUNT|COUNTABLE/);
  }
  const { interaction_method: omitted, ...incomplete } = omEvents.ui_click_count.fields;
  assert(omitted);
  assert.throws(() => createTracker({ ...options(async () => 'accepted'),
    registry: { ...omEvents, ui_click_count: { ...omEvents.ui_click_count, fields: incomplete } }, aggregation }), /INVALID_COUNT_SCHEMA/);
});

test('1000 raw clicks become one immutable summary with the same count and full semantic dimensions', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-11T12:00:01.000Z') });
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...structuredClone(batch)); return 'accepted'; }), aggregation });
  try {
    const duplicate = packet(); assert.equal(tracker.ingest(duplicate), 'queued');
    assert.equal(tracker.ingest(duplicate), 'duplicate');
    for (let i = 1; i < 1000; i++) assert.equal(tracker.ingest(packet()), 'queued');
    assert.equal(tracker.pending(), 1); assert.equal(await tracker.flush(), 'accepted');
    assert.equal(events.length, 1); assert.equal(events[0].event, 'ui_click_count');
    assert.equal(events[0].properties.count, 1000); assert.equal(events[0].entrypoint, 'studio');
    assert.equal(events[0].properties.page_name, click.page_name); assert.equal(events[0].properties.area, click.area);
    assert.equal(events[0].properties.element, click.element); assert.equal(validPending(omEvents, events[0]), true);
    assert.equal(Date.parse(String(events[0].properties.window_end)) - Date.parse(String(events[0].properties.window_start)), 60_000);
    assert.equal(events[0].occurred_at, events[0].properties.window_start);
    assert.equal(tracker.pending(), 0);
  } finally { tracker.close(); }
});

test('property order coalesces but optional dimensions, entrypoints and device timezone stay separate', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-11T12:00:01.000Z') });
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), aggregation });
  try {
    const event = packet(); tracker.ingest(event);
    tracker.ingest({ ...packet(), properties: { element: click.element, area: click.area, page_name: click.page_name } });
    tracker.ingest({ ...packet(), properties: { ...click, interaction_method: 'pointer' } });
    tracker.ingest({ ...packet(), properties: { ...click, interaction_method: 'keyboard' } });
    tracker.ingest({ ...packet(), entrypoint: 'mcp' });
    tracker.ingest({ ...packet(), device_timezone: null, utc_offset_minutes: event.utc_offset_minutes === 0 ? 60 : 0 });
    await tracker.flush(); assert.equal(events.length, 5);
    assert.deepEqual(events.map(event => event.properties.count).sort(), [1, 1, 1, 1, 2]);
    assert.equal(events.reduce((sum, event) => sum + Number(event.properties.count), 0), 6);
  } finally { tracker.close(); }
});

test('windows split at UTC midnight and are based on event time rather than arrival time', async t => {
  const midnight = Date.parse('2026-11-11T00:00:00.000Z');
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: midnight + 5000 });
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), aggregation });
  try {
    tracker.ingest({ ...packet(), occurred_at: new Date(midnight - 1).toISOString() });
    tracker.ingest(packet()); await tracker.flush();
    assert.deepEqual(events.map(event => event.properties.window_start), ['2026-11-10T23:59:00.000Z', '2026-11-11T00:00:00.000Z']);
    assert.deepEqual(events.map(event => event.properties.count), [1, 1]);
  } finally { tracker.close(); }
});

test('automatic reporting waits for the count window while unrelated raw events keep their normal interval', async t => {
  const start = Date.parse('2026-11-11T12:00:00.000Z');
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: start });
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), flushIntervalMs: 1000, aggregation });
  try {
    tracker.ingest(packet());
    tracker.track('project_create_result', { outcome: 'success' });
    t.mock.timers.tick(1000); await settle();
    assert.deepEqual(events.map(event => event.event), ['project_create_result']);
    assert.equal(tracker.pending(), 1);
    t.mock.timers.tick(58_999); await settle(); assert.equal(events.length, 1);
    t.mock.timers.tick(1); await settle();
    assert.equal(events[1].event, 'ui_click_count'); assert.equal(events[1].properties.count, 1);
    t.mock.timers.tick(60_000); await settle(); assert.equal(events.length, 2);
  } finally { tracker.close(); }
});

test('in-flight and retried summaries retain UUID, timestamp and count while new clicks form a new part', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-11T12:00:01.000Z') });
  let resolve!: (receipt: 'retry') => void;
  const batches: PendingEvent[][] = [];
  const tracker = createTracker({ ...options(async events => {
    batches.push(structuredClone([...events]));
    if (batches.length === 1) return new Promise<'retry'>(done => { resolve = done; });
    return 'accepted';
  }), aggregation });
  try {
    for (let i = 0; i < 5; i++) tracker.ingest(packet());
    const pending = tracker.flush(); assert.equal(tracker.flush(), pending);
    for (let i = 0; i < 2; i++) tracker.ingest(packet());
    assert.equal(batches[0][0].properties.count, 5);
    resolve('retry'); assert.equal(await pending, 'retry');
    assert.equal(await tracker.flush(), 'accepted');
    assert.deepEqual(batches[1][0], batches[0][0]);
    assert.equal(batches[1][1].properties.count, 2);
    assert.notEqual(batches[1][0].event_id, batches[1][1].event_id);
    assert.equal(batches[1].reduce((sum, event) => sum + Number(event.properties.count), 0), 7);
  } finally { tracker.close(); }
});

test('queue limits never silently coalesce unlike dimensions and opt-out clears all count state', async () => {
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), aggregation, maxQueue: 1 });
  try {
    for (let i = 0; i < 100; i++) assert.equal(tracker.ingest(packet()), 'queued');
    assert.equal(tracker.ingest({ ...packet(), properties: { ...click, element: 'recent_session' } }), 'full');
    tracker.setEnabled(false); assert.equal(tracker.pending(), 0);
    assert.equal(await tracker.flush(), 'disabled'); assert.equal(tracker.ingest(packet()), 'disabled');
    tracker.setEnabled(true); tracker.ingest(packet()); await tracker.flush();
    assert.equal(events.length, 1); assert.equal(events[0].properties.count, 1);
  } finally { tracker.close(); }
});

test('count summaries reject direct submission and domain close drains a partial window', async () => {
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'accepted'; }), aggregation });
  assert.equal(tracker.ingest({ ...packet(), properties: { ...click, prompt: 'PRIVATE' } }), 'invalid');
  assert.equal(tracker.ingest({ ...packet(), properties: { ...click, count: 999 } }), 'invalid');
  assert.equal(tracker.ingest({ ...packet(), event: 'ui_click_count', properties: { ...click, count: 999,
    window_start: new Date().toISOString(), window_end: new Date().toISOString() } }), 'invalid');
  tracker.ingest(packet()); tracker.ingest(packet()); await closeTracking(tracker);
  assert.equal(events.length, 1); assert.equal(events[0].properties.count, 2); assert.equal(tracker.enabled(), false);
});

test('Node output preserves identity and source and a replay matches raw business counts per dimension', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-11T12:00:01.000Z') });
  const wire: any[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: any, init: RequestInit) => { wire.push(JSON.parse(String(init.body))); return Response.json({ status: 'Ok' }); });
  const baseline = new Map<string, number>(), identities = new Map<string, string>();
  for (const source of ['creator_a', 'creator_b']) {
    const id = crypto.randomUUID(); identities.set(source, id);
    const tracker = createNodeTracking({ registry: omEvents, entrypoint: 'mcp', enabled: true, flushIntervalMs: 0,
      identity: { installation_id: id, utm_source: source, created_at: new Date().toISOString() },
      appVersion: '0.0.0', env: 'test', host: 'https://us.i.posthog.com', token: 'phc_test', aggregation });
    try {
      for (const element of ['new_creation', 'recent_session'] as const) for (let i = 0; i < 100; i++) {
        const event = packet(); event.properties.element = element; tracker.ingest(event);
        const key = JSON.stringify([id, source, element]); baseline.set(key, (baseline.get(key) ?? 0) + 1);
      }
      await tracker.flush();
    } finally { tracker.close(); }
  }
  const summaries = wire.flatMap(body => body.batch), observed = new Map<string, number>();
  assert.equal(summaries.length, 4);
  for (const event of summaries) {
    assert.equal(event.event, 'ui_click_count'); const p = event.properties;
    assert.equal(p.installation_id, identities.get(p.utm_source)); assert.equal(p.product, 'openmotion');
    const key = JSON.stringify([p.installation_id, p.utm_source, p.element]); observed.set(key, (observed.get(key) ?? 0) + p.count);
  }
  assert.deepEqual(observed, baseline);
  assert.equal(summaries.reduce((sum, event) => sum + event.properties.count, 0), 400);
});

test('application reporting config controls local browser ingress without admitting forged summaries', t => fixture(async store => {
  const keys = ['OPENMOTION_TRACKING_AGGREGATION', 'OPENMOTION_TRACKING_ENV', 'OPENMOTION_TRACKING_TEST_RUN_ID', 'OPENMOTION_TELEMETRY', 'DO_NOT_TRACK'];
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const wire: any[] = [], runtimes: Awaited<ReturnType<typeof createAppTracking>>[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: any, init: RequestInit) => { wire.push(JSON.parse(String(init.body))); return Response.json({ status: 'Ok' }); });
  try {
    delete process.env.OPENMOTION_TELEMETRY; delete process.env.DO_NOT_TRACK;
    process.env.OPENMOTION_TRACKING_ENV = 'test'; process.env.OPENMOTION_TRACKING_TEST_RUN_ID = crypto.randomUUID();
    process.env.OPENMOTION_TRACKING_AGGREGATION = JSON.stringify(aggregation);
    const tracker = await createAppTracking(store.directory, 'mcp'); runtimes.push(tracker);
    const request = transport(store, { tracking: tracker });
    const send = (events: unknown[]) => request('/motion-api/tracking', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events }) });
    const events = Array.from({ length: 16 }, () => packet());
    assert.equal((await send(events)).status, 200); assert.equal((await send(events)).status, 200);
    assert.equal((await send([{ ...packet(), event: 'ui_click_count', properties: { ...click, count: 999,
      window_start: new Date().toISOString(), window_end: new Date().toISOString() } }])).status, 400);
    await tracker.flush(); assert.equal(wire.length, 1); assert.equal(wire[0].batch[0].properties.count, 16);
    const raw = await createAppTracking(store.directory, 'mcp', { aggregation: { ui_click: false } }); runtimes.push(raw);
    raw.ingest(packet()); raw.ingest(packet()); await raw.flush();
    assert.equal(wire[1].batch.length, 2); assert.equal(wire[1].batch[0].event, 'ui_click');
    process.env.OPENMOTION_TRACKING_AGGREGATION = '{invalid';
    const invalid = await createAppTracking(store.directory, 'mcp'); runtimes.push(invalid); assert.equal(invalid.enabled(), false);
  } finally {
    for (const runtime of runtimes) runtime.close();
    for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
}, false));

test('opting out aborts a summary in flight and never replays the discarded window', async () => {
  let sends = 0, aborted = false;
  const tracker = createTracker({ ...options(async (_events, signal) => {
    sends++;
    return new Promise<'retry'>(resolve => signal.addEventListener('abort', () => { aborted = true; resolve('retry'); }, { once: true }));
  }), aggregation });
  tracker.ingest(packet()); const pending = tracker.flush(); tracker.setEnabled(false);
  assert.equal(await pending, 'disabled'); assert.equal(aborted, true); assert.equal(tracker.pending(), 0);
  tracker.setEnabled(true); assert.equal(await tracker.flush(), 'empty'); assert.equal(sends, 1); tracker.close();
});

test('permanent rejection and TTL expiry do not keep orphaned aggregate groups', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-11T12:00:01.000Z') });
  const events: PendingEvent[] = [], tracker = createTracker({ ...options(async batch => { events.push(...batch); return 'drop'; }), aggregation });
  try {
    tracker.ingest(packet()); assert.equal(await tracker.flush(), 'drop'); assert.equal(tracker.pending(), 0);
    tracker.ingest(packet()); t.mock.timers.tick(86_400_001);
    assert.equal(await tracker.flush(), 'empty'); assert.equal(tracker.pending(), 0);
    tracker.ingest(packet()); assert.equal(await tracker.flush(), 'drop');
    assert.equal(events.length, 2); assert.deepEqual(events.map(event => event.properties.count), [1, 1]);
  } finally { tracker.close(); }
});

test('count policy cannot enable reporting in test builds or bypass a live policy opt-out', async () => {
  const identity = { installation_id: crypto.randomUUID(), utm_source: 'creator_a', created_at: new Date().toISOString() };
  const locked = createNodeTracking({ registry: omEvents, entrypoint: 'mcp', identity, appVersion: '0.6.4-test.1',
    host: 'https://us.i.posthog.com', token: 'phc_test', env: 'test', enabled: true, aggregation });
  locked.setEnabled(true); assert.equal(locked.ingest(packet()), 'disabled'); locked.close();
  let allowed = true;
  const tracker = createTracker({ ...options(async () => assert.fail('opt-out must prevent delivery')), isEnabled: () => allowed, aggregation });
  tracker.ingest(packet()); allowed = false;
  assert.equal(await tracker.flush(), 'disabled'); assert.equal(tracker.pending(), 0); tracker.close();
});
