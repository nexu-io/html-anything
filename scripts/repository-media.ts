import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from '../shared/entry.ts';
import { downloadMedia, mediaDigest, mediaPath, validateMediaManifest } from '../shared/repository-media.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

async function safeDestination(directory: string, name: string): Promise<string> {
  mediaPath(name);
  let current = directory;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    const info = await lstat(current).catch(error => { if (error.code !== 'ENOENT') throw error; return undefined; });
    assert(!info?.isSymbolicLink(), 'Media operations must not follow symlinks');
  }
  return current;
}

export async function pullMedia(directory = root, prefix?: string, fetcher: typeof fetch = fetch) {
  const manifest = validateMediaManifest(JSON.parse(await readFile(path.join(directory, 'repository-media.json'), 'utf8')));
  if (prefix) mediaPath(prefix.replace(/\/$/, ''));
  const selected = manifest.files.filter(file => !prefix || file.path === prefix || file.path.startsWith(prefix.replace(/\/$/, '') + '/'));
  assert(!prefix || selected.length, 'No media matches the selected path');
  for (const file of selected) {
    const destination = await safeDestination(directory, file.path);
    const present = await readFile(destination).catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (present && present.length === file.bytes && mediaDigest(present) === file.sha256) continue;
    const bytes = await downloadMedia(file, fetcher);
    await mkdir(path.dirname(destination), { recursive: true });
    // Exclusive temporary file creation also prevents following a pre-existing symlink.
    const temporary = destination + '.download-' + process.pid;
    await writeFile(temporary, bytes, { flag: 'wx' });
    try { await rename(temporary, destination); }
    finally { await rm(temporary, { force: true }); }
  }
  return { selected: selected.length };
}

if (isMain(import.meta.url)) {
  const [prefix, extra] = process.argv.slice(2);
  assert(!extra, 'Usage: repository-media.ts [path-prefix]');
  console.log(JSON.stringify(await pullMedia(root, prefix)));
}
