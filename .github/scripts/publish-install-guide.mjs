import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';

export function storagePlan(record, { endpoint, bucket, publicOrigin }) {
  const api = new URL(endpoint), origin = new URL(publicOrigin);
  assert(api.protocol === 'https:' && api.hostname.endsWith('.r2.cloudflarestorage.com') && api.pathname === '/' && !api.port, 'Require an R2 S3 HTTPS origin');
  for (const url of [api, origin]) assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'Require plain HTTPS origins');
  assert(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket || ''), 'Require the configured R2 bucket');
  assert(['test', 'stable'].includes(record.channel), 'Unknown publication channel');
  assert(/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-test\.[1-9]\d*(?:\.[1-9]\d*)*)?$/.test(record.version), 'Invalid guide version');
  assert.equal(record.version.includes('-test.'), record.channel === 'test', 'Channel and version differ');
  const prefix = record.channel === 'test' ? 'open-motion/dev' : 'open-motion';
  return { endpoint: api.origin, bucket, publicOrigin: origin.origin, versionKey: `${prefix}/${record.version}/install.md`, legacyVersionKey: `${prefix}/versions/${record.version}/install.md`, fixedKey: `${prefix}/install.md` };
}

export async function publishGuide(directory, config, { run = runFile, fetcher = fetch } = {}) {
  const file = path.join(directory, 'install.md'), record = JSON.parse(await readFile(path.join(directory, 'install-record.json'), 'utf8'));
  assert.equal(record.candidate, false, 'Build previews cannot be published');
  assert.equal(await sha256(file), record.guideSHA256, 'Generated guide changed after validation');
  const plan = storagePlan(record, config), expected = await readFile(file);
  const args = ['--endpoint-url', plan.endpoint, '--region', 'auto', 's3api'];
  const aws = async (operation, rest) => JSON.parse(await run('aws', [...args, operation, '--bucket', plan.bucket, ...rest]) || '{}');
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-install-publish-'));
  try {
    const get = async (key, destination) => {
      try { const response = await aws('get-object', ['--key', key, destination]); return { etag: response.ETag, bytes: await readFile(destination) }; }
      catch (error) { if (/NoSuchKey|\(404\)|Not Found/.test(error.message)) return null; throw error; }
    };
    const verifyPublic = async key => {
      const url = new URL('/' + key, plan.publicOrigin);
      const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20_000), headers: { 'cache-control': 'no-cache', 'user-agent': 'OpenMotion-install-publisher' } });
      assert(response.ok, `Public installation guide returned HTTP ${response.status}`);
      assert(Buffer.from(await response.arrayBuffer()).equals(expected), 'Public installation guide bytes differ');
    };
    const put = (key, condition, cache) => aws('put-object', ['--key', key, '--body', file, '--content-type', 'text/markdown; charset=utf-8', '--cache-control', cache, ...condition]);
    const existing = await get(plan.versionKey, path.join(work, 'version.md'));
    const legacy = await get(plan.legacyVersionKey, path.join(work, 'legacy-version.md'));
    if (legacy) assert(legacy.bytes.equals(expected), 'An immutable legacy version already has different installation instructions');
    if (existing) assert(existing.bytes.equals(expected), 'An immutable version already has different installation instructions');
    else await put(plan.versionKey, ['--if-none-match', '*'], 'public, max-age=31536000, immutable');
    await verifyPublic(plan.versionKey);
    const previous = await get(plan.fixedKey, path.join(work, 'previous.md'));
    if (previous) {
      assert(previous.etag, 'Existing guide requires an ETag for conditional promotion');
      await writeFile(path.join(directory, 'previous-install.md'), previous.bytes);
    }
    const publication = { ...record, ...plan, previousSHA256: previous ? createHash('sha256').update(previous.bytes).digest('hex') : null,
      previousETag: previous?.etag ?? null, phase: 'before-fixed-promotion' };
    await writeJSON(path.join(directory, 'publication.json'), publication);
    if (!previous?.bytes.equals(expected)) {
      publication.phase = 'fixed-write-attempted'; await writeJSON(path.join(directory, 'publication.json'), publication);
      await put(plan.fixedKey, previous ? ['--if-match', previous.etag] : ['--if-none-match', '*'], 'public, max-age=60, must-revalidate');
    }
    publication.phase = 'fixed-written-public-unverified'; await writeJSON(path.join(directory, 'publication.json'), publication);
    await verifyPublic(plan.fixedKey);
    publication.phase = 'verified'; await writeJSON(path.join(directory, 'publication.json'), publication);
    return publication;
  } finally { await rm(work, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 3, 'Usage: publish-install-guide.mjs <generated-guide-directory>');
  for (const name of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) assert(process.env[name], `Missing publication credential: ${name}`);
  await publishGuide(path.resolve(process.argv[2]), { endpoint: process.env.MOTION_R2_ENDPOINT, bucket: process.env.MOTION_R2_BUCKET, publicOrigin: process.env.MOTION_INSTALL_PUBLIC_ORIGIN });
}
