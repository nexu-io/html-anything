import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';
import { checkReleaseVersion, compareReleaseVersions } from '../../scripts/release-version.mjs';
import { generateInstallGuide } from '../../scripts/install-guide.mjs';
import { publishGuide, storagePlan } from './publish-install-guide.mjs';
import { scanPackage, scanSource } from './motion-scan.mjs';

export const repository = 'nexu-io/html-anything';
export const candidateWorkflow = '.github/workflows/motion-publish-test.yml';
export const recoveryWorkflow = '.github/workflows/motion-publication-recovery.yml';
export const publicationEnvironment = 'motion-test-publish';
export const candidateJobName = 'Build immutable candidate';
const exec = promisify(execFile), hashPattern = /^[a-f0-9]{64}$/;
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const integrity = bytes => 'sha512-' + createHash('sha512').update(bytes).digest('base64');

export function releaseInputs(env = process.env) {
  assert.equal(env.GITHUB_REPOSITORY, repository, 'Wrong repository');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Manual invocation required');
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Run the trusted workflow registered on main');
  assert(['publish-test', 'archive-only'].includes(env.MOTION_RELEASE_ACTION), 'Unknown release action');
  const workflow = env.GITHUB_WORKFLOW_REF;
  assert([candidateWorkflow, recoveryWorkflow].some(p => workflow === `${repository}/${p}@refs/heads/main`), 'Require a trusted manual entry');
  if (workflow.includes(recoveryWorkflow)) assert.equal(env.MOTION_RELEASE_ACTION, 'archive-only', 'Recovery never publishes or moves a channel');
  if (env.MOTION_EXPECTED_SHA256) assert.match(env.MOTION_EXPECTED_SHA256, hashPattern);
  assert(/^[1-9]\d*$/.test(env.MOTION_CANDIDATE_RUN || ''), 'Require a candidate workflow run ID');
  return { action: env.MOTION_RELEASE_ACTION, expectedSHA256: env.MOTION_EXPECTED_SHA256,
    candidateRun: env.MOTION_CANDIDATE_RUN, artifactId: env.MOTION_CANDIDATE_ARTIFACT_ID };
}

export async function resolveSource(control, requested, version, run = runFile) {
  const commit = requested || (await run('git', ['rev-parse', 'refs/remotes/origin/feature/motion'], { cwd: control })).trim();
  await validateSource(control, commit, version, run);
  return commit;
}

export async function validateSource(control, commit, version, run = runFile) {
  assert.match(commit || '', /^[a-f0-9]{40}$/, 'Use a full immutable source SHA');
  checkReleaseVersion(version); assert(version.includes('-test.'), 'This workflow builds test versions only');
  await run('git', ['merge-base', '--is-ancestor', commit, 'refs/remotes/origin/feature/motion'], { cwd: control });
}

export async function sealCandidate(build, output, source, env = process.env) {
  const manifest = await json(path.join(build, 'release-npm.json'));
  assert.equal(manifest.commit, (await runFile('git', ['rev-parse', 'HEAD'], { cwd: source })).trim());
  assert.equal(manifest.commit, env.MOTION_SOURCE_SHA); assert.equal(manifest.version, env.MOTION_VERSION);
  assert(manifest.version.includes('-test.') && manifest.templateEnvironment === 'prod');
  assert.match(env.GITHUB_SHA || '', /^[a-f0-9]{40}$/);
  assert.equal(env.GITHUB_WORKFLOW_REF, `${repository}/${candidateWorkflow}@refs/heads/main`);
  assert(/^[1-9]\d*$/.test(env.GITHUB_RUN_ID || '') && /^[1-9]\d*$/.test(env.GITHUB_RUN_ATTEMPT || ''));
  const filename = manifest.installer.url.replace(/^\.\//, '');
  assert.equal(filename, `openmotion-app-${manifest.version}.tgz`);
  await mkdir(output, { recursive: true });
  for (const name of [filename, 'release-npm.json', 'source-scan.json', 'package-scan.json']) await cp(path.join(build, name), path.join(output, name));
  const guide = await generateInstallGuide(path.join(output, filename), output);
  assert.equal(guide.packageName, '@openmotion/app'); assert.equal(guide.commit, env.MOTION_SOURCE_SHA);
  for (const name of ['source-scan.json', 'package-scan.json']) assert.equal((await json(path.join(output, name))).status, 'passed');
  const template = await readFile(new URL('../../docs/templates/release-record.md', import.meta.url), 'utf8');
  assert(template.includes('<!-- CANDIDATE_IDENTITY -->'), 'Acceptance template needs its generated identity marker');
  const identity = { package: `${guide.packageName}@${guide.version}`, sourceCommit: guide.commit,
    workflowCommit: env.GITHUB_SHA, candidateRun: Number(env.GITHUB_RUN_ID), attempt: Number(env.GITHUB_RUN_ATTEMPT),
    tgz: filename, tgzSHA256: await sha256(path.join(output, filename)), applicationSHA256: guide.applicationSHA256, locks: guide.locks,
    templateEnvironment: 'prod' };
  await writeFile(path.join(output, 'acceptance.md'), template.replace('<!-- CANDIDATE_IDENTITY -->', '```json\n' + JSON.stringify(identity, null, 2) + '\n```'));
  const names = [filename, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json', 'acceptance.md'];
  const files = Object.fromEntries(await Promise.all(names.map(async name => [name, await sha256(path.join(output, name))])));
  const candidate = { schemaVersion: 2, kind: 'motion-candidate', packageName: guide.packageName, version: guide.version,
    sourceCommit: guide.commit, tgz: filename, tgzSHA256: files[filename], integrity: integrity(await readFile(path.join(output, filename))), files,
    workflow: { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: env.GITHUB_SHA,
      runId: Number(env.GITHUB_RUN_ID), attempt: Number(env.GITHUB_RUN_ATTEMPT) },
    createdAt: new Date().toISOString(), acceptance: 'not-performed' };
  await writeJSON(path.join(output, 'candidate.json'), candidate);
  return candidate;
}

export function validateRun(run, artifact, job, attempt) {
  assert.equal(run.event, 'workflow_dispatch'); assert.equal(run.head_branch, 'main');
  assert.equal(run.head_repository?.full_name, repository);
  assert.equal(run.path.split('@')[0], candidateWorkflow, 'Candidate must come from the registered workflow');
  assert(Number.isSafeInteger(attempt) && attempt > 0 && attempt <= run.run_attempt, 'Invalid producer attempt');
  assert.equal(job.name, candidateJobName); assert.equal(job.status, 'completed'); assert.equal(job.conclusion, 'success');
  assert.equal(job.run_id, run.id); assert.equal(job.head_sha, run.head_sha);
  assert.equal(artifact.name, `motion-candidate-${run.id}-${attempt}`);
  assert.equal(artifact.workflow_run?.id, run.id); assert.equal(artifact.expired, false);
  assert.match(artifact.digest || '', /^sha256:[a-f0-9]{64}$/, 'Require the GitHub artifact digest');
  assert(artifact.size_in_bytes > 0 && artifact.size_in_bytes < 150 * 1024 * 1024, 'Unexpected artifact size');
}

async function github(route, fetcher = fetch) {
  const response = await fetcher(`https://api.github.com/repos/${repository}${route}`, { redirect: 'error', signal: AbortSignal.timeout(30_000),
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' } });
  assert(response.ok, 'GitHub metadata request failed: HTTP ' + response.status);
  return response.json();
}

export function validatePublicationEnvironment(environment, branches) {
  assert.equal(environment.name, publicationEnvironment);
  const rule = environment.protection_rules?.find(r => r.type === 'required_reviewers');
  assert(rule?.reviewers?.length > 0 && rule.prevent_self_review === true, 'Configure independent required reviewers and prevent self-review');
  assert.equal(environment.can_admins_bypass, false, 'Disable environment protection bypass');
  assert.equal(environment.deployment_branch_policy?.custom_branch_policies, true, 'Restrict the publication environment to main');
  assert.equal(environment.deployment_branch_policy?.protected_branches, false);
  assert.deepEqual(branches.branch_policies?.map(b => ({ name: b.name, type: b.type })).sort((a, b) => a.name.localeCompare(b.name)), [{ name: 'main', type: 'branch' }]);
}

export async function checkPublicationEnvironment(fetcher = fetch) {
  const environment = await github(`/environments/${publicationEnvironment}`, fetcher);
  const branches = await github(`/environments/${publicationEnvironment}/deployment-branch-policies?per_page=100`, fetcher);
  validatePublicationEnvironment(environment, branches);
}

export function approvalReceipt(candidate, reviews, run, action, observedAt = new Date().toISOString()) {
  // shortcut: GitHub reviews are run-scoped; use deployment-specific receipts if the API gains attempt identities.
  const reviewers = [...new Set(reviews.filter(r => r.state === 'approved' && r.comment?.trim() === 'PASS' &&
    r.environments?.some(e => e.name === publicationEnvironment) && r.user?.login &&
    ![run.actor?.login, run.triggering_actor?.login].includes(r.user.login)).map(r => r.user.login))].sort();
  assert(reviewers.length > 0, 'Require an independent environment approval with the non-sensitive comment PASS');
  return { schemaVersion: 1, environment: publicationEnvironment, publicationRun: run.id, action,
    version: candidate.version, tgzSHA256: candidate.tgzSHA256, candidateRun: candidate.workflow,
    reviewers, observedAt, historySHA256: createHash('sha256').update(JSON.stringify(reviews)).digest('hex'),
    scope: 'run-review-history; the protected npm job enforces approval for its execution' };
}

export async function recordApproval(directory, inputs, fetcher = fetch, env = process.env) {
  await checkPublicationEnvironment(fetcher);
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256);
  const run = await github(`/actions/runs/${env.GITHUB_RUN_ID}`, fetcher);
  assert.equal(run.head_branch, 'main'); assert.equal(run.event, 'workflow_dispatch');
  assert.equal(run.head_sha, env.GITHUB_SHA);
  assert.equal(run.path.split('@')[0], env.GITHUB_WORKFLOW_REF.slice(repository.length + 1).split('@')[0]);
  const reviews = await github(`/actions/runs/${run.id}/approvals`, fetcher);
  await writeJSON(path.join(directory, 'approval.json'), approvalReceipt(candidate, reviews, run, inputs.action));
}

async function verifyApproval(directory, inputs, env = process.env) {
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256), approval = await json(path.join(directory, 'approval.json'));
  assert.equal(approval.schemaVersion, 1);
  assert.equal(approval.environment, publicationEnvironment); assert.equal(approval.version, candidate.version);
  assert.equal(approval.tgzSHA256, candidate.tgzSHA256); assert.equal(approval.action, inputs.action);
  assert.deepEqual(approval.candidateRun, candidate.workflow);
  assert.equal(String(approval.publicationRun), env.GITHUB_RUN_ID, 'Approval belongs to another publication run');
  assert(Array.isArray(approval.reviewers) && approval.reviewers.length > 0 && approval.reviewers.every(v => typeof v === 'string' && v.length > 0));
  assert.match(approval.historySHA256, hashPattern);
  return approval;
}

export async function verifyCandidate(directory, expectedSHA256, run) {
  const candidate = await json(path.join(directory, 'candidate.json'));
  assert.equal(candidate.schemaVersion, 2); assert.equal(candidate.kind, 'motion-candidate'); assert.equal(candidate.packageName, '@openmotion/app');
  checkReleaseVersion(candidate.version); assert(candidate.version.includes('-test.'));
  assert.equal(candidate.tgz, `openmotion-app-${candidate.version}.tgz`); assert.equal(candidate.tgzSHA256, expectedSHA256);
  assert.match(expectedSHA256, hashPattern); assert.match(candidate.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(candidate.workflow, { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: run.head_sha, runId: run.id, attempt: run.run_attempt });
  const names = [candidate.tgz, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json', 'acceptance.md'];
  assert.deepEqual(Object.keys(candidate.files).sort(), names.sort());
  for (const name of names) assert.equal(await sha256(path.join(directory, name)), candidate.files[name], 'Candidate file changed: ' + name);
  assert.equal(await sha256(path.join(directory, candidate.tgz)), expectedSHA256);
  assert.equal(integrity(await readFile(path.join(directory, candidate.tgz))), candidate.integrity);
  const guide = await json(path.join(directory, 'install-record.json'));
  assert.equal(guide.commit, candidate.sourceCommit); assert.equal(guide.version, candidate.version); assert.equal(guide.packageName, candidate.packageName);
  assert.equal(guide.tgzSHA256, expectedSHA256); assert.equal(guide.channel, 'test'); assert.equal(guide.templateEnvironment, 'prod');
  assert.equal(guide.guideSHA256, candidate.files['install.md']); assert.equal(guide.candidate, false);
  const manifest = await json(path.join(directory, 'release-npm.json'));
  assert.equal(manifest.commit, candidate.sourceCommit); assert.equal(manifest.version, candidate.version);
  assert.equal(manifest.installer.sha256, expectedSHA256);
  for (const name of ['source-scan.json', 'package-scan.json']) assert.equal((await json(path.join(directory, name))).status, 'passed');
  return candidate;
}

export async function verifyDownloaded(directory, expectedSHA256) {
  const provenance = await json(path.join(directory, 'provenance.json'));
  return verifyCandidate(directory, expectedSHA256, { head_sha: provenance.head_sha, id: provenance.runId, run_attempt: provenance.attempt });
}

export async function platformReports(directory, candidate) {
  const reports = [];
  for (const platform of ['darwin-arm64', 'win32-x64']) {
    const name = `registry-${platform}.json`, report = await json(path.join(directory, name));
    assert.equal(report.status, 'passed'); assert.equal(report.platform, platform);
    assert.equal(report.version, candidate.version); assert.equal(report.tgzSHA256, candidate.tgzSHA256);
    assert.equal(report.sourceCommit, candidate.sourceCommit);
    assert.equal(report.registryColdInstall, 'passed'); assert.equal(report.nativePreparation, 'passed');
    assert.equal(report.repeatSetup, 'passed'); assert.equal(report.resources, 'passed');
    assert.equal(report.mcpTools, 11); assert.equal(report.skills, 5);
    reports.push({ platform, reportSHA256: await sha256(path.join(directory, name)) });
  }
  return reports;
}

export async function downloadCandidate(runId, directory, expectedSHA256, fetcher = fetch, artifactId) {
  assert(/^[1-9]\d*$/.test(runId));
  const run = await github(`/actions/runs/${runId}`, fetcher);
  const { artifacts } = await github(`/actions/runs/${runId}/artifacts?per_page=100`, fetcher);
  const matches = artifacts.filter(a => artifactId ? String(a.id) === String(artifactId) : new RegExp(`^motion-candidate-${run.id}-[1-9]\\d*$`).test(a.name));
  assert(matches.length > 0, 'Candidate artifact missing');
  matches.sort((a, b) => Number(b.name.split('-').at(-1)) - Number(a.name.split('-').at(-1)));
  const artifact = matches[0], attempt = Number(artifact.name.split('-').at(-1));
  assert.equal(matches.filter(a => a.name === artifact.name).length, 1, 'Candidate artifact ambiguous');
  const { jobs } = await github(`/actions/runs/${run.id}/attempts/${attempt}/jobs?per_page=100`, fetcher);
  const builds = jobs.filter(j => j.name === candidateJobName); assert.equal(builds.length, 1, 'Successful candidate producer is missing or ambiguous');
  validateRun(run, artifact, builds[0], attempt);
  const redirect = await fetcher(`https://api.github.com/repos/${repository}/actions/artifacts/${artifact.id}/zip`, {
    redirect: 'manual', signal: AbortSignal.timeout(30_000), headers: { Authorization: `Bearer ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}` } });
  assert.equal(redirect.status, 302); const url = new URL(redirect.headers.get('location')); assert.equal(url.protocol, 'https:'); assert(!url.username && !url.password);
  // Signed artifact URLs are fetched without forwarding the GitHub credential.
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(60_000) }); assert(response.ok);
  const bytes = Buffer.from(await response.arrayBuffer()); assert(bytes.length < 150 * 1024 * 1024);
  assert.equal('sha256-' + createHash('sha256').update(bytes).digest('hex'), artifact.digest.replace(':', '-'));
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-artifact-'));
  try {
    const archive = path.join(work, 'candidate.zip'); await writeFile(archive, bytes);
    const entries = (await runFile('unzip', ['-Z1', archive])).trim().split('\n');
    assert(entries.length === 8 && new Set(entries).size === 8, 'Unexpected candidate artifact files');
    assert(entries.every(name => /^[a-zA-Z0-9._-]+$/.test(name) && name.length < 160), 'Unsafe candidate artifact entry');
    await mkdir(directory, { recursive: true });
    for (const name of entries) {
      const { stdout } = await exec('unzip', ['-p', archive, name], { encoding: 'buffer', maxBuffer: 150 * 1024 * 1024 });
      await writeFile(path.join(directory, name), stdout);
    }
    const candidate = await verifyCandidate(directory, expectedSHA256 || (await json(path.join(directory, 'candidate.json'))).tgzSHA256, { ...run, run_attempt: attempt });
    await writeJSON(path.join(directory, 'provenance.json'), { runId: run.id, attempt, head_sha: run.head_sha, artifactId: artifact.id, digest: artifact.digest });
    return candidate;
  } finally { await rm(work, { recursive: true, force: true }); }
}

export async function registryPackage(candidate, fetcher = fetch) {
  const response = await fetcher('https://registry.npmjs.org/@openmotion%2fapp', { signal: AbortSignal.timeout(30_000) });
  if (response.status === 404) return { version: null, tags: {} };
  assert(response.ok, 'Registry metadata request failed'); const data = await response.json();
  const version = data.versions?.[candidate.version];
  if (version) assert.equal(version.dist.integrity, candidate.integrity, 'Published npm version has different bytes; never overwrite it');
  return { version: version || null, tags: data['dist-tags'] || {} };
}

export async function publishNpm(directory, inputs, { fetcher = fetch, run = runFile, env = process.env } = {}) {
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256);
  await verifyApproval(directory, inputs, env);
  const before = await registryPackage(candidate, fetcher);
  if (inputs.action === 'archive-only') assert(before.version, 'Archive-only requires an existing identical npm version');
  if (inputs.action === 'publish-test' && before.tags.test) assert(compareReleaseVersions(candidate.version, before.tags.test) >= 0, 'A newer npm test version already exists; use snapshot recovery for an identical published version');
  const record = { schemaVersion: 1, version: candidate.version, tgzSHA256: candidate.tgzSHA256, action: inputs.action,
    previousLatest: before.tags.latest ?? null, status: before.version ? 'already-published-identical' : 'publish-started' };
  await writeJSON(path.join(directory, 'npm-publication.json'), record);
  if (!before.version) {
    // OIDC authenticates this publisher; its main SHA is not the prebuilt application's source.
    await run('npm', ['publish', path.join(directory, candidate.tgz), '--access', 'public', '--tag', 'test', '--ignore-scripts', '--provenance=false', '--registry=https://registry.npmjs.org/']);
    record.status = 'published-awaiting-registry'; await writeJSON(path.join(directory, 'npm-publication.json'), record);
  }
  return record;
}

export async function archiveRelease(directory, inputs, config, { run = runFile, fetcher = fetch, env = process.env } = {}) {
  await writeJSON(path.join(directory, 'release-attempt.json'), { action: inputs.action, tgzSHA256: inputs.expectedSHA256, stage: 'verifying-release', runId: env.GITHUB_RUN_ID });
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256);
  const approval = await verifyApproval(directory, inputs, env);
  const platforms = await platformReports(directory, candidate);
  const record = await json(path.join(directory, 'install-record.json')), plan = storagePlan(record, config);
  assert.equal(candidate.tgzSHA256, inputs.expectedSHA256);
  const registry = await registryPackage(candidate, fetcher); assert(registry.version, 'Exact npm version is not public');
  const npm = await json(path.join(directory, 'npm-publication.json'));
  assert.equal(npm.tgzSHA256, candidate.tgzSHA256);
  assert.equal(registry.tags.latest ?? null, npm.previousLatest, 'npm latest changed unexpectedly; stop and investigate before promoting a guide');
  if (inputs.action === 'publish-test' && registry.tags.test !== candidate.version) {
    assert(registry.tags.test && compareReleaseVersions(registry.tags.test, candidate.version) > 0, 'npm test tag is missing or unexpectedly older; explicit channel recovery is required');
  }
  const prefix = path.posix.dirname(plan.versionKey), work = await mkdtemp(path.join(os.tmpdir(), 'motion-snapshot-'));
  const aws = async (operation, rest) => JSON.parse(await run('aws', ['--endpoint-url', plan.endpoint, '--region', 'auto', 's3api', operation, '--bucket', plan.bucket, ...rest]) || '{}');
  try {
    const get = async key => {
      const file = path.join(work, 'object');
      try { await aws('get-object', ['--key', key, file]); return await readFile(file); }
      catch (error) { if (/NoSuchKey|\(404\)|Not Found/.test(error.message)) return null; throw error; }
    };
    const prior = await get(`${prefix}/release-record.json`);
    let release = { schemaVersion: 2, packageName: candidate.packageName, version: candidate.version, sourceCommit: candidate.sourceCommit,
      tgzSHA256: candidate.tgzSHA256, integrity: candidate.integrity, candidateRun: candidate.workflow,
      approval, publicationRun: env.GITHUB_RUN_ID,
      platformVerification: platforms, status: 'registry-verified', publishedAt: new Date().toISOString() };
    if (prior) {
      const existing = JSON.parse(prior);
      for (const key of ['packageName', 'version', 'sourceCommit', 'tgzSHA256', 'integrity']) assert.equal(existing[key], release[key], 'Existing release record differs: ' + key);
      release = existing;
    }
    await writeJSON(path.join(directory, 'release-record.json'), release);
    const names = [...Object.keys(candidate.files), 'candidate.json', 'registry-darwin-arm64.json', 'registry-win32-x64.json', 'release-record.json'];
    const objects = [];
    for (const name of names) {
      const file = path.join(directory, name), bytes = await readFile(file), key = `${prefix}/${name}`, existing = await get(key);
      if (existing) assert(existing.equals(bytes), 'Immutable snapshot already has different bytes: ' + name);
      objects.push({ file, bytes, key, existing });
    }
    await writeJSON(path.join(directory, 'release-attempt.json'), { action: inputs.action, version: candidate.version, stage: 'archive-started', runId: env.GITHUB_RUN_ID });
    for (const object of objects) {
      if (!object.existing) await aws('put-object', ['--key', object.key, '--body', object.file, '--if-none-match', '*', '--content-type', object.key.endsWith('.md') ? 'text/markdown; charset=utf-8' : object.key.endsWith('.json') ? 'application/json' : 'application/octet-stream', '--cache-control', 'public, max-age=31536000, immutable']);
      const response = await fetcher(new URL('/' + object.key, plan.publicOrigin), { redirect: 'error', signal: AbortSignal.timeout(30_000), headers: { 'cache-control': 'no-cache' } });
      assert(response.ok, 'Snapshot public readback failed'); assert(Buffer.from(await response.arrayBuffer()).equals(object.bytes), 'Snapshot public bytes differ');
    }
    const promote = inputs.action === 'publish-test' && registry.tags.test === candidate.version;
    const publication = await publishGuide(directory, config, { run, fetcher, promote });
    await writeJSON(path.join(directory, 'release-attempt.json'), { action: inputs.action, version: candidate.version,
      stage: inputs.action === 'archive-only' ? 'archive-only-verified' : !promote || publication.phase === 'superseded' ? 'archived-superseded' : 'test-entry-verified', runId: env.GITHUB_RUN_ID });
    return release;
  } finally { await rm(work, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, directory, extra, final] = process.argv.slice(2);
  if (command === 'source') {
    const commit = await resolveSource(directory, process.env.MOTION_SOURCE_SHA, process.env.MOTION_VERSION);
    const { appendFile } = await import('node:fs/promises');
    await appendFile(process.env.GITHUB_OUTPUT, `source_sha=${commit}\n`);
  }
  else if (command === 'seal') await sealCandidate(directory, extra, final);
  else {
    const inputs = releaseInputs();
    if (command === 'download') {
      const candidate = await downloadCandidate(inputs.candidateRun, directory, inputs.expectedSHA256, fetch, inputs.artifactId);
      const { appendFile } = await import('node:fs/promises');
      await appendFile(process.env.GITHUB_OUTPUT, `tgz_sha256=${candidate.tgzSHA256}\n`);
    }
    else if (command === 'environment') await checkPublicationEnvironment();
    else if (command === 'approval') await recordApproval(directory, inputs);
    else if (command === 'rescan') {
      const c = await verifyDownloaded(directory, inputs.expectedSHA256);
      await validateSource(extra, c.sourceCommit, c.version);
      const work = await mkdtemp(path.join(os.tmpdir(), 'motion-source-verify-'));
      try {
        await runFile('git', ['worktree', 'add', '--detach', work, c.sourceCommit], { cwd: extra });
        await writeJSON(path.join(directory, 'publication-source-scan.json'), await scanSource(work, final));
        await writeJSON(path.join(directory, 'publication-package-scan.json'), await scanPackage(path.join(directory, c.tgz), final));
      } finally { await runFile('git', ['worktree', 'remove', '--force', work], { cwd: extra }).catch(() => {}); }
    } else if (command === 'verify') await verifyDownloaded(directory, inputs.expectedSHA256);
    else if (command === 'npm') await publishNpm(directory, inputs);
    else if (command === 'archive') {
      for (const name of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) assert(process.env[name], 'Missing R2 credential: ' + name);
      await archiveRelease(directory, inputs, { endpoint: process.env.MOTION_R2_ENDPOINT, bucket: process.env.MOTION_R2_BUCKET, publicOrigin: process.env.MOTION_INSTALL_PUBLIC_ORIGIN });
    }
    else throw new Error('Unknown release command');
  }
}
