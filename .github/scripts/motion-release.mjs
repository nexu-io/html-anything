import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';
import { checkReleaseVersion } from '../../scripts/release-version.mjs';
import { generateInstallGuide } from '../../scripts/install-guide.mjs';
import { publishGuide, storagePlan } from './publish-install-guide.mjs';
import { scanPackage, scanSource } from './motion-scan.mjs';

export const repository = 'nexu-io/html-anything';
export const candidateWorkflow = '.github/workflows/motion-candidate.yml';
const exec = promisify(execFile), hashPattern = /^[a-f0-9]{64}$/;
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const integrity = bytes => 'sha512-' + createHash('sha512').update(bytes).digest('base64');

export function releaseInputs(env = process.env) {
  assert.equal(env.GITHUB_REPOSITORY, repository, 'Wrong repository');
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Manual invocation required');
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Run the trusted workflow registered on main');
  assert(['publish-test', 'archive-only'].includes(env.MOTION_RELEASE_ACTION), 'Unknown release action');
  assert.equal(env.MOTION_APPROVED, 'true', 'Explicit release approval is required');
  assert.match(env.MOTION_EXPECTED_SHA256 || '', hashPattern, 'Require the accepted tgz SHA256');
  assert.match(env.MOTION_ACCEPTANCE_SHA256 || '', hashPattern, 'Require the digest of the internal acceptance record');
  assert(/^[1-9]\d*$/.test(env.MOTION_CANDIDATE_RUN || ''), 'Require a candidate workflow run ID');
  return { action: env.MOTION_RELEASE_ACTION, expectedSHA256: env.MOTION_EXPECTED_SHA256,
    acceptanceSHA256: env.MOTION_ACCEPTANCE_SHA256, candidateRun: env.MOTION_CANDIDATE_RUN };
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
  const names = [filename, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json'];
  const files = Object.fromEntries(await Promise.all(names.map(async name => [name, await sha256(path.join(output, name))])));
  const candidate = { schemaVersion: 1, kind: 'motion-candidate', packageName: guide.packageName, version: guide.version,
    sourceCommit: guide.commit, tgz: filename, tgzSHA256: files[filename], integrity: integrity(await readFile(path.join(output, filename))), files,
    workflow: { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: env.GITHUB_SHA,
      runId: Number(env.GITHUB_RUN_ID), attempt: Number(env.GITHUB_RUN_ATTEMPT) },
    createdAt: new Date().toISOString(), acceptance: 'not-performed' };
  await writeJSON(path.join(output, 'candidate.json'), candidate);
  return candidate;
}

export function validateRun(run, artifact) {
  assert.equal(run.event, 'workflow_dispatch'); assert.equal(run.head_branch, 'main');
  assert.equal(run.head_repository?.full_name, repository); assert.equal(run.status, 'completed'); assert.equal(run.conclusion, 'success');
  assert.equal(run.path.split('@')[0], candidateWorkflow, 'Candidate must come from the registered workflow');
  assert.equal(artifact.name, `motion-candidate-${run.id}-${run.run_attempt}`);
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

export async function verifyCandidate(directory, expectedSHA256, run) {
  const candidate = await json(path.join(directory, 'candidate.json'));
  assert.equal(candidate.schemaVersion, 1); assert.equal(candidate.kind, 'motion-candidate'); assert.equal(candidate.packageName, '@openmotion/app');
  checkReleaseVersion(candidate.version); assert(candidate.version.includes('-test.'));
  assert.equal(candidate.tgz, `openmotion-app-${candidate.version}.tgz`); assert.equal(candidate.tgzSHA256, expectedSHA256);
  assert.match(expectedSHA256, hashPattern); assert.match(candidate.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(candidate.workflow, { repository, path: candidateWorkflow, ref: 'refs/heads/main', sha: run.head_sha, runId: run.id, attempt: run.run_attempt });
  const names = [candidate.tgz, 'release-npm.json', 'source-scan.json', 'package-scan.json', 'install.md', 'install-record.json'];
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

export async function downloadCandidate(runId, directory, expectedSHA256, fetcher = fetch) {
  assert(/^[1-9]\d*$/.test(runId));
  const run = await github(`/actions/runs/${runId}`, fetcher);
  const { artifacts } = await github(`/actions/runs/${runId}/artifacts?per_page=100`, fetcher);
  const matches = artifacts.filter(a => a.name === `motion-candidate-${run.id}-${run.run_attempt}`); assert.equal(matches.length, 1, 'Candidate artifact missing or ambiguous');
  const artifact = matches[0]; validateRun(run, artifact);
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
    assert(entries.length === 7 && new Set(entries).size === 7, 'Unexpected candidate artifact files');
    assert(entries.every(name => /^[a-zA-Z0-9._-]+$/.test(name) && name.length < 160), 'Unsafe candidate artifact entry');
    await mkdir(directory, { recursive: true });
    for (const name of entries) {
      const { stdout } = await exec('unzip', ['-p', archive, name], { encoding: 'buffer', maxBuffer: 150 * 1024 * 1024 });
      await writeFile(path.join(directory, name), stdout);
    }
    const candidate = await verifyCandidate(directory, expectedSHA256, run);
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

export async function publishNpm(directory, inputs, { fetcher = fetch, run = runFile } = {}) {
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256);
  const before = await registryPackage(candidate, fetcher);
  if (inputs.action === 'archive-only') assert(before.version, 'Archive-only requires an existing identical npm version');
  const record = { schemaVersion: 1, version: candidate.version, tgzSHA256: candidate.tgzSHA256, action: inputs.action,
    previousLatest: before.tags.latest ?? null, status: before.version ? 'already-published-identical' : 'publish-started' };
  await writeJSON(path.join(directory, 'npm-publication.json'), record);
  if (!before.version) {
    await run('npm', ['publish', path.join(directory, candidate.tgz), '--access', 'public', '--tag', 'test', '--ignore-scripts', '--registry=https://registry.npmjs.org/']);
    record.status = 'published-awaiting-registry'; await writeJSON(path.join(directory, 'npm-publication.json'), record);
  }
  return record;
}

export async function archiveRelease(directory, inputs, config, { run = runFile, fetcher = fetch, env = process.env } = {}) {
  await writeJSON(path.join(directory, 'release-attempt.json'), { action: inputs.action, tgzSHA256: inputs.expectedSHA256, stage: 'verifying-release', runId: env.GITHUB_RUN_ID });
  const candidate = await verifyDownloaded(directory, inputs.expectedSHA256);
  const platforms = await platformReports(directory, candidate);
  const record = await json(path.join(directory, 'install-record.json')), plan = storagePlan(record, config);
  assert.equal(candidate.tgzSHA256, inputs.expectedSHA256);
  const registry = await registryPackage(candidate, fetcher); assert(registry.version, 'Exact npm version is not public');
  const npm = await json(path.join(directory, 'npm-publication.json'));
  assert.equal(npm.tgzSHA256, candidate.tgzSHA256);
  assert.equal(registry.tags.latest ?? null, npm.previousLatest, 'npm latest changed unexpectedly; stop and investigate before promoting a guide');
  if (inputs.action === 'publish-test') assert.equal(registry.tags.test, candidate.version, 'The test channel changed; use archive-only or a separately approved channel recovery');
  const prefix = path.posix.dirname(plan.versionKey), work = await mkdtemp(path.join(os.tmpdir(), 'motion-snapshot-'));
  const aws = async (operation, rest) => JSON.parse(await run('aws', ['--endpoint-url', plan.endpoint, '--region', 'auto', 's3api', operation, '--bucket', plan.bucket, ...rest]) || '{}');
  try {
    const get = async key => {
      const file = path.join(work, 'object');
      try { await aws('get-object', ['--key', key, file]); return await readFile(file); }
      catch (error) { if (/NoSuchKey|\(404\)|Not Found/.test(error.message)) return null; throw error; }
    };
    const prior = await get(`${prefix}/release-record.json`);
    let release = { schemaVersion: 1, packageName: candidate.packageName, version: candidate.version, sourceCommit: candidate.sourceCommit,
      tgzSHA256: candidate.tgzSHA256, integrity: candidate.integrity, candidateRun: candidate.workflow,
      acceptanceRecordSHA256: inputs.acceptanceSHA256, approvedBy: env.GITHUB_ACTOR, publicationRun: env.GITHUB_RUN_ID,
      platformVerification: platforms, status: 'registry-verified', publishedAt: new Date().toISOString() };
    if (prior) {
      const existing = JSON.parse(prior);
      for (const key of ['packageName', 'version', 'sourceCommit', 'tgzSHA256', 'integrity', 'acceptanceRecordSHA256']) assert.equal(existing[key], release[key], 'Existing release record differs: ' + key);
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
    await publishGuide(directory, config, { run, fetcher, promote: inputs.action === 'publish-test' });
    await writeJSON(path.join(directory, 'release-attempt.json'), { action: inputs.action, version: candidate.version, stage: inputs.action === 'publish-test' ? 'test-entry-verified' : 'archive-only-verified', runId: env.GITHUB_RUN_ID });
    return release;
  } finally { await rm(work, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, directory, extra, final] = process.argv.slice(2);
  if (command === 'source') await validateSource(directory, process.env.MOTION_SOURCE_SHA, process.env.MOTION_VERSION);
  else if (command === 'seal') await sealCandidate(directory, extra, final);
  else {
    const inputs = releaseInputs();
    if (command === 'download') await downloadCandidate(inputs.candidateRun, directory, inputs.expectedSHA256);
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
