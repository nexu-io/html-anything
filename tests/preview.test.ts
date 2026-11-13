import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureService, openPreview, previewUrl, probe, VERSION } from '../preview.ts';
import type { Probe, PreviewRuntime } from '../preview.ts';
import { WorkspaceStore } from '../workspace.ts';
import { pluginRoot } from '../hyperframes.ts';
import { phase1McpCapabilities } from '../shared/phase1-tools.ts';
import { sharedEditorEnabled } from '../editor-runtime.ts';
import { fixture } from './fixtures.ts';

function runtime(store: WorkspaceStore) {
  const occupied = new Map<number, Probe>(); const launches: number[] = [], stops: number[] = [];
  const environment: PreviewRuntime = {
    probe: async port => occupied.get(port) || { kind: 'free' },
    launch: async (port, directory, log, background) => {
      assert.equal(directory, store.directory); assert.equal(log, path.join(directory, 'preview.log')); launches.push(port);
      if (!background) await store.initialize(pluginRoot);
      occupied.set(port, { kind: 'motion', health: { service: 'motion-preview', protocol: 2, version: VERSION, dataDirectory: directory, ffmpeg: true, ready: true, mcp: phase1McpCapabilities, studioUrl: background ? undefined : `http://localhost:${port + 1}/#project/project` } });
      return { pid: 1234, alive: () => true, error: () => '', stop: () => { stops.push(port); } };
    },
    openEditor: async port => {
      await store.initialize(pluginRoot);
      const entry = occupied.get(port); assert.equal(entry?.kind, 'motion');
      entry.health!.studioUrl = `http://localhost:${port + 1}/#project/project`;
    },
    wait: () => new Promise(resolve => setTimeout(resolve, 2)), attempts: 2,
  };
  return { environment, occupied, launches, stops };
}
test('startup verifies the native Studio service and reuses the same workspace', () => fixture(async store => {
  const mock = runtime(store);
  const first = await openPreview(store, mock.environment);
  assert.equal(first.ready, true); assert.equal(first.reused, false); assert.equal(first.browserOpened, false); assert.ok(first.studioUrl);
  assert.equal(new URL(first.studioUrl).origin, new URL(first.previewUrl).origin, 'a legacy backend must not hand off its internal Studio URL');
  assert.equal((await store.get()).project!.format, 'hyperframes');
  const before = await store.get();
  const second = await openPreview(new WorkspaceStore(store.directory), mock.environment);
  assert.equal(second.previewUrl, first.previewUrl); assert.equal(second.reused, true);
  assert.equal(second.studioUrl, first.studioUrl);
  assert.equal(mock.launches.length, 1); assert.equal(mock.stops.length, 0);
  assert.equal((await store.get()).revision, before.revision); assert.equal(await previewUrl(store), first.previewUrl);
}, false));
test('background startup preserves an empty revision; opening the editor upgrades the same process', () => fixture(async store => {
  const mock = runtime(store), before = await store.get();
  const service = await ensureService(store, mock.environment);
  assert.equal(service.studioUrl, undefined);
  assert.deepEqual(await store.get(), before);
  const editor = await openPreview(store, mock.environment);
  assert.equal(editor.previewUrl, service.previewUrl); assert.ok(editor.studioUrl);
  assert.equal(editor.reused, true); assert.equal(mock.launches.length, 1);
  assert.ok((await store.get()).project);
}, false));
test('unrelated services and mismatched versions or data directories are left intact', () => fixture(async store => {
  const mock = runtime(store), port = Number(process.env.PORT || 4173);
  mock.occupied.set(port, { kind: 'busy' });
  mock.occupied.set(port + 1, { kind: 'motion', health: { service: 'motion-preview', protocol: 2, version: '0.3.1', dataDirectory: store.directory, ffmpeg: true, ready: true } });
  mock.occupied.set(port + 2, { kind: 'motion', health: { service: 'motion-preview', protocol: 2, version: VERSION, dataDirectory: '/other', ffmpeg: true, ready: true } });
  const result = await openPreview(store, mock.environment);
  assert.equal(result.previewUrl, `http://localhost:${port + 3}`); assert.deepEqual(mock.stops, []);
}));
test('a phase1 call reuses compatible stable and prerelease backends without restarting them', async t => {
  for (const version of ['0.6.4', '0.6.4-test.8']) await t.test(version, () => fixture(async store => {
    const mock = runtime(store), port = Number(process.env.PORT || 4173);
    mock.occupied.set(port, { kind: 'motion', health: { service: 'motion-preview', protocol: 2, version,
      dataDirectory: store.directory, ffmpeg: true, ready: true, mcp: { protocol: 1, tools: ['openmotion_export_request'] } } });
    const before = await store.get();
    const result = await ensureService(store, mock.environment, 'openmotion_export_request');
    assert.equal(result.previewUrl, `http://localhost:${port}`);
    assert.equal(result.reused, true);
    assert.deepEqual(mock.launches, []); assert.deepEqual(mock.stops, []);
    assert.deepEqual(await store.get(), before);
    assert.equal(JSON.parse(await readFile(path.join(store.directory, 'preview.json'), 'utf8')).version, version);
  }, false));
});
test('phase1 port discovery leaves unrelated services and other workspaces intact', () => fixture(async store => {
  const mock = runtime(store), port = Number(process.env.PORT || 4173);
  const health = { service: 'motion-preview', protocol: 2, version: '0.6.4', dataDirectory: store.directory, ffmpeg: true, ready: true, mcp: { protocol: 1, tools: ['openmotion_export_request'] } };
  const changes = [{ dataDirectory: '/other' }, { service: 'unrelated-service' }];
  changes.forEach((change, i) => mock.occupied.set(port + i, { kind: 'motion', health: { ...health, ...change } }));
  const result = await ensureService(store, mock.environment, 'openmotion_export_request');
  assert.equal(result.previewUrl, `http://localhost:${port + changes.length}`);
  assert.deepEqual(mock.stops, []);
}, false));
test('phase1 port discovery refuses an incompatible same-workspace authority without launching another', async t => {
  for (const change of [{ protocol: 999 }, { version: VERSION, mcp: { protocol: 2, tools: ['openmotion_export_request'] } }, { mcp: { protocol: 1, tools: ['openmotion_get_project'] } }, { mcp: undefined }]) await t.test(JSON.stringify(change), () => fixture(async store => {
    const mock = runtime(store), port = Number(process.env.PORT || 4173);
    mock.occupied.set(port, { kind: 'motion', health: { service: 'motion-preview', protocol: 2, version: '0.6.4', dataDirectory: store.directory, ffmpeg: true, ready: true, ...change } });
    const before = await store.get();
    await assert.rejects(ensureService(store, mock.environment, 'openmotion_export_request'), { code: 'EDITOR_RUNTIME_INCOMPATIBLE' });
    assert.deepEqual(mock.launches, []); assert.deepEqual(mock.stops, []);
    assert.deepEqual(await store.get(), before);
  }, false));
});
test('real HTTP discovery preserves Motion identity before checking compatibility and readiness', () => fixture(async temporary => {
  const store = new WorkspaceStore(await realpath(temporary.directory));
  const health = { service: 'motion-preview', protocol: 999, version: '0.6.4', dataDirectory: store.directory, ffmpeg: true, ready: true, mcp: phase1McpCapabilities };
  const server = createServer((req, res) => {
    assert.equal(req.url, '/api/health');
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(health));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    await writeFile(path.join(store.directory, 'preview.json'), JSON.stringify({ port: address.port }));
    const before = await store.get(), mock = runtime(store);
    mock.environment.probe = probe;
    mock.environment.launch = async port => { mock.launches.push(port); throw new Error('Unexpected competing backend launch'); };
    for (const change of [{ protocol: 999, ready: true }, { protocol: 2, ready: false }]) {
      Object.assign(health, change);
      assert.deepEqual(await probe(address.port), { kind: 'motion', health });
      await assert.rejects(ensureService(store, mock.environment, 'openmotion_export_request'), { code: 'EDITOR_RUNTIME_INCOMPATIBLE' });
      assert.deepEqual(mock.launches, []); assert.deepEqual(mock.stops, []);
      assert.deepEqual(await store.get(), before);
      assert.deepEqual(JSON.parse(await readFile(path.join(store.directory, 'preview.json'), 'utf8')), { port: address.port });
      if (sharedEditorEnabled) {
        health.version = VERSION;
        await assert.rejects(openPreview(store), /旧预览服务/);
        health.version = '0.6.4';
      }
    }
    health.ready = true;
    assert.equal((await ensureService(store, mock.environment, 'openmotion_export_request')).reused, true);
    assert.deepEqual(mock.launches, []);
  } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}, false));
test('concurrent preview requests create one process and preserve existing source', () => fixture(async store => {
  const current = await store.get(); await store.writeFiles(current.revision, [{ path: 'notes.md', content: 'preserve me' }]);
  const before = await store.get(), mock = runtime(store);
  const results = await Promise.all([openPreview(store, mock.environment), openPreview(new WorkspaceStore(store.directory), mock.environment)]);
  assert.equal(results.filter(r => r.reused).length, 1); assert.equal(mock.launches.length, 1);
  assert.equal((await store.get()).revision, before.revision);
}));
test('failed startup stops only the process it launched and releases the startup lock', () => fixture(async store => {
  const mock = runtime(store);
  mock.environment.launch = async port => ({ alive: () => false, error: () => 'listen EPERM', stop: () => { mock.stops.push(port); } });
  await assert.rejects(openPreview(store, mock.environment), /listen EPERM/); assert.equal(mock.stops.length, 1);
  await assert.rejects(readFile(path.join(store.directory, 'preview.json')), /ENOENT/);
  assert.equal((await store.get()).project, null);
  await openPreview(store, runtime(store).environment);
}, false));
test('stale registration and a child that never becomes ready cannot claim success', () => fixture(async store => {
  const port = Number(process.env.PORT || 4173), mock = runtime(store);
  await writeFile(path.join(store.directory, 'preview.json'), JSON.stringify({ port })); mock.occupied.set(port, { kind: 'busy' });
  assert.equal((await openPreview(store, mock.environment)).previewUrl, `http://localhost:${port + 1}`);
  const failed = runtime(store);
  failed.environment.launch = async p => ({ alive: () => true, error: () => '', stop: () => { failed.stops.push(p); } });
  await assert.rejects(openPreview(store, failed.environment), /启动超时/); assert.equal(failed.stops.length, 1);
}));
