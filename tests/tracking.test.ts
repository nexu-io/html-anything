import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createTracker, deviceContext } from '../tracking/core.ts';
import { createPosthogSender, loadIdentity } from '../tracking/node.ts';
import { omEvents, studioEvents } from '../tracking/events.ts';
import { validProperties } from '../tracking/core.ts';
import { closeTracking, createAppTracking, saveTrackingPreference, trackingError } from '../shared/tracking.ts';
import { Phase1Service } from '../phase1.ts';
import { renderNext } from '../server.ts';
import { pluginRoot } from '../hyperframes.ts';
import { fixture } from './fixtures.ts';
import { phase1Tools } from '../shared/phase1-tools.ts';
import { toolNames } from '../tracking/events.ts';
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

test('Motion editor events admit only closed categories, UUID projects and bounded counts', () => {
  const projectId = crypto.randomUUID(), exportId = crypto.randomUUID();
  const settings = { origin: 'export_panel', format: 'mp4', quality: 'standard', resolution: '1080p', fps: '30' };
  const valid: Array<[string, Record<string, unknown>]> = [
    ['studio_load_result', { load_id: exportId, outcome: 'success', duration_ms: 10, embedded: false, project_scope: 'default' }],
    ['ui_click', { page_name: 'studio', area: 'header', element: 'export', interaction_method: 'pointer', project_scope: 'managed', project_id: projectId }],
    ['ui_click', { page_name: 'studio', area: 'project_drawer', element: 'language_change', option: 'pt-BR' }],
    ['studio_export_request_result', { export_id: exportId, outcome: 'rejected', ...settings, error_code: 'FFMPEG_MISSING' }],
    ['studio_export_result', { export_id: exportId, job_state: 'failed', duration_ms: 1200, ...settings, error_code: 'RENDER_FAILED', project_id: projectId }],
    ['studio_notice_shown', { notice: 'ffmpeg_missing' }],
    ['studio_edit_result', { outcome: 'success', edit_kind: 'timeline_trim', surface: 'timeline', project_scope: 'managed', project_id: projectId }],
    ['studio_edit_result', { outcome: 'failure', edit_kind: 'other', surface: 'other', error_code: 'CONFLICT' }],
    ['studio_history_step_result', { action: 'redo', outcome: 'unavailable', interaction_method: 'keyboard' }],
    ['studio_asset_import_result', { outcome: 'partial', entry_point: 'assets_drop', requested_count: 3, added_count: 2, failed_count: 1, error_category: 'too_large' }],
  ];
  for (const [event, properties] of valid) {
    assert.equal(validProperties(studioEvents, event, properties), true, event);
    // Every new event is Studio-produced and so admitted by the browser ingress registry.
    assert.deepEqual((omEvents as Record<string, { producers: readonly string[] }>)[event].producers, ['studio'], event);
  }
  const invalid: Array<[string, Record<string, unknown>]> = [
    // The built-in project id is the literal `project`: it is a scope, never a project_id.
    ['studio_edit_result', { outcome: 'success', edit_kind: 'move', surface: 'canvas', project_id: 'project' }],
    ['studio_edit_result', { outcome: 'success', edit_kind: 'move', surface: 'canvas', project_name: 'Launch film' }],
    ['studio_edit_result', { outcome: 'success', edit_kind: 'Edit layer style', surface: 'canvas' }],
    ['studio_edit_result', { outcome: 'success', edit_kind: 'move' }],
    ['studio_export_request_result', { export_id: exportId, outcome: 'accepted', ...settings, composition: 'scenes/intro.html' }],
    ['studio_export_request_result', { export_id: 'demo_2026-11-10_10-00-00', outcome: 'accepted', ...settings }],
    ['studio_export_request_result', { export_id: exportId, outcome: 'rejected', ...settings, error_code: 'ENOENT /Users/a/b' }],
    ['studio_export_result', { export_id: exportId, job_state: 'completed', duration_ms: 1, ...settings, filename: 'out.mp4' }],
    ['studio_export_result', { export_id: exportId, job_state: 'completed', duration_ms: 1, ...settings, fps: 30 }],
    ['studio_asset_import_result', { outcome: 'failure', entry_point: 'assets_button', requested_count: 1, added_count: 0, failed_count: 1, error_category: 'clip.mov too large' }],
    ['studio_asset_import_result', { outcome: 'success', entry_point: 'assets_button', requested_count: -1, added_count: 0, failed_count: 0 }],
    ['studio_history_step_result', { action: 'undo', outcome: 'success', label: 'Undid: Move Title' }],
    ['studio_notice_shown', { notice: 'ffmpeg_missing', command: 'brew install ffmpeg' }],
    ['ui_click', { page_name: 'studio', area: 'header', element: 'export', option: 'My private folder' }],
    ['ui_click', { page_name: 'studio', area: 'assets', element: 'asset_search', query: 'invoice' }],
  ];
  for (const [event, properties] of invalid) assert.equal(validProperties(studioEvents, event, properties), false, JSON.stringify(properties));
  // The worker's terminal event stays worker-only; Studio cannot submit it.
  assert.equal(Object.hasOwn(studioEvents, 'export_result'), false);
});

test('editor dimensions are closed buckets and a bounded template id, never raw values', () => {
  const exportId = crypto.randomUUID();
  const settings = { origin: 'export_panel', format: 'mp4', quality: 'standard', resolution: 'auto', fps: '30' };
  const request = { export_id: exportId, outcome: 'accepted', ...settings };
  const result = { export_id: exportId, job_state: 'completed', duration_ms: 900, ...settings };
  const load = { load_id: exportId, outcome: 'success', duration_ms: 10, embedded: false };
  const ok = (event: string, properties: Record<string, unknown>) => assert.equal(validProperties(studioEvents, event, properties), true, JSON.stringify(properties));
  const no = (event: string, properties: Record<string, unknown>) => assert.equal(validProperties(studioEvents, event, properties), false, JSON.stringify(properties));

  for (const bucket of ['lt_15s', '15_60s', '1_3min', '3_10min', 'gt_10min', 'unknown']) {
    ok('studio_export_request_result', { ...request, video_duration_bucket: bucket });
    ok('studio_export_result', { ...result, video_duration_bucket: bucket });
  }
  for (const raw of [42.5, '42.5', '42s', 'long']) no('studio_export_result', { ...result, video_duration_bucket: raw });
  no('studio_export_result', { ...result, video_duration_seconds: 42 });

  for (const bucket of ['0', '1_5', '6_20', '21_50', 'gt_50', 'unknown']) {
    ok('studio_load_result', { ...load, clip_count_bucket: bucket, asset_count_bucket: bucket });
    ok('studio_export_request_result', { ...request, clip_count_bucket: bucket, asset_count_bucket: bucket });
  }
  for (const bucket of ['1', '2_5', '6_20', 'gt_20', 'unknown']) ok('studio_load_result', { ...load, composition_count_bucket: bucket });
  no('studio_load_result', { ...load, clip_count_bucket: 37 });
  no('studio_load_result', { ...load, asset_count_bucket: '37' });
  no('studio_load_result', { ...load, composition_count_bucket: '0' });
  no('studio_load_result', { ...load, project_bytes: 1024 });
  // The terminal event describes the render, not the project: scale stays on the request.
  no('studio_export_result', { ...result, clip_count_bucket: '1_5' });
  // The events are still valid when a dimension is simply absent.
  ok('studio_load_result', load); ok('studio_export_request_result', request); ok('studio_export_result', result);

  const click = { page_name: 'studio', area: 'templates', element: 'copy_template' };
  const copied = { host_product: 'codex', copy_status: 'clipboard_written' };
  for (const id of ['product-promo', 'hf-moment-M1147', 'hf-block-ai-chat-reveal', 'a', 'A1', 'x'.repeat(64)]) {
    ok('ui_click', { ...click, template_id: id });
    ok('template_instruction_copy_result', { ...copied, page_name: 'studio', template_id: id });
    ok('studio_load_result', { ...load, template_id: id });
    ok('studio_export_request_result', { ...request, template_id: id });
    ok('studio_export_result', { ...result, template_id: id });
  }
  for (const id of ['', 'x'.repeat(65), 'Launch Film', 'launch_film', 'a.b', 'a/b', '../etc', 'https://x.test/t', 'a--b', '-a', 'a-', 'café', 'a\nb', 7]) {
    no('ui_click', { ...click, template_id: id });
    no('studio_export_result', { ...result, template_id: id });
  }
  no('ui_click', { ...click, template_title: 'Product Promo' });
  no('template_instruction_copy_result', { ...copied, template_author: 'someone' });
  no('ui_click', { ...click, element: 'template_category', option: 'my-private-category' });
  ok('ui_click', { ...click, element: 'template_category', option: 'featured' });
  // No host field was added to the load event: the Studio page does not know its host.
  no('studio_load_result', { ...load, host_product: 'codex' });
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
  const options = { identity, appVersion: '0.0.0-test', env: 'test' as const, host: 'https://us.i.posthog.com', token: 'phc_test' };
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
  assert.deepEqual([...toolNames].sort(), phase1Tools.map(tool => tool.name).sort());
  const events: PendingEvent[] = [], tracking = core(async batch => { events.push(...batch); return 'accepted'; });
  const service = new Phase1Service(store, pluginRoot, { tracking, origin: () => 'http://127.0.0.1:4173',
    nativeUrl: () => undefined, openProject: async () => {}, mutation: async task => task(), cancel: async () => {} });
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
    await saveTrackingPreference(store.directory, true); assert.equal(restarted.enabled(), true);
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
  const current = await store.get(), job = await store.requestExport(current.revision);
  assert.equal(job.state, 'pending'); assert.equal(tracking.pending(), 0);
  await writeFile(path.join(store.snapshotDirectory(job.id), 'index.html'), '<html><body>Invalid composition for a failure test</body></html>');
  await renderNext(store, pluginRoot, tracking);
  assert.equal((await store.job(job.id))!.state, 'failed');
  await renderNext(store, pluginRoot, tracking);
  await tracking.flush();
  assert.equal(events.length, 1); assert.equal(events[0].event, 'export_result');
  assert.equal(events[0].entrypoint, 'worker'); assert.equal(events[0].properties.job_state, 'failed');
  assert.equal((await store.get()).revision, current.revision);
  assert.equal(events[0].properties.technical_check, 'unknown'); tracking.close();
}));
