import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile, chmod } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { download, runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';
import { releaseTemplateEnvironment } from '../../scripts/release-version.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
export const scannerVersion = '8.30.1';
const scannerHashes = {
  'linux_x64': '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb',
  'darwin_arm64': 'b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5',
};

export async function installScanner(directory) {
  const target = `${process.platform}_${process.arch}`;
  assert(scannerHashes[target], 'Use the supported Linux x64 or Mac arm64 scanner runner');
  await mkdir(directory, { recursive: true });
  const archive = path.join(directory, 'gitleaks.tar.gz');
  await download({ url: `https://github.com/gitleaks/gitleaks/releases/download/v${scannerVersion}/gitleaks_${scannerVersion}_${target}.tar.gz`, sha256: scannerHashes[target] }, archive);
  await runFile('tar', ['-xzf', archive, '-C', directory, 'gitleaks']);
  const binary = path.join(directory, 'gitleaks'); await chmod(binary, 0o755);
  return binary;
}

export function archivePaths(listing) {
  const names = listing.trim().split('\n');
  assert(names.length && names.length < 20_000, 'Archive has too many entries');
  for (const name of names) {
    assert(name && !/[\\\x00-\x1f]/.test(name) && !path.posix.isAbsolute(name) && !/^[a-z]:/i.test(name)
      && !name.split('/').includes('..'), 'Unsafe archive entry');
  }
  return names;
}

export async function unpackChecked(archive, directory, run = runFile) {
  assert((await lstat(archive)).size < 150 * 1024 * 1024, 'Archive exceeds release size limit');
  let expanded = 0;
  for await (const chunk of createReadStream(archive).pipe(createGunzip())) {
    expanded += chunk.length; assert(expanded < 350 * 1024 * 1024, 'Expanded archive exceeds release size limit');
  }
  archivePaths(await run('tar', ['-tzf', archive]));
  const details = (await run('tar', ['-tvzf', archive])).trim().split('\n');
  assert(details.every(line => /^[-d]/.test(line)), 'Archive links and special files are forbidden');
  await mkdir(directory, { recursive: true });
  await run('tar', ['-xzf', archive, '-C', directory]);
}

export function privacyFindings(name, text, kind = 'source') {
  const findings = [], add = rule => findings.push({ path: name, rule });
  // Public DEV routing and synthetic redaction fixtures are intentional, not credentials or employee paths.
  if (name === 'prism-templates.ts' || name === './prism-templates.ts') text = text.replace(/https:\/\/r\.powerformer\.net/g, 'https://dev.example.invalid');
  if (kind === 'source') {
    const fixtures = {
      'studio/src/components/feedback/projectProvenance.test.ts': /\/Users\/me\/x/g,
      'studio/src/player/store/previewQualitySlice.test.ts': /\/Users\/a\/film\.mp3/g,
      'studio/src/telemetry/breadcrumbs.test.ts': /\/Users\/someone\/(?:private\/path\.html|project\.ts)/g,
    };
    if (fixtures[name]) text = text.replace(fixtures[name], '/synthetic/redaction-fixture');
  }
  if (/(?:^|\/)(?:outputs|research|node_modules|\.artifacts|\.motion-data(?:-dev)?)(?:\/|$)/.test(name)
    || /(?:^|\/)(?:\.npmrc|\.DS_Store|id_rsa|id_ed25519)$/.test(name)
    || /\.(?:log|pem|key|p12|pfx)$/.test(name)) add('private-file');
  if (/(?:^|\/)\.env(?:\.|$)/.test(name) && !(kind === 'source' && /(?:^|\/)\.env\.(?:example|development)$/.test(name))) add('environment-file');
  if (/https?:\/\/[^\s"'<>)]*(?:powerformer\.(?:net|com)|feishu\.(?:cn|com)|larksuite\.com)/i.test(text)) add('internal-link');
  if (/\/(?:Users|home)\/[a-zA-Z0-9_.-]+\/|[a-z]:\\Users\\[^\\\s]+\\|\/var\/folders\//i.test(text)) add('personal-path');
  return findings;
}

async function scanTree(directory, kind, binary) {
  const findings = []; let files = 0, bytes = 0;
  const visit = async (dir, prefix = '') => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const name = prefix + entry.name, filename = path.join(dir, entry.name);
      assert(!entry.isSymbolicLink(), 'Release scan does not follow links');
      if (entry.isDirectory()) await visit(filename, name + '/');
      else {
        assert(entry.isFile(), 'Special file in release');
        const data = await readFile(filename); files++; bytes += data.length;
        assert(bytes < 350 * 1024 * 1024 && files < 20_000, 'Expanded release exceeds scan limit');
        findings.push(...privacyFindings(name, data.includes(0) ? '' : data.toString('utf8'), kind));
      }
    }
  };
  await visit(directory);
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-secrets-'));
  try {
    const report = path.join(work, 'secrets.json'), ignore = path.join(work, 'empty.ignore'); await writeFile(ignore, '');
    const env = { ...process.env }; delete env.GITLEAKS_CONFIG; delete env.GITLEAKS_CONFIG_TOML;
    let failure;
    try { await runFile(binary, ['dir', directory, '--no-banner', '--redact', '--ignore-gitleaks-allow', '--gitleaks-ignore-path', ignore,
      '--config', path.join(root, '.github/gitleaks.toml'), '--report-format', 'json', '--report-path', report], { cwd: work, env }); }
    catch (error) { failure = error; }
    let secrets;
    try { secrets = JSON.parse(await readFile(report, 'utf8')); }
    catch { throw new Error('Credential scanner did not produce a valid report'); }
    for (const hit of secrets) findings.push({ path: path.relative(directory, hit.File), rule: hit.RuleID, line: hit.StartLine });
    assert(!failure || secrets.length, 'Credential scanner failed before completing');
    // Never expose matched values or the scanner's raw stdout/report.
    if (findings.length) throw new Error('Release content rejected: ' + JSON.stringify(findings));
    return { status: 'passed', kind, files, bytes, scanner: `gitleaks-${scannerVersion}`,
      policySHA256: createHash('sha256').update(await readFile(path.join(root, '.github/gitleaks.toml'))).update(await readFile(fileURLToPath(import.meta.url))).digest('hex') };
  } finally { await rm(work, { recursive: true, force: true }); }
}

export async function scanSource(source, binary) {
  const names = (await runFile('git', ['ls-files', '-z'], { cwd: source })).split('\0').filter(Boolean);
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-source-scan-'));
  try {
    // Scan the public gallery separately so neither batch exceeds the archive scan budget.
    const batches = new Set();
    for (const name of names) {
      assert(!name.split('/').includes('..') && !path.isAbsolute(name), 'Unsafe tracked path');
      const file = path.join(source, name); assert((await lstat(file)).isFile(), 'Tracked links are forbidden');
      const batch = name.startsWith('docs/readme/') ? 'gallery' : 'source';
      batches.add(batch);
      const destination = path.join(work, batch, name);
      await mkdir(path.dirname(destination), { recursive: true }); await cp(file, destination);
    }
    const reports = [];
    for (const batch of batches) reports.push(await scanTree(path.join(work, batch), 'source', binary));
    if (!reports.length) return await scanTree(work, 'source', binary);
    return { ...reports[0], files: reports.reduce((n, report) => n + report.files, 0),
      bytes: reports.reduce((n, report) => n + report.bytes, 0) };
  } finally { await rm(work, { recursive: true, force: true }); }
}

export async function scanPackage(tgz, binary) {
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-package-scan-'));
  try {
    await unpackChecked(tgz, path.join(work, 'outer'));
    const outer = path.join(work, 'outer/package');
    const pkg = JSON.parse(await readFile(path.join(outer, 'package.json')));
    assert.equal(pkg.name, '@openmotion/app'); assert.equal(pkg.private, false);
    const manifest = JSON.parse(await readFile(path.join(outer, 'payload/release-npm.json')));
    assert.equal(manifest.format, 'npm'); assert.equal(manifest.templateEnvironment, releaseTemplateEnvironment(pkg.version)); assert.equal(manifest.version, pkg.version);
    const appName = manifest.application.url.replace(/^\.\//, ''); assert.equal(path.basename(appName), appName);
    const appArchive = path.join(outer, 'payload', appName); assert.equal(await sha256(appArchive), manifest.application.sha256);
    await unpackChecked(appArchive, path.join(work, 'application'));
    assert.equal(await sha256(path.join(work, 'application/package-lock.json')), manifest.locks.npm);
    assert.equal(await sha256(path.join(work, 'application/scripts/runtime-lock.json')), manifest.locks.native);
    const applicationPkg = JSON.parse(await readFile(path.join(work, 'application/package.json'))); assert.equal(applicationPkg.version, pkg.version);
    const templates = JSON.parse(await readFile(path.join(work, 'application/shared/template-config.json')));
    assert.equal(templates.environment, manifest.templateEnvironment, 'Application template defaults differ from the manifest');
    const reports = await Promise.all([scanTree(path.join(work, 'outer'), 'package', binary), scanTree(path.join(work, 'application'), 'package', binary)]);
    return { status: 'passed', version: pkg.version, tgzSHA256: await sha256(tgz), applicationSHA256: manifest.application.sha256, reports };
  } finally { await rm(work, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, input, output, binary] = process.argv.slice(2);
  if (command === 'install') console.log(await installScanner(path.resolve(input)));
  else {
    assert(['source', 'package'].includes(command) && input && output && binary, 'Usage: motion-scan.mjs source|package <input> <report> <gitleaks>');
    await writeJSON(output, await (command === 'source' ? scanSource(path.resolve(input), binary) : scanPackage(path.resolve(input), binary)));
    console.log('Release content scan passed');
  }
}
