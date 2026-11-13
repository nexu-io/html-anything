import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { isMain } from '../shared/entry.ts';
import { lfsPointer, maxLfsAssetBytes, repositoryMediaFile } from '../shared/repository-template-catalog.ts';
import { validateMediaManifest } from '../shared/repository-media.ts';

const maxGitFileBytes = 1024 * 1024;
const maxCheckoutBytes = 180 * 1024 * 1024;
function git(cwd: string, args: string[], input?: string) {
  const result = spawnSync('git', args, { cwd, input, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message);
  return result.stdout;
}

/** Inspect the index and newly introduced history, without downloading LFS media. */
export function checkRepositoryStorage(cwd: string, base?: string, options: { finalTreeOnly?: boolean } = {}) {
  if (base) assert(/^[a-f0-9]{40}$/.test(base), 'Use a full base commit SHA');
  const errors: string[] = [];
  const entries = git(cwd, ['ls-files', '--stage', '-z']).toString().split('\0').filter(Boolean).map(line => {
    const match = /^(\d+) ([a-f0-9]+) 0\t([\s\S]+)$/.exec(line);
    assert(match, 'Resolve index conflicts before checking storage');
    return { mode: match[1], oid: match[2], name: match[3] };
  });
  const oids = [...new Set(entries.map(entry => entry.oid))];
  const sizes = new Map(git(cwd, ['cat-file', '--batch-check=%(objectname) %(objectsize)'], oids.join('\n') + '\n')
    .toString().trim().split('\n').filter(Boolean).map(line => {
      const [oid, size] = line.split(' ');
      return [oid, Number(size)] as const;
    }));
  const attributes = git(cwd, ['check-attr', '--cached', '-z', '--stdin', 'filter'], entries.map(entry => entry.name).join('\0') + '\0').toString().split('\0');
  const filters = new Map<string, string>();
  for (let i = 0; i + 2 < attributes.length; i += 3) filters.set(attributes[i], attributes[i + 2]);
  const small = oids.filter(oid => sizes.get(oid)! <= 1024);
  const output = small.length ? git(cwd, ['cat-file', '--batch'], small.join('\n') + '\n') : Buffer.alloc(0);
  const contents = new Map<string, Buffer>();
  let offset = 0;
  for (const oid of small) {
    const end = output.indexOf(10, offset);
    const size = sizes.get(oid)!;
    contents.set(oid, output.subarray(end + 1, end + 1 + size));
    offset = end + size + 2;
  }
  const changed = new Set(git(cwd, ['diff', '--cached', '--name-only', '-z', '--diff-filter=AM', ...(base ? [base] : [])]).toString().split('\0'));
  let gitBytes = 0, lfsBytes = 0, lfsFiles = 0;
  for (const entry of entries) {
    const size = sizes.get(entry.oid)!;
    gitBytes += size;
    if (size > maxGitFileBytes && changed.has(entry.name)) errors.push(`${entry.name}: staged ordinary Git file exceeds 1 MiB; use LFS or Prepare PR media`);
    const bytes = contents.get(entry.oid), pointer = bytes && lfsPointer(bytes);
    if (filters.get(entry.name) !== 'lfs' && !pointer && !bytes?.toString().startsWith('version https://git-lfs.github.com/spec/v1')) continue;
    if (!pointer || filters.get(entry.name) !== 'lfs' || !['100644', '100755'].includes(entry.mode)) {
      errors.push(`${entry.name}: require a canonical LFS pointer and staged LFS attributes`);
      continue;
    }
    if (!repositoryMediaFile.test(entry.name) && !/\.motion$/i.test(entry.name)) errors.push(`${entry.name}: LFS is for media and optional template archives`);
    if (pointer.bytes > maxLfsAssetBytes) errors.push(`${entry.name}: LFS file exceeds 50 MiB`);
    lfsBytes += pointer.bytes;
    lfsFiles++;
  }
  if (gitBytes > maxCheckoutBytes) errors.push('Ordinary Git checkout exceeds 180 MiB; move optional media to public storage or review the budget');
  if (base && !options.finalTreeOnly) {
    const objects = git(cwd, ['rev-list', '--objects', 'HEAD', '--not', base]).toString().trim().split('\n').filter(Boolean);
    if (objects.length) {
      const metadata = git(cwd, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], objects.map(line => line.split(' ')[0]).join('\n') + '\n').toString().trim().split('\n');
      for (const line of metadata) {
        const [oid, type, size] = line.split(' ');
        if (type === 'blob' && Number(size) > maxGitFileBytes) errors.push(`History blob ${oid}: new ordinary Git file exceeds 1 MiB, even if later deleted; use Git LFS for media`);
      }
    }
  }
  const manifest = entries.find(entry => entry.name === 'repository-media.json');
  if (manifest) {
    try {
      const media = validateMediaManifest(JSON.parse(git(cwd, ['cat-file', 'blob', manifest.oid]).toString()));
      for (const file of media.files)
        if (entries.some(entry => entry.name === file.path)) errors.push(`${file.path}: transferred media must not also be stored in Git`);
    } catch (error) { errors.push((error as Error).message); }
  }
  return { errors, gitBytes, lfsBytes, lfsFiles };
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2), finalTreeOnly = args.includes('--final-tree');
  const base = args.filter(arg => arg !== '--final-tree');
  assert(base.length <= 1, 'Usage: check-repository-storage.ts [base-sha] [--final-tree]');
  const result = checkRepositoryStorage(process.cwd(), base[0] || process.env.BASE_SHA, { finalTreeOnly });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
