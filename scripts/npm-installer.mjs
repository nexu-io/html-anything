#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { extractArchive, obtainAsset, readJSON, runFile, withLock, writeAtomic, writeJSON } from './runtime-assets.mjs';
import { ensureNativeRuntime, startNativePreparation } from './npm-runtime.mjs';
import { hosts, skillTargets, obsoleteSkills, checkSkillOwner, copyHostSkills } from './npm-hosts.mjs';

import { managedBy, bundledManifest, defaultHome, contains, npmCli, installationLocation, installationOwner, installationHost, preflight, installationStatus } from './install-state.mjs';
import { installerTracking, installError } from './installer-tracking.mjs';
export { managedBy, localManifest } from './install-state.mjs';
const usage = `Usage:
  openmotion setup --host <${hosts.join('|')}> [options]
  openmotion preflight --host <${hosts.join('|')}> [options] [--json]
  openmotion status [--home DIR] [--host HOST] [--json]
  openmotion prepare [--home DIR]
  openmotion --version

Select the current Agent host explicitly; installed CLIs do not identify the current host.
Setup options:
  --host HOST        Supported hosts: ${hosts.join(', ')} (default: codex)
  --home DIR         Managed application home; reuse for prepare and upgrades
  --data-dir DIR     Project data outside application/cache directories
  --skills-dir DIR   Skills root for Codex, Claude Code or WorkBuddy
  --codex FILE       Codex executable or JavaScript CLI entry
  --claude FILE      Claude Code executable
  --dsh FILE         Harness executable (macOS Desktop CLI is detected automatically)
  --profile NAME     Harness profile (default: web); use the selected host profile
  --source LABEL     First-install acquisition source: 1-64 letters, digits, _, . or -
  --json             Machine-readable preflight/status result
  --manifest FILE    Explicit release manifest for controlled local installations

Preflight and status do not install, download or send telemetry.
Status verifies configuration; actual host Tools/Skills loading remains unverified.
Setup starts native preparation in the background; editing does not wait for it.
Use prepare to wait explicitly for every video component or retry failed preparation.
Refresh the selected host's Tools/Skills; registration alone does not prove loading.
Use separate host configuration, home, data and Skills paths for test candidates.
  -h, --help         Show this help without installing or changing configuration
  --version          Show this package's version`;


export async function setup(options) {
  const location = await installationLocation(options);
  const { manifest, templateEnvironment, home, dataDirectory } = location;
  await mkdir(home, { recursive: true });
  return withLock(path.join(home, 'install.lock'), async () => {
    const owner = await installationOwner(location), { previous, launcher, stateFile } = owner;
    const operation = !previous ? 'install' : !previous.hosts?.[options.host || 'codex'] ? 'add_host' : previous.version !== manifest.version ? 'upgrade' : 'reinstall';
    const context = { dataDirectory, version: manifest.version, flowId: crypto.randomUUID(), host: options.host || 'codex', operation };
    const observer = await installerTracking(context, options.source), started = performance.now();
    observer.track('installation_started');
    try {
      const plan = await observer.step('host_preflight', () => installationHost(options, location, owner));
      const appRoot = path.join(home, 'apps', manifest.version + '-' + manifest.application.sha256.slice(0, 16));
      const cachedApplication = Boolean(await readJSON(path.join(appRoot, '.npm-install.json')));
      const installed = await observer.step('application', async () => {
        if (!cachedApplication) {
          const archive = path.join(home, 'cache/downloads', manifest.application.sha256 + '.tar.gz');
          console.error('OpenMotion: preparing application ' + manifest.version);
          await obtainAsset(manifest.application, archive, true);
          await mkdir(path.dirname(appRoot), { recursive: true });
          const temporary = await mkdtemp(path.join(home, 'apps', '.install-'));
          try {
            await extractArchive(archive, temporary);
            const pkg = await readJSON(path.join(temporary, 'package.json'));
            assert.equal(pkg?.version, manifest.version, 'Application version does not match manifest');
            if (manifest.templateEnvironment) assert.equal((await readJSON(path.join(temporary, 'shared/template-config.json')))?.environment, templateEnvironment, 'Application template environment does not match manifest');
            for (const file of ['mcp.ts', 'scripts/npm-runtime.mjs', 'studio/build/index.html', 'skills/motion-production/SKILL.md']) await readFile(path.join(temporary, file));
            assert(!contains(temporary, process.execPath), 'Node must remain external to the lightweight application');
            const npm = npmCli();
            console.error('OpenMotion: installing locked npm runtime (no native media/browser download).');
            await observer.step('npm_runtime', () => runFile(process.execPath, [npm, 'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: temporary }));
            await writeJSON(path.join(temporary, '.npm-install.json'), { schemaVersion: 1, applicationSHA256: manifest.application.sha256,
              cacheDirectory: path.join(home, 'cache/native'), runtime: manifest.runtime, allowLocalAssets: true });
            await rename(temporary, appRoot);
          } finally { await rm(temporary, { recursive: true, force: true }); }
        }
        const installed = await readJSON(path.join(appRoot, '.npm-install.json'));
        assert.equal(installed.applicationSHA256, manifest.application.sha256, 'Installed application identity mismatch');
        assert.equal(JSON.stringify(installed.runtime), JSON.stringify(manifest.runtime), 'Native manifest changed for the same application; rebuild the application release');
        return installed;
      }, { cache_hit: cachedApplication });
      const targets = await skillTargets(plan, appRoot), directories = [];
      for (const target of targets) directories.push({ target, existed: await checkSkillOwner(target, home, plan.host, plan.layout), movedOld: false, movedNew: false });
      for (const target of await obsoleteSkills(plan, home, targets)) directories.push({ target, existed: true, removeOnly: true, movedOld: false, movedNew: false });
      let wroteState = false, wroteLauncher = false;
      try {
        await observer.step('skills', async () => {
          for (const item of directories) {
            await mkdir(path.dirname(item.target), { recursive: true });
            item.stage = await mkdtemp(path.join(path.dirname(item.target), '.openmotion-'));
            item.backup = item.stage + '-previous';
            if (!item.removeOnly) await copyHostSkills(item.stage, item.target, appRoot, plan, home, manifest.version, dataDirectory);
          }
          for (const item of directories) {
            if (item.existed) { await rename(item.target, item.backup); item.movedOld = true; }
            if (!item.removeOnly) { await rename(item.stage, item.target); item.movedNew = true; }
          }
        });
        await writeAtomic(launcher, `import { readFile } from 'node:fs/promises';\nimport { spawn } from 'node:child_process';\nimport { pathToFileURL } from 'node:url';\nconst state = JSON.parse(await readFile(new URL('./install.json', import.meta.url), 'utf8'));\nawait (await import(pathToFileURL(state.appRoot + '/scripts/npm-runtime.mjs'))).configureNativeEnvironment(state.appRoot);\nconst child = spawn(process.execPath, ['--experimental-strip-types', state.appRoot + '/mcp.ts'], { cwd: state.appRoot, env: { ...process.env, MOTION_DATA_DIR: state.dataDirectory }, stdio: 'inherit', windowsHide: true });\nfor (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));\nchild.once('error', error => { console.error(error.message); process.exitCode = 1; });\nchild.once('exit', code => { process.exitCode = code ?? 1; });\n`);
        wroteLauncher = true;
        const registered = previous?.hosts || (previous?.skillsDirectory ? { codex: { skillsDirectory: previous.skillsDirectory } } : {});
        const state = { ...previous, managedBy, version: manifest.version, templateEnvironment, appRoot, dataDirectory, launcher,
          hosts: { ...registered, [plan.host]: plan.metadata }, installFlowId: context.flowId,
          ...(plan.host === 'codex' ? { skillsDirectory: targets[0] } : {}) };
        await writeJSON(stateFile, state); wroteState = true;
        await observer.step('host_register', () => plan.register());
        await writeJSON(path.join(appRoot, '.npm-install.json'), { ...installed, tracking: context }).catch(() => console.error('OpenMotion: native preparation attribution is unavailable.'));
        for (const item of directories) await rm(item.backup, { recursive: true, force: true }).catch(error => console.error('Old instruction backup retained: ' + error.message));
        await startNativePreparation(appRoot, false, 'setup', context).catch(error => console.error('OpenMotion: background preparation could not start; retry in Studio or run prepare. ' + error.message));
        observer.track('installation_result', { outcome: 'success', duration_ms: observer.elapsed(started) });
        return { ...state, host: plan.host, hostInstallation: plan.metadata, nativeDependencies: 'background-preparation; status and retry available in Studio' };
      } catch (error) {
        const rollbackStarted = performance.now();
        if (wroteLauncher && !previous) await rm(launcher, { force: true });
        if (wroteState) { if (previous) await writeJSON(stateFile, previous); else await rm(stateFile, { force: true }); }
        for (const item of [...directories].reverse()) {
          if (item.movedNew) await rm(item.target, { recursive: true, force: true });
          if (item.movedOld) await rename(item.backup, item.target);
        }
        observer.track('installation_step_result', { step: 'rollback', outcome: 'success', duration_ms: observer.elapsed(rollbackStarted) });
        throw error;
      } finally { for (const item of directories) if (item.stage) await rm(item.stage, { recursive: true, force: true }); }

    } catch (error) {
      observer.track('installation_result', { outcome: 'failure', duration_ms: observer.elapsed(started), error_code: installError(error) });
      throw error;
    } finally { await observer.close(); }
  });
}

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    manifest: { type: 'string' }, home: { type: 'string' }, 'data-dir': { type: 'string' }, 'skills-dir': { type: 'string' }, host: { type: 'string' }, codex: { type: 'string' }, claude: { type: 'string' }, dsh: { type: 'string' }, profile: { type: 'string' },
    source: { type: 'string' }, json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' }, version: { type: 'boolean' },
  } });
  if (values.help) { console.log(usage); return; }
  if (values.version) { console.log((await readJSON(new URL('../package.json', import.meta.url))).version); return; }
  const [command] = positionals;
  assert(positionals.length === 1, usage);
  assert(values.source === undefined || ['setup', 'preflight'].includes(command), '--source is only supported by setup and preflight');
  const options = { manifest: values.manifest, home: values.home, dataDirectory: values['data-dir'], skillsDirectory: values['skills-dir'], host: values.host, codex: values.codex, claude: values.claude, dsh: values.dsh, profile: values.profile, source: values.source };
  if (command === 'preflight') {
    const report = await preflight(options); console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } else if (command === 'status') {
    const environment = (await readJSON(bundledManifest))?.templateEnvironment;
    const report = await installationStatus({ ...options, home: options.home || defaultHome(environment) });
    console.log(JSON.stringify(report, null, 2));
  } else if (command === 'setup') {
    console.log(JSON.stringify(await setup(options), null, 2));
  } else if (command === 'prepare') {
    const environment = (await readJSON(bundledManifest))?.templateEnvironment;
    const state = await readJSON(path.join(values.home || defaultHome(environment), 'install.json'));
    assert(state?.managedBy === managedBy, 'Run setup first');
    await ensureNativeRuntime(state.appRoot, undefined, 'explicit');
    console.log('Pinned FFmpeg, ffprobe and browser are ready.');
  } else throw new Error('Supported commands: preflight, status, setup, prepare');
}
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main().catch(error => { console.error(error.message + '\nRun openmotion --help for supported hosts and installation options.'); process.exitCode = 1; });
