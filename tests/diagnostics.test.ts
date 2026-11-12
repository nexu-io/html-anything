import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { collectDiagnostics, diagnosticLimits, exportDiagnostics, recordDiagnostic } from '../scripts/diagnostics.mjs';
import { redactDiagnostic } from '../scripts/diagnostic-redaction.mjs';
import { runFile } from '../scripts/runtime-assets.mjs';
import { WorkspaceStore } from '../workspace.ts';
import { handler } from '../server.ts';
import { transport } from './http.ts';

function contents(buffer: Buffer): Record<string, string> {
  const entries: Record<string, string> = {};
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18), length = buffer.readUInt16LE(offset + 26);
    const name = buffer.subarray(offset + 30, offset + 30 + length).toString();
    const start = offset + 30 + length + buffer.readUInt16LE(offset + 28);
    entries[name] = buffer.subarray(start, start + size).toString();
    offset = start + size;
  }
  return entries;
}
async function fixture(t: any) {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-diagnostics-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const appRoot = path.join(root, 'app'), dataDirectory = path.join(root, 'data'), installHome = path.join(root, 'install');
  for (const directory of [appRoot, dataDirectory, installHome]) await mkdir(directory);
  await mkdir(path.join(appRoot, 'shared'));
  await writeFile(path.join(appRoot, 'package.json'), JSON.stringify({ version: '0.7.0' }));
  return { root, appRoot, dataDirectory, installHome };
}

test('diagnostic ZIPs are readable, redacted, bounded and contain only allowlisted data in test and stable builds', async t => {
  const options = await fixture(t);
  const secret = 'fixture-' + randomUUID(), jobId = randomUUID();
  const personalPath = path.posix.join('/', 'Users', 'person', 'private', 'file.txt');
  const previous = process.env.DIAGNOSTIC_TEST_TOKEN;
  process.env.DIAGNOSTIC_TEST_TOKEN = secret;
  t.after(() => { if (previous === undefined) delete process.env.DIAGNOSTIC_TEST_TOKEN; else process.env.DIAGNOSTIC_TEST_TOKEN = previous; });
  await writeFile(path.join(options.appRoot, 'shared/build-info.json'), JSON.stringify({ commit: 'a'.repeat(40) }));
  await writeFile(path.join(options.dataDirectory, 'preview.log'), `startup ${secret}\napi_key="${secret}"\nCookie: session=${secret}; other=${secret}\nhttps://user:${secret}@example.com/private/${secret}?token=${secret}\n${personalPath}\n`);
  const privateContent = 'private-project-' + randomUUID();
  for (const name of ['.env', 'project.html', 'providers.json', 'conversation.json']) await writeFile(path.join(options.dataDirectory, name), privateContent);
  await mkdir(path.join(options.dataDirectory, 'jobs', jobId), { recursive: true });
  await writeFile(path.join(options.dataDirectory, 'jobs', jobId, 'job.json'), JSON.stringify({ id: jobId, state: 'failed', error: `api_key=${secret}`, createdAt: 123, token: secret, prompt: privateContent }));
  await writeFile(path.join(options.dataDirectory, 'jobs', jobId, 'render.log'), 'render failed\n');
  for (const version of ['0.7.0', '0.7.1-test.4']) {
    await writeFile(path.join(options.appRoot, 'package.json'), JSON.stringify({ version }));
    const result = await collectDiagnostics(options), files = contents(result.data);
    assert.equal(JSON.parse(files['metadata.json']).version, version);
    assert.equal(JSON.parse(files['metadata.json']).commit, 'a'.repeat(40));
    assert.equal(JSON.parse(files['jobs.json'])[0].error, 'api_key=[redacted]');
    assert.equal(JSON.parse(files['jobs.json'])[0].token, undefined);
    assert(!result.data.includes(Buffer.from(secret)) && !result.data.includes(Buffer.from(privateContent)));
    assert(!result.data.includes(Buffer.from(path.posix.dirname(personalPath))));
    assert(files['logs/job-1/render.log'].includes('render failed'));
    assert(JSON.parse(files['files.json']).some((file: any) => file.name === 'studio.log' && file.status === 'missing'));
    assert(result.data.length < diagnosticLimits.totalBytes + 64 * 1024);
    const filename = path.join(options.root, version + '.zip'); await writeFile(filename, result.data);
    assert.match(await runFile('unzip', ['-t', filename]), /No errors detected/);
  }
});

test('collection excludes symlinks and non-files, truncates large logs and never overwrites CLI output', async t => {
  const options = await fixture(t);
  const outside = path.join(options.root, 'outside'); await mkdir(outside);
  const secret = 'outside-' + randomUUID();
  await writeFile(path.join(outside, 'editor.log'), secret);
  await symlink(path.join(outside, 'editor.log'), path.join(options.dataDirectory, 'preview.log'));
  await symlink(outside, path.join(options.dataDirectory, '.editor-runtime'), process.platform === 'win32' ? 'junction' : 'dir');
  await mkdir(path.join(options.dataDirectory, 'studio.log'));
  await mkdir(path.join(options.dataDirectory, 'diagnostics'));
  await writeFile(path.join(options.dataDirectory, 'diagnostics/events.log'), 'large log line\n'.repeat(20_000));
  const result = await collectDiagnostics(options), files = contents(result.data);
  assert(!result.data.includes(Buffer.from(secret)));
  const list = JSON.parse(files['files.json']);
  for (const name of ['preview.log', 'studio.log', '.editor-runtime/editor.log']) assert.equal(list.find((file: any) => file.name === name).status, 'excluded');
  assert.equal(list.find((file: any) => file.name === 'diagnostics/events.log').status, 'truncated');
  assert(Buffer.byteLength(files['logs/diagnostics/events.log']) <= diagnosticLimits.fileBytes);
  const output = path.join(options.root, 'saved.zip');
  await exportDiagnostics({ ...options, output });
  const before = await readFile(output);
  await assert.rejects(exportDiagnostics({ ...options, output }), { code: 'EEXIST' });
  assert.deepEqual(await readFile(output), before);
  if (process.platform !== 'win32') assert.equal((await stat(output)).mode & 0o777, 0o600);
});

test('local failure logging rotates, redacts and refuses linked log destinations', async t => {
  const options = await fixture(t), secret = 'fixture-secret-' + randomUUID();
  await Promise.all(Array.from({ length: 40 }, () => recordDiagnostic(options.dataDirectory, { kind: 'failure', message: 'api_key=' + secret + ' ' + 'detail '.repeat(1200) })));
  for (const name of ['events.log', 'events.log.1']) {
    const file = path.join(options.dataDirectory, 'diagnostics', name);
    assert((await stat(file)).size <= diagnosticLimits.fileBytes);
    assert(!(await readFile(file, 'utf8')).includes(secret));
  }
  const target = path.join(options.root, 'untouched'); await writeFile(target, 'original');
  await rm(path.join(options.dataDirectory, 'diagnostics/events.log'));
  await symlink(target, path.join(options.dataDirectory, 'diagnostics/events.log'));
  await recordDiagnostic(options.dataDirectory, { message: 'do not write' });
  assert.equal(await readFile(target, 'utf8'), 'original');
});

test('CLI works without a running app or completed setup, and with a saved custom data directory', async t => {
  const options = await fixture(t), output = path.join(options.root, 'cli.zip');
  await writeFile(path.join(options.installHome, 'install.json'), JSON.stringify({ appRoot: options.appRoot, dataDirectory: options.dataDirectory }));
  const result = await runFile(process.execPath, ['scripts/npm-installer.mjs', 'diagnostics', '--home', options.installHome, '--output', output]);
  assert.equal(JSON.parse(result).output, output);
  assert.equal(JSON.parse(contents(await readFile(output))['metadata.json']).version, '0.7.0');
  const source = path.join(options.root, 'source.zip');
  await runFile(process.execPath, ['scripts/diagnostics.mjs', '--data-dir', options.dataDirectory, '--output', source]);
  assert(contents(await readFile(source))['metadata.json']);
  await runFile(process.execPath, ['scripts/npm-installer.mjs', 'diagnostics', '--home', path.join(options.root, 'not-installed'), '--output', path.join(options.root, 'not-installed.zip')]);
});

test('redaction removes credential formats, private keys, URLs, home paths and email', () => {
  const secret = 'test-secret-' + randomUUID();
  const result = redactDiagnostic(`Bearer ${secret}\nAuthorization: Basic ${secret}\npassword='${secret}'\nhttps://user:${secret}@example.com/path?q=${secret}\n-----BEGIN PRIVATE KEY-----\n${secret}\n-----END PRIVATE KEY-----\nC:\\Users\\person\\project file\nperson@example.com`);
  for (const privateValue of [secret, 'person', 'project file']) assert(!result.includes(privateValue));
});

test('HTTP export is local POST-only, rejects path selection and throttles repeated or concurrent collection', async t => {
  const options = await fixture(t), store = new WorkspaceStore(options.dataDirectory), context = { nativeRoot: options.appRoot };
  const request = transport(store, context), init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errors: [] }) };
  assert.equal((await request('/motion-api/diagnostics')).status, 405);
  assert.equal((await request('/motion-api/diagnostics?output=/tmp/forbidden', init)).status, 403);
  assert.equal((await request('/motion-api/diagnostics', { ...init, body: JSON.stringify({ errors: [], dataDirectory: options.root }) })).status, 400);
  const concurrent = await Promise.all([request('/motion-api/diagnostics', init), request('/motion-api/diagnostics', init)]);
  assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 429]);
  const ok = concurrent.find(response => response.status === 200)!;
  assert.equal(ok.headers.get('content-type'), 'application/zip'); assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert(contents(Buffer.from(await ok.arrayBuffer()))['metadata.json']);
  assert.equal((await request('/design-api/diagnostics', init)).status, 429);
  const hostile = transport(store, {}, async (req, res, source, service) => {
    req.headers.origin = 'https://evil.example'; await handler(req, res, source, service);
  });
  assert.equal((await hostile('/motion-api/diagnostics', init)).status, 403);
});

test('browser error persistence is bounded and available to subsequent offline CLI collection', async t => {
  const options = await fixture(t), store = new WorkspaceStore(options.dataDirectory), request = transport(store, { nativeRoot: options.appRoot });
  const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errors: [{ kind: 'react_crash', message: 'api_key=fixture-private', stack: 'stack' }] }) };
  assert.equal((await request('/motion-api/diagnostics/events', init)).status, 200);
  const files = contents((await collectDiagnostics(options)).data);
  assert.match(files['logs/diagnostics/events.log'], /react_crash/); assert(!files['logs/diagnostics/events.log'].includes('fixture-private'));
  const tooMany = { ...init, body: JSON.stringify({ errors: Array(21).fill({ message: 'spam' }) }) };
  assert.equal((await request('/motion-api/diagnostics/events', tooMany)).status, 400);
  const batch = { ...init, body: JSON.stringify({ errors: Array(20).fill({ message: 'spam' }) }) };
  assert.equal((await request('/motion-api/diagnostics/events', batch)).status, 200);
  assert.equal((await request('/motion-api/diagnostics/events', batch)).status, 200);
  assert.equal((await request('/motion-api/diagnostics/events', batch)).status, 429);
});

test('exhausted log budgets still produce valid metadata and native status uses the configured platform target', async t => {
  const options = await fixture(t), cache = path.join(options.root, 'cache'), target = 'custom-target';
  await mkdir(path.join(cache, target), { recursive: true });
  const hash = 'a'.repeat(64);
  await writeFile(path.join(options.appRoot, '.npm-install.json'), JSON.stringify({ cacheDirectory: cache, runtime: { targets: {
    [target]: { platform: process.platform, arch: process.arch, browser: { sha256: hash } },
  } } }));
  await writeFile(path.join(cache, target, `browser-${hash}.status.json`), JSON.stringify({ stage: 'failed', errorCode: 'download', error: 'token=fixture-private' }));
  await writeFile(path.join(cache, target, 'preparation.log'), 'native preparation failed\n');
  const content = ('a@b.co token=test\n').repeat(20_000);
  for (const name of ['preview.log', 'studio.log', '.editor-runtime/editor.log', 'diagnostics/events.log', 'diagnostics/events.log.1']) {
    await mkdir(path.dirname(path.join(options.dataDirectory, name)), { recursive: true });
    await writeFile(path.join(options.dataDirectory, name), content);
  }
  const files = contents((await collectDiagnostics(options)).data);
  for (const [name, data] of Object.entries(files)) if (name.endsWith('.json')) assert.doesNotThrow(() => JSON.parse(data), name);
  const native = JSON.parse(files['native.json']);
  assert.equal(native[0].stage, 'failed'); assert.equal(native[0].errorCode, 'download'); assert(!native[0].error.includes('fixture-private'));
  assert(Object.entries(files).filter(([name]) => name.startsWith('logs/')).reduce((size, [, data]) => size + Buffer.byteLength(data), 0) <= diagnosticLimits.logBytes);
  assert.equal(JSON.parse(files['metadata.json']).version, '0.7.0');
});

test('browser batches preserve event time, redact values and separate bounded activity from errors in ZIPs', async t => {
  const options = await fixture(t), store = new WorkspaceStore(options.dataDirectory), request = transport(store, { nativeRoot: options.appRoot });
  const time = '2026-11-12T01:02:03.000Z';
  const events = Array.from({ length: 20 }, (_, i) => ({ time, kind: i ? 'activity_request' : 'request_failed', message: `request=page:${i} api_key=fixture-secret`, stack: '' }));
  const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errors: events }) };
  assert.equal((await request('/motion-api/diagnostics/events', init)).status, 200);
  const saved = (await readFile(path.join(options.dataDirectory, 'diagnostics/events.log'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(saved.length, 20); assert(saved.every(event => event.time === time));
  assert(!JSON.stringify(saved).includes('fixture-secret'));
  const archiveEvents = [...events, ...events, ...events];
  const response = await request('/motion-api/diagnostics', { ...init, body: JSON.stringify({ errors: archiveEvents }) });
  assert.equal(response.status, 200);
  const files = contents(Buffer.from(await response.arrayBuffer()));
  assert.equal(JSON.parse(files['browser-errors.json']).length, 3);
  assert.equal(JSON.parse(files['browser-activity.json']).length, 57);
  assert(!JSON.stringify(files).includes('fixture-secret'));
  assert.equal((await request('/motion-api/diagnostics/events', { ...init, body: JSON.stringify({ errors: [{} , []] }) })).status, 400);
  assert.equal((await request('/motion-api/diagnostics', { ...init, body: JSON.stringify({ errors: [...archiveEvents, {}] }) })).status, 400);
});
