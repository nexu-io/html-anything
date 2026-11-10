import assert from 'node:assert/strict';
import { existsSync, realpathSync } from 'node:fs';
import { mkdir, mkdtemp, open, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { installerTracking, installError } from './installer-tracking.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { executable, extractArchive, nativeComponents, obtainAsset, readJSON, relativePath, runFile, withCacheLock, writeJSON, processAlive } from './runtime-assets.mjs';

export async function nativeConfiguration(root) {
  const config = await readJSON(path.join(root, '.npm-install.json'));
  if (!config) return null;
  assert.equal(config.schemaVersion, 1, 'Unsupported npm installation');
  const found = Object.entries(config.runtime.targets).find(([, value]) => value.platform === process.platform && value.arch === process.arch);
  assert(found, `No pinned native runtime for ${process.platform}-${process.arch}`);
  const [target, info] = found;
  assert(/^[a-z0-9-]+$/.test(target), 'Invalid native target');
  const components = nativeComponents(info);
  for (const component of components) assert(/^[a-f0-9]{64}$/.test(info[component]?.sha256), 'Require a pinned native SHA256');
  assert(path.isAbsolute(config.cacheDirectory), 'Native cache must be absolute');
  const cache = path.join(config.cacheDirectory, target), suffix = process.platform === 'win32' ? '.exe' : '';
  const media = info.media && relativePath(path.join(cache, 'media-' + info.media.sha256), info.media.directory);
  const mediaTool = name => media ? path.join(media, 'bin', name + suffix) : relativePath(path.join(cache, name + '-' + info[name].sha256), info[name].executable);
  const browser = relativePath(path.join(cache, 'browser-' + info.browser.sha256), info.browser.executable);
  return { config, info, cache, components, paths: {
    HYPERFRAMES_FFMPEG_PATH: mediaTool('ffmpeg'),
    HYPERFRAMES_FFPROBE_PATH: mediaTool('ffprobe'),
    HYPERFRAMES_BROWSER_PATH: browser,
  } };
}

export async function configureNativeEnvironment(root) {
  const native = await nativeConfiguration(root);
  if (!native) return null;
  process.env.HYPERFRAMES_FFMPEG_PATH ||= process.env.FFMPEG_PATH || native.paths.HYPERFRAMES_FFMPEG_PATH;
  process.env.HYPERFRAMES_FFPROBE_PATH ||= process.env.FFPROBE_PATH || native.paths.HYPERFRAMES_FFPROBE_PATH;
  process.env.HYPERFRAMES_BROWSER_PATH ||= process.env.MOTION_BROWSER_PATH || native.paths.HYPERFRAMES_BROWSER_PATH;
  return native;
}

const componentKeys = { browser: ['HYPERFRAMES_BROWSER_PATH'], media: ['HYPERFRAMES_FFMPEG_PATH', 'HYPERFRAMES_FFPROBE_PATH'], ffmpeg: ['HYPERFRAMES_FFMPEG_PATH'], ffprobe: ['HYPERFRAMES_FFPROBE_PATH'] };
const preparing = new Map();
const launching = new Map();
const location = (native, component) => path.join(native.cache, component + '-' + native.info[component].sha256);
const overridden = (native, key) => process.env[key] && process.env[key] !== native.paths[key];
async function ready(native, component) {
  const keys = componentKeys[component];
  if (!keys.every(key => overridden(native, key)) && (await readJSON(path.join(location(native, component), 'ready.json')))?.sha256 !== native.info[component].sha256) return false;
  try {
    for (const key of keys) {
      await executable(overridden(native, key) ? process.env[key] : native.paths[key]);
      if (overridden(native, key)) await runFile(process.env[key], [key.includes('BROWSER') ? '--version' : '-version'], { timeout: 5000 });
    }
    return true;
  } catch { return false; }
}

export async function nativeRuntimeStatus(root) {
  const native = await configureNativeEnvironment(root);
  if (!native) return { managed: false, components: [], capabilities: { capture: true, media: true, export: true } };
  const components = await Promise.all(native.components.map(async id => {
    try {
      if (await ready(native, id)) return { id, stage: 'ready' };
      const destination = location(native, id), state = await readJSON(destination + '.status.json');
      const owner = await readJSON(destination + '.lock');
      const pid = typeof owner === 'number' ? owner : owner?.pid;
      if (processAlive(pid)) return { id, ...(state?.pid === pid && !['ready', 'failed'].includes(state.stage) ? state : { stage: 'waiting' }) };
      if (state?.stage === 'failed') return { id, stage: 'failed', error: state.error, errorCode: state.errorCode };
      return { id, stage: 'idle' };
    } catch (error) {
      return { id, stage: 'failed', errorCode: ['EACCES', 'EPERM'].includes(error.code) ? 'permission' : 'checking', error: String(error.message).slice(0, 1000) };
    }
  }));
  const available = ids => components.filter(component => ids.includes(component.id)).every(component => component.stage === 'ready');
  return { managed: true, components, capabilities: { capture: available(native.components), media: available(['media', 'ffmpeg', 'ffprobe']), export: available(native.components) } };
}

async function prepareComponent(native, component, observer) {
  const destination = location(native, component);
  if (preparing.has(destination)) return preparing.get(destination);
  const checkedAt = performance.now();
  if (await ready(native, component)) {
    observer.track('installation_step_result', { step: 'native_probe', component, cache_hit: true, outcome: 'success', duration_ms: observer.elapsed(checkedAt) });
    return;
  }
  if (preparing.has(destination)) return preparing.get(destination);
  const task = withCacheLock(destination + '.lock', async () => {
    if (await ready(native, component)) return;
    let state = { pid: process.pid, stage: 'waiting' }, lastProgress = 0;
    const update = async change => {
      if (change.stage === 'downloading' && state.stage === 'downloading' && change.receivedBytes !== undefined && state.receivedBytes !== undefined && Date.now() - lastProgress < 500) return;
      lastProgress = Date.now(); state = { ...state, ...change, updatedAt: Date.now() };
      await writeJSON(destination + '.status.json', state);
    };
    try {
      await update({ stage: 'waiting' });
      const { config, info, paths, cache } = native, keys = componentKeys[component];
      for (const key of keys.filter(key => overridden(native, key))) {
        await executable(process.env[key]);
        await runFile(process.env[key], [key.includes('BROWSER') ? '--version' : '-version']);
      }
      if (await ready(native, component)) return;
      const asset = info[component];
      if (process.platform === 'darwin') assert(Number(os.release().split('.')[0]) >= 25, 'Pinned native downloads require macOS 26 or later; supply compatible media and browser paths on older systems.');
      if (process.platform === 'win32') assert(Number(os.release().split('.')[2]) >= 22000, 'Pinned native runtime requires Windows 11 or later');
      console.error(`OpenMotion: preparing pinned ${component} in the background.`);
      const archive = path.join(config.cacheDirectory, 'downloads', asset.sha256 + (new URL(asset.url).pathname.endsWith('.zip') ? '.zip' : '.tar.gz'));
      await update({ stage: 'downloading' });
      const transfer = { component, cache_hit: false, transfer_kind: new URL(asset.url).protocol === 'file:' ? 'local' : 'network' };
      await observer.step('native_download', async () => {
        const result = await obtainAsset(asset, archive, config.allowLocalAssets === true, update);
        transfer.cache_hit = result.cacheHit; if (result.cacheHit) transfer.transfer_kind = 'cache';
      }, transfer);
      await update({ stage: 'extracting' });
      await mkdir(cache, { recursive: true });
      const temporary = await mkdtemp(path.join(cache, component + '-'));
      try {
        await observer.step('native_extract', () => extractArchive(archive, temporary), { component });
        await update({ stage: 'checking' });
        await observer.step('native_probe', async () => {
        for (const key of keys) {
          const filename = path.join(temporary, path.relative(destination, paths[key]));
          if (process.platform === 'win32') assert(filename.length < 260, 'Native tool path is too long; choose a shorter --home directory');
          await executable(filename);
          await runFile(filename, [component === 'browser' ? '--version' : '-version']);
        }
        }, { component, cache_hit: false });
        await writeFile(path.join(temporary, 'ready.json'), JSON.stringify({ sha256: asset.sha256 }));
        await rm(destination, { recursive: true, force: true });
        await rename(temporary, destination);
      } finally { await rm(temporary, { recursive: true, force: true }); }
      await update({ stage: 'ready' });
    } catch (error) {
      const errorCode = /SHA256/.test(error.message) ? 'integrity' : error.code === 'ENOSPC' ? 'disk_space' : ['EACCES', 'EPERM'].includes(error.code) ? 'permission' : /requires? (?:macOS|Windows)/i.test(error.message) ? 'platform' : state.stage === 'downloading' ? 'download' : 'checking';
      await update({ stage: 'failed', errorCode, error: String(error.message).slice(0, 1000) });
      throw error;
    }
  });
  preparing.set(destination, task);
  try { return await task; } finally { preparing.delete(destination); }
}

export async function ensureNativeRuntime(root, components, trigger = 'explicit') {
  const native = await configureNativeEnvironment(root);
  if (!native) return;
  let context = native.config.tracking;
  try {
    const inherited = JSON.parse(process.env.OPENMOTION_NATIVE_TRACKING_CONTEXT || 'null');
    if (inherited?.root === path.resolve(root)) { context = inherited.context; trigger = inherited.trigger; }
  } catch { /* Invalid diagnostic context never blocks native preparation. */ }
  const observer = await installerTracking(context), started = performance.now();
  observer.track('native_prepare_started', { trigger });
  try {
    const selected = components ?? native.components;
    assert(selected.every(component => native.components.includes(component)), 'Unknown native component');
    const prepared = await Promise.allSettled(selected.map(component => prepareComponent(native, component, observer)));
    const failed = prepared.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
    observer.track('native_prepare_result', { trigger, outcome: 'success', duration_ms: observer.elapsed(started) });
  } catch (error) {
    observer.track('native_prepare_result', { trigger, outcome: 'failure', duration_ms: observer.elapsed(started), error_code: installError(error) });
    throw error;
  } finally { await observer.close(); }
}

export async function startNativePreparation(root, retry = false, trigger = 'app_start', context) {
  if (launching.has(root)) return launching.get(root);
  const task = (async () => {
    const status = await nativeRuntimeStatus(root);
    const components = status.components.filter(component => component.stage === 'idle' || retry && component.stage === 'failed').map(component => component.id);
    if (!components.length) return status;
    const native = await nativeConfiguration(root);
    await mkdir(native.cache, { recursive: true });
    const log = await open(path.join(native.cache, 'preparation.log'), 'a', 0o600);
    try {
      const child = spawn(process.execPath, [path.join(root, 'scripts/npm-runtime.mjs'), root, ...components], {
        detached: true, stdio: ['ignore', log.fd, log.fd], env: { ...process.env, OPENMOTION_NATIVE_TRACKING_CONTEXT: JSON.stringify({ root: path.resolve(root), context: context ?? native.config.tracking, trigger }) }, windowsHide: true,
      });
      await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
      child.unref();
    } finally { await log.close(); }
    return status;
  })();
  launching.set(root, task);
  try { return await task; } finally { launching.delete(root); }
}

export async function requireNativeRuntime(root, capability) {
  assert(['capture', 'media', 'export'].includes(capability), 'Unknown native capability');
  const status = await nativeRuntimeStatus(root);
  if (!status.managed || status.capabilities[capability]) return;
  await startNativePreparation(root);
  throw Object.assign(new Error('NATIVE_RUNTIME_NOT_READY: Video components are preparing or need retry. Continue editing; check Studio preparation status or run openmotion prepare for this installation, then retry this operation.'),
    { code: 'NATIVE_RUNTIME_NOT_READY', details: status });
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  ensureNativeRuntime(process.argv[2], process.argv.length > 3 ? process.argv.slice(3) : undefined).catch(error => { console.error(error.message); process.exitCode = 1; });
}
