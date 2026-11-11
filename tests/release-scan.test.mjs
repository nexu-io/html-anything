import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { archivePaths, privacyFindings, scanSource, scanPackage, unpackChecked } from '../.github/scripts/motion-scan.mjs';
import { candidateFixture } from './release-fixture.mjs';
import { runFile, sha256, writeJSON } from '../scripts/runtime-assets.mjs';

test('privacy rules reject internal URLs, employee paths and private files without printing their values', () => {
  for (const name of ['.env', 'nested/.env.production', '.npmrc', 'outputs/log.json', 'research/info.md', 'server.key']) assert(privacyFindings(name, '').length);
  assert.equal(privacyFindings('.env.example', 'DUMMY=example').length, 0);
  assert(privacyFindings('.env.example', '', 'package').length);
  const url = 'https://' + 'workspace.' + 'feishu.cn/wiki/private';
  const text = '/' + 'Users/' + 'employee/private/file';
  assert.deepEqual(privacyFindings('README.md', url).map(x => x.rule), ['internal-link']);
  assert.deepEqual(privacyFindings('README.md', text).map(x => x.rule), ['personal-path']);
  assert(!JSON.stringify(privacyFindings('README.md', url)).includes('private'));
  for (const name of ['../escape', '/absolute', 'C:/drive', 'safe/../../outside', 'bad\\file', 'bad\tname']) assert.throws(() => archivePaths(name));
});

async function scanner(t, findings = []) {
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-scanner-test-')); t.after(() => rm(work, { recursive: true, force: true }));
  const binary = path.join(work, 'scanner');
  const script = `#!/usr/bin/env node\nimport{writeFileSync}from'node:fs'; const args=process.argv.slice(2); if(!args.includes('--redact')||!args.includes('--ignore-gitleaks-allow'))process.exit(2); writeFileSync(args[args.indexOf('--report-path')+1],JSON.stringify(${JSON.stringify(findings)}));process.exit(${findings.length ? 1 : 0});\n`;
  await writeFile(binary, script); await chmod(binary, 0o755); return { work, binary };
}

test('tracked source is scanned without ignore-file bypasses; secret errors expose only rule/path/line', async t => {
  const { work, binary } = await scanner(t, [{ File: 'source.txt', RuleID: 'fixture-secret', StartLine: 1, Secret: 'never-print-this' }]);
  const source = path.join(work, 'source'); await mkdir(source);
  await runFile('git', ['init', '-q', source]); await writeFile(path.join(source, 'source.txt'), 'synthetic fixture');
  await runFile('git', ['add', '.'], { cwd: source });
  await assert.rejects(scanSource(source, binary), error => error.message.includes('fixture-secret') && !error.message.includes('never-print-this'));
  await symlink('source.txt', path.join(source, 'link')); await runFile('git', ['add', 'link'], { cwd: source });
  await assert.rejects(scanSource(source, binary), /Tracked links/);
});

test('the scanner opens the nested application, rejects hidden private content and rejects linked archive entries', async t => {
  const f = await candidateFixture(t), { binary } = await scanner(t);
  assert.equal((await scanPackage(path.join(f.directory, f.candidate.tgz), binary)).status, 'passed');
  const templates = path.join(f.app, 'shared/template-config.json');
  await writeJSON(templates, { environment: 'prod' });
  const appArchive = path.join(f.pkg, 'payload', f.manifest.application.url.slice(2));
  const tgz = path.join(f.work, 'hidden.tgz');
  const repack = async () => {
    await runFile('tar', ['-czf', appArchive, '-C', f.app, '.']);
    await writeJSON(path.join(f.pkg, 'payload/release-npm.json'), { ...f.manifest, application: { ...f.manifest.application, sha256: await sha256(appArchive) } });
    await runFile('tar', ['-czf', tgz, '-C', f.work, 'package']);
  };
  await repack();
  await assert.rejects(scanPackage(tgz, binary), /template defaults differ/);
  await writeJSON(templates, { environment: 'dev' });
  await writeFile(path.join(f.app, '.env'), 'EXAMPLE=not-a-real-secret');
  await repack();
  await assert.rejects(scanPackage(tgz, binary), /environment-file/);
  await symlink('package.json', path.join(f.app, 'linked')); const linked = path.join(f.work, 'linked.tar.gz');
  await runFile('tar', ['-czf', linked, '-C', f.app, '.']);
  await assert.rejects(unpackChecked(linked, path.join(f.work, 'extracted')), /links and special/);
});

test('bundled dependencies must match the production lock and still pass private-content scanning', async t => {
  const f = await candidateFixture(t), { binary } = await scanner(t);
  const dependency = path.join(f.app, 'node_modules/fixture-dependency');
  await mkdir(dependency, { recursive: true });
  await writeJSON(path.join(dependency, 'package.json'), { version: '1.0.0' });
  const lock = { packages: { 'node_modules/fixture-dependency': { version: '1.0.0' } } };
  await writeJSON(path.join(f.app, 'package-lock.json'), lock);
  await writeJSON(path.join(f.app, 'scripts/runtime-lock.json'), { targets: f.manifest.runtime.targets });
  const appArchive = path.join(f.pkg, 'payload', f.manifest.application.url.slice(2)), tgz = path.join(f.work, 'bundled.tgz');
  const repack = async () => {
    await runFile('tar', ['-czf', appArchive, '-C', f.app, '.']);
    await writeJSON(path.join(f.pkg, 'payload/release-npm.json'), { ...f.manifest,
      application: { ...f.manifest.application, sha256: await sha256(appArchive), dependencyTargets: ['darwin/arm64'] },
      locks: { npm: await sha256(path.join(f.app, 'package-lock.json')), native: await sha256(path.join(f.app, 'scripts/runtime-lock.json')) } });
    await runFile('tar', ['-czf', tgz, '-C', f.work, 'package']);
  };
  await repack();
  const result = await scanPackage(tgz, binary);
  assert(result.reports.some(r => r.kind === 'dependencies'));
  await writeJSON(path.join(dependency, 'package.json'), { version: '2.0.0' }); await repack();
  await assert.rejects(scanPackage(tgz, binary), /production lock/);
  await writeJSON(path.join(dependency, 'package.json'), { version: '1.0.0' });
  lock.packages['node_modules/fixture-dependency'].dev = true;
  await writeJSON(path.join(f.app, 'package-lock.json'), lock); await repack();
  await assert.rejects(scanPackage(tgz, binary), /production lock/);
  lock.packages['node_modules/fixture-dependency'].dev = false;
  await writeJSON(path.join(f.app, 'package-lock.json'), lock);
  await writeFile(path.join(dependency, '.npmrc'), 'registry=https://example.invalid'); await repack();
  await assert.rejects(scanPackage(tgz, binary), /private-file/);
});
