import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { candidateFixture } from './release-fixture.mjs';
import { releaseInputs, resolveCandidate, sealCandidate, publishNpm, promoteStable, promoteTest, archiveRelease } from '../.github/scripts/motion-release.mjs';

const config = { endpoint: 'https://example.r2.cloudflarestorage.com', bucket: 'example-releases', publicOrigin: 'https://download.example.invalid' };

function services(f) {
  let published = false, latest = '0.5.0';
  const writes = [], objects = new Map();
  const registry = () => Response.json({ versions: published ? { [f.candidate.version]: { dist: { integrity: f.candidate.integrity } } } : {},
    'dist-tags': { test: '0.6.4-test.8', latest } });
  const fetcher = async url => String(url).includes('registry.npmjs.org') ? registry() : new Response(objects.get(new URL(url).pathname.slice(1)) || '', { status: objects.has(new URL(url).pathname.slice(1)) ? 200 : 404 });
  const run = async (command, args) => {
    if (command === 'npm') {
      writes.push(args);
      if (args[0] === 'publish') { assert.equal(args[args.indexOf('--tag') + 1], 'stage'); published = true; }
      else { assert.equal(args[3], 'latest'); latest = f.candidate.version; }
      return '';
    }
    assert.equal(command, 'aws');
    const op = args[args.indexOf('s3api') + 1], key = args[args.indexOf('--key') + 1];
    if (op === 'get-object') {
      if (!objects.has(key)) throw Error('NoSuchKey');
      await writeFile(args.at(-1), objects.get(key)); return '{"ETag":"etag"}';
    }
    assert.equal(op, 'put-object'); assert(args.includes('--if-none-match') || args.includes('--if-match'));
    objects.set(key, await readFile(args[args.indexOf('--body') + 1])); return '{}';
  };
  return { run, fetcher, env: f.env, writes, objects, setLatest: value => { latest = value; }, getLatest: () => latest };
}

test('stable selection is explicit and rejects prerelease/prod or stable/DEV channel mismatches', async t => {
  const f = await candidateFixture(t, 'main', { version: '0.6.4' });
  assert.equal(releaseInputs(f.env).channel, 'stable');
  for (const patch of [{ MOTION_RELEASE_CHANNEL: 'test' }, { MOTION_VERSION: '0.6.4-test.9' }, { MOTION_RELEASE_ACTION: 'publish-test' }]) assert.throws(() => releaseInputs({ ...f.env, ...patch }));
  await assert.rejects(resolveCandidate('.', '', '', { ...f.env, GITHUB_WORKFLOW_REF: f.env.GITHUB_WORKFLOW_REF.replace('motion-publish-test', 'motion-candidate') }, async () => {}), /exact stable version/);
  await assert.rejects(promoteTest(f.directory, f.inputs), /channel/);
  assert.equal(f.candidate.version, '0.6.4');
  const guide = JSON.parse(await readFile(path.join(f.directory, 'install-record.json')));
  assert.equal(guide.templateEnvironment, 'prod'); assert.equal(guide.channel, 'stable');
  assert((await readFile(path.join(f.directory, 'candidate-install.md'), 'utf8')).includes('**prod template environment**'));
  await writeFile(path.join(f.build, 'release-npm.json'), JSON.stringify({ ...f.manifest, templateEnvironment: 'dev' }));
  await assert.rejects(sealCandidate(f.build, path.join(f.work, 'wrong-environment'), f.root, {
    ...f.env, MOTION_SOURCE_SHA: f.candidate.sourceCommit,
  }), /Template defaults must match/);
});

test('stable stage, native acceptance, latest and exact/prod guides use the same immutable bytes', async t => {
  const f = await candidateFixture(t, 'main', { version: '0.6.4' }), store = services(f);

  await publishNpm(f.directory, f.inputs, store);
  assert.equal(store.getLatest(), '0.5.0');
  const native = path.join(f.directory, 'registry-win32-x64.json'), original = await readFile(native, 'utf8');
  for (const patch of [{ status: 'failed' }, { templateEnvironment: 'dev' }, { tgzSHA256: '0'.repeat(64) }, { nativePreparation: 'failed' }, { resources: 'failed' }]) {
    await writeFile(native, JSON.stringify({ ...JSON.parse(original), ...patch }));
    await assert.rejects(promoteStable(f.directory, f.inputs, store)); assert.equal(store.getLatest(), '0.5.0');
    assert.equal(store.writes.length, 1, 'Only stage publication has occurred');
  }
  await writeFile(native, original);
  assert.equal((await promoteStable(f.directory, f.inputs, store)).status, 'promoted');
  assert.equal(store.getLatest(), '0.6.4');
  await archiveRelease(f.directory, f.inputs, config, store);
  const exact = store.objects.get('open-motion/0.6.4/install.md').toString();
  const moving = store.objects.get('open-motion/install.md').toString();
  assert(exact.includes('@openmotion/app@0.6.4')); assert(moving.includes('@openmotion/app@latest'));
  assert(![...store.objects.keys()].some(key => key.startsWith('open-motion/dev/')));
  const record = JSON.parse(store.objects.get('open-motion/0.6.4/release-record.json'));
  assert.equal(record.nativeChecks, 'passed-before-latest'); assert.equal(record.platformVerification.length, 2);
  await publishNpm(f.directory, f.inputs, store); await promoteStable(f.directory, f.inputs, store); await archiveRelease(f.directory, f.inputs, config, store);
  assert.equal(store.writes.length, 2, 'Retry does not republish or move latest again');
});

test('stable treats native Tool and Skill counts as informational', async t => {
  const f = await candidateFixture(t, 'main', { version: '0.6.7' }), store = services(f);
  await publishNpm(f.directory, f.inputs, store);
  for (const platform of ['darwin-arm64', 'win32-x64']) {
    const file = path.join(f.directory, `registry-${platform}.json`);
    const report = JSON.parse(await readFile(file, 'utf8'));
    delete report.skills;
    delete report.mcpTools;
    await writeFile(file, JSON.stringify(report));
  }
  assert.equal((await promoteStable(f.directory, f.inputs, store)).status, 'promoted');
  await archiveRelease(f.directory, f.inputs, config, store);
});

test('stable accepts an older candidate with only the five canonical Skills', async t => {
  const skills = ['production', 'director', 'template-to-video', 'recreate', 'video-to-template'].map(name => 'openmotion-' + name);
  const f = await candidateFixture(t, 'main', { version: '0.6.5', skills }), store = services(f);
  await publishNpm(f.directory, f.inputs, store);
  assert.equal((await promoteStable(f.directory, f.inputs, store)).status, 'promoted');
  await archiveRelease(f.directory, f.inputs, config, store);
});

test('stable recovery never publishes, changes tags or touches the moving guide; newer latest is preserved', async t => {
  const f = await candidateFixture(t, 'main', { version: '0.6.4' }), store = services(f);
  await publishNpm(f.directory, f.inputs, store);
  store.setLatest('0.7.0');
  assert.equal((await promoteStable(f.directory, f.inputs, store)).status, 'superseded');
  await archiveRelease(f.directory, f.inputs, config, store);
  assert(!store.objects.has('open-motion/install.md')); assert(store.objects.has('open-motion/0.6.4/install.md'));
  await writeFile(path.join(f.directory, 'authorization.json'), JSON.stringify({ ...f.authorization, action: 'archive-only' }));
  const inputs = { ...f.inputs, action: 'archive-only' }, before = store.writes.length;
  await publishNpm(f.directory, inputs, store); await promoteStable(f.directory, inputs, store);
  await archiveRelease(f.directory, inputs, config, store);
  assert.equal(store.writes.length, before); assert(!store.objects.has('open-motion/install.md')); assert.equal(store.getLatest(), '0.7.0');
});

test('stable uses the existing trusted publisher filename and native failures block latest, not test delivery', async () => {
  const workflow = await readFile(new URL('../.github/workflows/motion-publish-test.yml', import.meta.url), 'utf8');
  assert(workflow.includes('options: [test, stable]')); assert(!workflow.includes('accepted:') && !workflow.includes('environment:'));
  assert(workflow.includes('  promote-stable:') && workflow.includes('  stable-snapshot:'));
  assert(workflow.includes("continue-on-error: ${{ inputs.channel != 'stable' }}"));
  const stable = workflow.split('  promote-stable:\n')[1].split('  stable-snapshot:')[0];
  assert(stable.includes('needs.registry-mac.result') && stable.includes('needs.registry-windows.result'));
  assert(stable.includes('id-token: write') && !stable.includes('secrets.'));
  const snapshot = workflow.split('  stable-snapshot:\n')[1];
  assert(!snapshot.includes('id-token: write') && snapshot.includes('CLOUDFLARE_R2_RELEASES_SK'));
  const candidate = await readFile(new URL('../.github/workflows/motion-candidate.yml', import.meta.url), 'utf8');
  assert(candidate.includes("inputs.channel == 'stable' && 'prod' || 'dev'"));
});
