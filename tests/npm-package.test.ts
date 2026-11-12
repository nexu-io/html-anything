import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { checkReleaseLocks, packageNpm } from '../scripts/package-npm.mjs';
import { extractArchive, runFile, sha256 } from '../scripts/runtime-assets.mjs';
import { protocolClient } from '../scripts/smoke-test-package.mjs';
import { packagedSkills } from '../shared/workflow.ts';
import { mcpRegistry } from '../mcp.ts';

const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
async function verifyTrackingPolicy(application: string, mode: 'test' | 'stable') {
  await symlink(path.resolve('node_modules'), path.join(application, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const result = JSON.parse(await runFile(process.execPath, ['--experimental-strip-types', path.resolve('tests/tracking-package.ts'), application, mode]));
  assert.equal(result.passed, true); assert.equal(result.external_requests, 0);
}

async function verifyBundledTemplates(application: string) {
  const { copyTemplate, templates } = await import(pathToFileURL(path.join(application, 'template-library.ts')).href);
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-bundled-templates-'));
  try {
    for (const template of templates) {
      const project = path.join(directory, template.id);
      await copyTemplate(template.id, project, application);
      // Match MCP preview preflight before Studio can rewrite the copied source.
      const checked = JSON.parse(await runFile(process.execPath, [path.join(application, 'scripts/lint-project.mjs'), application, project]));
      assert.equal(checked.errorCount, 0, `${template.id}: ${JSON.stringify(checked.findings)}`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('shared Agent instructions keep the release controls synchronized', async () => {
  const section = async file => {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    return text.split('## Candidate and publication controls\n')[1].split('\n## ')[0].trim();
  };
  const shared = await section('AGENTS.md');
  assert(shared.includes('test` (default, DEV templates)') && shared.includes('stable` (prod templates)'));
  assert(shared.includes('Test publishes under `candidate`') && shared.includes('non-blocking Mac/Windows cold installs'));
  assert(shared.includes('Stable publishes publicly under `stage`') && shared.includes('requires both exact prod cold installs to pass'));
  assert.equal(await section('CLAUDE.md'), shared, 'CLAUDE.md must mirror the AGENTS.md release controls');
});

test('release packaging rejects floating npm versions, lock drift, unpinned native assets and a mismatched browser', async () => {
  const pkg = await json('package.json'), lock = await json('package-lock.json'), runtime = await json('scripts/runtime-lock.json');
  checkReleaseLocks(pkg, lock, runtime);
  assert.equal(runtime.targets['mac-arm64'].minimumOS, undefined);
  const missingCPU = structuredClone(runtime); missingCPU.targets['mac-arm64'].arch = '';
  assert.throws(() => checkReleaseLocks(pkg, lock, missingCPU), /OS\/CPU/);
  const missingWindowsMinimum = structuredClone(runtime); missingWindowsMinimum.targets['win-x64'].minimumOS = '';
  assert.throws(() => checkReleaseLocks(pkg, lock, missingWindowsMinimum), /minimum system version/);
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
    const version = '0.6.4-test.42812345678.1', output = path.join(directory, 'build');
    const built = await packageNpm(output, version), release = await json(built.manifest);
    assert.equal(release.version, version); assert.equal(release.installer.version, version); assert.equal(release.format, 'npm');
    assert.equal(release.templateEnvironment, 'dev');
    assert.equal(release.runtime.targets['mac-arm64'].minimumOS, undefined);
    assert.equal(release.runtime.targets['win-x64'].minimumOS, 'Windows 11');
    assert.equal(release.mcp.profile, 'phase1'); assert.deepEqual(release.mcp.tools, mcpRegistry().tools.map(tool => tool.name));
    assert.deepEqual(release.skills, [...packagedSkills].sort());
    assert.equal(release.installer.sha256, await sha256(built.installer)); assert.equal(release.application.sha256, await sha256(built.application));
    assert.match(release.commit, /^[a-f0-9]{40}$/);
    const application = path.join(directory, 'app'), installer = path.join(directory, 'installer');
    await extractArchive(built.application, application); await extractArchive(built.installer, installer);
    const readme = await readFile(path.join(installer, 'package/README.md'), 'utf8');
    assert(readme.includes("Reverse engineering for any video"));
    assert(readme.includes(`https://raw.githubusercontent.com/nexu-io/openmotion/${release.commit}/docs/readme/brand-hero.jpg`));
    assert(readme.includes(`src="https://raw.githubusercontent.com/nexu-io/openmotion/${release.commit}/docs/readme/openmotion-logo.svg"`));
    assert(readme.includes(`https://github.com/nexu-io/openmotion/blob/${release.commit}/docs/motion-md.md`));
    assert(readme.includes('](#choose-agent)'));
    assert(readme.includes('href="https://open-design.ai/motion/'));
    assert(readme.includes(`srcset="https://raw.githubusercontent.com/nexu-io/openmotion/${release.commit}/docs/readme/brand-hero.mobile.jpg"`));
    assert(readme.includes(`href="https://github.com/nexu-io/openmotion/blob/${release.commit}/docs/readme/media/presenter-caption-remake.mp4"`));
    assert(!readme.includes('](docs/') && !readme.includes('](template-library/'));
    assert(!readme.startsWith('# Motion application npm package'));
    const embeddedReadme = await readFile(path.join(application, 'README.md'), 'utf8');
    assert(embeddedReadme.includes('](docs/motion-md.md)'), 'Installed documentation keeps local links to shipped guides');
    assert(embeddedReadme.includes(`srcset="https://raw.githubusercontent.com/nexu-io/openmotion/${release.commit}/docs/readme/brand-hero.mobile.jpg"`));
    await assert.rejects(readdir(path.join(application, 'docs/readme/media')), { code: 'ENOENT' });
    await assert.rejects(readFile(path.join(application, 'scripts/install-library-skill.mjs')), { code: 'ENOENT' });
    assert.equal((await json(path.join(application, 'package.json'))).version, version);
    await verifyTrackingPolicy(application, 'test');
    await verifyBundledTemplates(application);
    assert.equal((await json(path.join(application, 'shared/template-config.json'))).environment, 'dev');
    assert.equal((await json(path.join(application, '.codex-plugin/plugin.json'))).version, version);
    assert.equal((await json(path.join(application, '.codex-plugin/plugin.json'))).description,
      (await json('.codex-plugin/plugin.json')).description);
    const pluginInterface = (await json(path.join(application, '.codex-plugin/plugin.json'))).interface;
    for (const field of ['logo', 'logoDark', 'composerIcon', 'composerIconDark']) {
      const filename = pluginInterface[field];
      assert.equal(await readFile(path.join(application, filename), 'utf8'), await readFile(filename, 'utf8'));
    }
    assert.equal((await json(path.join(application, 'package-lock.json'))).packages[''].version, version);
    assert.equal((await json(path.join(installer, 'package/package.json'))).version, version);
    assert.equal((await json(path.join(installer, 'package/package.json'))).private, false);
    const bundled = path.join(installer, 'package/payload');
    const embedded = await json(path.join(bundled, 'release-npm.json'));
    assert.equal(embedded.installer, undefined, 'The containing archive cannot include its own hash');
    assert.equal(embedded.version, version);
    assert.equal(await sha256(path.join(bundled, embedded.application.url)), release.application.sha256);
    const metadata = await json(path.join(installer, 'package/package.json'));
    assert.equal(metadata.name, (await json('packages/npm/package.json')).name);
    assert.equal(metadata.publishConfig.tag, 'candidate'); assert.equal(metadata.publishConfig.access, 'public');
    assert.equal(metadata.bin.openmotion, 'scripts/npm-installer.mjs');
    const cli = path.join(installer, 'package', metadata.bin.openmotion);
    assert.equal((await runFile(process.execPath, [cli, '--version'])).trim(), version);
    const help = await runFile(process.execPath, [cli, 'setup', '--help']);
    for (const host of ['codex', 'claude', 'deepseek', 'workbuddy']) assert(help.includes(host), host);
    await readFile(path.join(installer, 'package/LICENSE'));
    assert.deepEqual((await readdir(path.join(application, 'skills'))).sort(), [...packagedSkills].sort());
    assert.match(await readFile(path.join(application, 'skills/motion-production/agents/openai.yaml'), 'utf8'), /allow_implicit_invocation: false/);
    assert.match(await readFile(path.join(application, 'skills/motion-production/SKILL.md'), 'utf8'), /disable-model-invocation: true/);
    assert.match(await readFile(path.join(application, 'skills/openmotion-production/agents/openai.yaml'), 'utf8'), /OpenMotion Production/);
    for (const document of ['skills/openmotion-director/SKILL.md', 'skills/openmotion-production/references/context.md', 'skills/openmotion-production/references/native.md', 'skills/openmotion-production/references/verification.md', 'skills/openmotion-recreate/SKILL.md', 'phase1.ts', 'shared/phase1-tools.ts', 'shared/mcp-profiles.json']) {
      assert.equal(await readFile(path.join(application, document), 'utf8'), await readFile(document, 'utf8'));
    }
    assert.equal(await sha256(path.join(application, 'package-lock.json')), release.locks.npm);
    assert.equal(await sha256(path.join(application, 'scripts/runtime-lock.json')), release.locks.native);
    const entries = await runFile('tar', ['-tf', built.application]);
    assert(!/\/(node_modules|runtime)\//.test(entries));
    assert(entries.includes('skills/openmotion-production/SKILL.md'));
    for (const file of unapproved) assert(!entries.includes(file), 'Unapproved file shipped: ' + file);
    assert(!/\/(tests|src)\//.test(entries), 'Development sources and fixtures must not ship');
    assert(entries.includes('skills/openmotion-recreate/scripts/measure_frame.mjs'));
    assert(entries.includes('skills/openmotion-recreate/references/verify.md'));
    assert(entries.includes('studio/build/index.html'));
    assert(entries.includes('shared/editor-launch.pl'), 'macOS shared editor launcher must ship');
    for (const script of ['lint-project.mjs', 'npm-installer.mjs', 'npm-hosts.mjs', 'check-installed-mcp.mjs', 'diagnostics.mjs', 'zip.mjs', 'diagnostic-redaction.mjs', 'install-onboarding.mjs', 'onboarding-catalog.ts']) assert(entries.includes('scripts/' + script), 'Runtime diagnostic and lint entry must ship: ' + script);
    await readFile(path.join(installer, 'package/scripts/check-installed-mcp.mjs'));
    const diagnosticFile = path.join(directory, 'packaged-diagnostics.zip');
    await runFile(process.execPath, [cli, 'diagnostics', '--home', path.join(directory, 'not-installed'), '--output', diagnosticFile]);
    assert.match(await runFile('unzip', ['-p', diagnosticFile, 'metadata.json']), new RegExp(version.replaceAll('.', '\\.')));
    assert.equal((await json(path.join(application, 'shared/build-info.json'))).commit, release.commit);
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
    assert.equal((await json(path.join(unpacked, 'package/package.json'))).private, false);
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
    assert.equal((await json(built.manifest)).templateEnvironment, 'prod');
    const application = path.join(directory, 'app'); await extractArchive(built.application, application);
    const diagnosticFile = path.join(directory, 'stable-diagnostics.zip');
    await runFile(process.execPath, [path.join(application, 'scripts/diagnostics.mjs'), '--data-dir', path.join(directory, 'missing-data'), '--output', diagnosticFile]);
    assert.match(await runFile('unzip', ['-p', diagnosticFile, 'metadata.json']), /"version": "0\.6\.4"/);
    await verifyTrackingPolicy(application, 'stable');
    await verifyBundledTemplates(application);
    assert.equal(metadata.version, '0.6.4'); assert.equal(metadata.private, false); assert.equal(metadata.publishConfig.tag, 'stage');
    assert.equal((await json('package.json')).private, true);
    assert.equal((await json('packages/npm/package.json')).private, true);
    for (const [version, environment] of [['0.6.4-test.3', 'prod'], ['0.6.4', 'dev']]) {
      const alternate = await packageNpm(path.join(directory, version + '-' + environment), version, environment);
      const unpacked = path.join(directory, version + '-' + environment + '-npm');
      await extractArchive(alternate.installer, unpacked);
      assert.equal((await json(path.join(unpacked, 'package/package.json'))).private, true, 'Non-channel environment builds stay private');
    }
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
