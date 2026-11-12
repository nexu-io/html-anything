import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { installLibrarySkill } from '../scripts/install-library-skill.mjs';

const pairs = { brandkit: 'openmotion-brandkit', 'presenter-story': 'openmotion-presenter-story', 'motion-design-remix': 'openmotion-design-remix' };
async function isolated(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'openmotion-library-install-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

for (const [old, canonical] of Object.entries(pairs)) {
  test(`standalone ${old} installs one canonical payload and forwards to it`, async t => {
    const root = await isolated(t), destination = path.join(root, 'skills');
    const result = await installLibrarySkill(old, destination);
    assert.deepEqual((await readdir(destination)).sort(), [old, canonical].sort());
    assert.equal(result.entry, path.join(destination, old, 'SKILL.md'));
    const alias = await readFile(result.entry, 'utf8');
    assert.match(alias, /disable-model-invocation: true/);
    const target = alias.match(/\]\((\.\.\/[^)]+\/SKILL\.md)\)/)[1];
    const entry = path.resolve(path.dirname(result.entry), target);
    assert.equal(await readFile(entry, 'utf8'), await readFile(`library/skills/${canonical}/SKILL.md`, 'utf8'));
    assert.deepEqual((await readdir(path.join(destination, old))).sort(), ['SKILL.md', 'agents']);
    // Selecting both names, in either order, reuses the same checked payload.
    await installLibrarySkill(canonical, destination);
    await installLibrarySkill(old, destination);
    assert.deepEqual((await readdir(destination)).sort(), [old, canonical].sort());
    if (old === 'presenter-story') {
      const guide = await readFile(path.join(destination, canonical, 'references/workflow-demo/MOTION_DESIGN.md'), 'utf8');
      assert(guide.length > 100);
      assert((await readFile(path.join(destination, canonical, 'assets/john-tagudin-capso-result.mp4'))).length > 1000);
    }
    if (old === 'motion-design-remix') {
      // Invoke from the alias location: the forwarded workflow owns all relative resources.
      for (const id of ['ui-3d-reveal', 'wireframe-portal-title', 'canopy-part-title', 'code-3d-extrude', 'code-particle-assemble', 'liquid-glass-widgets']) {
        const output = path.join(root, id);
        const invoked = spawnSync(process.execPath, [path.join(path.dirname(entry), 'scripts/materialize.mjs'), id, 'remix', output], { cwd: path.dirname(result.entry), encoding: 'utf8' });
        assert.equal(invoked.status, 0, invoked.stderr);
        assert((await readFile(path.join(output, 'index.html'), 'utf8')).length > 100);
        assert((await readFile(path.join(output, 'vendor/manifest.json'), 'utf8')).length > 100);
      }
    }
  });
  test(`standalone ${canonical} installs without legacy payloads`, async t => {
    const destination = await isolated(t);
    await installLibrarySkill(canonical, destination);
    assert.deepEqual(await readdir(destination), [canonical]);
  });
}

test('installation preserves customized dependencies and does not leave a partial alias', async t => {
  const root = await isolated(t);
  await installLibrarySkill('openmotion-brandkit', root);
  const file = path.join(root, 'openmotion-brandkit/SKILL.md');
  await writeFile(file, 'User-owned instructions');
  await assert.rejects(installLibrarySkill('brandkit', root), /Existing Skill differs/);
  assert.equal(await readFile(file, 'utf8'), 'User-owned instructions');
  assert.deepEqual(await readdir(root), ['openmotion-brandkit']);
  await assert.rejects(installLibrarySkill('../foreign', root), /Unknown Library Skill/);
});

// Legacy single-folder recovery intentionally retains its original raw-media snapshot.
// Compare hydrated content trees so moving the same bytes to LFS does not change the pin.
function hydratedSkillTree(relative) {
  const run = (args, input) => {
    const result = spawnSync('git', args, { encoding: 'utf8', input });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const entries = run(['ls-tree', '-r', '-z', `HEAD:${relative}`]).split('\0').filter(Boolean);
  const directories = new Map([['', []]]);
  for (const entry of entries) {
    const [metadata, name] = entry.split('\t');
    let [mode, type, oid] = metadata.split(' ');
    if (name.endsWith('.mp4')) oid = run(['hash-object', '--no-filters', relative + '/' + name]);
    let directory = path.posix.dirname(name);
    if (directory === '.') directory = '';
    let ancestor = directory;
    while (ancestor) {
      if (!directories.has(ancestor)) directories.set(ancestor, []);
      ancestor = path.posix.dirname(ancestor);
      if (ancestor === '.') ancestor = '';
    }
    directories.get(directory).push(`${mode} ${type} ${oid}\t${path.posix.basename(name)}\0`);
  }
  for (const directory of [...directories.keys()].sort((a, b) => b.split('/').length - a.split('/').length || b.length - a.length)) {
    const tree = run(['mktree', '--missing', '-z'], directories.get(directory).join(''));
    if (!directory) return tree;
    const parent = path.posix.dirname(directory);
    directories.get(parent === '.' ? '' : parent).push(`040000 tree ${tree}\t${path.posix.basename(directory)}\0`);
  }
}

test('a generic single-folder alias installation includes matching pinned dependency recovery', async t => {
  const root = await isolated(t);
  for (const [old, canonical] of Object.entries(pairs)) {
    const alias = path.join(root, old);
    await cp(`library/skills/${old}`, alias, { recursive: true });
    const text = await readFile(path.join(alias, 'SKILL.md'), 'utf8');
    const match = text.match(/npx skills add (https:\/\/github.com\/nexu-io\/openmotion\/tree\/([a-f0-9]{40})\/library\/skills) --skill (openmotion-[a-z-]+)/);
    assert(match, 'A single copied folder must explain how to recover its dependency');
    assert.equal(match[3], canonical);
    // Verify the entire pinned dependency tree without fetching historical objects in shallow CI.
    const trees = {
      'openmotion-brandkit': '69ccb4e1b92c9a2a75edc1a84d1b98322c549e29',
      'openmotion-presenter-story': '85619c143a5eebc9f613af0fd0190a6e78a7f215',
      'openmotion-design-remix': '18dc7b5af383fac1eacd1dfdab87bf31af76efa3',
    };
    assert.equal(match[2], 'af755bcdd7f8af257186ff8723aedf78b176577a');
    assert.equal(hydratedSkillTree(`library/skills/${canonical}`), trees[canonical], 'Pinned fallback workflow and all hydrated resources must match this version');
  }
});
