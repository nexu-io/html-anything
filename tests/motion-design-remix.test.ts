import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, lstat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve('library/skills/openmotion-design-remix');
const script = path.join(root, 'scripts/materialize.mjs');
const { localize } = await import('../library/skills/openmotion-design-remix/scripts/localize.mjs');
const invoke = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));

test('all six profiles create independent content variants and retain a usable handoff', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'motion-remix-test-'));
  try {
    for (const item of (await json(path.join(root, 'sources.json'))).items) {
      const original = await readFile(path.join(root, 'assets', item.id, 'index.html'), 'utf8');
      const preset = await json(path.join(root, 'presets', item.id + '.json'));
      for (const variant of ['reference', 'remix']) {
        const dest = path.join(dir, item.id + '-' + variant);
        const result = invoke(item.id, variant, dest);
        assert.equal(result.status, 0, result.stderr);
        const content = await readFile(path.join(dest, 'index.html'), 'utf8');
        if (variant === 'reference') assert.equal(content, localize(original));
        else {
          assert.notEqual(content, localize(original));
          for (const edit of preset.replacements) assert(content.includes(edit.to));
        }
        assert(!/https:\/\/(?:cdn\.jsdelivr|cdnjs\.cloudflare|fonts\.googleapis)/.test(content));
        assert((await lstat(path.join(dest, 'vendor/manifest.json'))).isFile());
        assert((await lstat(path.join(dest, 'reference.mp4'))).isFile());
        const design = await readFile(path.join(dest, 'MOTION_DESIGN.md'), 'utf8');
        for (const match of design.matchAll(/\]\(([^)]+)\)/g)) {
          if (!/^https?:/.test(match[1])) assert((await lstat(path.join(dest, match[1]))).isFile());
        }
        assert((await readFile(path.join(dest, 'LICENSE'), 'utf8')).includes('Apache License'));
        assert.equal((await json(path.join(dest, 'remix-record.json'))).variant, variant);
      }
      assert.equal(await readFile(path.join(root, 'assets', item.id, 'index.html'), 'utf8'), original);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('existing projects, symlinks, and mismatched presets are preserved or rejected before writing', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'motion-remix-guard-'));
  try {
    const id = 'wireframe-portal-title', dest = path.join(dir, 'project');
    assert.equal(invoke(id, 'remix', dest).status, 0);
    await writeFile(path.join(dest, 'my-work.txt'), 'Keep my edits');
    assert.notEqual(invoke(id, 'remix', dest).status, 0);
    assert.equal(await readFile(path.join(dest, 'my-work.txt'), 'utf8'), 'Keep my edits');
    const link = path.join(dir, 'link'); await symlink(dest, link);
    assert.notEqual(invoke(id, 'reference', link).status, 0);
    assert((await lstat(link)).isSymbolicLink());
    const preset = await json(path.join(root, 'presets', id + '.json'));
    const custom = path.join(dir, 'invalid.json'), missing = path.join(dir, 'missing');
    preset.replacements[0].count += 1;
    await writeFile(custom, JSON.stringify(preset));
    assert.notEqual(invoke(id, 'remix', missing, custom).status, 0);
    await assert.rejects(lstat(missing), { code: 'ENOENT' });
    preset.sourceSha256 = '0'.repeat(64);
    await writeFile(custom, JSON.stringify(preset));
    assert.notEqual(invoke(id, 'remix', missing, custom).status, 0);
    await assert.rejects(lstat(missing), { code: 'ENOENT' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
