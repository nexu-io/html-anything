import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { generateInstallGuide, validateGuideSpec, validateGuideIdentity } from '../scripts/install-guide.mjs';
import { movingGuide, publishGuide, storagePlan } from '../.github/scripts/publish-install-guide.mjs';
import { installationInstructions } from '../scripts/install-onboarding.mjs';
import { fileURLToPath } from 'node:url';
import { runFile } from '../scripts/runtime-assets.mjs';

const pkg = { name: '@openmotion/app', version: '0.6.4-test.1', private: false, bin: { openmotion: 'scripts/npm-installer.mjs' } };
const manifest = { schemaVersion: 1, version: pkg.version, templateEnvironment: 'dev', commit: 'a'.repeat(40),
  application: { sha256: 'b'.repeat(64) }, locks: { npm: 'c'.repeat(64), native: 'd'.repeat(64) },
  runtime: { targets: { mac: { platform: 'darwin', arch: 'arm64' }, windows: { platform: 'win32', arch: 'x64', minimumOS: 'Windows 11' } } } };
const config = { endpoint: 'https://example.r2.cloudflarestorage.com', bucket: 'example-guides', publicOrigin: 'https://download.example.invalid' };
test('installation URLs separate the moving channel entry from the exact immutable version', () => {
  assert.equal(storagePlan({ channel: 'test', version: pkg.version }, config).versionKey, `open-motion/dev/${pkg.version}/install.md`);
  assert.equal(storagePlan({ channel: 'test', version: pkg.version }, config).fixedKey, 'open-motion/dev/install.md');
  assert.equal(storagePlan({ channel: 'stable', version: '0.6.4' }, config).versionKey, 'open-motion/0.6.4/install.md');
  assert.equal(storagePlan({ channel: 'stable', version: '0.6.4' }, config).fixedKey, 'open-motion/install.md');
});
async function fixture(t: any, candidate = false, declaration = manifest) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'motion-guide-test-')); t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'package/payload'), { recursive: true });
  await writeFile(path.join(root, 'package/package.json'), JSON.stringify(pkg));
  await writeFile(path.join(root, 'package/payload/release-npm.json'), JSON.stringify(declaration));
  const tgz = path.join(root, 'candidate.tgz');
  await runFile('tar', ['-czf', tgz, '-C', root, 'package']);
  const directory = path.join(root, 'guide'), record = await generateInstallGuide(tgz, directory, candidate);
  return { directory, record };
}
const previousGuide = '# Install OpenMotion 0.6.3-test.1\n';
test('guides allow macOS without a version floor and retain declared minimums for other targets and older packages', async t => {
  const { directory } = await fixture(t);
  const text = await readFile(path.join(directory, 'install.md'), 'utf8');
  assert(text.includes('darwin/arm64, win32/x64 (Windows 11+)'));
  assert(!text.includes('26.0+') && !text.includes('undefined+'));
  const missingWindowsMinimum = structuredClone(manifest);
  missingWindowsMinimum.runtime.targets.windows.minimumOS = '';
  assert.throws(() => validateGuideIdentity(pkg, missingWindowsMinimum), /native target/);
  const missingCPU = structuredClone(manifest);
  missingCPU.runtime.targets.mac.arch = '';
  assert.throws(() => validateGuideIdentity(pkg, missingCPU), /native target/);
  const legacy = { ...manifest, runtime: { targets: { ...manifest.runtime.targets, mac: { ...manifest.runtime.targets.mac, minimumOS: '26.0' } } } };
  const older = await fixture(t, false, legacy);
  assert((await readFile(path.join(older.directory, 'install.md'), 'utf8')).includes('darwin/arm64 (26.0+)'));
});
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
  assert(text.includes('new test versions embed DEV defaults') && !text.includes('does not select DEV templates'),
    'A generated test guide must not claim test versions skip DEV templates');
  for (const host of ['codex', 'claude', 'deepseek', 'workbuddy']) assert(text.includes(`openmotion setup --host ${host}`), host);
  assert(text.includes('--profile PROFILE') && text.includes('Do not infer the current host'));
  assert(text.includes(`/blob/${manifest.commit}/docs/npm-installation.md#npm-download-failures`), 'Network recovery must link to this package source');
  assert(text.includes('automatically try `https://registry.npmjs.org` then `https://registry.npmmirror.com`'), 'Network recovery must name the ordered automatic fallback');
  assert(text.includes('at most once per registry, counting the initial failed attempt'), 'Recovery must not retry the same registry indefinitely');
  assert(text.includes('`npm_config_registry` and `npm_config_fetch_retries=0` only for that attempt, including setup\'s npm child process'), 'Temporary registry settings must reach nested dependency installation');
  assert(text.includes('verify any mirrored tgz against the matching immutable guide\'s SHA256 before executing it'), 'Mirror recovery must preserve an independently recorded package identity');
  assert(text.includes('Permission or checksum failures stop immediately') && text.includes('terminal handoff') && text.includes('A local tgz still needs npm access'), 'Retain fail-closed recovery, terminal handoff and the online dependency boundary');
  assert(text.includes(await installationInstructions(fileURLToPath(new URL('../', import.meta.url)))), 'Published guide must preserve the exact setup reply contract');
  assert.equal(record.channel, 'test'); assert.equal(record.candidate, false);
  assert.equal(validateGuideSpec('openmotion', '0.6.4'), 'stable');
  for (const name of ['https://evil.invalid/a', 'x;echo bad', '--script', '@bad/no/extra']) assert.throws(() => validateGuideSpec(name, pkg.version));
  assert.throws(() => validateGuideSpec(pkg.name, 'latest'));
  assert.throws(() => validateGuideIdentity({ ...pkg, private: true }, manifest), /public/);
  assert.throws(() => validateGuideIdentity(pkg, { ...manifest, templateEnvironment: 'prod' }), /Template defaults/);
  assert.throws(() => validateGuideIdentity(pkg, { ...manifest, version: '0.6.4' }), /versions differ/);
  const stable = { ...pkg, version: '0.6.4' };
  assert.equal(validateGuideIdentity(stable, { ...manifest, version: stable.version, templateEnvironment: 'prod' }), 'stable');
  assert.throws(() => validateGuideIdentity(stable, { ...manifest, version: stable.version }), /Template defaults/);
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

test('PR CI has no publication credentials; publication requires a separate manual workflow', async () => {
  const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/motion-publish-test.yml', import.meta.url), 'utf8');
  assert(!ci.includes('secrets.') && !ci.includes('publish-install-guide:'));
  assert(workflow.includes('workflow_dispatch:') && !workflow.includes('pull_request:') && !workflow.includes('push:'));
  assert(!workflow.includes('environment:'), 'No independent approval environment is enabled');
  assert(!workflow.includes('accepted:') && !workflow.includes('MOTION_ACCEPTED'));
  assert(!workflow.split('  snapshot:\n')[0].includes('secrets.'));
});

test('moving guides use channel tags while immutable guides and current version remain exact', async t => {
  const { directory, record } = await fixture(t), store = storage(directory, record);
  const exact = await readFile(path.join(directory, 'install.md'), 'utf8');
  // Existing same-version pinned defaults may migrate once without changing the archive.
  store.objects.set(store.plan.fixedKey, Buffer.from(exact));
  await publishGuide(directory, config, store);
  const current = store.objects.get(store.plan.fixedKey)!.toString();
  assert(current.includes('@openmotion/app@test'));
  assert(!current.includes('@openmotion/app@' + record.version));
  assert(current.includes('Current test version: ' + record.version));
  assert.equal(store.objects.get(store.plan.versionKey)!.toString(), exact);
  assert(movingGuide(exact, { ...record, channel: 'stable' }).includes('@openmotion/app@latest'));
  const count = store.writes.length;
  await publishGuide(directory, config, store); assert.equal(store.writes.length, count);
});
