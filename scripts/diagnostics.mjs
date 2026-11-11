import { constants, realpathSync } from 'node:fs';
import { lstat, mkdir, open, opendir, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { zip } from './zip.mjs';
import { redactDiagnostic } from './diagnostic-redaction.mjs';

export const diagnosticLimits = { fileBytes: 128 * 1024, logBytes: 1024 * 1024, totalBytes: 2 * 1024 * 1024, jobs: 5, directoryEntries: 100, cooldownMs: 30_000 };
const appDirectory = fileURLToPath(new URL('../', import.meta.url));
const idPattern = /^[a-f\d-]{36}$/i;
const writers = new Map();

// Check every relative component, then open without following a final link or blocking on a FIFO.
async function checkedPath(base, relative) {
  let file = await realpath(base);
  for (const part of relative.split('/')) {
    if (!part || part === '.' || part === '..' || part.includes('\\')) throw new Error('UNSAFE_PATH');
    file = path.join(file, part);
    if ((await lstat(file)).isSymbolicLink()) throw new Error('SYMLINK_EXCLUDED');
  }
  return file;
}

async function readBounded(base, relative, limit = diagnosticLimits.fileBytes, tail = true) {
  try {
    const file = await checkedPath(base, relative);
    const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const info = await handle.stat();
      if (!info.isFile()) throw new Error('NOT_A_REGULAR_FILE');
      const truncated = info.size > limit;
      const data = Buffer.alloc(Math.min(info.size, limit));
      const { bytesRead } = await handle.read(data, 0, data.length, tail ? Math.max(0, info.size - data.length) : 0);
      let text = data.subarray(0, bytesRead).toString('utf8');
      // A tail can begin inside a secret or a UTF-8 character; omit that partial line.
      if (tail && truncated) text = text.includes('\n') ? text.slice(text.indexOf('\n') + 1) : '';
      return { status: truncated ? 'truncated' : 'collected', text, modifiedAt: info.mtime.toISOString() };
    } finally { await handle.close(); }
  } catch (error) {
    return { status: error.code === 'ENOENT' ? 'missing' : 'excluded', reason: error.code || error.message };
  }
}

async function readJson(base, relative) {
  const result = await readBounded(base, relative, 64 * 1024, false);
  if (result.status !== 'collected') return null;
  try { return JSON.parse(result.text); } catch { return null; }
}

export async function recordDiagnostic(directory, event) {
  // Local diagnostics must never turn a failed user operation into another failure.
  const previous = writers.get(directory) ?? Promise.resolve();
  const task = previous.then(async () => {
    const root = await realpath(directory);
    const logs = path.join(root, 'diagnostics');
    await mkdir(logs, { recursive: true, mode: 0o700 });
    if ((await lstat(logs)).isSymbolicLink()) throw new Error('SYMLINK_EXCLUDED');
    const file = path.join(logs, 'events.log'), backup = file + '.1';
    for (const target of [file, backup]) {
      const info = await lstat(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
      if (info && !info.isFile()) throw new Error('NOT_A_REGULAR_FILE');
    }
    const fields = {};
    for (const key of ['kind', 'tool', 'requestId', 'projectId', 'versionId', 'jobId', 'message', 'stack']) {
      if (typeof event[key] === 'string') fields[key] = redactDiagnostic(event[key].slice(0, 64 * 1024), process.env, [os.homedir(), root]).slice(0, ['message', 'stack'].includes(key) ? 8192 : 256);
    }
    const line = JSON.stringify({ time: new Date().toISOString(), ...fields }) + '\n';
    const size = (await lstat(file).catch(() => null))?.size ?? 0;
    if (size + Buffer.byteLength(line) > diagnosticLimits.fileBytes) await rename(file, backup);
    const handle = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o600);
    try { await handle.writeFile(line); } finally { await handle.close(); }
  }).catch(() => {});
  writers.set(directory, task);
  try { await task; } finally { if (writers.get(directory) === task) writers.delete(directory); }
}

export async function collectDiagnostics({ appRoot = appDirectory, dataDirectory, installHome, browserErrors = [] } = {}) {
  const entries = [], files = [];
  let remaining = diagnosticLimits.totalBytes;
  let logRemaining = diagnosticLimits.logBytes;
  const paths = [os.homedir(), appRoot, dataDirectory, installHome];
  const clean = text => redactDiagnostic(text, process.env, paths);
  const add = (name, text, sanitize = true) => {
    const data = Buffer.from(sanitize ? clean(text) : text);
    const isLog = name.startsWith('logs/');
    const bounded = data.subarray(0, Math.max(0, Math.min(diagnosticLimits.fileBytes, remaining, isLog ? logRemaining : Infinity)));
    remaining -= bounded.length;
    if (isLog) logRemaining -= bounded.length;
    entries.push({ name, data: bounded });
    return bounded.length < data.length;
  };
  const addJson = (name, value) => {
    let text = JSON.stringify(value, (_key, item) => typeof item === 'string' ? clean(item) : item, 2);
    if (Buffer.byteLength(text) > diagnosticLimits.fileBytes) {
      files.push({ name, status: 'truncated', reason: 'structured file size limit' });
      text = JSON.stringify({ status: 'truncated', reason: 'See files.json; structured file exceeded the size limit.' });
    }
    add(name, text, false);
  };
  const log = async (base, relative, name = relative) => {
    if (!base) { files.push({ name, status: 'missing' }); return; }
    const result = await readBounded(base, relative);
    const { text, ...metadata } = result;
    if (text !== undefined && add('logs/' + name, text)) metadata.status = 'truncated';
    files.push({ name, ...metadata });
  };
  const pkg = await readJson(appRoot, 'package.json');
  const build = await readJson(appRoot, 'shared/build-info.json');
  const templates = await readJson(appRoot, 'shared/template-config.json');
  const native = await readJson(appRoot, '.npm-install.json');
  installHome ??= typeof native?.installHome === 'string' ? native.installHome : undefined;
  const cacheDirectory = typeof native?.cacheDirectory === 'string' ? native.cacheDirectory : undefined;
  paths.push(installHome, cacheDirectory);
  const installation = installHome ? await readJson(installHome, 'install.json') : null;
  dataDirectory ??= typeof installation?.dataDirectory === 'string' ? installation.dataDirectory : undefined;
  paths.push(dataDirectory);
  const metadata = {
    schemaVersion: 1, createdAt: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    version: typeof pkg?.version === 'string' ? pkg.version.slice(0, 128) : 'unknown',
    commit: /^[a-f\d]{40}$/i.test(build?.commit ?? native?.commit ?? '') ? (build?.commit ?? native.commit) : null,
    templateEnvironment: ['dev', 'prod'].includes(templates?.environment ?? installation?.templateEnvironment) ? (templates?.environment ?? installation.templateEnvironment) : 'unknown',
    platform: process.platform, arch: process.arch, osVersion: os.release(), nodeVersion: process.version, engineVersion: pkg?.dependencies?.hyperframes,
    applicationSHA256: /^[a-f\d]{64}$/i.test(native?.applicationSHA256 ?? '') ? native.applicationSHA256 : null,
    hosts: Object.keys(installation?.hosts ?? {}).filter(host => ['codex', 'claude', 'deepseek', 'workbuddy'].includes(host)),
    hostSessionVerified: false, collection: 'local files only; no MCP probe, downloads or cloud upload',
  };
  for (const name of ['preview.log', 'studio.log', '.editor-runtime/editor.log', 'diagnostics/events.log', 'diagnostics/events.log.1']) await log(dataDirectory, name);
  if (installHome && path.resolve(installHome) !== path.resolve(dataDirectory || '.')) {
    for (const name of ['diagnostics/events.log', 'diagnostics/events.log.1']) await log(installHome, name, 'installation/' + name);
  }
  const components = [];
  if (cacheDirectory) {
    const target = Object.entries(native.runtime?.targets ?? {}).find(([name, value]) => /^[a-z\d-]+$/.test(name)
      && value?.platform === process.platform && value?.arch === process.arch)?.[0];
    if (target) {
      await log(cacheDirectory, target + '/preparation.log', 'native/preparation.log');
      const config = native.runtime?.targets?.[target];
      for (const id of ['browser', 'ffmpeg', 'ffprobe', 'media']) {
        const hash = config?.[id]?.sha256;
        if (!/^[a-f\d]{64}$/.test(hash ?? '')) continue;
        const state = await readJson(cacheDirectory, `${target}/${id}-${hash}.status.json`);
        components.push({ id, stage: typeof state?.stage === 'string' ? state.stage.slice(0, 64) : 'unknown',
          errorCode: typeof state?.errorCode === 'string' ? state.errorCode.slice(0, 128) : undefined,
          error: typeof state?.error === 'string' ? state.error.slice(0, 8192) : undefined });
      }
    } else files.push({ name: 'native/preparation.log', status: 'missing', reason: 'no matching native target' });
  } else files.push({ name: 'native/preparation.log', status: 'missing' });
  addJson('native.json', components);
  const jobs = [];
  try {
    const directory = await opendir(await checkedPath(dataDirectory, 'jobs'));
    let scanned = 0;
    for await (const entry of directory) {
      if (++scanned > diagnosticLimits.directoryEntries) { files.push({ name: 'jobs', status: 'truncated', reason: 'directory scan limit' }); break; }
      if (entry.isDirectory() && idPattern.test(entry.name)) {
        const job = await readJson(dataDirectory, `jobs/${entry.name}/job.json`);
        if (job?.id === entry.name) jobs.push(job);
      }
    }
  } catch { files.push({ name: 'jobs', status: 'missing' }); }
  jobs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const selected = jobs.slice(0, diagnosticLimits.jobs);
  addJson('jobs.json', selected.map(job => Object.fromEntries(
    ['id', 'projectId', 'requestId', 'versionId', 'revision', 'state', 'stage', 'createdAt', 'completedAt', 'error'].filter(key => ['string', 'number'].includes(typeof job[key])).map(key => [key, typeof job[key] === 'string' ? job[key].slice(0, key === 'error' ? 8192 : 256) : job[key]])
  )));
  for (const [index, job] of selected.entries()) await log(dataDirectory, `jobs/${job.id}/render.log`, `job-${index + 1}/render.log`);
  const browser = [];
  for (const entry of Array.isArray(browserErrors) ? browserErrors.slice(-20) : []) {
    browser.push(Object.fromEntries(['time', 'kind', 'message', 'stack'].filter(key => typeof entry?.[key] === 'string').map(key => [key, entry[key].slice(0, 4096)])));
    while (Buffer.byteLength(JSON.stringify(browser)) > 24 * 1024) browser.shift();
  }
  addJson('browser-errors.json', browser);
  addJson('metadata.json', metadata);
  addJson('files.json', files);
  add('README.txt', 'OpenMotion local diagnostics\nReview before sharing. Known credentials, URL details, email addresses and local paths are redacted; arbitrary text in existing logs can still contain private information.\nProjects, media, conversations, provider/host configuration and environment dumps are excluded.\nfiles.json lists missing, excluded and truncated logs. Only a bounded sample of jobs is included. A successful collection does not verify the active host chat. No cloud upload or automatic repair was performed.\n');
  return { filename: `openmotion-diagnostics-${Date.now()}-${randomUUID().slice(0, 8)}.zip`, data: zip(entries) };
}

export async function exportDiagnostics(options) {
  const result = await collectDiagnostics(options);
  const output = path.resolve(options.output || result.filename);
  await writeFile(output, result.data, { flag: 'wx', mode: 0o600 });
  return { output, bytes: result.data.length };
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { values } = parseArgs({ options: { 'data-dir': { type: 'string' }, output: { type: 'string' } } });
    if (!values['data-dir']) throw new Error('Usage: node scripts/diagnostics.mjs --data-dir DIR [--output FILE.zip]');
    console.log(JSON.stringify(await exportDiagnostics({ dataDirectory: path.resolve(values['data-dir']), output: values.output })));
  } catch { console.error('Diagnostic export failed. Check --data-dir, output permissions and that the output file does not already exist.'); process.exitCode = 1; }
}
