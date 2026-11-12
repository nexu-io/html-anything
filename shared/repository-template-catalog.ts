import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repositoryCatalogRoot = fileURLToPath(new URL('../library/templates/catalog/', import.meta.url));
export type PublishedTemplate = {
  templateId: string;
  original: Record<string, string>;
  files: { path: string; url: string; bytes: number; sha256: string }[];
  [field: string]: any;
};
export type TemplatePublication = {
  resourceId: string;
  environment: string;
  channel: string;
  publicationId: string;
  defaultLocale: string;
  content: Record<string, { templates: PublishedTemplate[]; [field: string]: any }>;
  [field: string]: any;
};
export type LocalTemplateSource = {
  directory: string;
  metadataPath: string;
  instructionsPath: string;
  sourceDirectory: string;
  motionPath: string;
  previewPath: string;
  manifestPath: string;
};

export async function readRepositoryFile(root: string, relative: string): Promise<Buffer> {
  assert(
    relative &&
      !/[\\\x00-\x1f:]/.test(relative) &&
      !path.isAbsolute(relative) &&
      relative.split('/').every((part) => part && part !== '.' && part !== '..'),
    'Invalid repository template path',
  );
  const base = await realpath(root),
    filename = path.join(base, relative);
  assert.equal(await realpath(filename), filename, 'Repository templates must not follow symlinks');
  const info = await lstat(filename);
  assert(
    info.isFile() && info.size <= 1024 * 1024,
    'Repository template file must be a regular file at most 1 MiB',
  );
  return readFile(filename);
}

/** Resolve from the loaded plugin, independently of the client's current working directory. */
export async function loadRepositoryCatalog(root = repositoryCatalogRoot) {
  const directory = await realpath(root);
  const bytes = await readRepositoryFile(directory, 'catalog.json');
  const manifest = JSON.parse(bytes.toString());
  assert(
    manifest.schemaVersion === 1 && Array.isArray(manifest.templateIds) && manifest.templateIds.length > 0,
    'Invalid repository template catalog',
  );
  assert(
    new Set(manifest.templateIds).size === manifest.templateIds.length,
    'Duplicate repository template ID',
  );
  const { locales, ...identity } = manifest.publication;
  assert(
    Array.isArray(locales) && locales.includes(identity.defaultLocale),
    'Invalid repository template locales',
  );
  const publication: TemplatePublication = { ...identity, content: {} };
  for (const locale of locales)
    publication.content[locale] = { ...manifest.localeContent?.[locale], templates: [] };
  const sources = new Map<string, LocalTemplateSource>();
  const records = new Map<string, any>();
  const fingerprint = createHash('sha256').update(bytes);
  for (const id of manifest.templateIds) {
    assert(typeof id === 'string' && /^[a-z][a-z0-9-]+$/.test(id), 'Invalid repository template ID');
    const recordBytes = await readRepositoryFile(directory, id + '/template.json');
    const record = JSON.parse(recordBytes.toString());
    assert(
      record.templateId === id && record.entry?.templateId === id,
      'Repository template identity mismatch',
    );
    assert.deepEqual(
      Object.keys(record.locales).sort(),
      [...locales].sort(),
      'Repository template locale mismatch',
    );
    for (const locale of locales) {
      const entry = { ...record.entry, ...record.locales[locale] };
      assert(
        entry.templateId === id && entry.original?.templateName && Array.isArray(entry.files),
        'Invalid repository template metadata',
      );
      publication.content[locale].templates.push(entry);
    }
    const source = path.join(directory, id);
    sources.set(id, {
      directory: source,
      metadataPath: path.join(source, 'template.json'),
      instructionsPath: path.join(source, 'TEMPLATE.md'),
      sourceDirectory: path.join(source, 'source'),
      motionPath: path.join(source, 'source/motion.md'),
      previewPath: path.join(source, 'source/preview.html'),
      manifestPath: path.join(source, 'source/manifest.json'),
    });
    records.set(id, record);
    fingerprint
      .update(id)
      .update(recordBytes)
      .update(await readRepositoryFile(directory, id + '/source/manifest.json'));
  }
  return { directory, publication, sources, records, version: 'repository:' + fingerprint.digest('hex') };
}
