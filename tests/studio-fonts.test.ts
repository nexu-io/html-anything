import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { create } from 'fontkit';
import { createFontCatalog, extractCollectionFace, fontFaces, prepareFont } from '../shared/studio-fonts.ts';

const fontRoot = new URL('../library/skills/openmotion-design-remix/assets/wireframe-portal-title/assets/fonts/', import.meta.url);
const regular = await readFile(new URL('Geist-Regular.ttf', fontRoot));
const bold = await readFile(new URL('Geist-Bold.ttf', fontRoot));

function collection(...fonts: Buffer[]) {
  let offset = 12 + fonts.length * 4;
  const result = Buffer.alloc(offset + fonts.reduce((size, font) => size + Math.ceil(font.length / 4) * 4, 0));
  result.write('ttcf'); result.writeUInt32BE(0x00010000, 4); result.writeUInt32BE(fonts.length, 8);
  fonts.forEach((font, index) => {
    result.writeUInt32BE(offset, 12 + index * 4); font.copy(result, offset);
    for (let i = 0; i < font.readUInt16BE(4); i++) {
      const entry = offset + 12 + i * 16;
      result.writeUInt32BE(result.readUInt32BE(entry + 8) + offset, entry + 8);
    }
    offset += Math.ceil(font.length / 4) * 4;
  });
  return result;
}

test('a collection selects its regular face and preserves every table, glyph and identity', () => {
  const bytes = collection(bold, regular);
  const faces = fontFaces(bytes, create);
  assert.deepEqual(faces.map(face => face.weight), ['700', '400']);
  const prepared = prepareFont(bytes, create, faces[0].family);
  const result = create(prepared.data), original = create(regular);
  assert.equal(prepared.weight, '400');
  assert.equal(result.postscriptName, original.postscriptName);
  assert.equal(result.numGlyphs, original.numGlyphs);
  assert.deepEqual(result.characterSet, original.characterSet);
  assert.deepEqual(Object.keys(result.directory.tables), Object.keys(original.directory.tables));
  let checksum = 0;
  for (let i = 0; i < prepared.data.length; i += 4) checksum = (checksum + prepared.data.readUInt32BE(i)) >>> 0;
  assert.equal(checksum, 0xB1B0AFBA);
});

test('a misleading filename cannot change the family or force a bold face', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-font-catalog-'));
  try {
    const misleading = path.join(root, 'Arial Black.ttf'), normal = path.join(root, 'other.ttf');
    await writeFile(misleading, bold); await writeFile(normal, regular);
    const family = fontFaces(regular, create)[0].family;
    const catalog = createFontCatalog([misleading, normal, misleading], create);
    assert.deepEqual(await catalog.families(), [family]);
    assert.equal((await catalog.file(family))?.postscriptName, create(regular).postscriptName);
    assert.equal(await catalog.file('Arial'), null);
    assert.equal(await catalog.file('../../package.json'), null);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('malformed collections and unsupported bytes fail before extraction or import', () => {
  assert.throws(() => prepareFont(Buffer.from('not a font'), create));
  const bad = collection(bold, regular);
  bad.writeUInt32BE(0xffffffff, 12);
  assert.throws(() => extractCollectionFace(bad, 0));
  assert.throws(() => extractCollectionFace(collection(bold), 1));
  const table = collection(regular);
  const start = table.readUInt32BE(12);
  table.writeUInt32BE(0xffffffff, start + 12 + 12);
  assert.throws(() => extractCollectionFace(table, 0));
});
