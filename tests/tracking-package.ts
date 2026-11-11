import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transport } from './http.ts';

// Run only in a child process against an extracted package; never contact a collector.
const [root, mode] = process.argv.slice(2);
assert(root && ['test', 'stable'].includes(mode));
for (const key of ['OPENMOTION_TELEMETRY', 'DO_NOT_TRACK', 'OPENMOTION_POSTHOG_HOST', 'OPENMOTION_POSTHOG_KEY']) delete process.env[key];
process.env.OPENMOTION_TRACKING_ENV = 'test'; process.env.OPENMOTION_TRACKING_TEST_RUN_ID = crypto.randomUUID();
const directory = await mkdtemp(path.join(tmpdir(), 'motion-tracking-package-'));
process.env.MOTION_DATA_DIR = directory;
const load = (file: string) => import(pathToFileURL(path.join(root, file)).href);
const { createAppTracking, saveTrackingPreference, trackingLocked, trackingLockReason } = await load('shared/tracking.ts');
const { handler } = await load('server.ts'), { WorkspaceStore } = await load('workspace.ts');
const { deviceContext } = await load('tracking/core.ts');
const packet = () => ({ event: 'ui_click', event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(), entrypoint: 'studio',
  ...deviceContext(), properties: { page_name: 'home', area: 'workspace', element: 'new_creation' } });
const bodies: any[] = [];
globalThis.fetch = async (_url, init) => { bodies.push(JSON.parse(String(init?.body))); return Response.json({ status: 'Ok' }); };
const runtimes: any[] = [];
try {
  if (mode === 'test') await saveTrackingPreference(directory, true);
  for (const entry of ['mcp', 'worker']) runtimes.push(await createAppTracking(directory, entry));
  const request = transport(new WorkspaceStore(directory), { tracking: runtimes[1] }, handler);
  const set = (enabled: boolean) => request('/motion-api/tracking/preferences', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled }) });
  const send = () => request('/motion-api/tracking', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: [packet()] }) });
  if (mode === 'test') {
    process.env.OPENMOTION_TELEMETRY = '1';
    assert.equal(trackingLocked(), true); assert.equal(trackingLockReason(), 'test_build');
    const status = await (await request('/motion-api/tracking/preferences')).json();
    assert.deepEqual(status, { enabled: false, preference: true, locked: true, reason: 'test_build' });
    for (const runtime of runtimes) {
      runtime.setEnabled(true);
      assert.equal(runtime.ingest(packet()), 'disabled'); assert.equal(await runtime.flush(), 'disabled');
    }
    for (let cycle = 0; cycle < 2; cycle++) {
      assert.equal((await set(true)).status, 403);
      assert.deepEqual(await (await send()).json(), { accepted: 0, enabled: false });
    }
    assert.equal(bodies.length, 0);
    await assert.rejects(readFile(path.join(directory, 'tracking/identity.json')), /ENOENT/);
    assert.equal(JSON.parse(await readFile(path.join(directory, 'tracking/preferences.json'), 'utf8')).enabled, true);
  } else {
    assert.equal(trackingLocked(), false);
    const status = await (await request('/motion-api/tracking/preferences')).json();
    assert.deepEqual(status, { enabled: true, preference: true, locked: false, reason: null });
    assert.equal((await send()).status, 200); await runtimes[1].flush();
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const runtime of runtimes) runtime.ingest(packet());
      assert.equal((await set(false)).status, 200);
      for (const runtime of runtimes) {
        assert.equal(runtime.enabled(), false);
        assert.equal(runtime.pending(), 0); assert.equal(runtime.ingest(packet()), 'disabled');
        assert.equal(await runtime.flush(), 'disabled');
      }
      const before = bodies.length;
      await send(); assert.equal(bodies.length, before);
      const restarted = await createAppTracking(directory, 'mcp'); runtimes.push(restarted);
      assert.equal(restarted.enabled(), false);
      assert.equal((await set(true)).status, 200);
      for (const runtime of runtimes) {
        assert.equal(runtime.ingest(packet()), 'queued'); assert.equal(await runtime.flush(), 'accepted');
      }
      assert.equal(bodies.length, before + runtimes.length);
    }
    assert.equal(new Set(bodies.flatMap(body => body.batch.map((event: any) => event.properties.installation_id))).size, 1);
  }
  if (process.getuid) {
    const { editorDirectory, ensureEditor } = await load('editor-runtime.ts');
    const { data, runtime } = await editorDirectory(directory);
    const registry = { service: 'opendesign-editor', protocol: 1, version: mode === 'test' ? '0.6.4' : '0.6.4-test.8',
      build: 'fixture', instanceId: crypto.randomUUID(), pid: process.pid, dataDirectory: data,
      endpoint: 'http://127.0.0.1:4173/', token: 'a'.repeat(64) };
    const registryFile = path.join(runtime, 'runtime.json');
    await writeFile(registryFile, JSON.stringify(registry));
    const before = await readFile(registryFile, 'utf8');
    globalThis.fetch = async url => {
      assert.equal(new URL(String(url)).pathname, '/editor-api/health');
      return Response.json({ ...registry, mcp: { protocol: 1, tools: ['motion_get_project'] } });
    };
    await assert.rejects(ensureEditor(directory, 'motion_get_project'), { code: 'EDITOR_RUNTIME_INCOMPATIBLE' });
    assert.equal(await readFile(registryFile, 'utf8'), before);
  }
  console.log(JSON.stringify({ version: JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version,
    policy: mode, captured_requests: bodies.length, external_requests: 0, passed: true }));
} finally {
  for (const runtime of runtimes) runtime.close();
  await rm(directory, { recursive: true, force: true });
}
