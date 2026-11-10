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
export const candidateWorkflow = '.github/workflows/motion-candidate.yml';
export const publicationWorkflow = '.github/workflows/motion-publish-test.yml';
export const recoveryWorkflow = '.github/workflows/motion-publication-recovery.yml';
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
  assert([publicationWorkflow, recoveryWorkflow].some(p => workflow === `${repository}/${p}@refs/heads/main`), 'Require a trusted manual entry');
  if (workflow.includes(recoveryWorkflow)) assert.equal(env.MOTION_RELEASE_ACTION, 'archive-only', 'Recovery never publishes or moves a channel');
  if (env.MOTION_EXPECTED_SHA256) assert.match(env.MOTION_EXPECTED_SHA256, hashPattern);
  assert.equal(env.MOTION_ACCEPTED, 'true', 'Explicit operator acceptance confirmation is required');
  checkReleaseVersion(env.MOTION_VERSION); assert(env.MOTION_VERSION.includes('-test.'), 'Only test versions may use this entry');
  return { action: env.MOTION_RELEASE_ACTION, accepted: true, version: env.MOTION_VERSION, expectedSHA256: env.MOTION_EXPECTED_SHA256 };
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
  const installTemplate = await readFile(new URL('../../docs/templates/candidate-install.md', import.meta.url), 'utf8');
  const values = { VERSION: guide.version, TGZ: filename, SHA256: identity.tgzSHA256, SOURCE_SHA: guide.commit,
    DETAILS_URL: `https://github.com/${repository}/blob/${guide.commit}/docs/npm-installation.md` };
  const instructions = installTemplate.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => { assert(Object.hasOwn(values, key)); return values[key]; });
  assert(!instructions.includes('{{'), 'Unresolved candidate instructions');
  await writeFile(path.join(output, 'candidate-install.md'), instructions);
  const names = [filename, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json', 'acceptance.md', 'candidate-install.md'];
  const files = Object.fromEntries(await Promise.all(names.map(async name => [name, await sha256(path.join(output, name))])));
  const candidate = { schemaVersion: 2, kind: 'motion-candidate', packageName: guide.packageName, version: guide.version,
    sourceCommit: guide.commit, tgz: filename, tgzSHA256: files[filename], integrity: integrity(await readFile(path.join(output, filename))), files,
    workflow: { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: env.GITHUB_SHA,
      runId: Number(env.GITHUB_RUN_ID), attempt: Number(env.GITHUB_RUN_ATTEMPT) },
    createdAt: new Date().toISOString(), acceptance: 'not-performed' };
  await writeJSON(path.join(output, 'candidate.json'), candidate);
  return candidate;
}

export function validateRun(run, artifact, version) {
  assert.equal(run.event, 'workflow_dispatch'); assert.equal(run.head_branch, 'main');
  assert.equal(run.head_repository?.full_name, repository);
  assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success', 'Candidate build must finish successfully');
  assert.equal(run.path.split('@')[0], candidateWorkflow, 'Candidate must come from the registered build workflow');
  assert.equal(artifact.name, `motion-candidate-${version}`);
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

export function authorizationReceipt(candidate, run, action, observedAt = new Date().toISOString()) {
  const actor = run.triggering_actor?.login || run.actor?.login;
  assert(typeof actor === 'string' && actor.length > 0, 'Require the actual publication operator');
  return { schemaVersion: 1, type: 'manual-workflow-dispatch', publicationRun: run.id, runAttempt: run.run_attempt,
    action, version: candidate.version, tgzSHA256: candidate.tgzSHA256, candidateRun: candidate.workflow,
    actor, acceptanceConfirmed: true, observedAt };
}

export async function recordAuthorization(directory, inputs, fetcher = fetch, env = process.env) {
  const authorized = releaseInputs(env);
  assert.equal(authorized.action, inputs.action); assert.equal(authorized.version, inputs.version);
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256, inputs.version);
  const run = await github(`/actions/runs/${env.GITHUB_RUN_ID}`, fetcher);
  assert.equal(String(run.id), env.GITHUB_RUN_ID); assert.equal(run.head_branch, 'main'); assert.equal(run.event, 'workflow_dispatch');
  assert.equal(run.head_repository?.full_name, repository); assert.equal(run.head_sha, env.GITHUB_SHA);
  assert.equal(run.path.split('@')[0], env.GITHUB_WORKFLOW_REF.slice(repository.length + 1).split('@')[0]);
  await writeJSON(path.join(directory, 'authorization.json'), authorizationReceipt(candidate, run, inputs.action));
}

async function verifyAuthorization(directory, inputs, env = process.env) {
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256, inputs.version), authorization = await json(path.join(directory, 'authorization.json'));
  assert.equal(inputs.accepted, true); assert.equal(authorization.schemaVersion, 1);
  assert.equal(authorization.type, 'manual-workflow-dispatch'); assert.equal(authorization.acceptanceConfirmed, true);
  assert.equal(authorization.version, candidate.version); assert.equal(authorization.tgzSHA256, candidate.tgzSHA256);
  assert.equal(authorization.action, inputs.action); assert.deepEqual(authorization.candidateRun, candidate.workflow);
  assert.equal(String(authorization.publicationRun), env.GITHUB_RUN_ID, 'Authorization belongs to another publication run');
  assert(typeof authorization.actor === 'string' && authorization.actor.length > 0);
  return authorization;
}

export async function verifyCandidate(directory, expectedSHA256, run) {
  const candidate = await json(path.join(directory, 'candidate.json'));
  assert.equal(candidate.schemaVersion, 2); assert.equal(candidate.kind, 'motion-candidate'); assert.equal(candidate.packageName, '@openmotion/app');
  checkReleaseVersion(candidate.version); assert(candidate.version.includes('-test.'));
  assert.equal(candidate.tgz, `openmotion-app-${candidate.version}.tgz`); assert.equal(candidate.tgzSHA256, expectedSHA256);
  assert.match(expectedSHA256, hashPattern); assert.match(candidate.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(candidate.workflow, { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: run.head_sha, runId: run.id, attempt: run.run_attempt });
  const names = [candidate.tgz, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json', 'acceptance.md', 'candidate-install.md'];
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

export async function verifyDownloaded(directory, expectedSHA256, version) {
  const provenance = await json(path.join(directory, 'provenance.json'));
  const candidate = await verifyCandidate(directory, expectedSHA256, { head_sha: provenance.head_sha, id: provenance.runId, run_attempt: provenance.attempt });
  if (version) assert.equal(candidate.version, version, 'Candidate version differs from the accepted version');
  return candidate;
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

export async function findCandidate(version, fetcher = fetch) {
  checkReleaseVersion(version); assert(version.includes('-test.'));
  const name = `motion-candidate-${version}`;
  const result = await github(`/actions/artifacts?name=${encodeURIComponent(name)}&per_page=100`, fetcher);
  assert(result.total_count <= 100, 'Too many matching artifacts; refusing an incomplete lookup');
  const matches = result.artifacts.filter(a => a.name === name && !a.expired);
  assert.equal(matches.length, 1, 'Candidate missing, expired or ambiguous; build a new unique version');
  assert(Number.isSafeInteger(matches[0].workflow_run?.id) && matches[0].workflow_run.id > 0);
  return matches[0];
}

export async function downloadCandidate(version, directory, expectedSHA256, fetcher = fetch) {
  const artifact = await findCandidate(version, fetcher), run = await github(`/actions/runs/${artifact.workflow_run.id}`, fetcher);
  validateRun(run, artifact, version);
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
    assert(entries.length === 9 && new Set(entries).size === 9, 'Unexpected candidate artifact files');
    assert(entries.every(name => /^[a-zA-Z0-9._-]+$/.test(name) && name.length < 160), 'Unsafe candidate artifact entry');
    await mkdir(directory, { recursive: true });
    for (const name of entries) {
      const { stdout } = await exec('unzip', ['-p', archive, name], { encoding: 'buffer', maxBuffer: 150 * 1024 * 1024 });
      await writeFile(path.join(directory, name), stdout);
    }
    const candidate = await verifyCandidate(directory, expectedSHA256 || (await json(path.join(directory, 'candidate.json'))).tgzSHA256, run);
    assert.equal(candidate.version, version, 'Artifact version differs from the accepted version');
    await writeJSON(path.join(directory, 'provenance.json'), { runId: run.id, attempt: run.run_attempt, head_sha: run.head_sha, artifactId: artifact.id, digest: artifact.digest });
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
  await verifyAuthorization(directory, inputs, env);
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
  const authorization = await verifyAuthorization(directory, inputs, env);
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
      authorization, publicationRun: env.GITHUB_RUN_ID,
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
      const candidate = await downloadCandidate(inputs.version, directory, inputs.expectedSHA256);
      const { appendFile } = await import('node:fs/promises');
      await appendFile(process.env.GITHUB_OUTPUT, `tgz_sha256=${candidate.tgzSHA256}\n`);
    }
    else if (command === 'authorize') await recordAuthorization(directory, inputs);
    else if (command === 'rescan') {
      const c = await verifyDownloaded(directory, inputs.expectedSHA256);
      await validateSource(extra, c.sourceCommit, c.version);
      const work = await mkdtemp(path.join(os.tmpdir(), 'motion-source-verify-'));
      try {
        await runFile('git', ['worktree', 'add', '--detach', work, c.sourceCommit], { cwd: extra });
        await writeJSON(path.join(directory, 'publication-source-scan.json'), await scanSource(work, final));
        await writeJSON(path.join(directory, 'publication-package-scan.json'), await scanPackage(path.join(directory, c.tgz), final));
      } finally { await runFile('git', ['worktree', 'remove', '--force', work], { cwd: extra }).catch(() => {}); }
    } else if (command === 'verify') await verifyDownloaded(directory, inputs.expectedSHA256, inputs.version);
    else if (command === 'npm') await publishNpm(directory, inputs);
    else if (command === 'archive') {
      for (const name of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) assert(process.env[name], 'Missing R2 credential: ' + name);
      await archiveRelease(directory, inputs, { endpoint: process.env.MOTION_R2_ENDPOINT, bucket: process.env.MOTION_R2_BUCKET, publicOrigin: process.env.MOTION_INSTALL_PUBLIC_ORIGIN });
    }
    else throw new Error('Unknown release command');
  }
}
