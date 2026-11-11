import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';
import { compareReleaseVersions } from '../../scripts/release-version.mjs';

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

export function movingGuide(text, record) {
  const tag = record.channel === 'test' ? 'test' : 'latest';
  return text.replaceAll(`${record.packageName}@${record.version}`, `${record.packageName}@${tag}`)
    .replace('This guide pins the complete npm application', `Current ${record.channel} version: ${record.version}. Commands follow the npm ${tag} tag for the complete application`)
    .replace('from this exact package', 'from the installed package')
    .replace('Pin this exact version when reproducing an issue.', 'Record and pin the installed version when reproducing an issue.')
    .replace('Release identity: source', 'Guide version identity (the npm tag may advance): source');
}

export async function publishGuide(directory, config, { run = runFile, fetcher = fetch, promote = true } = {}) {
  const file = path.join(directory, 'install.md'), record = JSON.parse(await readFile(path.join(directory, 'install-record.json'), 'utf8'));
  assert.equal(record.candidate, false, 'Build previews cannot be published');
  assert.equal(await sha256(file), record.guideSHA256, 'Generated guide changed after validation');
  const plan = storagePlan(record, config), expected = await readFile(file);
  const current = Buffer.from(movingGuide(expected.toString('utf8'), record));
  const args = ['--endpoint-url', plan.endpoint, '--region', 'auto', 's3api'];
  const aws = async (operation, rest) => JSON.parse(await run('aws', [...args, operation, '--bucket', plan.bucket, ...rest]) || '{}');
  const work = await mkdtemp(path.join(os.tmpdir(), 'motion-install-publish-'));
  try {
    const get = async (key, destination) => {
      try { const response = await aws('get-object', ['--key', key, destination]); return { etag: response.ETag, bytes: await readFile(destination) }; }
      catch (error) { if (/NoSuchKey|\(404\)|Not Found/.test(error.message)) return null; throw error; }
    };
    const verifyPublic = async (key, bytes = expected) => {
      const url = new URL('/' + key, plan.publicOrigin);
      const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20_000), headers: { 'cache-control': 'no-cache', 'user-agent': 'OpenMotion-install-publisher' } });
      assert(response.ok, `Public installation guide returned HTTP ${response.status}`);
      assert(Buffer.from(await response.arrayBuffer()).equals(bytes), 'Public installation guide bytes differ');
    };
    const currentFile = path.join(work, 'current-install.md');
    await writeFile(currentFile, current);
    const put = (key, condition, cache, body = file) => aws('put-object', ['--key', key, '--body', body, '--content-type', 'text/markdown; charset=utf-8', '--cache-control', cache, ...condition]);
    const existing = await get(plan.versionKey, path.join(work, 'version.md'));
    const legacy = await get(plan.legacyVersionKey, path.join(work, 'legacy-version.md'));
    if (legacy) assert(legacy.bytes.equals(expected), 'An immutable legacy version already has different installation instructions');
    if (existing) assert(existing.bytes.equals(expected), 'An immutable version already has different installation instructions');
    else await put(plan.versionKey, ['--if-none-match', '*'], 'public, max-age=31536000, immutable');
    await verifyPublic(plan.versionKey);
    if (!promote) {
      const publication = { ...record, ...plan, phase: 'version-verified', promoted: false };
      await writeJSON(path.join(directory, 'publication.json'), publication);
      return publication;
    }
    const previous = await get(plan.fixedKey, path.join(work, 'previous.md'));
    if (previous) {
      assert(previous.etag, 'Existing guide requires an ETag for conditional promotion');
      await writeFile(path.join(directory, 'previous-install.md'), previous.bytes);
      const version = previous.bytes.toString('utf8').match(/^# Install OpenMotion (\S+)\s*$/m)?.[1];
      assert(version, 'Existing default guide has no recognizable version; inspect it before promotion');
      if (compareReleaseVersions(version, record.version) > 0) {
        const publication = { ...record, ...plan, phase: 'superseded', promoted: false, currentVersion: version };
        await writeJSON(path.join(directory, 'publication.json'), publication);
        return publication;
      }
      if (version === record.version) assert(previous.bytes.equals(expected) || previous.bytes.equals(current), 'Same-version default guide has different bytes');
    }
    const publication = { ...record, ...plan, movingGuideSHA256: createHash('sha256').update(current).digest('hex'), previousSHA256: previous ? createHash('sha256').update(previous.bytes).digest('hex') : null,
      previousETag: previous?.etag ?? null, phase: 'before-fixed-promotion' };
    await writeJSON(path.join(directory, 'publication.json'), publication);
    if (!previous?.bytes.equals(current)) {
      publication.phase = 'fixed-write-attempted'; await writeJSON(path.join(directory, 'publication.json'), publication);
      await put(plan.fixedKey, previous ? ['--if-match', previous.etag] : ['--if-none-match', '*'], 'public, max-age=60, must-revalidate', currentFile);
    }
    publication.phase = 'fixed-written-public-unverified'; await writeJSON(path.join(directory, 'publication.json'), publication);
    await verifyPublic(plan.fixedKey, current);
    publication.phase = 'verified'; await writeJSON(path.join(directory, 'publication.json'), publication);
    return publication;
  } finally { await rm(work, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 3, 'Usage: publish-install-guide.mjs <generated-guide-directory>');
  for (const name of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']) assert(process.env[name], `Missing publication credential: ${name}`);
  await publishGuide(path.resolve(process.argv[2]), { endpoint: process.env.MOTION_R2_ENDPOINT, bucket: process.env.MOTION_R2_BUCKET, publicOrigin: process.env.MOTION_INSTALL_PUBLIC_ORIGIN });
}
