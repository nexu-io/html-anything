import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkDocument, verifyResources } from '../scripts/check-readme-resources.mjs';
import { distributionFiles } from '../scripts/distribution.ts';

test('README viewing resources and shipped browser dependencies resolve locally with matching hashes', async () => {
  const result = await verifyResources();
  assert(result.localReferences > 100);
  assert(result.verifiedHashes > 100);
});

test('each README language opens the full guide and ships its localized cover', async () => {
  const pages = [
    ['README.md', 'English', ''],
    ['docs/README.zh-CN.md', '简体中文', '.zh-CN'],
    ['docs/README.ja.md', '日本語', '.ja'],
  ];
  const shipped = new Set(await distributionFiles('phase1'));
  assert(shipped.has('docs/readme/openmotion-logo.svg'));
  for (const [file, language, suffix] of [...pages, ['README.zh-CN.md', '简体中文', '.zh-CN']]) {
    const text = await readFile(file, 'utf8');
    const selector = text.split('\n').find(line => line.includes(`**${language}**`) && line.includes(' · '));
    assert(selector, `Missing language selector in ${file}`);
    const destinations = [...selector.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
      .map(([, label, target]) => [path.normalize(path.join(path.dirname(file), target)), label]);
    assert.deepEqual(destinations, pages.filter(([, label]) => label !== language)
      .map(([target, label]) => [target, label]), file);
    for (const section of ['agent-wall', 'showcase', 'features', 'technical-guide', 'community']) {
      assert(text.includes(`id="${section}"`), `${file}: missing ${section}`);
    }
    for (const asset of [`brand-hero${suffix}.jpg`, `brand-hero.mobile${suffix}.jpg`]) {
      assert(text.includes(`readme/${asset}"`), `${file}: missing ${asset}`);
      assert(shipped.has(`docs/readme/${asset}`), `Missing from distribution: ${asset}`);
    }
  }
});

test('copied native templates carry every registered asset in the distributable application', async () => {
  const shipped = new Set(await distributionFiles('phase1'));
  for (const id of ['product-promo', 'nyt-graph', 'decision-tree']) {
    const base = `template-library/${id}/`;
    const registry = JSON.parse(await readFile(base + 'registry-item.json', 'utf8'));
    for (const file of registry.files) assert(shipped.has(base + file.path), `Missing template asset: ${base + file.path}`);
  }
});

test('resource checks reject hotlinked media and missing files while allowing source attribution', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'motion-readme-assets-'));
  try {
    const file = path.join(dir, 'README.md');
    for (const text of ['![cover](https://example.org/image)', '<img src="https://example.org/cover.png">', '[Watch](https://example.org/demo.mp4)', '[Watch](missing.mp4)']) {
      await writeFile(file, text);
      await assert.rejects(checkDocument(file));
    }
    await writeFile(path.join(dir, 'demo.mp4'), 'test fixture');
    await writeFile(file, '[Watch](demo.mp4) · [Original author](https://example.org/author)');
    assert.equal(await checkDocument(file), 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
