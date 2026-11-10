import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonical, nativeComponents, readJSON, relativePath, runFile } from './runtime-assets.mjs';
import { hostPlan, skillTargets, checkSkillOwner } from './npm-hosts.mjs';
import { nativeRuntimeStatus } from './npm-runtime.mjs';
import { trackingRuntime, installError } from './installer-tracking.mjs';

export const managedBy = '@openmotion/installer';
export const bundledManifest = fileURLToPath(new URL('../payload/release-npm.json', import.meta.url));
export const defaultHome = (environment = 'prod') => path.join(process.platform === 'win32' ? process.env.LOCALAPPDATA || os.homedir() : path.join(os.homedir(), '.local/share'), environment === 'dev' ? 'openmotion-dev' : 'openmotion');
export const npmCli = () => process.env.npm_execpath || path.join(path.dirname(process.execPath), process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : '../lib/node_modules/npm/bin/npm-cli.js');
export const contains = (parent, child) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); };

export async function localManifest(filename) {
  const file = path.resolve(filename), manifest = await readJSON(file);
  assert(manifest?.schemaVersion === 1 && /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(manifest.version), 'Invalid OpenMotion release manifest');
  assert(/^[a-f0-9]{64}$/.test(manifest.application?.sha256), 'Application requires a pinned SHA256');
  assert(manifest.runtime?.targets && !Array.isArray(manifest.runtime.targets) && Object.keys(manifest.runtime.targets).length, 'Missing native runtime manifest');
  const resolveAsset = asset => {
    assert(asset && /^[a-f0-9]{64}$/.test(asset.sha256), 'Asset requires a pinned SHA256');
    const url = new URL(asset.url, pathToFileURL(file));
    assert(['https:', 'file:'].includes(url.protocol), 'Assets require HTTPS or explicit local files');
    assert(!url.username && !url.password, 'Do not put credentials in asset URLs');
    return { ...asset, url: url.href };
  };
  manifest.application = resolveAsset(manifest.application);
  for (const target of Object.values(manifest.runtime.targets)) {
    for (const component of nativeComponents(target)) {
      target[component] = resolveAsset(target[component]);
      relativePath('/', component === 'media' ? target.media.directory : target[component].executable);
    }
  }
  return manifest;
}


export async function installationLocation(options) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  assert(major > 22 || major === 22 && minor >= 18, 'Node.js 22.18 or later is required');
  if (options.source !== undefined) (await trackingRuntime()).validateSource(options.source);
  const manifest = await localManifest(options.manifest || bundledManifest);
  if (!options.manifest) assert.equal(manifest.version, (await readJSON(new URL('../package.json', import.meta.url))).version, 'Bundled application must match the npm package version');
  assert(Object.values(manifest.runtime.targets).some(target => target.platform === process.platform && target.arch === process.arch), `No pinned native runtime for ${process.platform}-${process.arch}`);
  const templateEnvironment = manifest.templateEnvironment ?? 'prod';
  assert(['dev', 'prod'].includes(templateEnvironment), 'Invalid template environment');
  const home = await canonical(options.home || defaultHome(templateEnvironment));
  const dataDirectory = await canonical(options.dataDirectory || path.join(home, 'data'));
  assert(!contains(dataDirectory, home) && !['apps', 'cache', 'hosts'].some(name => contains(path.join(home, name), dataDirectory)), 'Keep user data and application/cache directories separate');
  return { manifest, templateEnvironment, home, dataDirectory };
}
export async function installationOwner(location) {
  const { home, dataDirectory, templateEnvironment } = location;
  const lock = await readJSON(path.join(home, 'install.lock'));
  assert(!lock || lock === process.pid, 'Another OpenMotion install is using this application home');
  const stateFile = path.join(home, 'install.json'), previous = await readJSON(stateFile);
  assert(previous === null || previous.managedBy === managedBy, 'Installation directory belongs to another application');
  assert(!previous || previous.dataDirectory === dataDirectory, 'This installation already uses another data directory; choose a separate --home');
  assert(!previous || (previous.templateEnvironment ?? 'prod') === templateEnvironment, 'This installation uses another template environment; choose a separate --home');
  const launcher = path.join(home, 'run-mcp.mjs');
  if (!previous) await readFile(launcher).then(() => { throw new Error('Refusing to replace an unowned MCP launcher'); }, error => { if (error.code !== 'ENOENT') throw error; });
  return { stateFile, previous, launcher };
}
async function writable(directory) {
  try { await access(directory, constants.W_OK); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await writable(path.dirname(directory)); }
}
export async function installationHost(options, location, owner) {
  const { home, dataDirectory } = location;
  const plan = await hostPlan(options, home, owner.launcher, owner.previous);
  assert(!plan.metadata.configFile || !contains(dataDirectory, plan.metadata.configFile), 'Keep host configuration outside user data');
  assert(!plan.metadata.configFile || !['apps', 'cache', 'hosts'].some(name => contains(path.join(home, name), plan.metadata.configFile)), 'Keep host configuration outside managed application/cache/host directories');
  if (plan.layout !== 'deepseek') assert(!contains(dataDirectory, plan.skillsDirectory) && !contains(plan.skillsDirectory, dataDirectory) && !contains(plan.skillsDirectory, home) && !contains(home, plan.skillsDirectory), 'Keep user data, installed Skills and application/cache directories separate');
  if (plan.layout === 'bundle') await checkSkillOwner(path.join(plan.skillsDirectory, 'openmotion'), home, plan.host, plan.layout);
  if (plan.layout === 'deepseek') await checkSkillOwner(plan.metadata.bundleDirectory, home, plan.host, plan.layout);
  if (plan.layout === 'flat') for (const name of location.manifest.skills || []) {
    assert(/^[a-z0-9-]+$/.test(name), 'Invalid Skill name');
    await checkSkillOwner(path.join(plan.skillsDirectory, name), home, plan.host, plan.layout);
  }
  for (const directory of [home, dataDirectory, plan.skillsDirectory, ...(plan.metadata.configFile ? [plan.metadata.configFile] : [])]) await writable(directory);
  const npmVersion = (await runFile(process.execPath, [npmCli(), '--version'], { timeout: 5000 })).trim();
  assert(/^\d+\.\d+\.\d+/.test(npmVersion), 'npm is required');
  plan.npmVersion = npmVersion;
  if (plan.probe) await plan.probe();
  return plan;
}
export async function preflight(options) {
  try {
    const location = await installationLocation(options), owner = await installationOwner(location);
    const plan = await installationHost(options, location, owner);
    return { schemaVersion: 1, ok: true, platform: process.platform, arch: process.arch, osRelease: os.release(), nodeVersion: process.versions.node, npmVersion: plan.npmVersion,
      plan: { host: plan.host, home: location.home, dataDirectory: location.dataDirectory, version: location.manifest.version,
        templateEnvironment: location.templateEnvironment, hostInstallation: plan.metadata,
        nativeMinimumOS: Object.values(location.manifest.runtime.targets).find(target => target.platform === process.platform && target.arch === process.arch).minimumOS ?? null },
      nextActions: ['run_setup', 'refresh_host_discovery', 'call_motion_get_project'] };
  } catch (error) {
    return { schemaVersion: 1, ok: false, error: { code: installError(error), message: error.message }, nextActions: ['resolve_preflight_error'] };
  }
}
export async function installationStatus(options) {
  try {
    const home = await canonical(options.home || defaultHome());
    const state = await readJSON(path.join(home, 'install.json'));
    if (!state) return { schemaVersion: 1, installation: { state: 'not_installed' }, nextActions: ['run_setup'] };
    assert.equal(state.managedBy, managedBy, 'Installation directory belongs to another application');
    for (const file of [state.launcher, path.join(state.appRoot, 'mcp.ts'), path.join(state.appRoot, '.npm-install.json')]) await access(file);
    const registrations = [];
    for (const host of options.host ? [options.host] : Object.keys(state.hosts || {})) {
      if (!state.hosts?.[host]) { registrations.push({ host, configuration: 'missing' }); continue; }
      try {
        const saved = state.hosts[host];
        const plan = await hostPlan({ ...options, host, profile: saved.profile, skillsDirectory: saved.skillsDirectory }, home, state.launcher, state);
        const targets = await skillTargets(plan, state.appRoot);
        let instructionFiles = 'present';
        for (const target of targets) {
          if (!await checkSkillOwner(target, home, host, plan.layout)) { instructionFiles = 'missing'; continue; }
          const sources = plan.layout === 'flat' ? [target] : (await readdir(path.join(state.appRoot, 'skills'), { withFileTypes: true }))
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => path.join(target, 'skills', entry.name));
          if (!sources.length) instructionFiles = 'missing';
          for (const source of sources) await access(path.join(source, 'SKILL.md')).catch(() => { instructionFiles = 'missing'; });
        }
        registrations.push({ host, configuration: plan.configured ? 'owned' : 'missing', instructionFiles });
      } catch (error) { registrations.push({ host, configuration: 'unverified', error: { code: installError(error), message: error.message } }); }
    }
    const runtime = await nativeRuntimeStatus(state.appRoot);
    return { schemaVersion: 1, installation: { state: 'installed', version: state.version, templateEnvironment: state.templateEnvironment },
      registrations, hostDiscovery: { tools: 'unverified', skills: 'unverified' }, nativeRuntime: runtime,
      nextActions: [...(registrations.some(item => item.configuration !== 'owned') ? ['check_host_configuration'] : []),
        ...(registrations.some(item => item.instructionFiles === 'missing') ? ['run_setup'] : []),
        'refresh_host_discovery', 'call_motion_get_project', ...(runtime.components.some(item => item.stage === 'failed') ? ['retry_native_preparation'] : !runtime.capabilities.export ? ['wait_for_native_preparation'] : [])] };
  } catch (error) {
    return { schemaVersion: 1, installation: { state: 'invalid' }, error: { code: installError(error), message: error.message }, nextActions: ['resolve_installation_error'] };
  }
}
