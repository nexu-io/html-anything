import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { isMain } from '../shared/entry.ts';
import { lfsPointer, maxLfsAssetBytes, repositoryMediaFile } from '../shared/repository-template-catalog.ts';

const maxGitFileBytes = 1024 * 1024;
const maxCheckoutBytes = 320 * 1024 * 1024;
function git(cwd: string, args: string[], input?: string) {
  const result = spawnSync('git', args, { cwd, input, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message);
  return result.stdout;
}

/** Inspect the index and newly introduced history, without downloading LFS media. */
export function checkRepositoryStorage(cwd: string, base?: string) {
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
  const changed = new Set(git(cwd, ['diff', '--cached', '--name-only', '-z', '--diff-filter=AM']).toString().split('\0'));
  let gitBytes = 0, lfsBytes = 0, lfsFiles = 0;
  for (const entry of entries) {
    const size = sizes.get(entry.oid)!;
    gitBytes += size;
    if (size > maxGitFileBytes && changed.has(entry.name)) errors.push(`${entry.name}: staged ordinary Git file exceeds 1 MiB; use Git LFS for media`);
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
  if (gitBytes > maxCheckoutBytes) errors.push('Ordinary Git checkout exceeds 320 MiB; move optional media to LFS or review the budget');
  if (base) {
    assert(/^[a-f0-9]{40}$/.test(base), 'Use a full base commit SHA');
    const objects = git(cwd, ['rev-list', '--objects', 'HEAD', '--not', base]).toString().trim().split('\n').filter(Boolean);
    if (objects.length) {
      const metadata = git(cwd, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], objects.map(line => line.split(' ')[0]).join('\n') + '\n').toString().trim().split('\n');
      for (const line of metadata) {
        const [oid, type, size] = line.split(' ');
        if (type === 'blob' && Number(size) > maxGitFileBytes) errors.push(`History blob ${oid}: new ordinary Git file exceeds 1 MiB, even if later deleted; use Git LFS for media`);
      }
    }
  }
  return { errors, gitBytes, lfsBytes, lfsFiles };
}

if (isMain(import.meta.url)) {
  const result = checkRepositoryStorage(process.cwd(), process.argv[2] || process.env.BASE_SHA);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
