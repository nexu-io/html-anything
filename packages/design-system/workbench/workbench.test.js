import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm, symlink, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { request } from 'node:http';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { DesignSource } from './store.js';
import { createDesignSystemServer } from './server.js';
import { applyChanges, mergeDraft, validateValue } from '../token-model.js';
import { renderDesignTokens } from '../generate.js';
import { publicDesignFiles } from '../index.js';
const packageDirectory = fileURLToPath(new URL('../', import.meta.url));
const original = JSON.parse(await readFile(new URL('../tokens.json', import.meta.url), 'utf8'));
async function fixture(t) {
  const parent = await mkdtemp(path.join(tmpdir(), 'openmotion-design-'));
  const directory = path.join(parent, 'design-system');
  await cp(packageDirectory, directory, { recursive: true, filter: file => !file.includes('.workbench-') && !file.endsWith('.workbench.lock') });
  t.after(() => rm(parent, { recursive: true, force: true }));
  return directory;
}
async function listen(t, server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('shared values update both generated contracts while preserving source metadata and themes', async t => {
  const directory = await fixture(t), source = new DesignSource(directory);
  const before = await source.snapshot();
  const result = await source.save(before.revision, [
    { id: 'shared/radius-sm', value: '9px' }, { id: 'shared/font-sans', value: 'Example, sans-serif' }, { id: 'light/panel', value: '#f8f0ff' },
  ]);
  assert.notEqual(result.revision, before.revision);
  assert.deepEqual(result.tokens.source, before.tokens.source);
  assert.deepEqual(result.tokens.themes.dark, before.tokens.themes.dark);
  assert.equal(result.tokens.studio['radius-button'], 'var(--motion-radius-sm)');
  for (const [file, expected] of Object.entries(renderDesignTokens(result.tokens))) assert.equal(await readFile(path.join(directory, file), 'utf8'), expected);
  assert.equal((await source.snapshot()).revision, result.revision);
  assert.equal((await readdir(directory)).some(file => file.startsWith('.workbench')), false);
});
test('optimistic revision and serialized saves prevent two UI clients from losing each other’s edits', async t => {
  const source = new DesignSource(await fixture(t)), before = await source.snapshot();
  const results = await Promise.allSettled(['8px','12px'].map(value => source.save(before.revision, [{ id: 'shared/radius-sm', value }])));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const failed = results.find(result => result.status === 'rejected').reason;
  assert.equal(failed.status, 409); assert.equal(failed.details.latest.tokens.shared['radius-sm'], '8px');
});
test('Agent source edits regenerate outputs without rewriting JSON; malformed source is preserved', async t => {
  const directory = await fixture(t), source = new DesignSource(directory);
  const next = structuredClone(original); next.shared['radius-md'] = '14px';
  const bytes = JSON.stringify(next, null, 4);
  await writeFile(path.join(directory, 'tokens.json'), bytes);
  const snapshot = await source.snapshot();
  assert.equal(snapshot.tokens.shared['radius-md'], '14px');
  assert.equal(await readFile(path.join(directory, 'tokens.json'), 'utf8'), bytes);
  assert.equal(await readFile(path.join(directory, 'tokens.css'), 'utf8'), renderDesignTokens(next)['tokens.css']);
  await writeFile(path.join(directory, 'tokens.json'), '{');
  await assert.rejects(source.snapshot(), error => error.status === 422);
  assert.equal(await readFile(path.join(directory, 'tokens.json'), 'utf8'), '{');
});
test('rebase preserves disjoint edits, exposes overlap and drops already-applied draft values', () => {
  const latest = structuredClone(original); latest.shared['radius-sm'] = '10px'; latest.shared['radius-lg'] = '20px';
  const result = mergeDraft(original, latest, [{ id: 'shared/radius-sm', value: '12px' }, { id: 'shared/radius-md', value: '11px' }, { id: 'shared/radius-lg', value: '20px' }]);
  assert.deepEqual(result.changes, [{ id: 'shared/radius-md', value: '11px' }]);
  assert.equal(result.conflicts.length, 1); assert.equal(result.conflicts[0].current, '10px'); assert.equal(result.conflicts[0].before, original.shared['radius-sm']);
});
test('source saves reject unknown paths, duplicate keys, CSS injection and invalid typed values', () => {
  for (const changes of [[], [{ id: 'studio/radius-button', value: '2px' }], [{ id: '../tokens.json', value: 'x' }], [{ id: 'shared/missing', value: '2px' }], [{ id: 'shared/radius-sm', value: '-3px' }], [{ id: 'shared/font-sans', value: 'url(https://example.com)' }], [{ id: 'shared/radius-sm', value: '2px; color:red' }], [{ id: 'shared/radius-sm', value: '2px' }, { id: 'shared/radius-sm', value: '3px' }], [{ id: 'light/panel', value: 'var(--motion-panel)' }]]) assert.throws(() => applyChanges(original, changes));
  assert.ok(validateValue('ease-out', 'cubic-bezier(2, 0, 3, 1)', original.shared['ease-out']));
  assert.ok(validateValue('shadow-md', 'broken', original.themes.light['shadow-md']));
  assert.ok(validateValue('glass', 'rgb(999 0 0)', original.themes.light.glass));
  assert.equal(validateValue('shadow-md', '0 2px 6px rgb(0 0 0 / 10%)', original.themes.light['shadow-md']), null);
  assert.equal(validateValue('glass-backdrop', 'blur(18px) saturate(1.5)', original.shared['glass-backdrop']), null);
});
test('symlink outputs and a held lock cannot redirect or partially commit a save', async t => {
  const directory = await fixture(t), source = new DesignSource(directory), before = await source.snapshot();
  const originalSource = await readFile(path.join(directory, 'tokens.json'));
  await writeFile(path.join(directory, '.workbench.lock'), '{}');
  await assert.rejects(source.save(before.revision, [{ id: 'shared/radius-sm', value: '10px' }]), error => error.status === 423);
  await rm(path.join(directory, '.workbench.lock'));
  await rm(path.join(directory, 'studio/tokens.css'));
  await symlink(path.join(directory, 'tokens.json'), path.join(directory, 'studio/tokens.css'));
  await assert.rejects(source.save(before.revision, [{ id: 'shared/radius-sm', value: '10px' }]), error => error.status === 400);
  assert.deepEqual(await readFile(path.join(directory, 'tokens.json')), originalSource);
  assert.equal((await readdir(directory)).some(file => file.startsWith('.workbench')), false);
});
test('copied package serves and saves without any repository, Studio, npm modules or app service', async t => {
  const directory = await fixture(t);
  const { createDesignSystemServer: standaloneServer } = await import(pathToFileURL(path.join(directory, 'workbench/server.js')));
  const origin = await listen(t, standaloneServer({ directory }));
  const html = await (await fetch(origin)).text();
  assert.match(html, /name="design-system-editable" content="true"/);
  assert.doesNotMatch(html, /返回编辑器|studio\/src|localhost:4173/);
  const snapshot = await (await fetch(origin + '/api/design-system')).json();
  const response = await fetch(origin + '/api/design-system/tokens', { method: 'PUT', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Design-System-Client': 'workbench' }, body: JSON.stringify({ expectedRevision: snapshot.revision, changes: [{ id: 'shared/radius-sm', value: '7px' }] }) });
  assert.equal(response.status, 200); assert.equal((await response.json()).tokens.shared['radius-sm'], '7px');
  for (const file of publicDesignFiles) assert.equal((await fetch(`${origin}/design-system/${file}`)).status, 200, file);
  for (const file of ['workbench/server.js', 'workbench/store.js', 'package.json', '..%2f..%2fpackage.json', '.workbench.lock']) assert.equal((await fetch(`${origin}/design-system/${file}`)).status, 404, file);
  const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  assert.equal(manifest.dependencies, undefined); assert.equal(manifest.scripts.dev, 'node workbench/server.js');
});
test('HTTP requires same-origin JSON mutations and rejects oversized bodies without changing source', async t => {
  const directory = await fixture(t), origin = await listen(t, createDesignSystemServer({ directory }));
  const snapshot = await (await fetch(origin + '/api/design-system')).json();
  const body = JSON.stringify({ expectedRevision: snapshot.revision, changes: [{ id: 'shared/radius-sm', value: '9px' }] });
  const headers = { Origin: origin, 'Content-Type': 'application/json', 'X-Design-System-Client': 'workbench' };
  for (const [override, expected] of [[{ Origin: 'https://example.com' }, 403], [{ 'X-Design-System-Client': '' },403], [{ 'Content-Type': 'text/plain' },415], [{ 'Sec-Fetch-Site': 'cross-site' },403]]) {
    assert.equal((await fetch(origin + '/api/design-system/tokens', { method: 'PUT', headers: { ...headers, ...override }, body })).status, expected, JSON.stringify(override));
  }
  const hostStatus = await new Promise((resolve, reject) => {
    const req = request(origin + '/api/design-system', { headers: { Host: 'example.com' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(origin + '/api/design-system/tokens', { method: 'PUT', headers, body: ' '.repeat(65537) })).status, 413);
  assert.equal((await fetch(origin + '/api/design-system', { headers: { 'If-None-Match': `"${snapshot.revision}"` } })).status, 304);
  assert.equal((await new DesignSource(directory).read()).revision, snapshot.revision);
});

test('every browser module import stays inside the positive package asset contract', async () => {
  for (const file of publicDesignFiles.filter(file => file.endsWith('.js'))) {
    const text = await readFile(path.join(packageDirectory, file), 'utf8');
    for (const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
      assert.match(match[1], /^\.{1,2}\//, `${file}: browser modules cannot import business services or external dependencies`);
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
      assert.ok(publicDesignFiles.includes(dependency), `${file}: missing public module ${dependency}`);
    }
  }
});
