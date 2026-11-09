import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { candidateFixture } from './release-fixture.mjs';
import { releaseInputs, validateSource, validateRun, verifyDownloaded, downloadCandidate, publishNpm, archiveRelease, repository, candidateWorkflow } from '../.github/scripts/motion-release.mjs';
import { consumerEnvironment } from '../.github/scripts/motion-registry-smoke.mjs';
import { runFile } from '../scripts/runtime-assets.mjs';

const config = { endpoint: 'https://example.r2.cloudflarestorage.com', bucket: 'example-releases', publicOrigin: 'https://download.example.invalid' };
const valid = { GITHUB_REPOSITORY: repository, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main',
  MOTION_RELEASE_ACTION: 'publish-test', MOTION_APPROVED: 'true', MOTION_EXPECTED_SHA256: 'a'.repeat(64), MOTION_ACCEPTANCE_SHA256: 'b'.repeat(64), MOTION_CANDIDATE_RUN: '123' };
const origin = { id: 123, run_attempt: 1, event: 'workflow_dispatch', head_branch: 'main', head_repository: { full_name: repository }, status: 'completed', conclusion: 'success', path: candidateWorkflow, head_sha: 'b'.repeat(40) };
const artifact = { id: 456, name: 'motion-candidate-123-1', workflow_run: { id: 123 }, expired: false, size_in_bytes: 100, digest: 'sha256:' + 'a'.repeat(64) };

test('publication and source selection fail closed on missing approval, mutable refs, wrong repository or non-test versions', async () => {
  assert.equal(releaseInputs(valid).action, 'publish-test');
  for (const [key, value] of Object.entries({ GITHUB_REPOSITORY: 'fork/repo', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/feature/motion', MOTION_APPROVED: 'false', MOTION_EXPECTED_SHA256: '', MOTION_ACCEPTANCE_SHA256: '', MOTION_CANDIDATE_RUN: '../123', MOTION_RELEASE_ACTION: 'stable' })) assert.throws(() => releaseInputs({ ...valid, [key]: value }));
  let called = false;
  await validateSource('.', 'a'.repeat(40), '0.6.4-test.7', async (_, args) => { called = true; assert(args.includes('refs/remotes/origin/feature/motion')); }); assert(called);
  for (const [sha, version] of [['main', '0.6.4-test.7'], ['a'.repeat(40), '0.6.4'], ['a'.repeat(40), '0.6.4-test.0']]) await assert.rejects(validateSource('.', sha, version, async () => { throw Error('must not run'); }));
  await assert.rejects(validateSource('.', 'a'.repeat(40), '0.6.4-test.7', async () => { throw Error('not integrated'); }), /not integrated/);
});

test('only successful trusted candidate runs and their exact attempts are accepted', () => {
  validateRun(origin, artifact);
  for (const patch of [{ event: 'pull_request' }, { head_branch: 'feature/motion' }, { conclusion: 'failure' }, { path: '.github/workflows/other.yml' }, { head_repository: { full_name: 'fork/repo' } }]) assert.throws(() => validateRun({ ...origin, ...patch }, artifact));
  for (const patch of [{ expired: true }, { name: 'motion-candidate-123-2' }, { digest: null }, { workflow_run: { id: 999 } }]) assert.throws(() => validateRun(origin, { ...artifact, ...patch }));
});

test('the sealed candidate detects tgz, guide, identity and provenance tampering', async t => {
  const { directory, candidate } = await candidateFixture(t);
  assert.equal((await verifyDownloaded(directory, candidate.tgzSHA256)).version, candidate.version);
  await assert.rejects(verifyDownloaded(directory, '0'.repeat(64)));
  const file = path.join(directory, 'install.md'), original = await readFile(file);
  await writeFile(file, 'changed'); await assert.rejects(verifyDownloaded(directory, candidate.tgzSHA256), /Candidate file changed/);
  await writeFile(file, original); await writeFile(path.join(directory, 'provenance.json'), JSON.stringify({ head_sha: 'f'.repeat(40), runId: 123, attempt: 1 }));
  await assert.rejects(verifyDownloaded(directory, candidate.tgzSHA256));
});

test('artifact download verifies GitHub ZIP digest and does not forward the credential to the signed URL', async t => {
  const f = await candidateFixture(t), zip = path.join(f.work, 'candidate.zip');
  await runFile('zip', ['-j', zip, ...['candidate.json', ...Object.keys(f.candidate.files)].map(name => path.join(f.directory, name))]);
  const bytes = await readFile(zip), digest = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
  const fetcher = async (url, options) => {
    const value = String(url);
    if (value.endsWith('/actions/runs/123')) return Response.json(origin);
    if (value.includes('/artifacts?')) return Response.json({ artifacts: [{ ...artifact, digest, size_in_bytes: bytes.length }] });
    if (value.endsWith('/456/zip')) return new Response(null, { status: 302, headers: { location: 'https://signed.example.invalid/candidate' } });
    assert.equal(value, 'https://signed.example.invalid/candidate'); assert.equal(options.headers, undefined);
    return new Response(bytes);
  };
  assert.equal((await downloadCandidate('123', path.join(f.work, 'download'), f.candidate.tgzSHA256, fetcher)).tgzSHA256, f.candidate.tgzSHA256);
  await assert.rejects(downloadCandidate('123', path.join(f.work, 'corrupt'), f.candidate.tgzSHA256, async (url, options) => String(url).includes('signed.') ? new Response('tampered ZIP') : fetcher(url, options)));
});

function registry(candidate, exists = true, tag = candidate.version, latest = '0.5.0') {
  return () => Response.json({ versions: exists ? { [candidate.version]: { dist: { integrity: candidate.integrity } } } : {}, 'dist-tags': { test: tag, latest } });
}

test('npm publishes only new exact bytes; identical retry and archive-only never write, mismatches fail', async t => {
  const f = await candidateFixture(t); let calls = 0;
  const run = async (command, args) => { calls++; assert.equal(command, 'npm'); assert(args.includes('--ignore-scripts') && args.includes('test')); assert.equal(args[1], path.join(f.directory, f.candidate.tgz)); };
  await publishNpm(f.directory, f.inputs, { run, fetcher: registry(f.candidate, false) }); assert.equal(calls, 1);
  await publishNpm(f.directory, f.inputs, { run, fetcher: registry(f.candidate) });
  await publishNpm(f.directory, { ...f.inputs, action: 'archive-only' }, { run, fetcher: registry(f.candidate) }); assert.equal(calls, 1);
  await assert.rejects(publishNpm(f.directory, { ...f.inputs, action: 'archive-only' }, { run, fetcher: registry(f.candidate, false) }), /existing identical/);
  await assert.rejects(publishNpm(f.directory, f.inputs, { run, fetcher: registry({ ...f.candidate, integrity: 'different' }) }), /different bytes/); assert.equal(calls, 1);
});

function storage(candidate) {
  const objects = new Map([['open-motion/dev/install.md', Buffer.from('previous entry')]]), writes = [], reads = [];
  let failKey;
  const run = async (command, args) => {
    assert.equal(command, 'aws'); const op = args[args.indexOf('s3api') + 1], key = args[args.indexOf('--key') + 1];
    if (op === 'get-object') { reads.push(key); if (!objects.has(key)) throw Error('NoSuchKey'); await writeFile(args.at(-1), objects.get(key)); return JSON.stringify({ ETag: '"etag"' }); }
    assert.equal(op, 'put-object'); if (key === failKey) throw Error('simulated upload interruption');
    assert(args.includes('--if-none-match') || args.includes('--if-match'));
    if (args.includes('--if-none-match')) assert(!objects.has(key));
    objects.set(key, await readFile(args[args.indexOf('--body') + 1])); writes.push(key); return '{}';
  };
  const fetcher = async url => String(url).includes('registry.npmjs.org') ? registry(candidate)() : new Response(objects.get(new URL(url).pathname.slice(1)) || '', { status: objects.has(new URL(url).pathname.slice(1)) ? 200 : 404 });
  return { objects, writes, reads, run, fetcher, fail: key => { failKey = key; } };
}

test('interrupted archive resumes identical snapshots, verifies the exact public URLs, and updates the moving guide last', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate), prefix = `open-motion/dev/${f.candidate.version}`;
  store.fail(prefix + '/install-record.json');
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, store), /interruption/);
  assert.equal(store.objects.get('open-motion/dev/install.md').toString(), 'previous entry');
  store.fail(null); await archiveRelease(f.directory, f.inputs, config, store);
  assert.equal(store.writes.at(-1), 'open-motion/dev/install.md');
  assert.equal(await readFile(path.join(f.directory, 'previous-install.md'), 'utf8'), 'previous entry');
  const before = store.writes.length; await archiveRelease(f.directory, f.inputs, config, store); assert.equal(store.writes.length, before);
  store.objects.set(prefix + '/release-npm.json', Buffer.from('different snapshot'));
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, store), /Immutable snapshot/);
});

test('archive-only never reads or writes the moving entry, and failed platform acceptance blocks all storage calls', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  await archiveRelease(f.directory, { ...f.inputs, action: 'archive-only' }, config, store);
  assert(!store.reads.includes('open-motion/dev/install.md') && !store.writes.includes('open-motion/dev/install.md'));
  await writeFile(path.join(f.directory, 'registry-win32-x64.json'), JSON.stringify({ status: 'failed' }));
  const before = store.reads.length; await assert.rejects(archiveRelease(f.directory, f.inputs, config, store)); assert.equal(store.reads.length, before);
});

test('an unexpected npm latest change stops promotion and consumer processes cannot inherit publication credentials', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, { ...store, fetcher: registry(f.candidate, true, f.candidate.version, f.candidate.version) }), /latest changed/);
  assert.equal(store.writes.length, 0);
  const env = consumerEnvironment('/isolated', { PATH: '/bin', NODE_AUTH_TOKEN: 'example', GITHUB_TOKEN: 'example', AWS_ACCESS_KEY_ID: 'example', ACTIONS_ID_TOKEN_REQUEST_URL: 'example', npm_config_registry: 'https://private.invalid' });
  assert(!env.NODE_AUTH_TOKEN && !env.GITHUB_TOKEN && !env.AWS_ACCESS_KEY_ID && !env.ACTIONS_ID_TOKEN_REQUEST_URL);
  assert.equal(env.npm_config_registry, 'https://registry.npmjs.org/');
});
