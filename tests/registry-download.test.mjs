import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { candidateFixture } from './release-fixture.mjs';
import { registryRead, registryReport, verifyRegistryDownload } from '../.github/scripts/motion-registry.mjs';
import { promoteTest } from '../.github/scripts/motion-release.mjs';

function clock(fetcher) {
  let time = 0;
  return { fetcher, timeout: 20_000, now: () => time, sleep: async ms => { time += ms; }, log: () => {} };
}

test('registry propagation, rate limits, server errors and interrupted reads retry within a deadline', async () => {
  for (const unavailable of [404, 408, 429, 503, 'network', 'body']) {
    let calls = 0;
    const options = clock(async (_, request) => {
      assert.equal(request.headers['cache-control'], 'no-cache');
      assert(!request.headers.Authorization);
      if (++calls > 1) return Response.json({ ready: true });
      if (unavailable === 'network') throw new TypeError('fetch failed');
      if (unavailable === 'body') return { ok: true, status: 200, json: async () => { throw new TypeError('terminated'); } };
      return new Response('', { status: unavailable });
    });
    assert.deepEqual(await registryRead('https://registry.npmjs.org/example', r => r.json(), options), { ready: true });
    assert.equal(calls, 2);
  }
  let calls = 0;
  await assert.rejects(registryRead('https://registry.npmjs.org/example', r => r.json(), clock(async () => { calls++; return new Response('', { status: 404 }); })), /REGISTRY_NOT_READY/);
  assert.equal(calls, 3);
  for (const status of [401, 403, 400]) {
    calls = 0;
    await assert.rejects(registryRead('https://registry.npmjs.org/example', r => r.json(), clock(async () => { calls++; return new Response('', { status }); })), new RegExp('HTTP ' + status));
    assert.equal(calls, 1);
  }
});

test('public download verifies both hashes against the frozen candidate without executing or publishing', async t => {
  const f = await candidateFixture(t), bytes = await readFile(path.join(f.directory, f.candidate.tgz));
  const metadata = { name: f.candidate.packageName, version: f.candidate.version,
    dist: { integrity: f.candidate.integrity, tarball: 'https://registry.npmjs.org/@openmotion/app/-/app.tgz' } };
  let wrongBytes = false, downloads = 0;
  const options = clock(async url => {
    if (String(url).endsWith('.tgz')) { downloads++; return new Response(wrongBytes ? 'different bytes' : bytes); }
    return Response.json(metadata);
  });
  const { report } = await verifyRegistryDownload(f.directory, options);
  assert.equal(report.nativeInstallation, 'not-run');
  assert.equal((await registryReport(f.directory, f.candidate)).tgzSHA256, f.candidate.tgzSHA256);
  wrongBytes = true;
  await assert.rejects(verifyRegistryDownload(f.directory, options), /SHA256 mismatch/);
  await assert.rejects(registryReport(f.directory, f.candidate), /ENOENT/, 'A failed download invalidates any stale success report');
  assert.equal(downloads, 2, 'Corrupt bytes must not be retried or passed');
  metadata.dist.integrity = 'different';
  await assert.rejects(verifyRegistryDownload(f.directory, options), /different bytes/);
  assert.equal(downloads, 2);
  metadata.dist.integrity = f.candidate.integrity;
  metadata.dist.tarball = 'https://private.invalid/app.tgz';
  await assert.rejects(verifyRegistryDownload(f.directory, options), /public npm tarball origin/);
  assert.equal(downloads, 2);
});

test('independent platform results do not gate test promotion or masquerade as platform acceptance', async t => {
  const f = await candidateFixture(t);
  await writeFile(path.join(f.directory, 'registry-win32-x64.json'), JSON.stringify({ status: 'failed' }));
  const result = await promoteTest(f.directory, f.inputs, { env: f.env,
    fetcher: async () => Response.json({ versions: { [f.candidate.version]: { dist: { integrity: f.candidate.integrity } } }, 'dist-tags': { test: f.candidate.version, latest: '0.5.0' } }),
    run: async () => { throw Error('Already promoted: no write permitted'); } });
  assert.equal(result.registryVerification.registryDownload, 'passed');
  assert.equal(result.platformVerification.status, 'independent-not-attached');
});

test('standalone installation workflow is read-only and exercises both platforms against test.7 on PRs', async () => {
  const workflow = await readFile(new URL('../.github/workflows/motion-install-check.yml', import.meta.url), 'utf8');
  for (const expected of ['pull_request:', 'workflow_dispatch:', '0.6.4-test.7', 'macos-26', 'windows-2025', 'fail-fast: false', 'downloadCandidate', 'validateSource', 'motion-registry-smoke.mjs', 'if: always()']) assert(workflow.includes(expected), expected);
  assert(!/id-token:|secrets\.|secrets:|npm publish|dist-tag add|s3api|motion-release\.mjs (?:npm|promote-test|archive)/.test(workflow.replace('No npm publish,', 'No publication,')));
  const smoke = workflow.split('      - name: Install the public version')[1].split('      - name: Retain')[0];
  assert(!smoke.includes('GH_TOKEN') && !smoke.includes('github.token'));
});
