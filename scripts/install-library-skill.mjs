import assert from 'node:assert/strict';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = fileURLToPath(new URL('../library/skills/', import.meta.url));
const aliases = { brandkit: 'openmotion-brandkit', 'presenter-story': 'openmotion-presenter-story', 'motion-design-remix': 'openmotion-design-remix' };
async function snapshot(directory, relative = '') {
  const files = {};
  for (const item of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.join(relative, item.name);
    assert(!item.isSymbolicLink(), 'Skill installation requires regular files: ' + name);
    if (item.isDirectory()) Object.assign(files, await snapshot(directory, name));
    else {
      assert(item.isFile(), 'Unsupported Skill entry: ' + name);
      files[name] = createHash('sha256').update(await readFile(path.join(directory, name))).digest('hex');
    }
  }
  return files;
}

// A legacy selection installs its canonical dependency once beside the thin alias.
// The destination is explicit; user-owned or different-version content is never overwritten.
export async function installLibrarySkill(name, destination) {
  const canonical = aliases[name] ?? name;
  assert(Object.values(aliases).includes(canonical), 'Unknown Library Skill: ' + name);
  assert(destination, 'An explicit destination skills directory is required');
  const directory = path.resolve(destination), names = canonical === name ? [canonical] : [canonical, name];
  await mkdir(directory, { recursive: true });
  const missing = [];
  for (const skill of names) {
    const target = path.join(directory, skill), expected = await snapshot(path.join(source, skill));
    const present = await lstat(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (present) {
      assert(present.isDirectory() && !present.isSymbolicLink(), 'Skill destination must be a regular directory: ' + target);
      assert.deepEqual(await snapshot(target), expected, 'Existing Skill differs; preserve it and choose another destination: ' + target);
    } else missing.push(skill);
  }
  const staging = await mkdtemp(path.join(directory, '.openmotion-install-'));
  try {
    for (const skill of missing) await cp(path.join(source, skill), path.join(staging, skill), { recursive: true, force: false, errorOnExist: true });
    for (const skill of missing) await rename(path.join(staging, skill), path.join(directory, skill));
  } finally { await rm(staging, { recursive: true, force: true }); }
  return { canonical, entry: path.join(directory, name, 'SKILL.md'), installed: names };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length, 4, 'Usage: node scripts/install-library-skill.mjs <skill-name> <destination-skills-directory>');
  console.log(JSON.stringify(await installLibrarySkill(process.argv[2], process.argv[3])));
}
