import assert from 'node:assert/strict';
import { isUtf8 } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { isMain } from '../shared/entry.ts';
import {
  digest,
  assetFile,
  maxLocalAssetBytes,
  maxFileBytes,
  safePath,
  textFile,
  validateArchive,
  validateRecord,
  type CatalogManifest,
  type TemplateRecord,
} from './template-library.ts';

export const scope = 'library/templates/catalog/';
const videoOrArchive = /\.(?:mp4|mov|webm|m4v|avi|mp3|wav|ogg|m4a|aac|flac|zip|gz|tgz|tar|7z|motion)$/i;
const pointerPattern =
  /^version https:\/\/git-lfs.github.com\/spec\/v1\noid sha256:([a-f0-9]{64})\nsize ([1-9][0-9]*)\n$/;

type IndexedFile = { name: string; mode: string; oid: string; bytes: Buffer };
export function git(args: string[], cwd: string, input?: Buffer | string): Buffer {
  const result = spawnSync('git', args, { cwd, input, maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.error?.message || result.stderr.toString().trim());
  return result.stdout;
}
function blobs(cwd: string, oids: string[]): Map<string, Buffer> {
  if (!oids.length) return new Map();
  const output = git(['cat-file', '--batch'], cwd, oids.join('\n') + '\n');
  const result = new Map<string, Buffer>();
  let offset = 0;
  for (const oid of oids) {
    const end = output.indexOf(10, offset);
    const [actual, type, size] = output.subarray(offset, end).toString().split(' ');
    assert(actual === oid && type === 'blob', 'Cannot read staged template blob');
    result.set(oid, output.subarray(end + 1, end + 1 + Number(size)));
    offset = end + 2 + Number(size);
  }
  return result;
}

/** Read Git's index, not smudged files or unstaged changes. No media downloads or npm dependencies. */
export function checkTemplateLibrary(cwd: string, base?: string): string[] {
  const errors: string[] = [];
  const staged = git(['ls-files', '--stage', '-z', '--', scope], cwd)
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d+) ([a-f0-9]+) 0\t([\s\S]+)$/.exec(line);
      assert(match, 'Resolve template index conflicts first');
      return { mode: match[1], oid: match[2], name: match[3] };
    });
  const oids = [...new Set(staged.map((file) => file.oid))];
  const sizes = new Map(
    git(['cat-file', '--batch-check=%(objectname) %(objectsize)'], cwd, oids.join('\n') + '\n')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [oid, size] = line.split(' ');
        return [oid, Number(size)];
      }),
  );
  const contents = blobs(
    cwd,
    oids.filter((oid) => sizes.get(oid)! <= maxFileBytes),
  );
  const files = new Map<string, IndexedFile>();
  let total = 0;
  const attributeOutput = git(
    ['check-attr', '--cached', '-z', '--stdin', 'filter'],
    cwd,
    staged.map((file) => file.name).join('\0') + '\0',
  )
    .toString()
    .split('\0');
  const filters = new Map<string, string>();
  for (let i = 0; i + 2 < attributeOutput.length; i += 3)
    filters.set(attributeOutput[i], attributeOutput[i + 2]);
  for (const file of staged) {
    const label = file.name.slice(scope.length);
    const size = sizes.get(file.oid)!;
    total += size;
    if (!['100644', '100755'].includes(file.mode)) {
      errors.push(`${label}: symlinks and submodules are not allowed`);
      continue;
    }
    if (size > maxFileBytes) {
      errors.push(`${label}: ordinary Git blob exceeds 1 MiB`);
      continue;
    }
    const bytes = contents.get(file.oid)!;
    files.set(file.name, { ...file, bytes });
    try {
      safePath(label);
    } catch {
      errors.push(`${label}: invalid path`);
    }
    if (
      videoOrArchive.test(label) ||
      /(?:^|\/)(?:node_modules|renders|dist|build|\.cache)(?:\/|$)/.test(label)
    )
      errors.push(`${label}: keep videos, audio, archives and generated outputs in CMS/outside Git`);
    const pointer = pointerPattern.exec(bytes.toString());
    const filter = filters.get(file.name);
    if (pointer || filter === 'lfs') errors.push(`${label}: use CMS links for large assets instead of LFS`);
    else if (assetFile.test(label)) {
      if (size > maxLocalAssetBytes) errors.push(`${label}: asset exceeds 100 KB; use a CMS link`);
      if (!/^[^/]+\/source\/assets\//.test(label))
        errors.push(`${label}: images/fonts belong in <id>/source/assets/`);
    } else if (!isUtf8(bytes) || bytes.includes(0) || !textFile.test(label))
      errors.push(`${label}: unsupported source or disguised binary content`);
  }
  if (total > 128 * 1024 * 1024)
    errors.push('Catalog Git contents exceed 128 MiB; review the catalog budget before expanding');
  const parse = (name: string) => {
    const file = files.get(scope + name);
    assert(file, 'Missing ' + name);
    return JSON.parse(file.bytes.toString());
  };
  try {
    const manifest: CatalogManifest = parse('catalog.json');
    assert(
      manifest.schemaVersion === 1 && Array.isArray(manifest.templateIds) && manifest.templateIds.length > 0,
      'Invalid catalog manifest',
    );
    assert(new Set(manifest.templateIds).size === manifest.templateIds.length, 'Duplicate template IDs');
    assert(
      Array.isArray(manifest.publication.locales) &&
        manifest.publication.locales.includes(manifest.publication.defaultLocale),
      'Invalid locale manifest',
    );
    const expected = new Set(manifest.templateIds);
    for (const file of files.keys()) {
      const parts = file.slice(scope.length).split('/');
      if (parts.length > 1 && !expected.has(parts[0]))
        errors.push(`${parts[0]}: directory is not registered in catalog.json`);
    }
    for (const id of manifest.templateIds) {
      try {
        safePath(id);
        const record: TemplateRecord = parse(id + '/template.json');
        validateRecord(record, id, manifest.publication.locales);
        assert(record.sourceArchive, 'Missing imported package identity');
        validateArchive(record.sourceArchive);
        assert.equal(
          record.sourceArchive.url,
          record.entry.motionDocumentUrl,
          'Archive must match primary package URL',
        );
        for (const required of [
          'TEMPLATE.md',
          'source/motion.md',
          'source/manifest.json',
          'source/preview.html',
        ])
          assert(files.has(scope + id + '/' + required), `Missing ${required}`);
        const sourceManifest = parse(id + '/source/manifest.json');
        const sourcePrefix = scope + id + '/source/';
        const remoteAssets = new Map((record.remoteAssets ?? []).map((asset) => [asset.source.path, asset]));
        const sourcePaths = [...files.keys()]
          .filter((name) => name.startsWith(sourcePrefix) && name !== sourcePrefix + 'manifest.json')
          .map((name) => name.slice(sourcePrefix.length))
          .sort();
        assert.deepEqual(
          sourceManifest.files.map((file: { path: string }) => file.path).sort(),
          [...sourcePaths, ...remoteAssets.keys()].sort(),
          'Source manifest coverage mismatch; run templates:manifest, then stage',
        );
        for (const file of sourceManifest.files) {
          safePath(file.path);
          const source = files.get(scope + id + '/source/' + file.path);
          const remote = remoteAssets.get(file.path);
          if (remote) {
            assert(!source, 'Remote asset must not also be stored in Git: ' + file.path);
            assert(
              file.bytes === remote.source.bytes && file.sha256 === remote.source.sha256,
              'Original remote asset manifest mismatch: ' + file.path,
            );
            continue;
          }
          assert(source, 'Missing source/asset: ' + file.path);
          assert(
            source.bytes.length === file.bytes && digest(source.bytes) === file.sha256,
            'Source manifest mismatch: ' + file.path + '; run templates:manifest, then stage',
          );
        }
      } catch (error) {
        errors.push(`${id}: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    errors.push((error as Error).message);
  }
  if (base) {
    assert(/^[a-f0-9]{40}$/.test(base), 'Base must be a full commit SHA');
    git(['rev-parse', '--verify', `${base}^{commit}`], cwd);
    const objects = git(['rev-list', '--objects', `${base}..HEAD`, '--', scope], cwd)
      .toString()
      .trim();
    const names = new Map(
      objects.split('\n').map((line) => {
        const [oid, ...name] = line.split(' ');
        return [oid, name.join(' ')];
      }),
    );
    if (objects) {
      const info = git(
        ['cat-file', '--batch-check=%(objecttype) %(objectsize) %(objectname)'],
        cwd,
        [...names.keys()].join('\n') + '\n',
      ).toString();
      const small: string[] = [];
      for (const line of info.trim().split('\n')) {
        const [type, size, oid] = line.split(' ');
        if (type !== 'blob') continue;
        if (Number(size) > maxFileBytes)
          errors.push(`History blob ${oid}: exceeds 1 MiB, even if deleted later`);
        else if (videoOrArchive.test(names.get(oid) ?? ''))
          errors.push(`History blob ${oid}: video/audio/archive must remain in CMS, even if deleted later`);
        else if (assetFile.test(names.get(oid) ?? '') && Number(size) > maxLocalAssetBytes)
          errors.push(
            `History blob ${oid}: asset exceeds 100 KB; remove it from new history and use a CMS link`,
          );
        else if (!assetFile.test(names.get(oid) ?? '')) small.push(oid);
      }
      for (const [oid, bytes] of blobs(cwd, small))
        if (!isUtf8(bytes) || bytes.includes(0))
          errors.push(`History blob ${oid}: raw binary media must be removed from new commits`);
    }
  }
  return errors;
}
if (isMain(import.meta.url)) {
  const errors = checkTemplateLibrary(process.cwd(), process.argv[2] || process.env.BASE_SHA || undefined);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      'PASS: template metadata, localized identities, source, small local assets, CMS links and requested Git history',
    );
}
