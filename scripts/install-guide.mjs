import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeAtomic, writeJSON } from './runtime-assets.mjs';
import { checkReleaseVersion, releaseTemplateEnvironment } from './release-version.mjs';

export function validateGuideSpec(name, version) {
  assert.match(name || '', /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/, 'Require an npm package name');
  assert(name.length <= 214, 'npm package name is too long');
  checkReleaseVersion(version);
  return version.includes('-test.') ? 'test' : 'stable';
}

export function validateGuideIdentity(pkg, manifest) {
  validateGuideSpec(pkg.name, pkg.version);
  assert.equal(pkg.private, false, 'Only public release candidates may have a public installation guide');
  assert.equal(pkg.version, manifest.version, 'Package and embedded manifest versions differ');
  assert.equal(manifest.schemaVersion, 1, 'Unsupported release manifest');
  assert.equal(manifest.templateEnvironment, releaseTemplateEnvironment(pkg.version), 'Template defaults must match the release channel');
  assert.equal(pkg.bin?.openmotion, 'scripts/npm-installer.mjs', 'Missing Motion entry point');
  assert.match(manifest.commit || '', /^[a-f0-9]{40}$/, 'Require the built source SHA');
  for (const hash of [manifest.application?.sha256, manifest.locks?.npm, manifest.locks?.native]) assert.match(hash || '', /^[a-f0-9]{64}$/, 'Require release checksums');
  const targets = Object.values(manifest.runtime?.targets || {});
  assert(targets.length > 0 && targets.every(t => t.platform && t.arch && t.minimumOS), 'Require native target declarations');
  return pkg.version.includes('-test.') ? 'test' : 'stable';
}

export async function generateInstallGuide(tgz, output, candidate = false) {
  const readEntry = async entry => JSON.parse(await runFile('tar', ['-xOf', path.resolve(tgz), entry]));
  const pkg = await readEntry('package/package.json'), manifest = await readEntry('package/payload/release-npm.json');
  const channel = validateGuideIdentity(pkg, manifest);
  const digest = await sha256(tgz), packageSpec = `${pkg.name}@${pkg.version}`;
  const values = { VERSION: pkg.version, PACKAGE_SPEC: packageSpec, CHANNEL: channel, COMMIT: manifest.commit,
    TEMPLATE_ENVIRONMENT: manifest.templateEnvironment, TGZ_SHA256: digest,
    TARGETS: Object.values(manifest.runtime.targets).map(t => `${t.platform}/${t.arch} (${t.minimumOS}+)`).join(', '),
    DETAILS_URL: `https://github.com/nexu-io/openmotion/blob/${manifest.commit}/docs/npm-installation.md` };
  const template = await readFile(new URL('../docs/install.md', import.meta.url), 'utf8');
  // The repository warning is unnecessary after all release placeholders are resolved.
  const text = (candidate ? '> Build preview only: this candidate is not an approved registry installation entry.\n\n' : '') + template.replace(/^If you are reading this file.*\n\n/m, '').replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => {
    assert(Object.hasOwn(values, key), 'Unknown installation placeholder: ' + key); return values[key];
  });
  assert(!text.includes('{{'), 'Installation guide has unresolved placeholders');
  await mkdir(output, { recursive: true });
  await writeAtomic(path.join(output, 'install.md'), text);
  const record = { schemaVersion: 1, candidate, packageName: pkg.name, version: pkg.version, packageSpec, channel,
    templateEnvironment: manifest.templateEnvironment, commit: manifest.commit, tgzSHA256: digest,
    applicationSHA256: manifest.application.sha256, locks: manifest.locks, guideSHA256: await sha256(path.join(output, 'install.md')) };
  await writeJSON(path.join(output, 'install-record.json'), record);
  return record;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert([4, 5].includes(process.argv.length) && (process.argv[4] === undefined || process.argv[4] === '--candidate'), 'Usage: install-guide.mjs <complete-npm.tgz> <output-directory> [--candidate]');
  console.log(JSON.stringify(await generateInstallGuide(process.argv[2], path.resolve(process.argv[3]), process.argv[4] === '--candidate')));
}
