import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isMain } from '../shared/entry.ts';
import { checkTemplateLibrary } from './check-template-library.ts';
import { checkRepositoryStorage } from './check-repository-storage.ts';
import { lfsPointer } from '../shared/repository-template-catalog.ts';
import { boundedMediaBody, mediaDigest, mediaKey, mediaOrigin, maxMediaBytes, downloadMedia, validateMediaLock, validateMediaManifest, type MediaLock } from '../shared/repository-media.ts';
export type CleanupChange = { path: string; content: string | null };
export type CleanupPlan = { schemaVersion: 1; sourceSHA: string; pullNumber: number; changes: CleanupChange[]; media: MediaLock[] };

const execute = promisify(execFile);
const repository = 'nexu-io/openmotion';
export type TreeFile = { path: string; mode: string; sha: string; size: number; type: string };
type Inputs = { head: TreeFile[]; base: TreeFile[]; sourceSHA: string; pullNumber: number };
type Transfer = (file: MediaLock, bytes: Buffer) => Promise<void>;
const textFile = /\.(?:md|html?|css|json|[cm]?[jt]sx?|txt|ya?ml)$/i;
const mediaFile = /\.(?:mp4|mov|webm|m4v|avi|mp3|wav|ogg|m4a|aac|flac|png|jpe?g|webp|avif|gif|woff2?|ttf|otf|motion)$/i;
const videoOrAudio = /\.(?:mp4|mov|webm|m4v|avi|mp3|wav|ogg|m4a|aac|flac|motion)$/i;
const catalogAsset = /^library\/templates\/catalog\/([a-z][a-z0-9-]+)\/source\/(assets\/[\w/.@+ -]+)$/;
const jsonBytes = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');

export async function finalizeMediaCleanup(plan: CleanupPlan, upload: () => Promise<void>, currentHead: () => Promise<string>, push: () => Promise<void>) {
  await upload();
  assert.equal(await currentHead(), plan.sourceSHA, 'PR changed during upload; rerun against its new head');
  await push();
}

function replaceReference(text: string, relative: string, url: string) {
  const spellings = new Set([relative, relative.split('/').map(encodeURIComponent).join('/')]);
  for (const spelling of spellings) {
    const escaped = spelling.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`(^|[\\s"'(=])(?:\\./)?${escaped}(?=[\\s"')?#]|$)`, 'gm'), (_, prefix: string) => prefix + url);
  }
  return text;
}

/** Prepare only source/media edits; no PR code, hooks, dependencies or configuration is executed. */
export async function prepareMediaCleanup(inputs: Inputs, read: (file: TreeFile) => Promise<Buffer>, transfer?: Transfer): Promise<CleanupPlan> {
  const files = new Map(inputs.head.filter(file => file.type === 'blob').map(file => [file.path, file]));
  const previous = new Map(inputs.base.map(file => [file.path, file.sha]));
  const originals = new Map<string, Buffer>(), edits = new Map<string, Buffer | null>();
  const load = async (name: string) => {
    if (!originals.has(name)) {
      const file = files.get(name);
      assert(file?.mode === '100644' || file?.mode === '100755', 'Require regular source file: ' + name);
      originals.set(name, await read(file));
    }
    return originals.get(name)!;
  };
  const candidates = inputs.head.filter(file => file.type === 'blob' && previous.get(file.path) !== file.sha && mediaFile.test(file.path) &&
    /^(?:library|docs\/readme|examples)\//.test(file.path) && (videoOrAudio.test(file.path) || file.size > (catalogAsset.test(file.path) ? 100_000 : 1024 * 1024)));
  assert(candidates.length <= 100, 'Too many media files; split this PR');
  let total = 0;
  const locks: MediaLock[] = [];
  if (!candidates.length) return { schemaVersion: 1, sourceSHA: inputs.sourceSHA, pullNumber: inputs.pullNumber, changes: [], media: [] };
  for (const file of candidates) {
    assert(['100644', '100755'].includes(file.mode), 'Media must not be a symlink or submodule');
    if (file.path.startsWith('library/templates/catalog/')) assert(catalogAsset.test(file.path) && !file.path.endsWith('.motion'), 'Catalog media must be in source/assets/; archives are not source');
    assert(file.size <= maxMediaBytes, 'Git blob exceeds 50 MiB: ' + file.path);
    const raw = await load(file.path), pointer = lfsPointer(raw);
    assert(!raw.toString('utf8', 0, 64).startsWith('version https://git-lfs.github.com/spec/v1') || pointer, 'Malformed LFS pointer: ' + file.path);
    const bytes = pointer?.bytes ?? raw.length;
    assert(bytes > 0 && bytes <= maxMediaBytes, 'Media exceeds 50 MiB: ' + file.path);
    total += bytes;
    assert(total <= 320 * 1024 * 1024, 'PR transfer exceeds 320 MiB; split it');
    const sha256 = pointer?.sha256 ?? mediaDigest(raw);
    locks.push({ path: file.path, bytes, sha256, url: mediaOrigin + '/' + mediaKey(sha256, file.path) });
    validateMediaLock(locks.at(-1)!);
  }
  const manifestName = 'repository-media.json';
  const manifest = files.has(manifestName) ? validateMediaManifest(JSON.parse((await load(manifestName)).toString())) : { schemaVersion: 1 as const, files: [] as MediaLock[] };
  const templates = new Map<string, MediaLock[]>();
  const previousURLs = new Map<string, string>();
  for (const lock of locks) {
    edits.set(lock.path, null);
    const match = catalogAsset.exec(lock.path);
    if (match) templates.set(match[1], [...(templates.get(match[1]) ?? []), lock]);
    else {
      manifest.files = manifest.files.filter(file => file.path !== lock.path);
      manifest.files.push(lock);
    }
  }
  for (const [id, media] of templates) {
    const prefix = `library/templates/catalog/${id}/`, recordName = prefix + 'template.json';
    const record = JSON.parse((await load(recordName)).toString());
    const remote = new Map((record.remoteAssets ?? []).map((asset: { source: { path: string } }) => [asset.source.path, asset]));
    for (const lock of media) {
      const sourcePath = lock.path.slice((prefix + 'source/').length);
      const previous: any = remote.get(sourcePath);
      if (previous) previousURLs.set(previous.url, lock.url);
      remote.set(sourcePath, { url: lock.url, bytes: lock.bytes, sha256: lock.sha256, source: { path: sourcePath, bytes: lock.bytes, sha256: lock.sha256 } });
    }
    record.remoteAssets = [...remote.values()];
    edits.set(recordName, jsonBytes(record));
  }
  for (const file of inputs.head) {
    if (file.type !== 'blob' || !textFile.test(file.path) || file.size > 1024 * 1024 ||
      !(/^(?:docs\/|README(?:\.[\w-]+)?\.md$)/.test(file.path) || [...templates.keys()].some(id => file.path.startsWith(`library/templates/catalog/${id}/source/`))) || /\/(?:vendor|node_modules)\//.test(file.path) || /\/(?:manifest|template)\.json$/.test(file.path)) continue;
    const original = await load(file.path);
    let text = original.toString();
    for (const lock of locks) text = replaceReference(text, path.posix.relative(path.posix.dirname(file.path), lock.path), lock.url);
    for (const [previous, current] of previousURLs) text = replaceReference(text, previous, current);
    if (text !== original.toString()) edits.set(file.path, Buffer.from(text));
  }
  for (const [id, media] of templates) {
    const prefix = `library/templates/catalog/${id}/source/`, name = prefix + 'manifest.json';
    const sourceManifest = JSON.parse((await load(name)).toString());
    const entries = new Map(sourceManifest.files.map((file: { path: string }) => [file.path, file]));
    for (const lock of media) entries.set(lock.path.slice(prefix.length), { path: lock.path.slice(prefix.length), bytes: lock.bytes, sha256: lock.sha256 });
    for (const [filename, bytes] of edits) if (filename.startsWith(prefix) && bytes) entries.set(filename.slice(prefix.length), { path: filename.slice(prefix.length), bytes: bytes.length, sha256: mediaDigest(bytes) });
    sourceManifest.files = [...entries.values()].sort((a: any, b: any) => a.path.localeCompare(b.path));
    edits.set(name, jsonBytes(sourceManifest));
  }
  if (locks.some(lock => !catalogAsset.test(lock.path))) {
    manifest.files.sort((a, b) => a.path.localeCompare(b.path));
    validateMediaManifest(manifest);
    edits.set(manifestName, jsonBytes(manifest));
    let ignore = files.has('.gitignore') ? (await load('.gitignore')).toString() : '';
    for (const file of manifest.files) if (!ignore.split('\n').includes('/' + file.path)) ignore += '\n/' + file.path;
    edits.set('.gitignore', Buffer.from(ignore.trimEnd() + '\n'));
  }
  const changes: CleanupChange[] = [];
  for (const [name, bytes] of edits) {
    const original = files.has(name) ? await load(name) : null;
    if (original && bytes?.equals(original)) continue;
    changes.push({ path: name, content: bytes?.toString('base64') ?? null });
  }
  // Finish building every metadata edit before publishing anything.
  for (const lock of locks) if (transfer) await transfer(lock, originals.get(lock.path)!);
  return { schemaVersion: 1, sourceSHA: inputs.sourceSHA, pullNumber: inputs.pullNumber, changes, media: locks };
}

/** Conditional immutable writes and public byte verification; never overwrite an existing key. */
export async function publishMedia(lock: MediaLock, bytes: Buffer, options: { endpoint: string; bucket: string; run?: (args: string[]) => Promise<void>; fetcher?: typeof fetch }) {
  assert.equal(bytes.length, lock.bytes); assert.equal(mediaDigest(bytes), lock.sha256);
  const endpoint = new URL(options.endpoint);
  assert(endpoint.protocol === 'https:' && endpoint.hostname.endsWith('.r2.cloudflarestorage.com') && endpoint.pathname === '/' && !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash && !endpoint.port, 'Require the configured R2 HTTPS endpoint');
  assert(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(options.bucket), 'Invalid media bucket');
  validateMediaLock(lock);
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(lock.url, { method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (response.status !== 404) {
    assert.equal(response.status, 200, 'Cannot determine whether immutable media already exists');
    await downloadMedia(lock, fetcher); return;
  }
  const directory = await mkdtemp(path.join(tmpdir(), 'openmotion-media-upload-'));
  try {
    const file = path.join(directory, 'media'); await writeFile(file, bytes);
    const args = ['--endpoint-url', endpoint.origin, '--region', 'auto', 's3api', 'put-object', '--bucket', options.bucket,
      '--key', mediaKey(lock.sha256, lock.path), '--body', file, '--if-none-match', '*', '--content-type', contentType(lock.path), '--cache-control', 'public, max-age=31536000, immutable'];
    try {
      if (options.run) await options.run(args);
      else await execute('aws', args, { timeout: 180_000, env: { ...process.env, AWS_PAGER: '', AWS_EC2_METADATA_DISABLED: 'true' } });
    } catch (error) { if (!/PreconditionFailed|\(412\)/.test(String(error))) throw error; }
    await downloadMedia(lock, fetcher);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

function contentType(name: string) {
  const types: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', avi: 'video/x-msvideo', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac', webm: 'video/webm', mov: 'video/quicktime', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' };
  return types[path.extname(name).slice(1).toLowerCase()] ?? 'application/octet-stream';
}

export async function preparePullRequest(pullNumber: number, apply: boolean) {
  assert(Number.isSafeInteger(pullNumber) && pullNumber > 0, 'Use a PR number');
  if (apply && process.env.GITHUB_ACTIONS === 'true') {
    assert.equal(process.env.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Media transfer requires a maintainer-started workflow');
    assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Run the trusted media preparation workflow from main');
    assert.equal(process.env.GITHUB_REPOSITORY, repository);
    assert.equal(process.env.GITHUB_WORKFLOW_REF, repository + '/.github/workflows/prepare-pr-media.yml@refs/heads/main');
    assert(process.env.OPENMOTION_MEDIA_MAINTAINER_TOKEN, 'Configure OPENMOTION_MEDIA_MAINTAINER_TOKEN before starting media preparation');
  }
  // The maintainer's own GitHub identity retains access to allow-maintainer-edits forks.
  const token = process.env.OPENMOTION_MEDIA_MAINTAINER_TOKEN || (await execute('gh', ['auth', 'token'])).stdout.trim();
  const api = async (route: string, target = repository) => {
    assert(/^[\w.-]+\/[\w.-]+$/.test(target), 'Invalid GitHub repository');
    const response = await fetch('https://api.github.com/repos/' + target + '/' + route, {
      headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json' }, redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
    assert(response.ok, `GitHub read failed: HTTP ${response.status}`);
    return response.json() as Promise<any>;
  };
  const pr = await api('pulls/' + pullNumber);
  assert(!apply || !pr.draft, 'Finish the content review and mark the PR ready before preparing media');
  assert(pr.state === 'open' && pr.base.ref === 'main' && pr.head.repo, 'Require an open PR targeting main');
  assert(pr.head.repo.full_name === repository || pr.maintainer_can_modify, 'Ask the contributor to enable Allow edits by maintainers on the original PR');
  const settings = await fetch('https://api.github.com/repos/' + repository, { headers: { authorization: 'Bearer ' + token }, redirect: 'error' }).then(response => response.json()) as any;
  assert(settings.permissions?.push, 'The configured GitHub identity must have maintainer write access');
  assert(settings.allow_squash_merge && !settings.allow_merge_commit && !settings.allow_rebase_merge, 'Configure Squash merge only before transferring media; other merge methods retain intermediate large blobs');
  const head = await api(`git/trees/${pr.head.sha}?recursive=1`, pr.head.repo.full_name), base = await api(`git/trees/${pr.base.sha}?recursive=1`);
  assert(!head.truncated && !base.truncated, 'GitHub tree truncated; split this PR');
  const read = async (file: TreeFile) => {
    assert(file.size <= maxMediaBytes, 'Git blob exceeds media budget');
    const response = await fetch(`https://api.github.com/repos/${pr.head.repo.full_name}/git/blobs/${file.sha}`, { headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github.raw+json' }, redirect: 'error', signal: AbortSignal.timeout(120_000) });
    assert(response.ok, `GitHub blob unavailable: ${file.path}`);
    const bytes = await boundedMediaBody(response, file.size); assert.equal(bytes.length, file.size);
    return bytes;
  };
  const transfer: Transfer = async (lock, raw) => {
    let bytes = raw;
    if (lfsPointer(raw)) {
      const response = await fetch(`https://github.com/${pr.head.repo.full_name}.git/info/lfs/objects/batch`, {
        method: 'POST', headers: { authorization: 'Basic ' + Buffer.from('x-access-token:' + token).toString('base64'), 'content-type': 'application/vnd.git-lfs+json', accept: 'application/vnd.git-lfs+json' },
        body: JSON.stringify({ operation: 'download', transfers: ['basic'], objects: [{ oid: lock.sha256, size: lock.bytes }] }), redirect: 'error', signal: AbortSignal.timeout(30_000),
      });
      assert(response.ok, 'Cannot resolve existing LFS media');
      const batch: any = await response.json(), action = batch.objects?.[0]?.actions?.download;
      assert(action, 'LFS object is not available on the contributor remote');
      const url = new URL(action.href);
      assert(url.protocol === 'https:' && /(?:\.githubusercontent\.com|\.amazonaws\.com)$/.test(url.hostname) && !url.username && !url.password, 'Unexpected GitHub LFS download origin');
      const download = await fetch(url, { headers: action.header, redirect: 'error', signal: AbortSignal.timeout(120_000) });
      bytes = await boundedMediaBody(download, lock.bytes);
    }
    await publishMedia(lock, bytes, { endpoint: process.env.MOTION_R2_ENDPOINT ?? 'https://64ad4569ffd912432d6b86d5656484c4.r2.cloudflarestorage.com', bucket: process.env.MOTION_R2_BUCKET ?? 'open-design-releases' });
  };
  const inputs = { head: head.tree, base: base.tree, sourceSHA: pr.head.sha, pullNumber };
  const plan = await prepareMediaCleanup(inputs, read);
  const changed = new Map(inputs.base.map((file: TreeFile) => [file.path, file.sha]));
  for (const file of inputs.head) if (file.type === 'blob' && file.sha !== changed.get(file.path) && file.size > 1024 * 1024)
    assert(plan.media.some(lock => lock.path === file.path), 'Non-media Git blob exceeds 1 MiB: ' + file.path);
  console.log(JSON.stringify({ pullNumber, sourceSHA: plan.sourceSHA, files: plan.media.length, bytes: plan.media.reduce((sum, file) => sum + file.bytes, 0), apply }, null, 2));
  if (!apply || !plan.media.length) return plan;
  // Finish validation/planning first. Failed uploads leave the PR unchanged.
  await pushCleanup(plan, pr.head.repo.full_name, pr.head.ref, token, async push => finalizeMediaCleanup(plan, async () => {
    for (const lock of plan.media) await transfer(lock, await read(inputs.head.find((file: TreeFile) => file.path === lock.path)!));
  }, async () => (await api('pulls/' + pullNumber)).head.sha, push));
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY,
    `Prepared original PR #${pullNumber}: ${plan.media.length} media files were uploaded and publicly hash-verified.\n\nThe cleanup commit retains the original PR and contributor. Wait for CI and review of the new commit, then use Squash and merge. No PR was merged by this workflow.\n`, { flag: 'a' });
  return plan;
}

type GitRunner = (args: string[], input?: string, authenticated?: boolean) => Promise<string>;

export async function commitCleanup(plan: CleanupPlan, git: GitRunner, directory: string, identity: { login: string; id: number }) {
  assert(/^[a-f0-9]{40}$/.test(plan.sourceSHA), 'Invalid PR source SHA');
  await git(['update-ref', 'HEAD', plan.sourceSHA]);
  await git(['read-tree', plan.sourceSHA]);
  for (const change of plan.changes) {
    if (change.content === null) await git(['update-index', '--force-remove', '--', change.path]);
    else {
      const oid = await git(['hash-object', '-w', '--stdin'], Buffer.from(change.content, 'base64').toString());
      const existing = await git(['ls-files', '--stage', '--', change.path]);
      const mode = existing.startsWith('100755 ') ? '100755' : '100644';
      await git(['update-index', '--add', '--cacheinfo', mode, oid, change.path]);
    }
  }
  const errors = [...checkTemplateLibrary(directory), ...checkRepositoryStorage(directory).errors];
  assert.deepEqual(errors, [], 'Sanitized PR failed final-tree validation: ' + errors.join('\n'));
  const tree = await git(['write-tree']);
  assert(/^[\w-]+$/.test(identity.login) && Number.isSafeInteger(identity.id) && identity.id > 0, 'Invalid maintainer identity');
  return git(['-c', 'user.name=' + identity.login, '-c', `user.email=${identity.id}+${identity.login}@users.noreply.github.com`,
    'commit-tree', tree, '-p', plan.sourceSHA], 'chore: replace reviewed media with verified public links\n');
}

async function pushCleanup(plan: CleanupPlan, headRepository: string, branch: string, token: string, finish: (push: () => Promise<void>) => Promise<void>) {
  assert(/^[\w.-]+\/[\w.-]+$/.test(headRepository), 'Invalid contributor repository');
  const directory = await mkdtemp(path.join(tmpdir(), 'openmotion-media-commit-'));
  const git = async (args: string[], input?: string, authenticated = false) => {
    // git never checks out or executes contributor files, hooks, filters or .lfsconfig.
    const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: authenticated ? '1' : '0',
      ...(authenticated ? { GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: 'AUTHORIZATION: basic ' + Buffer.from('x-access-token:' + token).toString('base64') } : {}) };
    const child = execFile('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'credential.helper=', ...args], { cwd: directory, env, timeout: 180_000, maxBuffer: 1024 * 1024 });
    if (input !== undefined) child.stdin?.end(input);
    return new Promise<string>((resolve, reject) => {
      let output = '', error = ''; child.stdout?.on('data', chunk => output += chunk); child.stderr?.on('data', chunk => error += chunk);
      child.on('error', reject); child.on('close', code => code === 0 ? resolve(output.trim()) : reject(new Error('Git operation failed: ' + error)));
    });
  };
  try {
    await git(['-c', 'init.templateDir=', 'init', '-q']);
    await git(['fetch', '--depth=1', 'https://github.com/' + repository + '.git', `refs/pull/${plan.pullNumber}/head`], undefined, true);
    assert.equal(await git(['rev-parse', 'FETCH_HEAD']), plan.sourceSHA, 'PR changed before cleanup commit');
    const response = await fetch('https://api.github.com/user', { headers: { authorization: 'Bearer ' + token }, redirect: 'error' });
    assert(response.ok, 'Cannot resolve the maintainer identity');
    const identity: any = await response.json();
    const commit = await commitCleanup(plan, git, directory, identity);
    // This also checks fork write access before storage is touched. Nothing is pushed.
    await git(['push', '--dry-run', 'https://github.com/' + headRepository + '.git', `${commit}:refs/heads/${branch}`], undefined, true);
    await finish(async () => { await git(['push', 'https://github.com/' + headRepository + '.git', `${commit}:refs/heads/${branch}`], undefined, true); });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

if (isMain(import.meta.url)) {
  const [number, flag, extra] = process.argv.slice(2);
  assert(!extra && (!flag || flag === '--apply'), 'Usage: prepare-pr-media.ts <PR-number> [--apply]');
  await preparePullRequest(Number(number), flag === '--apply');
}
