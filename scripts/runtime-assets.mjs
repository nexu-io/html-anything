import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream, constants } from 'node:fs';
import { access, copyFile, link, mkdir, open, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export async function sha256(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
export async function download(asset, filename, progress = async () => {}) {
  const url = new URL(asset.url);
  assert(url.protocol === 'https:' && /^[a-f0-9]{64}$/.test(asset.sha256), 'Require HTTPS and a pinned SHA256');
  try { if (await sha256(filename) === asset.sha256) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.dirname(filename), { recursive: true });
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await downloadAttempt(asset, filename, progress, attempt, maxAttempts);
      return;
    } catch (error) {
      const transient = error.name === 'TimeoutError' || error.name === 'TypeError'
        || ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.cause?.code)
        || error.retryable === true;
      if (!transient || attempt === maxAttempts) throw error;
      await progress({ stage: 'waiting', attempt: attempt + 1, maxAttempts, receivedBytes: 0, totalBytes: undefined, downloadStartedAt: undefined });
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function downloadAttempt(asset, filename, progress, attempt, maxAttempts) {
  const url = new URL(asset.url), temporary = filename + '.part';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new DOMException('Download made no progress for five minutes', 'TimeoutError')), 300_000);
  try {
    let current = url, response;
    const signal = controller.signal;
    await progress({ stage: 'downloading', attempt, maxAttempts, receivedBytes: 0, totalBytes: undefined, downloadStartedAt: Date.now() });
    for (let redirects = 0; redirects <= 5; redirects++) {
      assert.equal(current.protocol, 'https:', 'Runtime redirects must use HTTPS');
      response = await fetch(current, { redirect: 'manual', signal });
      if (response.status < 300 || response.status > 399) break;
      const location = response.headers.get('location');
      await response.body?.cancel();
      assert(location && redirects < 5, 'Invalid or excessive runtime redirects');
      current = new URL(location, current);
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw Object.assign(new Error(`Download ${url.hostname}${url.pathname}: HTTP ${response.status}`), { retryable: response.status === 408 || response.status === 429 || response.status >= 500 });
    }
    let receivedBytes = 0;
    const encoding = response.headers.get('content-encoding');
    const totalBytes = !encoding || encoding === 'identity' ? Number(response.headers.get('content-length')) || undefined : undefined;
    async function* measured(source) {
      for await (const chunk of source) {
        timeout.refresh();
        receivedBytes += chunk.length;
        await progress({ stage: 'downloading', receivedBytes, totalBytes });
        yield chunk;
      }
    }
    await pipeline(Readable.fromWeb(response.body), measured, createWriteStream(temporary));
    clearTimeout(timeout);
    await progress({ stage: 'verifying' });
    assert.equal(await sha256(temporary), asset.sha256, `SHA256 mismatch: ${url.pathname}`);
    await rename(temporary, filename);
  } catch (error) {
    throw controller.signal.aborted ? controller.signal.reason : error;
  } finally { clearTimeout(timeout); await rm(temporary, { force: true }); }
}

export async function runFile(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, timeout: 300_000, ...options });
    let stdout = '', stderr = '';
    child.stdout?.on('data', chunk => { stdout = (stdout + chunk).slice(-4 * 1024 * 1024); });
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk).slice(-16000); });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(stdout) : reject(new Error(`${command} exited ${code}: ${stderr || stdout}`)));
  });
}

export function relativePath(root, filename) {
  assert(typeof filename === 'string' && filename && !/[\\\x00-\x1f]/.test(filename) && !filename.startsWith('/') && !/^[a-z]:/i.test(filename)
    && !filename.split('/').includes('..'), 'Unsafe archive path: ' + filename);
  return path.join(root, filename);
}

export async function canonical(directory) {
  const normalized = path.resolve(directory);
  try { return await realpath(normalized); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return path.join(await canonical(path.dirname(normalized)), path.basename(normalized));
  }
}

export async function withLock(filename, work) {
  // shortcut: a killed installer leaves its PID lock; verify the process exited before removing it.
  await mkdir(path.dirname(filename), { recursive: true });
  let handle;
  try { handle = await open(filename, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error(`Another OpenMotion install is using ${filename}. Retry after it finishes; after a crash confirm its PID has exited before removing this lock.`);
  }
  try { await handle.writeFile(String(process.pid)); return await work(); }
  finally { await handle.close(); await rm(filename, { force: true }); }
}

export function processAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}

// Native caches are shared by installers and running apps; contenders join the owner.
export async function withCacheLock(filename, work) {
  await mkdir(path.dirname(filename), { recursive: true });
  const token = randomUUID(), candidate = filename + '.' + token;
  await writeFile(candidate, JSON.stringify({ pid: process.pid, token }), { mode: 0o600 });
  const deadline = Date.now() + 15 * 60_000;
  try {
    for (;;) {
      try { await link(candidate, filename); break; }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
      const owner = await readJSON(filename);
      const pid = typeof owner === 'number' ? owner : owner?.pid;
      if (pid && !processAlive(pid)) {
        await withCacheLock(filename + '.reclaim', async () => {
          if (JSON.stringify(await readJSON(filename)) === JSON.stringify(owner)) await rm(filename, { force: true });
        });
      }
      if (Date.now() > deadline) throw new Error('Timed out waiting for native preparation; no live download lock was removed.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    try { return await work(); }
    finally { if ((await readJSON(filename))?.token === token) await rm(filename, { force: true }); }
  } finally { await rm(candidate, { force: true }); }
}

export async function obtainAsset(asset, filename, allowLocal = false, progress) {
  return withCacheLock(filename + '.lock', () => obtainLockedAsset(asset, filename, allowLocal, progress));
}
async function obtainLockedAsset(asset, filename, allowLocal, progress) {
  assert(/^[a-f0-9]{64}$/.test(asset.sha256), 'Require a pinned SHA256');
  const url = new URL(asset.url);
  if (url.protocol !== 'file:') return download(asset, filename, progress);
  assert(allowLocal, 'Local assets require an explicitly supplied local manifest');
  if (await sha256(filename).catch(error => { if (error.code !== 'ENOENT') throw error; }) === asset.sha256) return;
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = filename + '.' + randomUUID() + '.part';
  try {
    await copyFile(fileURLToPath(url), temporary);
    assert.equal(await sha256(temporary), asset.sha256, 'SHA256 mismatch: local asset');
    await rename(temporary, filename);
  } finally { await rm(temporary, { force: true }); }
}

export async function extractArchive(filename, directory) {
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar';
  const entries = await runFile(tar, ['-tf', filename]);
  for (const entry of entries.split(/\r?\n/).filter(Boolean)) relativePath(directory, entry);
  await mkdir(directory, { recursive: true });
  await runFile(tar, ['-xf', filename, '-C', directory]);
}

export async function writeJSON(filename, value) {
  return writeAtomic(filename, JSON.stringify(value, null, 2) + '\n');
}

export async function writeAtomic(filename, value) {
  const temporary = filename + '.' + randomUUID() + '.tmp';
  try { await writeFile(temporary, value, { mode: 0o600 }); await rename(temporary, filename); }
  finally { await rm(temporary, { force: true }); }
}

export async function readJSON(filename) {
  try { return JSON.parse(await readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function executable(filename) { await access(filename, constants.X_OK); return filename; }

export function nativeComponents(info) { return info.media ? ['browser', 'media'] : ['browser', 'ffmpeg', 'ffprobe']; }
