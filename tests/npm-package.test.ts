import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { checkReleaseLocks, packageNpm } from '../scripts/package-npm.mjs';
import { extractArchive, runFile, sha256 } from '../scripts/runtime-assets.mjs';
import { protocolClient } from '../scripts/smoke-test-package.mjs';
import { phase1Skills } from '../shared/workflow.ts';
import { mcpRegistry } from '../mcp.ts';

const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));

test('release packaging rejects floating npm versions, lock drift, unpinned native assets and a mismatched browser', async () => {
  const pkg = await json('package.json'), lock = await json('package-lock.json'), runtime = await json('scripts/runtime-lock.json');
  checkReleaseLocks(pkg, lock, runtime);
  const floating = structuredClone(pkg); floating.dependencies.gsap = '^' + pkg.dependencies.gsap;
  const floatingLock = structuredClone(lock); floatingLock.packages[''].dependencies = floating.dependencies;
  assert.throws(() => checkReleaseLocks(floating, floatingLock, runtime), /exact npm/);
  const drift = structuredClone(lock); drift.packages['node_modules/gsap'].version = '0.0.1';
  assert.throws(() => checkReleaseLocks(pkg, drift, runtime), /Resolved npm/);
  const unpinned = structuredClone(runtime); unpinned.targets['mac-arm64'].ffprobe.sha256 = '';
  assert.throws(() => checkReleaseLocks(pkg, lock, unpinned), /SHA256/);
  const browser = structuredClone(runtime); browser.chromium = '1.2.3.4';
  assert.throws(() => checkReleaseLocks(pkg, lock, browser), /Browser must match/);
});

test('test npm artifacts contain their application, locked manifest and no bundled native runtime', { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-npm-pack-'));
  const before = await readFile('package.json', 'utf8');
  const unapproved = ['docs/private-sentinel.md', 'scripts/private-sentinel.mjs', 'private-sentinel.ts'];
  for (const file of unapproved) await writeFile(file, 'must not ship');
  try {
    const version = '0.6.4-test.1', output = path.join(directory, 'build');
    const built = await packageNpm(output, version), release = await json(built.manifest);
    assert.equal(release.version, version); assert.equal(release.installer.version, version); assert.equal(release.format, 'npm');
    assert.equal(release.templateEnvironment, 'prod');
    assert.equal(release.mcp.profile, 'phase1'); assert.deepEqual(release.mcp.tools, mcpRegistry().tools.map(tool => tool.name));
    assert.deepEqual(release.skills, [...phase1Skills].sort());
    assert.equal(release.installer.sha256, await sha256(built.installer)); assert.equal(release.application.sha256, await sha256(built.application));
    assert.match(release.commit, /^[a-f0-9]{40}$/);
    const application = path.join(directory, 'app'), installer = path.join(directory, 'installer');
    await extractArchive(built.application, application); await extractArchive(built.installer, installer);
    assert.equal((await json(path.join(application, 'package.json'))).version, version);
    assert.equal((await json(path.join(application, 'shared/template-config.json'))).environment, 'prod');
    assert.equal((await json(path.join(application, '.codex-plugin/plugin.json'))).version, version);
    assert.equal((await json(path.join(application, 'package-lock.json'))).packages[''].version, version);
    assert.equal((await json(path.join(installer, 'package/package.json'))).version, version);
    assert.equal((await json(path.join(installer, 'package/package.json'))).private, false);
    const bundled = path.join(installer, 'package/payload');
    const embedded = await json(path.join(bundled, 'release-npm.json'));
    assert.equal(embedded.installer, undefined, 'The containing archive cannot include its own hash');
    assert.equal(embedded.version, version);
    assert.equal(await sha256(path.join(bundled, embedded.application.url)), release.application.sha256);
    const metadata = await json(path.join(installer, 'package/package.json'));
    assert.equal(metadata.publishConfig.tag, 'test'); assert.equal(metadata.publishConfig.access, 'public');
    assert.equal(metadata.bin.openmotion, 'scripts/npm-installer.mjs');
    await readFile(path.join(installer, 'package/LICENSE'));
    assert.deepEqual((await readdir(path.join(application, 'skills'))).sort(), [...phase1Skills].sort());
    assert.equal(await sha256(path.join(application, 'package-lock.json')), release.locks.npm);
    assert.equal(await sha256(path.join(application, 'scripts/runtime-lock.json')), release.locks.native);
    const entries = await runFile('tar', ['-tf', built.application]);
    assert(!/\/(node_modules|runtime)\//.test(entries));
    assert(entries.includes('skills/motion-production/SKILL.md'));
    for (const file of unapproved) assert(!entries.includes(file), 'Unapproved file shipped: ' + file);
    assert(!/\/(tests|src)\//.test(entries), 'Development sources and fixtures must not ship');
    assert(entries.includes('skills/motion-recreate/scripts/measure_frame.mjs'));
    assert(entries.includes('skills/motion-recreate/references/verify.md'));
    assert(entries.includes('studio/build/index.html'));
    assert(entries.includes('shared/editor-launch.pl'), 'macOS shared editor launcher must ship');
    assert(entries.includes('shared/workflow-entry.js'), 'Workflow discovery must ship with the five Skills');
    assert(!entries.split('\n').some(file => file.split('/').some(part => part.startsWith('._'))), 'Do not distribute macOS file metadata');
    assert(entries.includes('template-library/NOTICE.md'));
    assert(!entries.includes('studio/build/index.html.map'));
    await assert.rejects(packageNpm(output, version), /immutable/);
    await assert.rejects(packageNpm(path.join(directory, 'invalid'), 'latest'), /MAJOR.MINOR.PATCH/);
    assert.equal(await readFile('package.json', 'utf8'), before, 'Packaging must not bump the checkout');
  } finally {
    for (const file of unapproved) await rm(file, { force: true });
    await rm(directory, { recursive: true, force: true });
  }
});

test('DEV npm packages carry their catalog environment without changing the checkout', { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-npm-dev-'));
  try {
    const before = await readFile('shared/template-config.json', 'utf8');
    const built = await packageNpm(path.join(directory, 'build'), '0.6.4-test.2', 'dev');
    assert.equal((await json(built.manifest)).templateEnvironment, 'dev');
    const unpacked = path.join(directory, 'npm'); await extractArchive(built.installer, unpacked);
    assert.equal((await json(path.join(unpacked, 'package/package.json'))).private, true);
    assert.equal((await json(built.manifest)).installer.version, (await json(built.manifest)).version);
    assert.match(built.application, /-dev\.tar\.gz$/);
    const application = path.join(directory, 'app');
    await extractArchive(built.application, application);
    assert.equal((await json(path.join(application, 'shared/template-config.json'))).environment, 'dev');
    assert.equal(await readFile('shared/template-config.json', 'utf8'), before);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('stable artifacts stage publication instead of replacing latest and retain source publish guards', { timeout: 60_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-npm-stable-'));
  try {
    const built = await packageNpm(path.join(directory, 'build'), '0.6.4');
    await extractArchive(built.installer, path.join(directory, 'npm'));
    const metadata = await json(path.join(directory, 'npm/package/package.json'));
    assert.equal(metadata.version, '0.6.4'); assert.equal(metadata.private, false); assert.equal(metadata.publishConfig.tag, 'stage');
    assert.equal((await json('package.json')).private, true);
    assert.equal((await json('packages/npm/package.json')).private, true);
    const local = await packageNpm(path.join(directory, 'local'));
    await extractArchive(local.installer, path.join(directory, 'local-npm'));
    const localPkg = await json(path.join(directory, 'local-npm/package/package.json'));
    assert.equal(localPkg.private, true); assert.match(localPkg.version, /-local\.1$/);
    assert.equal((await json(local.manifest)).version, localPkg.version);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('the actual dispatch validation permits unpublished npm and backup ZIP, and rejects npm publication', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const step = workflow.split('      - name: Validate manual package selection\n')[1].split('      - name:')[0];
  const script = step.split('        run: |\n')[1].replace(/^ {10}/gm, '');
  for (const [format, publish] of [['npm', 'false'], ['full', 'false']]) await runFile('bash', ['-c', script], { env: { ...process.env, PACKAGE_FORMAT: format, PUBLISH: publish } });
  await assert.rejects(runFile('bash', ['-c', script], { env: { ...process.env, PACKAGE_FORMAT: 'npm', PUBLISH: 'true' } }), /publishing is disabled/);
  await assert.rejects(runFile('bash', ['-c', script], { env: { ...process.env, PACKAGE_FORMAT: 'full', PUBLISH: 'true' } }), /publishing is disabled/);
  await assert.rejects(runFile('bash', ['-c', script], { env: { ...process.env, PACKAGE_FORMAT: 'unknown', PUBLISH: 'false' } }), /Unknown package/);
});

test('the shared native acceptance client propagates a child failure instead of reporting a successful check', async () => {
  const client = protocolClient({ command: process.execPath, args: ['-e', 'console.error("fixture startup failed"); process.exit(1)'] }, process.env);
  try { await assert.rejects(client.rpc('initialize', {}), /MCP exited 1.*fixture startup failed/); }
  finally { client.child.kill('SIGTERM'); }
});

test('manual CI passes the selected template environment to both package formats', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-dispatch-'));
  try {
    const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
    const step = workflow.split('      - name: Build immutable standalone artifacts\n')[1].split('      - name:')[0];
    const script = step.split('        run: |\n')[1].replace(/^ {10}/gm, '');
    const calls = path.join(directory, 'calls.txt');
    await writeFile(path.join(directory, 'node'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$MOTION_PACKAGE_CALLS"\nif [ "$2" = version ]; then echo 0.6.4-test.42.1; fi\n', { mode: 0o755 });
    for (const format of ['npm', 'full']) for (const environment of ['prod', 'dev']) {
      await writeFile(calls, '');
      await runFile('bash', ['-c', script], { env: { ...process.env,
        PATH: directory + path.delimiter + process.env.PATH, MOTION_PACKAGE_CALLS: calls,
        PACKAGE_FORMAT: format, TEMPLATE_ENVIRONMENT: environment, GITHUB_RUN_NUMBER: '42', GITHUB_RUN_ATTEMPT: '1',
      } });
      const commands = (await readFile(calls, 'utf8')).trim().split('\n');
      assert.deepEqual(commands, ['scripts/test-package.mjs version 42 1', ...(format === 'npm'
        ? [`scripts/package-npm.mjs dist/0.6.4-test.42.1 0.6.4-test.42.1 --template-env=${environment}`]
        : ['mac-arm64', 'win-x64'].flatMap(target => [
          `scripts/test-package.mjs prepare ${target}`,
          `scripts/test-package.mjs build ${target} 0.6.4-test.42.1 --template-env=${environment}`,
        ]))]);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
