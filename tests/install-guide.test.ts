import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { generateInstallGuide, validateGuideSpec, validateGuideIdentity } from '../scripts/install-guide.mjs';
import { publishGuide, storagePlan } from '../.github/scripts/publish-install-guide.mjs';
import { runFile } from '../scripts/runtime-assets.mjs';

const pkg = { name: '@openmotion/app', version: '0.6.4-test.1', private: false, bin: { openmotion: 'scripts/npm-installer.mjs' } };
const manifest = { schemaVersion: 1, version: pkg.version, templateEnvironment: 'prod', commit: 'a'.repeat(40),
  application: { sha256: 'b'.repeat(64) }, locks: { npm: 'c'.repeat(64), native: 'd'.repeat(64) },
  runtime: { targets: { mac: { platform: 'darwin', arch: 'arm64', minimumOS: '26.0' } } } };
const config = { endpoint: 'https://example.r2.cloudflarestorage.com', bucket: 'example-guides', publicOrigin: 'https://download.example.invalid' };
test('installation URLs separate the moving channel entry from the exact immutable version', () => {
  assert.equal(storagePlan({ channel: 'test', version: pkg.version }, config).versionKey, `open-motion/dev/${pkg.version}/install.md`);
  assert.equal(storagePlan({ channel: 'test', version: pkg.version }, config).fixedKey, 'open-motion/dev/install.md');
  assert.equal(storagePlan({ channel: 'stable', version: '0.6.4' }, config).versionKey, 'open-motion/0.6.4/install.md');
  assert.equal(storagePlan({ channel: 'stable', version: '0.6.4' }, config).fixedKey, 'open-motion/install.md');
});
async function fixture(t: any, candidate = false) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'motion-guide-test-')); t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'package/payload'), { recursive: true });
  await writeFile(path.join(root, 'package/package.json'), JSON.stringify(pkg));
  await writeFile(path.join(root, 'package/payload/release-npm.json'), JSON.stringify(manifest));
  const tgz = path.join(root, 'candidate.tgz');
  await runFile('tar', ['-czf', tgz, '-C', root, 'package']);
  const directory = path.join(root, 'guide'), record = await generateInstallGuide(tgz, directory, candidate);
  return { directory, record };
}
const previousGuide = '# Install OpenMotion 0.6.3-test.1\n';
function storage(directory: string, record: any, previous = previousGuide) {
  const plan = storagePlan(record, config), objects = new Map<string, Buffer>(), writes: any[] = [];
  objects.set(plan.fixedKey, Buffer.from(previous));
  const run = async (command: string, args: string[]) => {
    assert.equal(command, 'aws');
    const operation = args[args.indexOf('s3api') + 1], key = args[args.indexOf('--key') + 1];
    if (operation === 'get-object') {
      if (!objects.has(key)) throw new Error('AWS (NoSuchKey)');
      await writeFile(args.at(-1)!, objects.get(key)!); return JSON.stringify({ ETag: '"previous-etag"' });
    }
    assert.equal(operation, 'put-object');
    const bytes = await readFile(args[args.indexOf('--body') + 1]);
    writes.push({ key, args }); objects.set(key, bytes); return JSON.stringify({ ETag: '"new-etag"' });
  };
  const fetcher = async (url: URL) => new Response(objects.get(url.pathname.slice(1)) ?? 'not found', { status: objects.has(url.pathname.slice(1)) ? 200 : 404 });
  return { plan, objects, writes, run, fetcher };
}

test('guide rendering pins the exact npm package, built source and hash while rejecting unresolved or private identities', async t => {
  const { directory, record } = await fixture(t);
  const text = await readFile(path.join(directory, 'install.md'), 'utf8');
  assert(text.includes(`npx --yes --package "${pkg.name}@${pkg.version}"`));
  assert(text.includes(manifest.commit) && text.includes(record.tgzSHA256));
  assert(!text.includes('{{') && !text.includes('see `{{...}}`'));
  assert(text.includes('eleven public Tools') && text.includes('five Skills'));
  for (const host of ['codex', 'claude', 'deepseek', 'workbuddy']) assert(text.includes(`openmotion setup --host ${host}`), host);
  assert(text.includes('--profile PROFILE') && text.includes('Do not infer the current host'));
  assert.equal(record.channel, 'test'); assert.equal(record.candidate, false);
  assert.equal(validateGuideSpec('openmotion', '0.6.4'), 'stable');
  for (const name of ['https://evil.invalid/a', 'x;echo bad', '--script', '@bad/no/extra']) assert.throws(() => validateGuideSpec(name, pkg.version));
  assert.throws(() => validateGuideSpec(pkg.name, 'latest'));
  assert.throws(() => validateGuideIdentity({ ...pkg, private: true }, manifest), /public/);
  assert.throws(() => validateGuideIdentity(pkg, { ...manifest, templateEnvironment: 'dev' }), /prod/);
  assert.throws(() => validateGuideIdentity(pkg, { ...manifest, version: '0.6.4' }), /versions differ/);
});

test('publication verifies the immutable URL before conditional fixed promotion and retains the prior guide', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  const result = await publishGuide(directory, config, { ...store, fetcher: async (url: URL) => {
    assert.equal(url.search, '', 'Verify the canonical URL that users receive');
    return store.fetcher(url);
  } });
  assert.deepEqual(store.writes.map(x => x.key), [store.plan.versionKey, store.plan.fixedKey]);
  assert(store.writes[0].args.includes('--if-none-match'));
  assert(store.writes[1].args.includes('--if-match') && store.writes[1].args.includes('"previous-etag"'));
  assert(store.writes[1].args.includes('public, max-age=60, must-revalidate'));
  assert.equal(await readFile(path.join(directory, 'previous-install.md'), 'utf8'), previousGuide);
  assert.equal(result.phase, 'verified'); assert(result.previousSHA256);
});

test('an immutable version mismatch or failed public version verification leaves the fixed entry untouched', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  store.objects.set(store.plan.versionKey, Buffer.from('other release bytes'));
  await assert.rejects(publishGuide(directory, config, store), /immutable/); assert.equal(store.writes.length, 0);
  store.objects.delete(store.plan.versionKey);
  await assert.rejects(publishGuide(directory, config, { ...store, fetcher: async () => new Response('wrong edge bytes') }), /bytes differ/);
  assert.equal(store.objects.get(store.plan.fixedKey)!.toString(), previousGuide);
});

test('short version URLs preserve the bytes of an existing immutable legacy URL', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  store.objects.set(store.plan.legacyVersionKey, Buffer.from('different instructions'));
  await assert.rejects(publishGuide(directory, config, store), /immutable legacy/);
  assert.equal(store.writes.length, 0);
  const expected = await readFile(path.join(directory, 'install.md'));
  store.objects.set(store.plan.legacyVersionKey, expected);
  await publishGuide(directory, config, store);
  assert(store.objects.get(store.plan.versionKey)!.equals(expected));
  assert(store.objects.get(store.plan.legacyVersionKey)!.equals(expected));
  assert(!store.writes.some(x => x.key === store.plan.legacyVersionKey));
});

test('a post-promotion public failure records the partial state and preserves recovery bytes', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  await assert.rejects(publishGuide(directory, config, { ...store, fetcher: async (url: URL) => url.pathname.slice(1) === store.plan.versionKey ? store.fetcher(url) : new Response('stale edge bytes') }), /bytes differ/);
  const state = JSON.parse(await readFile(path.join(directory, 'publication.json'), 'utf8'));
  assert.equal(state.phase, 'fixed-written-public-unverified');
  assert.equal(await readFile(path.join(directory, 'previous-install.md'), 'utf8'), previousGuide);
});

test('candidate previews, changed guide bytes and unsafe storage destinations cannot publish', async t => {
  const preview = await fixture(t, true); let calls = 0;
  await assert.rejects(publishGuide(preview.directory, config, { run: async () => { calls++; return '{}'; } }), /previews/); assert.equal(calls, 0);
  const { directory, record } = await fixture(t); await writeFile(path.join(directory, 'install.md'), 'tampered');
  await assert.rejects(publishGuide(directory, config), /changed after validation/);
  for (const endpoint of ['http://example.r2.cloudflarestorage.com', 'https://evil.invalid', 'https://user:pass@example.r2.cloudflarestorage.com']) assert.throws(() => storagePlan(record, { ...config, endpoint }));
  assert.throws(() => storagePlan(record, { ...config, bucket: '../other' }));
});

test('archive-only guide publication never accesses the moving default', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  const result = await publishGuide(directory, config, { ...store, promote: false, run: async (command: string, args: string[]) => {
    assert.notEqual(args[args.indexOf('--key') + 1], store.plan.fixedKey);
    return store.run(command, args);
  } });
  assert.equal(result.promoted, false); assert.equal(result.phase, 'version-verified');
  assert.deepEqual(store.writes.map(x => x.key), [store.plan.versionKey]);
  assert.equal(store.objects.get(store.plan.fixedKey)!.toString(), previousGuide);
});

test('late completion archives its exact version without rolling a newer default back', async t => {
  const { directory, record } = await fixture(t), newer = '# Install OpenMotion 0.6.4-test.10\n';
  const store = storage(directory, record, newer);
  const result = await publishGuide(directory, config, store);
  assert.equal(result.phase, 'superseded'); assert.equal(result.promoted, false);
  assert.deepEqual(store.writes.map(x => x.key), [store.plan.versionKey]);
  assert.equal(store.objects.get(store.plan.fixedKey)!.toString(), newer);
});

test('unrecognized or conflicting same-version defaults require inspection instead of replacement', async t => {
  const { directory, record } = await fixture(t);
  for (const previous of ['unrecognized instructions', `# Install OpenMotion ${record.version}\nchanged`]) {
    const store = storage(directory, record, previous);
    await assert.rejects(publishGuide(directory, config, store), /recognizable version|Same-version/);
    assert.equal(store.objects.get(store.plan.fixedKey)!.toString(), previous);
    assert(!store.writes.some(x => x.key === store.plan.fixedKey));
  }
});

test('PR CI has no publication credentials; publication requires the separate manual protected workflow', async () => {
  const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/motion-publish-test.yml', import.meta.url), 'utf8');
  assert(!ci.includes('secrets.') && !ci.includes('publish-install-guide:'));
  assert(workflow.includes('workflow_dispatch:') && !workflow.includes('pull_request:') && !workflow.includes('push:'));
  assert.equal([...workflow.matchAll(/^    environment:/gm)].length, 1, 'Only the npm job requests independent approval');
  assert(workflow.includes('name: motion-test-publish'));
  assert(!workflow.split('  snapshot:\n')[0].includes('secrets.'));
});
