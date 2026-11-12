import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const resourceDocuments = [
  'README.md', 'README.zh-CN.md', 'docs/README.zh-CN.md', 'docs/README.ja.md',
  'docs/examples.md', 'docs/examples.zh-CN.md',
  'docs/motion-design-examples.md', 'docs/motion-design-examples.zh-CN.md',
  'docs/collections/README.md', 'docs/collections/README.zh-CN.md',
];
const remote = /^(?:https?:)?\/\//i;

export async function checkDocument(file) {
  const text = await readFile(file, 'utf8');
  const refs = [...text.matchAll(/(?:src|srcset)="([^"]+)"|!\[[^\]]*\]\(([^)]+)\)|\]\(([^)]+)\)|href="([^"]+)"/g)];
  let checked = 0;
  for (const match of refs) {
    const url = match.slice(1).find(Boolean);
    const embedded = Boolean(match[1] || match[2]);
    const media = /\.(?:mp4|webm|mov|gif|png|jpe?g|svg|woff2?|ttf|mp3|wav)(?:[?#]|$)/i.test(url);
    assert(!(remote.test(url) && (embedded || media)), `${file}: external display/media dependency: ${url}`);
    if (/^(?:https?:|mailto:|#|data:)/i.test(url)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(url.split('#')[0].split('?')[0]));
    await stat(target).catch(() => { throw new Error(`${file}: missing local reference: ${url}`); });
    checked++;
  }
  return checked;
}

export async function verifyResources(root = fileURLToPath(new URL('../', import.meta.url))) {
  let links = 0, hashes = 0;
  for (const doc of resourceDocuments) links += await checkDocument(path.join(root, doc));
  const manifests = [
    ['docs/readme/live-product/manifest.json', '', 'files'],
    ['docs/readme/live-templates/manifest.json', '', 'files'],
    ['docs/readme/media/manifest.json', '', 'entries'],
    ['docs/readme/contributors/manifest.json', 'docs/readme/contributors', 'contributors'],
    ['library/skills/openmotion-design-remix/vendor/manifest.json', 'library/skills/openmotion-design-remix/vendor', 'files'],
    ['library/components/showcase/manifest.json', 'library/components/showcase', 'files'],
    ...['product-promo', 'nyt-graph', 'decision-tree'].map(id => [`template-library/${id}/vendor/manifest.json`, `template-library/${id}/vendor`, 'files']),
  ];
  for (const [manifest, base, key] of manifests) {
    const entries = JSON.parse(await readFile(path.join(root, manifest), 'utf8'))[key];
    for (const entry of entries) {
      const file = path.resolve(root, base, entry.file);
      assert(file.startsWith(path.resolve(root) + path.sep), 'Resource escapes checkout');
      const bytes = await readFile(file);
      assert(!bytes.subarray(0, 128).toString().startsWith('version https://git-lfs.github.com/spec/v1'),
        `${entry.file}: media is not downloaded. Run git lfs pull --include="docs/readme/**,library/**,examples/**" --exclude="library/templates/catalog/**" before verifying full resource hashes.`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, `Changed resource: ${entry.file}`);
      if (entry.bytes !== undefined) assert.equal(bytes.length, entry.bytes, `Changed size: ${entry.file}`);
      hashes++;
    }
  }
  return { documents: resourceDocuments.length, localReferences: links, verifiedHashes: hashes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await verifyResources(), null, 2));
}
