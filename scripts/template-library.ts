import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { loadRepositoryCatalog, lfsPointer, repositoryAssetFile, repositoryMediaFile } from '../shared/repository-template-catalog.ts';
import { isMain } from '../shared/entry.ts';

export const catalogRoot = fileURLToPath(new URL('../library/templates/catalog/', import.meta.url));
export const textFile = /\.(?:md|json|html?|css|[cm]?[jt]sx?|txt|ya?ml|toml|xml)$/i;
export const maxFileBytes = 1024 * 1024;
export const maxLocalAssetBytes = 100_000;
export const assetFile = repositoryAssetFile;
const maxArchiveBytes = 50 * 1024 * 1024;
const maxUnpackedBytes = 150 * 1024 * 1024;
export const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
export type FileLock = { path: string; bytes: number; sha256: string };
type Entry = {
  templateId: string;
  original: Record<string, string>;
  files: { path: string; url: string; bytes: number; sha256: string }[];
  [field: string]: any;
};
export type ArchiveLock = { url: string; bytes: number; sha256: string };
export type RemoteAsset = ArchiveLock & { source: FileLock };
export type TemplateRecord = {
  templateId: string;
  entry: Entry;
  locales: Record<string, Partial<Entry>>;
  sourceArchive?: ArchiveLock;
  remoteAssets?: RemoteAsset[];
  localMedia?: { preview?: string; poster?: string };
};
export type CatalogManifest = {
  schemaVersion: number;
  source: { url: string; sha256: string };
  publication: Record<string, any>;
  localeContent?: Record<string, Record<string, any>>;
  templateIds: string[];
};

export function safePath(name: string): string {
  assert(
    typeof name === 'string' &&
      name.length > 0 &&
      !/[\\\x00-\x1f:]/.test(name) &&
      !name.startsWith('/') &&
      name.split('/').every((part) => part && part !== '.' && part !== '..'),
    'Unsafe template path: ' + name,
  );
  return name;
}
export function cmsUrl(value: unknown): string {
  assert(typeof value === 'string', 'Missing CMS URL');
  const url = new URL(value);
  assert(
    url.origin === 'https://r.open-design.ai' &&
      /^\/files\/[a-f0-9]{64}$/.test(url.pathname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash,
    'Require a public, content-addressed CMS file URL',
  );
  return value;
}
export function validateRecord(record: TemplateRecord, id: string, locales: string[]): void {
  assert(
    /^[a-z][a-z0-9-]+$/.test(id) && record.templateId === id && record.entry.templateId === id,
    'Template ID must match directory',
  );
  assert.deepEqual(
    Object.keys(record.locales).sort(),
    [...locales].sort(),
    'Template locale set must match catalog',
  );
  const remoteAssets = record.remoteAssets ?? [];
  for (const [kind, name] of Object.entries(record.localMedia ?? {})) {
    safePath(name);
    assert(name.startsWith('assets/') && repositoryMediaFile.test(name), 'Local media must be in source/assets/');
    assert(kind === 'preview' || kind === 'poster', 'Unknown local media role');
    if (kind === 'poster') assert(assetFile.test(name), 'Local poster must be an image');
  }
  assert(Array.isArray(remoteAssets), 'Invalid remote assets');
  const remotePaths = new Set<string>();
  for (const asset of remoteAssets) {
    validateArchive(asset);
    const source = asset.source;
    safePath(source.path);
    assert(
      source.path.startsWith('assets/') && assetFile.test(source.path),
      'Remote assets must be images/fonts in source/assets/',
    );
    assert(
      Number.isSafeInteger(source.bytes) &&
        source.bytes > maxLocalAssetBytes &&
        /^[a-f0-9]{64}$/.test(source.sha256),
      'Invalid original remote asset identity',
    );
    assert(!remotePaths.has(source.path), 'Duplicate remote asset path');
    remotePaths.add(source.path);
  }
  for (const locale of locales) {
    const item = { ...record.entry, ...record.locales[locale] };
    assert(
      item.templateId === id && item.original?.templateName?.trim(),
      'Missing localized name or changed identity',
    );
    assert(Array.isArray(item.files), 'Missing project file manifest');
    for (const key of ['previewUrl', 'coverUrl', 'motionDocumentUrl', 'motionGuideUrl', 'projectFileUrl']) {
      if (item[key]) cmsUrl(item[key]);
    }
    assert.equal(item.previewUrl, record.entry.previewUrl, 'Reference video must be shared across locales');
    for (const file of item.files) {
      safePath(file.path);
      cmsUrl(file.url);
      assert(
        Number.isSafeInteger(file.bytes) && file.bytes > 0 && /^[a-f0-9]{64}$/.test(file.sha256),
        'Invalid project file lock',
      );
    }
  }
}
export function validateArchive(archive: ArchiveLock): void {
  cmsUrl(archive.url);
  assert(
    archive.url.endsWith('/' + archive.sha256) && /^[a-f0-9]{64}$/.test(archive.sha256),
    'Archive identity mismatch',
  );
  assert(
    Number.isSafeInteger(archive.bytes) && archive.bytes > 0 && archive.bytes <= maxArchiveBytes,
    'Archive too large',
  );
}

/** Read only ordinary ZIP32 files; paths and expansion limits are checked before writing anything. */
export function unzip(bytes: Buffer): Map<string, Buffer> {
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert(end >= 0 && bytes.readUInt32LE(end) === 0x06054b50, 'Invalid ZIP directory');
  assert.equal(bytes.readUInt16LE(end + 4), 0, 'Multi-disk ZIP is not supported');
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16),
    total = 0;
  assert(count < 10_000 && cursor < end, 'Invalid ZIP limits');
  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50, 'Invalid ZIP entry');
    const flags = bytes.readUInt16LE(cursor + 8),
      method = bytes.readUInt16LE(cursor + 10);
    const packed = bytes.readUInt32LE(cursor + 20),
      size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28),
      extra = bytes.readUInt16LE(cursor + 30),
      comment = bytes.readUInt16LE(cursor + 32);
    const mode = bytes.readUInt32LE(cursor + 38) >>> 16,
      offset = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    cursor += 46 + nameLength + extra + comment;
    safePath(name.endsWith('/') ? name.slice(0, -1) : name);
    assert((mode & 0xf000) !== 0xa000 && !(flags & 1) && [0, 8].includes(method), 'Unsupported ZIP entry');
    if (name.endsWith('/')) continue;
    assert(
      !files.has(name) && size <= maxArchiveBytes && (total += size) <= maxUnpackedBytes,
      'ZIP expansion limit or duplicate path',
    );
    assert.equal(bytes.readUInt32LE(offset), 0x04034b50, 'Invalid ZIP local entry');
    const start = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
    assert(start + packed <= bytes.length, 'Truncated ZIP file');
    const compressed = bytes.subarray(start, start + packed);
    const content = method === 0 ? compressed : inflateRawSync(compressed, { maxOutputLength: size || 1 });
    assert.equal(content.length, size, 'ZIP size mismatch');
    files.set(name, content);
  }
  return files;
}

async function json(filename: string): Promise<any> {
  return JSON.parse(await readFile(filename, 'utf8'));
}
async function writeJSON(filename: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, JSON.stringify(value, null, 2) + '\n');
}
export async function sourceFiles(directory: string, prefix = ''): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'Template source must not contain symlinks');
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...(await sourceFiles(directory, name + '/')));
    else {
      assert(entry.isFile(), 'Template source must contain regular files');
      result.push(name);
    }
  }
  return result.sort();
}

export async function exportCatalog(root = catalogRoot) {
  const catalog = await loadRepositoryCatalog(root);
  const locales = Object.keys(catalog.publication.content);
  for (const [id, record] of catalog.records) validateRecord(record, id, locales);
  return catalog.publication;
}

/** Import unpacked public guidance packages; reference videos and duplicate archives remain at CMS URLs. */
export async function importCatalog(
  publicationFile: string,
  packages: string,
  root = catalogRoot,
  assetLinks: Record<string, RemoteAsset[]> = {},
) {
  const bytes = await readFile(publicationFile);
  const publication = JSON.parse(bytes.toString());
  const { content, ...identity } = publication;
  assert(
    publication.environment === 'prod' && publication.channel === 'default',
    'Import a public production publication',
  );
  const primary = content[publication.defaultLocale]?.templates as Entry[];
  assert(Array.isArray(primary) && primary.length > 0, 'Missing default locale');
  const locales = Object.keys(content).sort();
  const templateIds = primary.map((item) => item.templateId);
  assert.equal(new Set(templateIds).size, templateIds.length, 'Duplicate template ID');
  for (const locale of locales)
    assert.deepEqual(
      content[locale].templates.map((item: Entry) => item.templateId),
      templateIds,
      'Locale identity/order mismatch',
    );
  const maps: Record<string, Map<string, Entry>> = Object.fromEntries(
    locales.map((locale) => [
      locale,
      new Map(content[locale].templates.map((item: Entry) => [item.templateId, item])),
    ]),
  );
  await mkdir(root, { recursive: true });
  const manifest: CatalogManifest = {
    schemaVersion: 1,
    source: {
      url: `https://r.open-design.ai/resources/${publication.resourceId}/channels/default/main.json`,
      sha256: digest(bytes),
    },
    publication: { ...identity, locales },
    localeContent: Object.fromEntries(
      locales.map((locale) => {
        const { templates: _templates, ...facets } = content[locale];
        return [locale, facets];
      }),
    ),
    templateIds,
  };
  for (const entry of primary) {
    const id = entry.templateId;
    safePath(id);
    const localized = Object.fromEntries(
      locales.map((locale) => {
        const item = maps[locale].get(id) as Entry;
        return [
          locale,
          Object.fromEntries(
            Object.entries(item).filter(
              ([key, value]) => JSON.stringify(value) !== JSON.stringify(entry[key]),
            ),
          ),
        ];
      }),
    );
    const remoteAssets = assetLinks[id] ?? [];
    const record: TemplateRecord = { templateId: id, entry, locales: localized };
    if (remoteAssets.length) record.remoteAssets = remoteAssets;
    validateRecord(record, id, locales);
    const sourceId = entry.original.templateId;
    assert(/^V[0-9]+$/.test(sourceId), 'Invalid original ID');
    const archive = await readFile(path.join(packages, sourceId, 'motion.md'));
    assert.equal(
      digest(archive),
      new URL(cmsUrl(entry.motionDocumentUrl)).pathname.split('/').pop(),
      'Local package differs from published archive',
    );
    const files = unzip(archive);
    for (const asset of remoteAssets) {
      const original = files.get(asset.source.path);
      assert(
        original && original.length === asset.source.bytes && digest(original) === asset.source.sha256,
        'Remote asset differs from original package',
      );
    }
    for (const [name, data] of files) {
      if (remoteAssets.some((asset) => asset.source.path === name)) continue;
      assert(
        !assetFile.test(name) || data.length <= maxLocalAssetBytes,
        'Provide a verified CMS link for assets over 100 KB',
      );
      assert(data.length <= maxFileBytes, 'Split large source files');
    }
    const directory = path.join(root, id);
    await mkdir(directory);
    await mkdir(path.join(directory, 'source'));
    for (const [name, data] of files) {
      if (remoteAssets.some((asset) => asset.source.path === name)) continue;
      const content = textFile.test(name)
        ? Buffer.from(
            data
              .toString('utf8')
              .replace(/\/(?:Users|home)\/[a-zA-Z0-9_.-]+/g, '/reference-workspace')
              .split('\n')
              .map((line) => line.replace(/[ \t]+$/, ''))
              .join('\n')
              .trimEnd() + '\n',
          )
        : data;
      await mkdir(path.dirname(path.join(directory, 'source', name)), { recursive: true });
      await writeFile(path.join(directory, 'source', name), rewriteAssetLinks(name, content, remoteAssets));
    }
    const sourceManifest = JSON.parse(await readFile(path.join(directory, 'source/manifest.json'), 'utf8'));
    sourceManifest.provenance.repositoryImport =
      'Text whitespace normalized; workstation paths in reference-screen OCR replaced with /reference-workspace. Original CMS archive unchanged.';
    if (remoteAssets.length)
      sourceManifest.provenance.repositoryImport +=
        ' Large reference images use existing CMS WebP renditions; original image identities are retained in template.json and originals remain in the CMS archive.';
    for (const file of sourceManifest.files) {
      if (textFile.test(file.path)) {
        const data = await readFile(path.join(directory, 'source', safePath(file.path)));
        file.bytes = data.length;
        file.sha256 = digest(data);
      }
    }
    await writeJSON(path.join(directory, 'source/manifest.json'), sourceManifest);
    record.sourceArchive = { url: entry.motionDocumentUrl, bytes: archive.length, sha256: digest(archive) };
    await writeJSON(path.join(directory, 'template.json'), record);
    await writeFile(
      path.join(directory, 'TEMPLATE.md'),
      `# ${maps.en?.get(id)?.original.templateName ?? id}\n\nReference guidance and authored HTML motion examples, not a verified complete Studio project.\n\n- Read [motion.md](source/motion.md) and open [preview.html](source/preview.html). ${remoteAssets.length ? 'Large reference images load from existing CMS URLs; an internet connection is required to view them. Original images remain in the published package.' : 'Guide images and demo files are local.'}\n- Edit source in this folder; refresh its manifest with \`npm run templates:manifest -- ${id}\`, stage the change and run \`npm run templates:check\`.\n- [Reference video](${entry.previewUrl}) · [Published package](${entry.motionDocumentUrl}). Videos and duplicate archives remain in the CMS.\n- Metadata, translations, remote asset identities and imported package identity: [template.json](template.json).\n\n## Acknowledgements\n\n[Original reference](${entry.original.sourceUrl}). Reference footage, brands, screenshots and fonts retain their original rights; the repository license does not relicense them. Measured/inferred limits and import normalization remain in [manifest.json](source/manifest.json).\n`,
    );
  }
  await writeJSON(path.join(root, 'catalog.json'), manifest);
  return manifest;
}

export async function refreshManifest(id: string, root = catalogRoot): Promise<void> {
  assert(/^[a-z][a-z0-9-]+$/.test(id), 'Invalid template ID');
  const source = path.join(root, id, 'source');
  const manifest = await json(path.join(source, 'manifest.json'));
  const record: TemplateRecord = await json(path.join(root, id, 'template.json'));
  const files: FileLock[] = (record.remoteAssets ?? []).map((asset) => asset.source);
  for (const name of await sourceFiles(source)) {
    if (name === 'manifest.json') continue;
    const bytes = await readFile(path.join(source, safePath(name)));
    const pointer = lfsPointer(bytes);
    assert(!bytes.toString().startsWith('version https://git-lfs.github.com/spec/v1') || pointer, 'Malformed Git LFS pointer');
    files.push({ path: name, ...(pointer ?? { bytes: bytes.length, sha256: digest(bytes) }) });
  }
  assert.equal(
    new Set(files.map((file) => file.path)).size,
    files.length,
    'Remote assets must not also be stored locally',
  );
  manifest.files = files.sort((a, b) => a.path.localeCompare(b.path));
  await writeJSON(path.join(source, 'manifest.json'), manifest);
}

/** Keep relative source references usable after large originals are replaced by CMS renditions. */
export function rewriteAssetLinks(name: string, bytes: Buffer, assets: RemoteAsset[]): Buffer {
  if (!textFile.test(name) || name === 'manifest.json') return bytes;
  let text = bytes.toString('utf8');
  for (const asset of assets) {
    const relative = path.posix.relative(path.posix.dirname(name), asset.source.path);
    text = text.split(relative).join(asset.url);
  }
  return Buffer.from(text);
}

if (isMain(import.meta.url)) {
  const [command, first, second, third] = process.argv.slice(2);
  if (command === 'export' && first && !second) {
    await writeJSON(path.resolve(first), await exportCatalog());
    console.log('Wrote CMS-compatible catalog; nothing was uploaded or published.');
  } else if (command === 'manifest' && first && !second) {
    await refreshManifest(first);
    console.log('Refreshed source manifest; stage the template before running templates:check.');
  } else if (command === 'import' && first && second) {
    console.log(
      (await importCatalog(first, second, catalogRoot, third ? await json(path.resolve(third)) : {}))
        .templateIds.length + ' templates imported',
    );
  } else
    throw new Error(
      'Usage: template-library.ts export <output.json> | manifest <template-id> | import <public-main.json> <package-directory> [remote-assets.json]',
    );
}
