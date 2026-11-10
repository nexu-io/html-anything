import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { loadIdentity } from '../tracking/node.ts';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { ensureNativeRuntime, nativeConfiguration, nativeRuntimeStatus, requireNativeRuntime, startNativePreparation } from '../scripts/npm-runtime.mjs';
import { runFile, sha256, writeJSON, withCacheLock } from '../scripts/runtime-assets.mjs';
import { nativeRouteCapability } from '../shared/native-runtime.ts';
import { transport } from './http.ts';
import { WorkspaceStore } from '../workspace.ts';

async function fixture(t: any) {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-native-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const keys = ['HYPERFRAMES_BROWSER_PATH', 'HYPERFRAMES_FFMPEG_PATH', 'HYPERFRAMES_FFPROBE_PATH', 'MOTION_BROWSER_PATH', 'FFMPEG_PATH', 'FFPROBE_PATH'];
  const previous = keys.map(key => process.env[key]); keys.forEach(key => delete process.env[key]);
  t.after(() => keys.forEach((key, i) => previous[i] === undefined ? delete process.env[key] : process.env[key] = previous[i]));
  const root = path.join(directory, 'app'); await mkdir(path.join(root, 'scripts'), { recursive: true });
  for (const file of ['npm-runtime.mjs', 'runtime-assets.mjs', 'installer-tracking.mjs']) await cp(new URL('../scripts/' + file, import.meta.url), path.join(root, 'scripts', file));
  const assets: Record<string, any> = {};
  for (const id of ['browser', 'ffmpeg', 'ffprobe']) {
    const source = path.join(directory, id); await mkdir(source);
    await writeFile(path.join(source, id), '#!/bin/sh\necho fixture-version\n', { mode: 0o755 });
    const archive = path.join(directory, id + '.tar.gz');
    await runFile('tar', ['-czf', archive, '-C', source, '.']);
    assets[id] = { url: pathToFileURL(archive).href, sha256: await sha256(archive), executable: id };
  }
  const configFile = path.join(root, '.npm-install.json');
  const config = { schemaVersion: 1, cacheDirectory: path.join(directory, 'cache'), allowLocalAssets: true,
    runtime: { targets: { fixture: { platform: process.platform, arch: process.arch, ...assets } } } };
  await writeJSON(configFile, config);
  return { directory, root, assets, config, configFile };
}

test('cold status is readable without downloading, and runtime guards do not create export jobs', { skip: process.platform === 'win32' }, async t => {
  const { directory, root } = await fixture(t);
  const initial = await nativeRuntimeStatus(root);
  assert(initial.components.every(item => item.stage === 'idle')); assert.equal(initial.capabilities.export, false);
  await assert.rejects(readFile(path.join(directory, 'cache/preparation.log')), { code: 'ENOENT' });
  const store = new WorkspaceStore(path.join(directory, 'data'));
  const request = transport(store, { nativeRoot: root, runtimeRoot: root, studio: { alive: () => true } as any });
  const status = await request('/motion-api/runtime'); assert.equal(status.status, 200);
  assert.equal((await status.json()).managed, true);
  assert.equal((await request('/motion-api/runtime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
  const response = await request(`/api/projects/${store.projectId}/render`, { method: 'POST' });
  assert.equal(response.status, 409); assert.equal((await response.json()).applied, false);
  assert.equal(await store.job(), null);
  // Join the detached preparation before fixture cleanup.
  await ensureNativeRuntime(root);
  assert.equal((await nativeRuntimeStatus(root)).capabilities.export, true);
});

test('concurrent processes and app versions share one download per native asset', { skip: process.platform === 'win32', timeout: 20_000 }, async t => {
  const { directory, root, assets, config, configFile } = await fixture(t);
  const bytes: Record<string, string> = {};
  for (const [id, asset] of Object.entries(assets)) {
    bytes[`https://example.invalid/${id}.tar.gz`] = new URL(asset.url).pathname;
    config.runtime.targets.fixture[id].url = `https://example.invalid/${id}.tar.gz`;
  }
  await writeJSON(configFile, config);
  const secondRoot = path.join(directory, 'app-v2'); await mkdir(secondRoot); await cp(configFile, path.join(secondRoot, '.npm-install.json'));
  const counts = path.join(directory, 'fetches');
  const module = pathToFileURL(fileURLToPath(new URL('../scripts/npm-runtime.mjs', import.meta.url))).href;
  const script = `import { appendFile, readFile } from 'node:fs/promises';
    const bytes = ${JSON.stringify(bytes)};
    globalThis.fetch = async url => { await appendFile(${JSON.stringify(counts)}, url.href+'\\n'); await new Promise(r => setTimeout(r, 200)); return new Response(await readFile(bytes[url.href])); };
    const { ensureNativeRuntime } = await import(${JSON.stringify(module)});
    await Promise.all([ensureNativeRuntime(process.argv[1]), ensureNativeRuntime(process.argv[1])]);`;
  await Promise.all([root, secondRoot].map(app => runFile(process.execPath, ['--input-type=module', '-e', script, app])));
  assert.equal((await readFile(counts, 'utf8')).trim().split('\n').length, 3);
  await rm(counts); for (const id of Object.keys(assets)) await rm(path.join(directory, id + '.tar.gz'));
  await Promise.all([ensureNativeRuntime(root), ensureNativeRuntime(secondRoot)]);
  await assert.rejects(readFile(counts), { code: 'ENOENT' });
});

test('one failed component remains visible and retry reuses completed components', { skip: process.platform === 'win32' }, async t => {
  const { root, assets } = await fixture(t);
  const original = await readFile(new URL(assets.browser.url)); await writeFile(new URL(assets.browser.url), 'bad browser');
  await assert.rejects(ensureNativeRuntime(root), /SHA256 mismatch/);
  const failed = await nativeRuntimeStatus(root);
  assert.equal(failed.components.find(item => item.id === 'browser')?.stage, 'failed');
  assert.equal(failed.capabilities.media, true); assert.equal(failed.capabilities.capture, false);
  await requireNativeRuntime(root, 'media');
  const native = await nativeConfiguration(root);
  const ready = await readFile(path.join(native.cache, 'ffmpeg-' + assets.ffmpeg.sha256, 'ready.json'), 'utf8');
  await rm(new URL(assets.ffmpeg.url)); await rm(new URL(assets.ffprobe.url));
  await writeFile(new URL(assets.browser.url), original);
  await startNativePreparation(root, true); await ensureNativeRuntime(root);
  assert.equal((await nativeRuntimeStatus(root)).capabilities.export, true);
  assert.equal(await readFile(path.join(native.cache, 'ffmpeg-' + assets.ffmpeg.sha256, 'ready.json'), 'utf8'), ready);
});

test('dead download ownership is recoverable while a live lock is never stolen', async t => {
  const { directory } = await fixture(t), lock = path.join(directory, 'test.lock');
  await writeJSON(lock, { pid: 2147483647, token: 'dead' });
  let firstDone = false, secondRan = false;
  let second: Promise<unknown>;
  await withCacheLock(lock, async () => {
    second = withCacheLock(lock, async () => { secondRan = true; assert(firstDone); });
    await new Promise(resolve => setTimeout(resolve, 180)); assert.equal(secondRan, false);
    firstDone = true;
  });
  await second!;
});

test('capability routing leaves editing, history and ordinary preview available', () => {
  assert.equal(nativeRouteCapability('POST', '/api/projects/a/render'), 'export');
  assert.equal(nativeRouteCapability('GET', '/api/projects/a/thumbnail/index.html'), 'capture');
  assert.equal(nativeRouteCapability('POST', '/api/projects/a/upload'), 'media');
  assert.equal(nativeRouteCapability('GET', '/api/projects/a/media/metadata'), 'media');
  for (const route of ['/api/projects/a/preview', '/api/projects/a/files/index.html', '/api/projects/a/renders', '/api/projects/a/history']) assert.equal(nativeRouteCapability('GET', route), undefined);
});


test('interrupted downloads retain truthful progress and recover only the incomplete component', { skip: process.platform === 'win32', timeout: 20_000 }, async t => {
  const { directory, root, assets, config, configFile } = await fixture(t);
  await ensureNativeRuntime(root, ['ffmpeg', 'ffprobe']);
  config.runtime.targets.fixture.browser.url = 'https://example.invalid/interrupted.tar.gz';
  await writeJSON(configFile, config);
  const module = pathToFileURL(fileURLToPath(new URL('../scripts/npm-runtime.mjs', import.meta.url))).href;
  const script = `const hold = setInterval(() => {}, 1000);
    globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(50)); } }), { headers: { 'content-length': '100' } });
    const { ensureNativeRuntime } = await import(${JSON.stringify(module)});
    await ensureNativeRuntime(process.argv[1], ['browser']); clearInterval(hold);`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, root], { stdio: 'ignore' });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  let component;
  for (let i = 0; i < 100; i++) {
    component = (await nativeRuntimeStatus(root)).components.find(item => item.id === 'browser');
    if (component?.receivedBytes === 50) break;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  assert.equal(component?.stage, 'downloading'); assert.equal(component.receivedBytes, 50); assert.equal(component.totalBytes, 100);
  const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited;
  assert.equal((await nativeRuntimeStatus(root)).components.find(item => item.id === 'browser')?.stage, 'idle');
  config.runtime.targets.fixture.browser.url = pathToFileURL(path.join(directory, 'browser.tar.gz')).href;
  await writeJSON(configFile, config);
  await rm(path.join(directory, 'ffmpeg.tar.gz')); await rm(path.join(directory, 'ffprobe.tar.gz'));
  await ensureNativeRuntime(root);
  assert.equal((await nativeRuntimeStatus(root)).capabilities.export, true);
});


test('an unreadable component state is reported without blocking basic service health', { skip: process.platform === 'win32' }, async t => {
  const { root, directory, assets } = await fixture(t);
  const native = await nativeConfiguration(root); await mkdir(native.cache, { recursive: true });
  await writeFile(path.join(native.cache, 'browser-' + assets.browser.sha256 + '.status.json'), '{broken');
  const store = new WorkspaceStore(path.join(directory, 'data'));
  const response = await transport(store, { runtimeRoot: root, nativeRoot: root })('/api/health');
  assert.equal(response.status, 200);
  const health = await response.json(); assert.equal(health.ready, true);
  assert.equal(health.nativeRuntime.components.find(item => item.id === 'browser').stage, 'failed');
  assert.equal(health.nativeRuntime.capabilities.export, false);
});


test('detached preparation keeps the setup flow and shares acquisition identity with the application', { skip: process.platform === 'win32', timeout: 20_000 }, async t => {
  const { directory, root, config, configFile } = await fixture(t);
  const events: any[] = [];
  const collector = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    events.push(...JSON.parse(body).batch); res.setHeader('Content-Type', 'application/json'); res.end('{"status":1}');
  });
  collector.listen(0, '127.0.0.1'); await once(collector, 'listening');
  t.after(() => new Promise<void>(resolve => collector.close(() => resolve())));
  const keys = ['OPENMOTION_TELEMETRY', 'DO_NOT_TRACK', 'OPENMOTION_POSTHOG_HOST', 'OPENMOTION_POSTHOG_KEY', 'OPENMOTION_TRACKING_ENV', 'OPENMOTION_TRACKING_TEST_RUN_ID'];
  const previous = keys.map(key => process.env[key]);
  t.after(() => keys.forEach((key, i) => previous[i] === undefined ? delete process.env[key] : process.env[key] = previous[i]));
  process.env.OPENMOTION_TELEMETRY = '1'; delete process.env.DO_NOT_TRACK;
  process.env.OPENMOTION_POSTHOG_HOST = `http://127.0.0.1:${(collector.address() as any).port}`;
  process.env.OPENMOTION_POSTHOG_KEY = 'phc_fixture'; process.env.OPENMOTION_TRACKING_ENV = 'test';
  process.env.OPENMOTION_TRACKING_TEST_RUN_ID = crypto.randomUUID();
  await mkdir(path.join(root, 'tracking'));
  await writeJSON(path.join(root, 'package.json'), { type: 'module' });
  for (const file of ['runtime.ts', 'core.ts', 'node.ts', 'events.ts']) await cp(new URL('../tracking/' + file, import.meta.url), path.join(root, 'tracking', file));
  const dataDirectory = path.join(directory, 'data'), flowId = crypto.randomUUID();
  const identity = await loadIdentity(path.join(dataDirectory, 'tracking'), 'channel_a');
  const tracked = { ...config, tracking: { dataDirectory, version: '1.2.3', flowId, host: 'workbuddy', operation: 'install' } };
  await writeJSON(configFile, tracked);
  await startNativePreparation(root, false, 'setup');
  // A later installer cannot relabel a worker that was already launched.
  tracked.tracking.flowId = crypto.randomUUID(); await writeJSON(configFile, tracked);
  const deadline = Date.now() + 10_000;
  while (!events.some(e => e.event === 'native_prepare_result')) {
    if (Date.now() >= deadline) {
      const native = await nativeConfiguration(root);
      assert.fail('Detached worker did not report a terminal preparation result: ' + await readFile(path.join(native.cache, 'preparation.log'), 'utf8').catch(() => 'no worker log'));
    }
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  assert.equal((await nativeRuntimeStatus(root)).capabilities.export, true);
  assert(events.every(e => e.properties.install_flow_id === flowId && e.properties.installation_id === identity.installation_id && e.properties.utm_source === 'channel_a'));
  assert.equal(events.filter(e => e.event === 'native_prepare_started').length, 1);
  assert.equal(events.filter(e => e.event === 'native_prepare_result')[0].properties.outcome, 'success');
  for (const component of ['browser', 'ffmpeg', 'ffprobe']) assert(events.some(e => e.properties.component === component && e.properties.step === 'native_download'));
  assert.doesNotMatch(JSON.stringify(events), /motion-native-|dataDirectory|example.invalid/);
});
