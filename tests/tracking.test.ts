import test from 'node:test';
import { legacyToolName } from '../shared/public-names.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createTracker, deviceContext, validProperties } from '../tracking/core.ts';
import { createNodeTracking, createPosthogSender, loadIdentity } from '../tracking/node.ts';
import { omEvents, studioEvents } from '../tracking/events.ts';
import { closeTracking, createAppTracking, saveTrackingPreference, trackingError } from '../shared/tracking.ts';
import { Phase1Service } from '../phase1.ts';
import { renderNext } from '../server.ts';
import { pluginRoot } from '../hyperframes.ts';
import { fixture } from './fixtures.ts';
import { phase1Tools } from '../shared/phase1-tools.ts';
import { toolNames } from '../tracking/events.ts';
import { identifyHost } from '../tracking/host.ts';
import { transport } from './http.ts';
import type { PendingEvent } from '../tracking/core.ts';

function packet(): PendingEvent {
  return { event: 'ui_click', event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(), entrypoint: 'studio',
    ...deviceContext(), properties: { page_name: 'home', area: 'workspace', element: 'new_creation' } };
}
const core = (send: Parameters<typeof createTracker>[0]['send'], maxQueue = 64) =>
  createTracker({ registry: omEvents, entrypoint: 'mcp', enabled: true, flushIntervalMs: 0, maxQueue, send });

test('Studio event types reject Node-only events and invalid semantic fields', () => {
  execFileSync(process.execPath, [path.join(pluginRoot, 'node_modules/typescript/bin/tsc'),
    '--noEmit', '--strict', '--allowImportingTsExtensions', '--module', 'ESNext', '--moduleResolution', 'Bundler',
    '--target', 'ES2022', '--lib', 'ES2023,DOM', '--skipLibCheck', path.join(pluginRoot, 'tests/tracking-types.ts')],
  { cwd: pluginRoot, stdio: 'pipe' });
});

test('bounded queue rejects private properties, preserves UUID/time on retries and serializes flushes', async () => {
  const batches: PendingEvent[][] = []; let attempts = 0;
  const tracker = core(async events => { batches.push(structuredClone([...events])); return ++attempts === 1 ? 'retry' : 'accepted'; }, 2);
  const event = packet();
  assert.equal(tracker.ingest({ ...event, properties: { ...event.properties, prompt: 'private text' } }), 'invalid');
  assert.equal(tracker.ingest({ ...event, device_id: crypto.randomUUID() }), 'invalid');
  assert.equal(tracker.ingest({ ...event, occurred_at: 123 }), 'invalid');
  assert.equal(tracker.ingest({ ...event, device_timezone: 'not/a/timezone' }), 'invalid');
  assert.equal(tracker.ingest(event), 'queued');
  assert.equal(tracker.ingest(event), 'duplicate');
  assert.equal(tracker.ingest(packet()), 'queued');
  assert.equal(tracker.ingest(packet()), 'full');
  const first = tracker.flush(); assert.equal(tracker.flush(), first);
  assert.equal(await first, 'retry'); assert.equal(tracker.pending(), 2);
  assert.equal(await tracker.flush(), 'accepted'); assert.deepEqual(batches[0], batches[1]);
  assert.equal(tracker.pending(), 0); tracker.close();
});

test('opting out aborts the in-flight request, erases the queue and prevents later reports', async () => {
  let aborted = false, sends = 0;
  const tracker = core(async (_events, signal) => { sends++; return new Promise(resolve => {
    signal.addEventListener('abort', () => { aborted = true; resolve('retry'); }, { once: true });
  }); });
  tracker.ingest(packet()); const pending = tracker.flush(); tracker.setEnabled(false);
  assert.equal(await pending, 'disabled'); assert.equal(aborted, true); assert.equal(tracker.pending(), 0);
  assert.equal(tracker.ingest(packet()), 'disabled'); assert.equal(await tracker.flush(), 'disabled'); assert.equal(sends, 1);
});

test('concurrent identity creation has one winner, keeps its first source and fails closed on corruption', () => fixture(async store => {
  const directory = path.join(store.directory, 'tracking');
  const identities = await Promise.all(Array.from({ length: 20 }, () => loadIdentity(directory, 'alice')));
  assert.equal(new Set(identities.map(value => value.installation_id)).size, 1);
  assert.equal((await loadIdentity(directory, 'bob')).utm_source, 'alice');
  assert.deepEqual(await readdir(directory), ['identity.json']);
  await writeFile(path.join(directory, 'identity.json'), JSON.stringify({ installation_id: identities[0].installation_id, created_at: identities[0].created_at }));
  await assert.rejects(loadIdentity(directory), /INVALID_IDENTITY/);
  await writeFile(path.join(directory, 'identity.json'), '{}');
  await assert.rejects(loadIdentity(directory), /INVALID_IDENTITY/);
  await assert.rejects(loadIdentity(directory, 'https://private.example'), /INVALID_SOURCE/);
}, false));

test('PostHog adapter uses public ingest only, privacy fields and real receipt semantics', async () => {
  const identity = { installation_id: crypto.randomUUID(), utm_source: 'alice', created_at: new Date().toISOString() };
  const options = { identity, appVersion: '0.0.0', env: 'test' as const, host: 'https://us.i.posthog.com', token: 'phc_test' };
  assert.throws(() => createPosthogSender({ ...options, token: 'phx_private' }), /PUBLIC_PROJECT/);
  assert.throws(() => createPosthogSender({ ...options, host: 'http://example.com' }), /INVALID_INGEST/);
  assert.throws(() => createPosthogSender({ ...options, host: 'https://user:secret@example.com' }), /INVALID_INGEST/);
  const event = packet(); const seen: any[] = []; let response = new Response('{"status":1}');
  const sender = createPosthogSender({ ...options, fetch: async (url, init) => {
    assert.equal(String(url), 'https://us.i.posthog.com/batch/'); seen.push(JSON.parse(String(init?.body))); return response;
  } });
  assert.equal(await sender([event], new AbortController().signal), 'accepted');
  const data = seen[0].batch[0];
  assert.equal(data.uuid, event.event_id); assert.equal(data.timestamp, event.occurred_at);
  assert.equal(data.properties.distinct_id, identity.installation_id); assert.equal(data.properties.device_id, identity.installation_id);
  assert.equal(data.properties.utm_source, 'alice'); assert.equal(data.properties.event_schema_version, 1);
  assert.equal(data.properties.$ip, '0.0.0.0'); assert.equal(data.properties.$geoip_disable, true);
  assert.equal(data.properties.$process_person_profile, false);
  response = new Response('{"status":"Ok"}'); assert.equal(await sender([event], new AbortController().signal), 'accepted');
  response = new Response('{"status":1,"quota_limited":["events"]}'); assert.equal(await sender([event], new AbortController().signal), 'retry');
  response = new Response('{}', { status: 429 }); assert.equal(await sender([event], new AbortController().signal), 'retry');
  response = new Response('{}', { status: 400 }); assert.equal(await sender([event], new AbortController().signal), 'drop');
  response = new Response('not json'); assert.equal(await sender([event], new AbortController().signal), 'retry');
  assert.equal(trackingError(new Error('private user prompt and /local/path')), 'TOOL_FAILED');
  const enriched: any[] = [];
  const geoip = createPosthogSender({ ...options, geoip: true, fetch: async (_url, init) => { enriched.push(JSON.parse(String(init?.body))); return Response.json({ status: 'Ok' }); } });
  await geoip([event], new AbortController().signal);
  assert.equal(enriched[0].batch[0].properties.$geoip_disable, false);
  assert.equal(Object.hasOwn(enriched[0].batch[0].properties, '$ip'), false);
});

test('all application versions report in development, test and production environments', async t => {
  const identity = { installation_id: crypto.randomUUID(), utm_source: null, created_at: new Date().toISOString() };
  for (const appVersion of ['0.6.4', '0.6.4-test.8', '0.6.4-test.42.2', '0.6.4-local.1', '0.6.4-beta.1']) {
    for (const env of ['development', 'test', 'production'] as const) {
      const bodies: any[] = [];
      const options = { registry: omEvents, identity, appVersion, env, entrypoint: 'mcp' as const, enabled: true,
        flushIntervalMs: 0, host: 'https://us.i.posthog.com', token: 'phc_test' };
      t.mock.method(globalThis, 'fetch', async (_url: any, init?: RequestInit) => {
        bodies.push(JSON.parse(String(init?.body))); return Response.json({ status: 'Ok' });
      });
      const tracking = createNodeTracking(options);
      try {
        assert.equal(tracking.enabled(), true); assert.equal(tracking.ingest(packet()), 'queued');
        assert.equal(await tracking.flush(), 'accepted');
        assert.equal(await createPosthogSender(options)([packet()], new AbortController().signal), 'accepted');
        assert.equal(bodies.length, 2);
        for (const body of bodies) {
          assert.equal(body.batch[0].properties.app_version, appVersion);
          assert.equal(body.batch[0].properties.env, env);
        }
      } finally { tracking.close(); }
    }
  }
});

test('browser ingress rejects forged identity, worker events and oversized batches', () => fixture(async store => {
  const events: PendingEvent[] = [], tracking = core(async batch => { events.push(...batch); return 'accepted'; });
  const request = transport(store, { tracking });
  const config = await (await request('/motion-api/tracking')).json(); assert.deepEqual(config, { enabled: true });
  const send = (data: unknown) => request('/motion-api/tracking', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
  const event = packet(); assert.equal((await send({ events: [event] })).status, 200);
  assert.equal((await send({ events: [event] })).status, 200);
  for (const data of [
    { events: [{ ...packet(), properties: { ...packet().properties, distinct_id: 'forged' } }] },
    { events: [{ ...packet(), utm_source: 'forged' }] },
    { events: [{ ...packet(), entrypoint: 'worker' }] },
    { events: [{ ...packet(), event: 'mcp_tool_started', properties: { tool_name: 'motion_get_project', call_id: crypto.randomUUID(), accepted: true } }] },
    { events: [{ ...packet(), event: 'export_result', properties: { job_id: crypto.randomUUID(), job_state: 'completed', duration_ms: 100, technical_check: 'passed' } }] },
    { events: Array.from({ length: 17 }, packet) },
    { events: [packet()], token: 'forged' },
  ]) assert.equal((await send(data)).status, 400);
  assert.equal((await send({ events: [packet()], padding: 'x'.repeat(65536) })).status, 400);
  await tracking.flush(); assert.equal(events.length, 1); tracking.close();
  assert.equal((await send({ events: [packet()] })).status, 200); assert.equal(tracking.pending(), 0);
}, false));

test('domain events follow real commits, skip replay and retain safe failure without source contents', () => fixture(async store => {
  assert.deepEqual([...toolNames].sort(), phase1Tools.map(tool => legacyToolName(tool.name)).sort());
  const events: PendingEvent[] = [], tracking = core(async batch => { events.push(...batch); return 'accepted'; });
  const service = new Phase1Service(store, pluginRoot, { tracking, origin: () => 'http://127.0.0.1:4173',
    nativeUrl: () => undefined, openProject: async () => {}, mutation: async task => task(), cancel: async () => {} });
  await service.call('openmotion_open_preview', { target: 'templates' });
  const args = { requestId: crypto.randomUUID(), projectType: 'natural_language', title: 'PRIVATE_TITLE', requirements: 'PRIVATE_PROMPT' };
  const created = await service.call('motion_create_project', args);
  assert.equal((await service.call('motion_create_project', args)).replayed, true);
  const edit = { projectId: created.projectId, requestId: crypto.randomUUID(), expectedRevision: created.revision,
    expectedVersionId: created.version.versionId, files: [{ path: 'private.txt', content: 'PRIVATE_SOURCE' }] };
  await service.call('motion_edit_project', edit);
  await assert.rejects(service.call('motion_edit_project', { ...edit, requestId: crypto.randomUUID() }), /VERSION_CONFLICT/);
  await tracking.flush();
  assert.deepEqual(events.map(event => [event.event, event.properties.outcome]), [
    ['project_create_result', 'success'], ['project_edit_result', 'success'], ['project_edit_result', 'failure'],
  ]);
  assert.equal(events[2].properties.error_code, 'VERSION_CONFLICT');
  assert.doesNotMatch(JSON.stringify(events), /PRIVATE_|private\.txt/); tracking.close();
}, false));

test('DO_NOT_TRACK creates no identity and sends nothing', () => fixture(async store => {
  const before = process.env.DO_NOT_TRACK; process.env.DO_NOT_TRACK = '1';
  try {
    const tracking = await createAppTracking(store.directory, 'mcp');
    assert.equal(tracking.enabled(), false); assert.equal(tracking.ingest(packet()), 'disabled');
    await closeTracking(tracking);
    await assert.rejects(readFile(path.join(store.directory, 'tracking', 'identity.json')), /ENOENT/);
  } finally { if (before === undefined) delete process.env.DO_NOT_TRACK; else process.env.DO_NOT_TRACK = before; }
}, false));

test('default configuration reports without opt-in; saved opt-out covers runtimes, restart and re-enable', t => fixture(async store => {
  const keys = ['OPENMOTION_TELEMETRY', 'DO_NOT_TRACK', 'OPENMOTION_POSTHOG_HOST', 'OPENMOTION_POSTHOG_KEY', 'OPENMOTION_TRACKING_ENV', 'OPENMOTION_TRACKING_TEST_RUN_ID'];
  const before = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const bodies: any[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: any, init: RequestInit) => { bodies.push(JSON.parse(String(init.body))); return Response.json({ status: 'Ok' }); });
  const runtimes: Awaited<ReturnType<typeof createAppTracking>>[] = [];
  try {
    for (const key of keys) delete process.env[key];
    process.env.OPENMOTION_TRACKING_ENV = 'test'; process.env.OPENMOTION_TRACKING_TEST_RUN_ID = crypto.randomUUID();
    const mcp = await createAppTracking(store.directory, 'mcp'), worker = await createAppTracking(store.directory, 'worker'); runtimes.push(mcp, worker);
    assert.equal(mcp.enabled(), true); assert.equal(worker.enabled(), true);
    mcp.ingest(packet()); assert.equal(await mcp.flush(), 'accepted'); assert.equal(bodies.length, 1);
    assert.equal(bodies[0].batch[0].properties.$geoip_disable, false);
    const request = transport(store, { tracking: worker });
    mcp.ingest(packet()); worker.ingest(packet());
    const set = (enabled: unknown) => request('/motion-api/tracking/preferences', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled }) });
    assert.equal((await set('false')).status, 400);
    assert.equal((await set(false)).status, 200);
    assert.equal(await mcp.flush(), 'disabled'); assert.equal(await worker.flush(), 'disabled');
    assert.equal(mcp.pending(), 0); assert.equal(worker.pending(), 0); assert.equal(bodies.length, 1);
    const restarted = await createAppTracking(store.directory, 'mcp'); runtimes.push(restarted);
    assert.equal(restarted.enabled(), false); assert.equal(restarted.ingest(packet()), 'disabled');
    for (let cycle = 0; cycle < 2; cycle++) {
      assert.equal((await set(true)).status, 200);
      for (const runtime of runtimes) {
        assert.equal(runtime.enabled(), true); assert.equal(runtime.ingest(packet()), 'queued');
        assert.equal(await runtime.flush(), 'accepted');
      }
      assert.equal(bodies.length, 1 + (cycle + 1) * runtimes.length);
      assert.equal((await set(false)).status, 200);
      for (const runtime of runtimes) {
        assert.equal(runtime.ingest(packet()), 'disabled'); assert.equal(await runtime.flush(), 'disabled');
      }
    }
    assert.equal((await set(true)).status, 200);
    assert.equal(new Set(bodies.flatMap(body => body.batch.map((event: any) => event.properties.installation_id))).size, 1);
    assert.equal(restarted.enabled(), true);
    process.env.OPENMOTION_TELEMETRY = '0'; assert.equal(restarted.ingest(packet()), 'disabled');
    assert.equal((await set(true)).status, 403); delete process.env.OPENMOTION_TELEMETRY;
    await writeFile(path.join(store.directory, 'tracking/preferences.json'), 'corrupted');
    assert.equal(restarted.ingest(packet()), 'disabled');
  } finally {
    for (const runtime of runtimes) runtime.close();
    for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; }
  }
}, false));

test('worker reports a real terminal render failure once, separately from queue acceptance', () => fixture(async store => {
  const events: PendingEvent[] = [], tracking = core(async batch => { events.push(...batch); return 'accepted'; });
  const host = identifyHost({ name: 'dsh-mcp-client', version: '0.0.1' });
  const current = await store.get(), job = await store.requestExport(current.revision, { trackingHost: host });
  assert.equal(job.state, 'pending'); assert.equal(tracking.pending(), 0);
  await writeFile(path.join(store.snapshotDirectory(job.id), 'index.html'), '<html><body>Invalid composition for a failure test</body></html>');
  await renderNext(store, pluginRoot, tracking);
  assert.equal((await store.job(job.id))!.state, 'failed');
  await renderNext(store, pluginRoot, tracking);
  await tracking.flush();
  assert.equal(events.length, 1); assert.equal(events[0].event, 'export_result');
  assert.equal(events[0].entrypoint, 'worker'); assert.equal(events[0].properties.job_state, 'failed');
  assert.deepEqual(events[0].host_context, host);
  assert.equal((await store.get()).revision, current.revision);
  assert.equal(events[0].properties.technical_check, 'unknown'); tracking.close();
}));

test('template library events: the search keyword is the only free text and stays bounded', () => {
  const id = '4f6d1c2e-8a3b-4c5d-9e7f-0a1b2c3d4e5f';
  const search = { search_id: id, query_length: 6, result_count: 1, outcome: 'success' };
  const ok = (event: string, properties: Record<string, unknown>) => assert.equal(validProperties(studioEvents, event, properties), true, JSON.stringify(properties));
  const no = (event: string, properties: Record<string, unknown>) => assert.equal(validProperties(studioEvents, event, properties), false, JSON.stringify(properties));
  ok('template_search_result', { ...search, search_keyword: 'saas 发布会 launch', page_name: 'studio', area: 'template_discovery' });
  for (const search_keyword of ['', ' padded ', 'x'.repeat(101), 'line\nbreak', 42]) no('template_search_result', { ...search, search_keyword });
  no('template_search_result', { query_length: 6, result_count: 1, outcome: 'success' });
  // No other template event accepts text: an option is a slug and a title is not a field at all.
  no('ui_click', { page_name: 'studio', area: 'template_discovery', element: 'filter_option', filter_value: 'Two Words' });
  no('ui_click', { page_name: 'studio', area: 'template_card', element: 'open_detail', title: 'Private title' });
  no('ui_click', { page_name: 'studio', area: 'template_discovery', element: 'category_select', search_keyword: 'x' });
  no('ui_click', { page_name: 'studio', area: 'template_card', element: 'open_detail', template_id: 'https://example.com/a' });
  ok('ui_click', { page_name: 'studio', area: 'template_card', element: 'open_detail', template_id: 'motion-e6ac921a-f56f-4170-a2be-938cec5d028b', placement: 'related', position: 1 });
  ok('surface_view', { page_name: 'studio', area: 'template_detail', element: 'detail', detail_view_id: id, detail_mode: 'modal', placement: 'random' });
  ok('surface_view', { page_name: 'studio', area: 'template_card', element: 'card', template_id: 'hf-moment-M1147', placement: 'catalog', position: 12, sort: 'duration', applied_filter_count: 0 });
  ok('template_filter_result', { action: 'sort_change', result_count: 0, outcome: 'success', sort: 'reverse' });
  ok('resource_download_result', { resource_kind: 'motion_guide', download_attempt_id: id, delivery_status: 'fetch_failed', error_code: 'HTTP_404' });
  no('resource_download_result', { resource_kind: 'motion_guide', download_attempt_id: id, delivery_status: 'saved_to_disk' });
});
