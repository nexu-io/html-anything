import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { checkRepositoryStorage } from '../scripts/check-repository-storage.ts';
import { requireDownloadedMedia } from '../scripts/distribution.ts';

function git(root: string, args: string[]) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
}
function fixture(t: { after: (fn: () => void) => void }) {
  const root = mkdtempSync(path.join(tmpdir(), 'openmotion-storage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, ['-c', 'init.templateDir=', 'init', '-b', 'main']);
  git(root, ['config', 'user.name', 'Storage test']); git(root, ['config', 'user.email', 'test@example.invalid']);
  git(root, ['config', 'core.hooksPath', '/dev/null']);
  const write = (name: string, data: string | Buffer) => {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); writeFileSync(path.join(root, name), data);
  };
  const stage = () => git(root, ['-c', 'filter.lfs.process=', '-c', 'filter.lfs.clean=cat', '-c', 'filter.lfs.required=false', 'add', '.']);
  write('README.md', '# Source'); stage(); git(root, ['commit', '-qm', 'Initial source']);
  return { root, write, stage, base: git(root, ['rev-parse', 'HEAD']) };
}
const pointer = (bytes = 2000000) => `version https://git-lfs.github.com/spec/v1\noid sha256:${'a'.repeat(64)}\nsize ${bytes}\n`;

test('storage checks staged pointer identities and attributes independently of downloaded working files', t => {
  const f = fixture(t);
  f.write('.gitattributes', 'docs/readme/**/*.mp4 filter=lfs diff=lfs merge=lfs -text\n');
  f.write('docs/readme/demo.mp4', pointer()); f.stage();
  f.write('docs/readme/demo.mp4', Buffer.alloc(2 * 1024 * 1024));
  const result = checkRepositoryStorage(f.root, f.base);
  assert.deepEqual(result.errors, []); assert.equal(result.lfsFiles, 1); assert.equal(result.lfsBytes, 2000000);
  f.write('.gitattributes', ''); f.stage();
  assert.match(checkRepositoryStorage(f.root).errors.join('\n'), /exceeds 1 MiB/);
  f.write('docs/readme/demo.mp4', pointer()); f.stage();
  assert.match(checkRepositoryStorage(f.root).errors.join('\n'), /staged LFS attributes/);
  f.write('.gitattributes', 'docs/readme/**/*.mp4 filter=lfs diff=lfs merge=lfs -text\n');
  f.write('docs/readme/demo.mp4', pointer(50 * 1024 * 1024 + 1)); f.stage();
  assert.match(checkRepositoryStorage(f.root).errors.join('\n'), /exceeds 50 MiB/);
});

test('new raw large blobs fail both before commit and after deletion from new history', t => {
  const f = fixture(t);
  f.write('demo.mp4', Buffer.alloc(1024 * 1024 + 1)); f.stage();
  assert.match(checkRepositoryStorage(f.root, f.base).errors.join('\n'), /staged ordinary Git file exceeds/);
  git(f.root, ['commit', '-qm', 'Add raw media']); rmSync(path.join(f.root, 'demo.mp4'));
  f.stage(); git(f.root, ['commit', '-qm', 'Delete raw media']);
  assert.match(checkRepositoryStorage(f.root, f.base).errors.join('\n'), /even if later deleted/);
  assert.deepEqual(checkRepositoryStorage(f.root, f.base, { finalTreeOnly: true }).errors, [], 'Squash accepts a sanitized final tree');
  f.write('still-large.mp4', Buffer.alloc(1024 * 1024 + 1)); f.stage(); git(f.root, ['commit', '-qm', 'Unclean final tree']);
  assert.match(checkRepositoryStorage(f.root, f.base, { finalTreeOnly: true }).errors.join('\n'), /ordinary Git file exceeds/, 'Committed large files in the final tree must still fail');
});

test('bundle construction refuses a pointer instead of silently shipping it as a video', async t => {
  const f = fixture(t); f.write('demo.mp4', pointer());
  await assert.rejects(requireDownloadedMedia(['demo.mp4'], f.root), /git lfs pull --include="demo.mp4" --exclude=""/);
  f.write('demo.mp4', Buffer.from([0, 1, 2, 255]));
  await requireDownloadedMedia(['demo.mp4'], f.root);
});

test('checkout budget counts every path even when Git deduplicates their blobs', t => {
  const f = fixture(t);
  f.write('shared.bin', Buffer.alloc(1024 * 1024, 42)); f.stage();
  const oid = git(f.root, ['rev-parse', ':shared.bin']);
  // Reuse one blob in the index without allocating a large working directory.
  for (let index = 0; index < 180; index++)
    git(f.root, ['update-index', '--add', '--cacheinfo', '100644', oid, `copy-${index}.bin`]);
  const result = checkRepositoryStorage(f.root);
  assert(result.gitBytes > 180 * 1024 * 1024);
  assert.match(result.errors.join('\n'), /checkout exceeds 180 MiB/);
});

test('repository LFS defaults keep a normal clone small and a scoped pull restores exact media', {
  skip: spawnSync('git', ['lfs', 'version']).status !== 0,
}, t => {
  const f = fixture(t);
  git(f.root, ['config', 'core.hooksPath', '.git/hooks']);
  git(f.root, ['lfs', 'install', '--local']);
  f.write('.lfsconfig', readFileSync(new URL('../.lfsconfig', import.meta.url)));
  f.write('.gitattributes', 'docs/readme/**/*.mp4 filter=lfs diff=lfs merge=lfs -text\n');
  const bytes = Buffer.alloc(2 * 1024 * 1024, 42);
  f.write('docs/readme/demo.mp4', bytes); git(f.root, ['add', '.']);
  git(f.root, ['commit', '-qm', 'Optional LFS media']);
  const remote = f.root + '-remote.git', clone = f.root + '-clone';
  t.after(() => { rmSync(remote, { recursive: true, force: true }); rmSync(clone, { recursive: true, force: true }); });
  git(f.root, ['init', '--bare', remote]); git(f.root, ['remote', 'add', 'origin', remote]);
  git(f.root, ['push', 'origin', 'main']); git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(f.root, ['-c', 'filter.lfs.process=git-lfs filter-process', '-c', 'filter.lfs.required=true', 'clone', remote, clone]);
  assert.match(readFileSync(path.join(clone, 'docs/readme/demo.mp4'), 'utf8'), /^version https:\/\/git-lfs/);
  git(clone, ['lfs', 'install', '--local']);
  git(clone, ['lfs', 'pull', '--include=docs/readme/**', '--exclude=']);
  const downloaded = readFileSync(path.join(clone, 'docs/readme/demo.mp4'));
  assert.equal(downloaded.length, bytes.length);
  assert.equal(createHash('sha256').update(downloaded).digest('hex'), createHash('sha256').update(bytes).digest('hex'));
});
