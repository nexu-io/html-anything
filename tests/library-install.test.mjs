import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { installLibrarySkill } from '../scripts/install-library-skill.mjs';

const pairs = { brandkit: 'openmotion-brandkit', 'presenter-story': 'openmotion-presenter-story', 'motion-design-remix': 'openmotion-design-remix' };
// Original published forwarding bytes, retained only as migration test data.
const aliases = JSON.parse(await readFile(new URL('./legacy-library-aliases.json', import.meta.url), 'utf8'));
async function isolated(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'openmotion-library-install-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function legacyFixture(root, old) {
  const directory = path.join(root, old);
  for (const [file, content] of Object.entries(aliases[old])) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), content);
  }
  return directory;
}

for (const [old, canonical] of Object.entries(pairs)) {
  test(`standalone ${canonical} removes its unchanged retired entry and reuses one payload`, async t => {
    const root = await isolated(t), destination = path.join(root, 'skills');
    await legacyFixture(destination, old);
    const result = await installLibrarySkill(canonical, destination);
    assert.deepEqual(await readdir(destination), [canonical]);
    assert.equal(result.entry, path.join(destination, canonical, 'SKILL.md'));
    assert.deepEqual(result.removedLegacy, [old]);
    assert.deepEqual(result.preservedLegacy, []);
    assert.equal(await readFile(result.entry, 'utf8'), await readFile(`library/skills/${canonical}/SKILL.md`, 'utf8'));
    assert.deepEqual((await installLibrarySkill(canonical, destination)).installed, [canonical]);
    assert.deepEqual(await readdir(destination), [canonical]);
    if (old === 'presenter-story') {
      assert((await readFile(path.join(destination, canonical, 'references/workflow-demo/MOTION_DESIGN.md'), 'utf8')).length > 100);
      assert((await readFile(path.join(destination, canonical, 'assets/john-tagudin-capso-result.mp4'))).length > 1000);
    }
    if (old === 'motion-design-remix') {
      for (const id of ['ui-3d-reveal', 'wireframe-portal-title', 'canopy-part-title', 'code-3d-extrude', 'code-particle-assemble', 'liquid-glass-widgets']) {
        const output = path.join(root, id);
        const invoked = spawnSync(process.execPath, [path.join(destination, canonical, 'scripts/materialize.mjs'), id, 'remix', output], { cwd: root, encoding: 'utf8' });
        assert.equal(invoked.status, 0, invoked.stderr);
        assert((await readFile(path.join(output, 'index.html'), 'utf8')).length > 100);
        assert((await readFile(path.join(output, 'vendor/manifest.json'), 'utf8')).length > 100);
      }
    }
    await assert.rejects(installLibrarySkill(old, destination), /Unknown Library Skill/);
  });
}

test('standalone cleanup preserves customized, extra-file and symlink legacy folders', async t => {
  const root = await isolated(t);
  for (const kind of ['customized', 'extra-file', 'symlink']) {
    const destination = path.join(root, kind), legacy = await legacyFixture(destination, 'brandkit');
    if (kind === 'customized') await writeFile(path.join(legacy, 'SKILL.md'), 'User-owned instructions');
    if (kind === 'extra-file') await writeFile(path.join(legacy, 'notes.md'), 'User notes');
    if (kind === 'symlink') {
      const original = path.join(root, 'original');
      await mkdir(original); await writeFile(path.join(original, 'SKILL.md'), 'User workflow');
      await rm(legacy, { recursive: true });
      await symlink(original, legacy, process.platform === 'win32' ? 'junction' : 'dir');
    }
    const before = await readFile(path.join(legacy, 'SKILL.md'), 'utf8');
    const result = await installLibrarySkill('openmotion-brandkit', destination);
    assert.deepEqual(result.removedLegacy, []);
    assert.deepEqual(result.preservedLegacy, ['brandkit']);
    assert.equal(await readFile(path.join(legacy, 'SKILL.md'), 'utf8'), before);
    if (kind === 'extra-file') assert.equal(await readFile(path.join(legacy, 'notes.md'), 'utf8'), 'User notes');
  }
});

test('installation preserves customized canonical content before attempting legacy cleanup', async t => {
  const root = await isolated(t);
  await installLibrarySkill('openmotion-brandkit', root);
  const legacy = await legacyFixture(root, 'brandkit');
  const file = path.join(root, 'openmotion-brandkit/SKILL.md');
  await writeFile(file, 'User-owned instructions');
  await assert.rejects(installLibrarySkill('openmotion-brandkit', root), /Existing Skill differs/);
  assert.equal(await readFile(file, 'utf8'), 'User-owned instructions');
  assert.equal(await readFile(path.join(legacy, 'SKILL.md'), 'utf8'), aliases.brandkit['SKILL.md']);
  await assert.rejects(installLibrarySkill('../foreign', root), /Unknown Library Skill/);
});
