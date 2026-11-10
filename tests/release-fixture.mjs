import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../scripts/runtime-assets.mjs';
import { sealCandidate, repository, candidateWorkflow, approvalReceipt, publicationEnvironment } from '../.github/scripts/motion-release.mjs';

export async function candidateFixture(t) {
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-release-test-'));
  t.after(() => rm(work, { recursive: true, force: true }));
  const root = fileURLToPath(new URL('../', import.meta.url)), build = path.join(work, 'build'), directory = path.join(work, 'candidate');
  const commit = (await runFile('git', ['rev-parse', 'HEAD'], { cwd: root })).trim(), version = '0.6.4-test.99';
  const app = path.join(work, 'app'), pkg = path.join(work, 'package');
  await mkdir(path.join(app, 'scripts'), { recursive: true }); await mkdir(path.join(pkg, 'payload'), { recursive: true }); await mkdir(build);
  await writeJSON(path.join(app, 'package.json'), { version }); await writeJSON(path.join(app, 'package-lock.json'), {});
  await writeJSON(path.join(app, 'scripts/runtime-lock.json'), {});
  const application = path.join(pkg, 'payload', `openmotion-application-${version}.tar.gz`);
  await runFile('tar', ['-czf', application, '-C', app, '.']);
  const manifest = { schemaVersion: 1, version, format: 'npm', templateEnvironment: 'prod', commit,
    application: { url: './' + path.basename(application), sha256: await sha256(application) },
    locks: { npm: await sha256(path.join(app, 'package-lock.json')), native: await sha256(path.join(app, 'scripts/runtime-lock.json')) },
    runtime: { targets: { mac: { platform: 'darwin', arch: 'arm64', minimumOS: '26.0' } } } };
  await writeJSON(path.join(pkg, 'payload/release-npm.json'), manifest);
  await writeJSON(path.join(pkg, 'package.json'), { name: '@openmotion/app', version, private: false, bin: { openmotion: 'scripts/npm-installer.mjs' } });
  const tgz = path.join(build, `openmotion-app-${version}.tgz`);
  await runFile('tar', ['-czf', tgz, '-C', work, 'package']);
  await writeJSON(path.join(build, 'release-npm.json'), { ...manifest, installer: { url: './' + path.basename(tgz), sha256: await sha256(tgz) } });
  for (const name of ['source-scan.json', 'package-scan.json']) await writeJSON(path.join(build, name), { status: 'passed' });
  const env = { MOTION_SOURCE_SHA: commit, MOTION_VERSION: version, GITHUB_SHA: 'b'.repeat(40),
    GITHUB_WORKFLOW_REF: `${repository}/${candidateWorkflow}@refs/heads/main`, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1' };
  const candidate = await sealCandidate(build, directory, root, env);
  const provenance = { head_sha: env.GITHUB_SHA, runId: 123, attempt: 1 };
  await writeJSON(path.join(directory, 'provenance.json'), provenance);
  const inputs = { action: 'publish-test', expectedSHA256: candidate.tgzSHA256, candidateRun: '123' };
  const publicationEnv = { GITHUB_RUN_ID: '800', GITHUB_SHA: env.GITHUB_SHA, GITHUB_WORKFLOW_REF: env.GITHUB_WORKFLOW_REF };
  const reviews = [{ state: 'approved', comment: 'PASS', environments: [{ name: publicationEnvironment }], user: { login: 'reviewer' } }];
  const approval = approvalReceipt(candidate, reviews, { id: 800, actor: { login: 'operator' } }, inputs.action);
  await writeJSON(path.join(directory, 'approval.json'), approval);
  for (const platform of ['darwin-arm64', 'win32-x64']) await writeJSON(path.join(directory, `registry-${platform}.json`), {
    status: 'passed', platform, version, sourceCommit: commit, tgzSHA256: candidate.tgzSHA256,
    registryColdInstall: 'passed', nativePreparation: 'passed', repeatSetup: 'passed', resources: 'passed', mcpTools: 11, skills: 5,
  });
  await writeJSON(path.join(directory, 'npm-publication.json'), { tgzSHA256: candidate.tgzSHA256, previousLatest: '0.5.0' });
  return { work, root, build, directory, candidate, inputs, provenance, app, pkg, manifest, approval, env: publicationEnv };
}
