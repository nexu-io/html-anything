import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { candidateFixture } from './release-fixture.mjs';
import { releaseInputs, resolveSource, validateSource, validateRun, verifyDownloaded, downloadCandidate, publishNpm, archiveRelease, repository, candidateWorkflow, recoveryWorkflow, publicationEnvironment, candidateJobName, validatePublicationEnvironment, approvalReceipt, recordApproval } from '../.github/scripts/motion-release.mjs';
import { compareReleaseVersions } from '../scripts/release-version.mjs';
import { consumerEnvironment } from '../.github/scripts/motion-registry-smoke.mjs';
import { runFile } from '../scripts/runtime-assets.mjs';

const config = { endpoint: 'https://example.r2.cloudflarestorage.com', bucket: 'example-releases', publicOrigin: 'https://download.example.invalid' };
const valid = { GITHUB_REPOSITORY: repository, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main',
  GITHUB_WORKFLOW_REF: `${repository}/${candidateWorkflow}@refs/heads/main`, MOTION_RELEASE_ACTION: 'publish-test', MOTION_EXPECTED_SHA256: 'a'.repeat(64), MOTION_CANDIDATE_RUN: '123' };
const origin = { id: 123, run_attempt: 1, event: 'workflow_dispatch', head_branch: 'main', head_repository: { full_name: repository }, status: 'completed', conclusion: 'success', path: candidateWorkflow, head_sha: 'b'.repeat(40) };
const artifact = { id: 456, name: 'motion-candidate-123-1', workflow_run: { id: 123 }, expired: false, size_in_bytes: 100, digest: 'sha256:' + 'a'.repeat(64) };
const producer = { name: candidateJobName, status: 'completed', conclusion: 'success', run_id: 123, head_sha: origin.head_sha };
const protectedEnvironment = { name: publicationEnvironment, can_admins_bypass: false,
  protection_rules: [{ type: 'required_reviewers', prevent_self_review: true, reviewers: [{ type: 'User', reviewer: { login: 'reviewer' } }] }],
  deployment_branch_policy: { custom_branch_policies: true, protected_branches: false } };
const branchPolicies = { branch_policies: [{ name: 'main', type: 'branch' }] };

test('manual entry and source selection reject untrusted callers, mutable refs and non-test versions', async () => {
  assert.equal(releaseInputs(valid).action, 'publish-test');
  for (const [key, value] of Object.entries({ GITHUB_REPOSITORY: 'fork/repo', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/feature/motion', GITHUB_WORKFLOW_REF: `${repository}/evil.yml@refs/heads/main`, MOTION_EXPECTED_SHA256: 'bad', MOTION_CANDIDATE_RUN: '../123', MOTION_RELEASE_ACTION: 'stable' })) assert.throws(() => releaseInputs({ ...valid, [key]: value }));
  const recovery = { ...valid, GITHUB_WORKFLOW_REF: `${repository}/${recoveryWorkflow}@refs/heads/main` };
  assert.throws(() => releaseInputs(recovery), /Recovery/);
  assert.equal(releaseInputs({ ...recovery, MOTION_RELEASE_ACTION: 'archive-only' }).action, 'archive-only');
  let called = false;
  await validateSource('.', 'a'.repeat(40), '0.6.4-test.7', async (_, args) => { called = true; assert(args.includes('refs/remotes/origin/feature/motion')); }); assert(called);
  for (const [sha, version] of [['main', '0.6.4-test.7'], ['a'.repeat(40), '0.6.4'], ['a'.repeat(40), '0.6.4-test.0']]) await assert.rejects(validateSource('.', sha, version, async () => { throw Error('must not run'); }));
  await assert.rejects(validateSource('.', 'a'.repeat(40), '0.6.4-test.7', async () => { throw Error('not integrated'); }), /not integrated/);
  const resolved = await resolveSource('.', '', '0.6.4-test.7', async (_, args) => args[0] === 'rev-parse' ? 'a'.repeat(40) + '\n' : '');
  assert.equal(resolved, 'a'.repeat(40));
});

test('an in-progress release requires its successful exact candidate producer, including partial retries', () => {
  validateRun(origin, artifact, producer, 1);
  validateRun({ ...origin, status: 'in_progress', conclusion: null }, artifact, producer, 1);
  validateRun({ ...origin, run_attempt: 2, conclusion: 'failure' }, artifact, producer, 1);
  for (const patch of [{ event: 'pull_request' }, { head_branch: 'feature/motion' }, { path: '.github/workflows/other.yml' }, { head_repository: { full_name: 'fork/repo' } }]) assert.throws(() => validateRun({ ...origin, ...patch }, artifact, producer, 1));
  for (const patch of [{ expired: true }, { name: 'motion-candidate-123-2' }, { digest: null }, { workflow_run: { id: 999 } }]) assert.throws(() => validateRun(origin, { ...artifact, ...patch }, producer, 1));
  for (const patch of [{ status: 'in_progress' }, { conclusion: 'failure' }, { name: 'another job' }, { head_sha: 'f'.repeat(40) }, { run_id: 999 }]) assert.throws(() => validateRun(origin, artifact, { ...producer, ...patch }, 1));
  assert.throws(() => validateRun(origin, artifact, producer, 2));
});

test('missing, bypassable or wrongly scoped environment protections block publication', () => {
  validatePublicationEnvironment(protectedEnvironment, branchPolicies);
  for (const patch of [{ protection_rules: [] }, { can_admins_bypass: true }, { deployment_branch_policy: null }, { protection_rules: [{ ...protectedEnvironment.protection_rules[0], prevent_self_review: false }] }]) assert.throws(() => validatePublicationEnvironment({ ...protectedEnvironment, ...patch }, branchPolicies));
  assert.throws(() => validatePublicationEnvironment(protectedEnvironment, { branch_policies: [{ name: '*', type: 'branch' }] }));
});

test('approval records identify actual independent reviewers without publishing private comments', async t => {
  const f = await candidateFixture(t), approved = { state: 'approved', comment: 'PASS', environments: [{ name: publicationEnvironment }], user: { login: 'reviewer' } };
  const run = { ...origin, id: 800, actor: { login: 'operator' }, triggering_actor: { login: 'rerunner' } };
  assert.equal(approvalReceipt(f.candidate, [approved], run, 'publish-test').reviewers[0], 'reviewer');
  for (const patch of [{ state: 'rejected' }, { comment: '' }, { comment: 'internal private material' }, { environments: [{ name: 'other' }] }, { user: { login: 'operator' } }, { user: { login: 'rerunner' } }]) assert.throws(() => approvalReceipt(f.candidate, [{ ...approved, ...patch }], run, 'publish-test'));
  const fetcher = async url => {
    const value = String(url);
    if (value.endsWith('/environments/' + publicationEnvironment)) return Response.json(protectedEnvironment);
    if (value.includes('deployment-branch-policies')) return Response.json(branchPolicies);
    if (value.endsWith('/approvals')) return Response.json([approved]);
    return Response.json(run);
  };
  await recordApproval(f.directory, f.inputs, fetcher, f.env);
  const record = JSON.parse(await readFile(path.join(f.directory, 'approval.json')));
  assert.equal(record.publicationRun, 800); assert.equal(record.tgzSHA256, f.candidate.tgzSHA256);
  assert(!JSON.stringify(record).includes('comment'));
  await assert.rejects(recordApproval(f.directory, f.inputs, async url => String(url).endsWith('/approvals') ? Response.json([]) : fetcher(url), f.env), /independent/);
});

test('the sealed candidate detects tgz, guide, identity and provenance tampering', async t => {
  const { directory, candidate } = await candidateFixture(t);
  assert.equal((await verifyDownloaded(directory, candidate.tgzSHA256)).version, candidate.version);
  const checklist = await readFile(path.join(directory, 'acceptance.md'), 'utf8');
  assert(checklist.includes(candidate.tgzSHA256) && checklist.includes(candidate.sourceCommit));
  assert(!checklist.includes('<!-- CANDIDATE_IDENTITY -->'));
  assert(checklist.includes('NOT RUN'), 'Generated identity must not fabricate human acceptance');
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
    if (value.includes('/attempts/1/jobs')) return Response.json({ jobs: [producer] });
    if (value.endsWith('/456/zip')) return new Response(null, { status: 302, headers: { location: 'https://signed.example.invalid/candidate' } });
    assert.equal(value, 'https://signed.example.invalid/candidate'); assert.equal(options.headers, undefined);
    return new Response(bytes);
  };
  assert.equal((await downloadCandidate('123', path.join(f.work, 'download'), f.candidate.tgzSHA256, fetcher)).tgzSHA256, f.candidate.tgzSHA256);
  const retryFetcher = (url, options) => String(url).endsWith('/actions/runs/123') ? Response.json({ ...origin, run_attempt: 2, conclusion: 'failure' }) : fetcher(url, options);
  assert.equal((await downloadCandidate('123', path.join(f.work, 'retry'), undefined, retryFetcher, '456')).tgzSHA256, f.candidate.tgzSHA256, 'A partial retry derives the hash from its exact retained producer artifact');
  await assert.rejects(downloadCandidate('123', path.join(f.work, 'corrupt'), f.candidate.tgzSHA256, async (url, options) => String(url).includes('signed.') ? new Response('tampered ZIP') : fetcher(url, options)));
});

function registry(candidate, exists = true, tag = candidate.version, latest = '0.5.0') {
  return () => Response.json({ versions: exists ? { [candidate.version]: { dist: { integrity: candidate.integrity } } } : {}, 'dist-tags': { test: tag, latest } });
}

test('npm publishes only new exact bytes; identical retry and archive-only never write, mismatches fail', async t => {
  const f = await candidateFixture(t); let calls = 0;
  assert.notEqual(f.candidate.sourceCommit, f.candidate.workflow.sha, 'Application and workflow source identities are independent');
  const run = async (command, args) => { calls++; assert.equal(command, 'npm'); assert(args.includes('--ignore-scripts') && args.includes('test')); assert(args.includes('--provenance=false'), 'Do not attest the publication main SHA as the prebuilt application source'); assert.equal(args[1], path.join(f.directory, f.candidate.tgz)); };
  await publishNpm(f.directory, f.inputs, { run, fetcher: registry(f.candidate, false), env: f.env }); assert.equal(calls, 1);
  await publishNpm(f.directory, f.inputs, { run, fetcher: registry(f.candidate), env: f.env });
  await assert.rejects(publishNpm(f.directory, f.inputs, { run, fetcher: registry({ ...f.candidate, integrity: 'different' }), env: f.env }), /different bytes/); assert.equal(calls, 1);
  await writeFile(path.join(f.directory, 'approval.json'), JSON.stringify({ ...f.approval, action: 'archive-only' }));
  await publishNpm(f.directory, { ...f.inputs, action: 'archive-only' }, { run, fetcher: registry(f.candidate), env: f.env }); assert.equal(calls, 1);
  await assert.rejects(publishNpm(f.directory, { ...f.inputs, action: 'archive-only' }, { run, fetcher: registry(f.candidate, false), env: f.env }), /existing identical/);
});

test('a stale candidate or approval from another run cannot publish or move npm test backward', async t => {
  const f = await candidateFixture(t); let calls = 0;
  const run = async () => { calls++; };
  await assert.rejects(publishNpm(f.directory, f.inputs, { run, env: f.env, fetcher: registry(f.candidate, false, '0.6.4-test.100') }), /newer npm test/);
  await assert.rejects(publishNpm(f.directory, f.inputs, { run, env: { GITHUB_RUN_ID: '801' }, fetcher: registry(f.candidate, false) }), /another publication run/);
  await writeFile(path.join(f.directory, 'approval.json'), JSON.stringify({ ...f.approval, tgzSHA256: '0'.repeat(64) }));
  await assert.rejects(publishNpm(f.directory, f.inputs, { run, env: f.env, fetcher: registry(f.candidate, false) }));
  assert.equal(calls, 0);
});

test('test version ordering handles numeric suffixes, stable versions and unsafe numeric widths', () => {
  for (const [a, b] of [['0.6.4-test.10', '0.6.4-test.9'], ['0.6.4', '0.6.4-test.99'], ['0.6.5-test.1', '0.6.4'], ['0.6.4-test.1.2', '0.6.4-test.1'], ['0.6.4-test.9007199254740993', '0.6.4-test.9007199254740992']]) {
    assert.equal(compareReleaseVersions(a, b), 1); assert.equal(compareReleaseVersions(b, a), -1);
  }
  assert.equal(compareReleaseVersions('0.6.4-test.1', '0.6.4-test.1'), 0);
  assert.throws(() => compareReleaseVersions('latest', '0.6.4'));
});

test('partial publication retries use the retained producer artifact IDs across attempts', async () => {
  const workflow = await readFile(new URL('../.github/workflows/motion-publish-test.yml', import.meta.url), 'utf8');
  const jobs = Object.fromEntries(workflow.split('\njobs:\n')[1].split(/(?=^  [\w-]+:\n)/m).filter(s => s.trim()).map(s => [s.match(/^  ([\w-]+):\n/)[1], s]));
  const producers = ['verify', 'npm', 'registry-mac', 'registry-windows'];
  const render = (value, attempt) => value.replaceAll('${{ github.run_id }}', '800').replaceAll('${{ github.run_attempt }}', String(attempt));
  for (const id of producers) {
    assert(jobs[id], 'A platform needs its own retained output: ' + id);
    assert(jobs[id].includes('artifact_id: ${{ steps.artifact.outputs.artifact-id }}'), 'Expose the actual uploaded artifact ID');
    assert(jobs[id].includes('        id: artifact\n'));
  }
  for (const id of ['npm', 'registry-mac', 'registry-windows', 'snapshot']) {
    assert(jobs[id].includes('if: ${{ always() && !cancelled() && needs.verify.result'), 'A skipped recovery build must not silently skip downstream jobs: ' + id);
  }
  const downloads = id => [...jobs[id].matchAll(/artifact-ids: \$\{\{ needs\.([\w-]+)\.outputs\.artifact_id \}\}/g)].map(m => m[1]);
  assert.deepEqual(downloads('npm'), ['verify']);
  assert.deepEqual(downloads('registry-mac'), ['verify']);
  assert.deepEqual(downloads('registry-windows'), ['verify']);
  assert.deepEqual(downloads('snapshot'), producers);
  assert(jobs.snapshot.includes('needs: [verify, npm, registry-mac, registry-windows]'));
  assert(jobs.npm.includes('      actions: read\n'), 'The credentialed npm job needs only read access to input artifacts');
  for (const job of Object.values(jobs)) {
    for (const step of job.split(/(?=^      - )/m).filter(s => s.includes('uses: actions/download-artifact@'))) {
      assert(step.includes('github-token: ${{ github.token }}') && step.includes('run-id: ${{ github.run_id }}'), 'Resolve exact IDs through the run-scoped REST API');
      assert(!step.includes('github.run_attempt'), 'A consumer must not guess the producing attempt');
    }
  }
  for (const rerun of [[], ['registry-mac'], ['registry-windows'], ['registry-mac', 'registry-windows'], ['npm', 'registry-mac', 'registry-windows'], producers]) {
    const stored = new Map(), outputs = {};
    for (const [index, id] of producers.entries()) {
      const name = jobs[id].match(/          name: ([^\n]+)/)[1];
      const oldID = String(100 + index); stored.set(oldID, render(name, 1)); outputs[id] = oldID;
      if (rerun.includes(id)) { const newID = String(200 + index); stored.set(newID, render(name, 2)); outputs[id] = newID; }
    }
    for (const id of downloads('snapshot')) {
      assert(stored.has(outputs[id]), 'The exact producer artifact remains available');
      assert.equal(stored.get(outputs[id]).endsWith(rerun.includes(id) ? '-2' : '-1'), true);
    }
  }
});

test('the daily entry builds before one approval; recovery can only reuse an existing candidate', async () => {
  const workflow = await readFile(new URL('../.github/workflows/motion-publish-test.yml', import.meta.url), 'utf8');
  const recovery = await readFile(new URL('../.github/workflows/motion-publication-recovery.yml', import.meta.url), 'utf8');
  const header = workflow.split('\njobs:\n')[0];
  assert(header.includes('version:') && header.includes('source_sha:'));
  for (const manualField of ['tgz_sha256:', 'acceptance_sha256:', 'approved:', 'action:']) assert(!header.includes(manualField));
  assert(!header.includes('concurrency:'), 'Acceptance waits cannot hold a repository-wide build lock');
  assert(workflow.includes('name: ' + candidateJobName));
  assert(workflow.includes('ref: ${{ steps.source.outputs.source_sha }}'), 'Checkout the already frozen commit');
  assert.equal([...workflow.matchAll(/^    environment:/gm)].length, 1);
  assert(workflow.includes('motion-release.mjs environment') && workflow.includes('motion-release.mjs approval'));
  assert(workflow.includes('MOTION_EXPECTED_SHA256: ${{ needs.verify.outputs.tgz_sha256 }}'));
  assert(!recovery.includes('publish-test\n') && !recovery.includes('version:') && !recovery.includes('source_sha:'));
  assert(recovery.includes('uses: ./.github/workflows/motion-publish-test.yml'));
  assert(workflow.includes("inputs.candidate_run_id != '' && 'archive-only' || 'publish-test'"));
});

function storage(candidate) {
  const objects = new Map([['open-motion/dev/install.md', Buffer.from('# Install OpenMotion 0.6.4-test.1\n')]]), writes = [], reads = [];
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
  return { objects, writes, reads, run, fetcher, env: { GITHUB_RUN_ID: '800' }, fail: key => { failKey = key; } };
}

test('interrupted archive resumes identical snapshots, verifies the exact public URLs, and updates the moving guide last', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate), prefix = `open-motion/dev/${f.candidate.version}`;
  store.fail(prefix + '/install-record.json');
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, store), /interruption/);
  assert.equal(store.objects.get('open-motion/dev/install.md').toString(), '# Install OpenMotion 0.6.4-test.1\n');
  store.fail(null); await archiveRelease(f.directory, f.inputs, config, store);
  assert.equal(store.writes.at(-1), 'open-motion/dev/install.md');
  assert.equal(await readFile(path.join(f.directory, 'previous-install.md'), 'utf8'), '# Install OpenMotion 0.6.4-test.1\n');
  const before = store.writes.length; await archiveRelease(f.directory, f.inputs, config, store); assert.equal(store.writes.length, before);
  store.objects.set(prefix + '/release-npm.json', Buffer.from('different snapshot'));
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, store), /Immutable snapshot/);
});

test('archive-only never reads or writes the moving entry, and failed platform acceptance blocks all storage calls', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  await writeFile(path.join(f.directory, 'approval.json'), JSON.stringify({ ...f.approval, action: 'archive-only' }));
  await archiveRelease(f.directory, { ...f.inputs, action: 'archive-only' }, config, store);
  assert(!store.reads.includes('open-motion/dev/install.md') && !store.writes.includes('open-motion/dev/install.md'));
  await writeFile(path.join(f.directory, 'registry-win32-x64.json'), JSON.stringify({ status: 'failed' }));
  const before = store.reads.length; await assert.rejects(archiveRelease(f.directory, f.inputs, config, store)); assert.equal(store.reads.length, before);
});

test('a superseded npm candidate still keeps immutable snapshots and never advances the moving guide', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  await archiveRelease(f.directory, f.inputs, config, { ...store, fetcher: url => String(url).includes('registry.npmjs.org') ? registry(f.candidate, true, '0.6.4-test.100')() : store.fetcher(url) });
  assert(store.objects.has(`open-motion/dev/${f.candidate.version}/install.md`));
  assert(!store.reads.includes('open-motion/dev/install.md') && !store.writes.includes('open-motion/dev/install.md'));
  const attempt = JSON.parse(await readFile(path.join(f.directory, 'release-attempt.json')));
  assert.equal(attempt.stage, 'archived-superseded');
});

test('a missing or regressed npm test tag cannot be misreported as a newer superseding release', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  for (const tag of [undefined, '0.6.4-test.1']) {
    await assert.rejects(archiveRelease(f.directory, f.inputs, config, { ...store,
      fetcher: () => Response.json({ versions: { [f.candidate.version]: { dist: { integrity: f.candidate.integrity } } }, 'dist-tags': { test: tag, latest: '0.5.0' } }) }), /explicit channel recovery/);
  }
  assert.equal(store.writes.length, 0);
});

test('an unexpected npm latest change stops promotion and consumer processes cannot inherit publication credentials', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  await assert.rejects(archiveRelease(f.directory, f.inputs, config, { ...store, fetcher: registry(f.candidate, true, f.candidate.version, f.candidate.version) }), /latest changed/);
  assert.equal(store.writes.length, 0);
  const env = consumerEnvironment('/isolated', { PATH: '/bin', NODE_AUTH_TOKEN: 'example', GITHUB_TOKEN: 'example', AWS_ACCESS_KEY_ID: 'example', ACTIONS_ID_TOKEN_REQUEST_URL: 'example', BROWSER_USE_ACCESS_PIPE_PATH: '/ipc', CODEX_APP_TOOLS_PIPE_PATH: '/ipc', NODE_OPTIONS: '--require=untrusted', npm_config_registry: 'https://private.invalid' });
  assert(!env.NODE_AUTH_TOKEN && !env.GITHUB_TOKEN && !env.AWS_ACCESS_KEY_ID && !env.ACTIONS_ID_TOKEN_REQUEST_URL);
  assert(!env.BROWSER_USE_ACCESS_PIPE_PATH && !env.CODEX_APP_TOOLS_PIPE_PATH && !env.NODE_OPTIONS);
  assert.equal(env.npm_config_registry, 'https://registry.npmjs.org/');
});

test('no-publication rehearsal carries one candidate through approval, npm and storage using simulated services only', async t => {
  const f = await candidateFixture(t), store = storage(f.candidate);
  const run = { ...origin, id: 800, actor: { login: 'operator' } };
  const reviews = [{ state: 'approved', comment: 'PASS', environments: [{ name: publicationEnvironment }], user: { login: 'reviewer' } }];
  const github = async url => {
    if (String(url).endsWith('/environments/' + publicationEnvironment)) return Response.json(protectedEnvironment);
    if (String(url).includes('deployment-branch-policies')) return Response.json(branchPolicies);
    if (String(url).endsWith('/approvals')) return Response.json(reviews);
    return Response.json(run);
  };
  await writeFile(path.join(f.directory, 'approval.json'), '{}');
  let npmWrites = 0, published = false;
  const npm = { env: f.env, fetcher: () => registry(f.candidate, published)(), run: async (command, args) => {
    assert.equal(command, 'npm'); assert.equal(args[1], path.join(f.directory, f.candidate.tgz));
    npmWrites++; published = true;
  } };
  await assert.rejects(publishNpm(f.directory, f.inputs, npm));
  assert.equal(npmWrites, 0, 'No approval means no registry write');
  await recordApproval(f.directory, f.inputs, github, f.env);
  await publishNpm(f.directory, f.inputs, npm);
  await archiveRelease(f.directory, f.inputs, config, store);
  assert.equal(npmWrites, 1);
  const release = JSON.parse(store.objects.get(`open-motion/dev/${f.candidate.version}/release-record.json`));
  assert.equal(release.schemaVersion, 2); assert.deepEqual(release.approval.reviewers, ['reviewer']);
  assert.equal(release.tgzSHA256, f.candidate.tgzSHA256);
  assert.equal(store.writes.at(-1), 'open-motion/dev/install.md');
  await publishNpm(f.directory, f.inputs, npm);
  await archiveRelease(f.directory, f.inputs, config, store);
  assert.equal(npmWrites, 1, 'Retry never repacks or republishes the accepted bytes');
});
