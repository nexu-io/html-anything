import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkReleaseVersion } from '../../scripts/release-version.mjs';
import { writeJSON } from '../../scripts/runtime-assets.mjs';

// Bound propagation/network retries; invalid bytes and authorization errors never retry.
export async function registryRead(url, consume, { fetcher = fetch, timeout = 15 * 60_000,
  now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), log = console.log } = {}) {
  const started = now(), deadline = started + timeout;
  for (let attempt = 1; ; attempt++) {
    let response, retry;
    try {
      response = await fetcher(url, { redirect: 'error', headers: { 'cache-control': 'no-cache' },
        signal: AbortSignal.timeout(Math.max(1, Math.min(30_000, deadline - now()))) });
      retry = [404, 408, 429].includes(response.status) || response.status >= 500;
      log(`Registry attempt ${attempt}: HTTP ${response.status}, ${Math.round((now() - started) / 1000)}s elapsed`);
      if (!retry) {
        assert(response.ok, `Registry request failed: HTTP ${response.status}`);
        return await consume(response);
      }
    } catch (error) {
      if (!(error instanceof TypeError) && !['TimeoutError', 'AbortError'].includes(error.name)) throw error;
      retry = true;
      log(`Registry attempt ${attempt}: network unavailable, ${Math.round((now() - started) / 1000)}s elapsed`);
    }
    await response?.body?.cancel().catch(() => {});
    const remaining = deadline - now();
    assert(remaining > 0, 'REGISTRY_NOT_READY: public download did not become available before the deadline');
    await sleep(Math.min(10_000, remaining));
  }
}

export async function verifyRegistryDownload(directory, { destination, ...options } = {}) {
  await rm(path.join(directory, 'registry-package.json'), { force: true });
  const c = JSON.parse(await readFile(path.join(directory, 'candidate.json')));
  assert.equal(c.packageName, '@openmotion/app');
  checkReleaseVersion(c.version); assert(c.version.includes('-test.'));
  assert.equal(c.tgz, `openmotion-app-${c.version}.tgz`);
  assert.match(c.tgzSHA256, /^[a-f0-9]{64}$/);
  const temporary = destination || await mkdtemp(path.join(os.tmpdir(), 'om-download-'));
  try {
    const metadata = await registryRead(`https://registry.npmjs.org/@openmotion%2fapp/${c.version}`, r => r.json(), options);
    assert.equal(metadata.name, c.packageName); assert.equal(metadata.version, c.version);
    assert.equal(metadata.dist.integrity, c.integrity, 'Published npm version has different bytes');
    const url = new URL(metadata.dist.tarball);
    assert(url.protocol === 'https:' && url.hostname === 'registry.npmjs.org' && !url.username && !url.password, 'Require the public npm tarball origin');
    const bytes = await registryRead(url, async response => {
      assert(Number(response.headers.get('content-length') || 0) < 150 * 1024 * 1024);
      const buffer = Buffer.from(await response.arrayBuffer());
      assert(buffer.length < 150 * 1024 * 1024);
      return buffer;
    }, options);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), c.tgzSHA256, 'Registry tgz SHA256 mismatch');
    assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), c.integrity, 'Registry tgz integrity mismatch');
    const tgz = path.join(temporary, c.tgz);
    await writeFile(tgz, bytes);
    const report = { schemaVersion: 1, status: 'passed', version: c.version, sourceCommit: c.sourceCommit,
      tgzSHA256: c.tgzSHA256, integrity: c.integrity, registryDownload: 'passed', nativeInstallation: 'not-run' };
    await writeJSON(path.join(directory, 'registry-package.json'), report);
    return { tgz, report };
  } finally { if (!destination) await rm(temporary, { recursive: true, force: true }); }
}
