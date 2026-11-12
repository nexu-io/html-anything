import { constants } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { MAX_ASSET_BYTES } from './asset-limits.ts';

export type FontMetadata = { family: string; weight: string; style: 'normal' | 'italic'; postscriptName: string };
type FontParser = (bytes: Buffer) => any;

export async function readFontFile(filename: string): Promise<Buffer> {
  const file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > MAX_ASSET_BYTES) throw new Error('Font must be a file of at most 500 MB');
    const bytes = Buffer.alloc(info.size);
    for (let offset = 0; offset < bytes.length;) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) throw new Error('Font changed while reading');
      offset += bytesRead;
    }
    return bytes;
  } finally { await file.close(); }
}

export function fontFaces(bytes: Buffer, parse: FontParser): Array<FontMetadata & { index: number }> {
  if (bytes.length > MAX_ASSET_BYTES) throw new Error('Font exceeds 500 MB');
  const signature = bytes.toString('ascii', 0, 4);
  if (signature === 'ttcf') {
    if (bytes.length < 12) throw new Error('Invalid font collection');
    const count = bytes.readUInt32BE(8);
    if (!count || count > 4096 || 12 + count * 4 > bytes.length) throw new Error('Invalid font collection');
  }
  if ((signature === 'wOFF' || signature === 'wOF2') && (bytes.length < 20 || bytes.readUInt32BE(16) > MAX_ASSET_BYTES)) throw new Error('Invalid compressed font size');
  const parsed = parse(bytes);
  return (parsed.fonts ?? [parsed]).map((font: any, index: number) => {
    const family = font.getName('preferredFamily') || font.familyName;
    if (typeof family !== 'string' || !family.trim() || !font.postscriptName) throw new Error('Font has no family or face name');
    const axis = font.variationAxes?.wght;
    return { family, index, postscriptName: font.postscriptName,
      weight: axis ? `${axis.min} ${axis.max}` : String(font['OS/2']?.usWeightClass || 400),
      style: font.italicAngle || /italic|oblique/i.test(font.subfamilyName ?? '') ? 'italic' : 'normal' };
  });
}

function checksum(bytes: Buffer): number {
  let sum = 0;
  for (let offset = 0; offset < bytes.length; offset += 4) sum = (sum + bytes.readUInt32BE(offset)) >>> 0;
  return sum;
}

/** Preserve every shaping/glyph table while making one TTC face a standalone font. */
export function extractCollectionFace(bytes: Buffer, index: number): Buffer {
  const count = bytes.readUInt32BE(8);
  if (count > 4096 || index < 0 || index >= count || 12 + count * 4 > bytes.length) throw new Error('Invalid font collection');
  const start = bytes.readUInt32BE(12 + index * 4);
  const tables = bytes.readUInt16BE(start + 4);
  if (!tables || tables > 4096 || start + 12 + tables * 16 > bytes.length) throw new Error('Invalid font directory');
  const entries: Array<{ tag: string; offset: number; length: number }> = [];
  for (let i = 0; i < tables; i++) {
    const entry = start + 12 + i * 16;
    const tag = bytes.toString('ascii', entry, entry + 4);
    const offset = bytes.readUInt32BE(entry + 8), length = bytes.readUInt32BE(entry + 12);
    if (offset + length > bytes.length) throw new Error('Invalid font table');
    if (tag !== 'DSIG') entries.push({ tag, offset, length });
  }
  const head = entries.find(entry => entry.tag === 'head');
  if (!head || head.length < 12) throw new Error('Font has no valid head table');
  const size = 12 + entries.length * 16 + entries.reduce((sum, entry) => sum + Math.ceil(entry.length / 4) * 4, 0);
  if (size > MAX_ASSET_BYTES) throw new Error('Font exceeds 500 MB');
  const result = Buffer.alloc(size);
  bytes.copy(result, 0, start, start + 4);
  const power = 2 ** Math.floor(Math.log2(entries.length));
  result.writeUInt16BE(entries.length, 4); result.writeUInt16BE(power * 16, 6);
  result.writeUInt16BE(Math.log2(power), 8); result.writeUInt16BE(entries.length * 16 - power * 16, 10);
  let next = 12 + entries.length * 16, headOffset = 0;
  entries.forEach((entry, i) => {
    const directory = 12 + i * 16, padded = Math.ceil(entry.length / 4) * 4;
    bytes.copy(result, next, entry.offset, entry.offset + entry.length);
    if (entry.tag === 'head') { headOffset = next; result.writeUInt32BE(0, next + 8); }
    result.write(entry.tag, directory, 4, 'ascii');
    result.writeUInt32BE(checksum(result.subarray(next, next + padded)), directory + 4);
    result.writeUInt32BE(next, directory + 8); result.writeUInt32BE(entry.length, directory + 12);
    next += padded;
  });
  result.writeUInt32BE((0xB1B0AFBA - checksum(result)) >>> 0, headOffset + 8);
  return result;
}

function faceScore(face: FontMetadata): number {
  const [min, max = min] = face.weight.split(' ').map(Number);
  return (face.style === 'normal' ? 0 : 10000) + (min <= 400 && max >= 400 ? 0 : Math.min(Math.abs(min - 400), Math.abs(max - 400)));
}

export function prepareFont(bytes: Buffer, parse: FontParser, requestedFamily?: string) {
  const faces = fontFaces(bytes, parse);
  const family = requestedFamily ?? faces.find(face => !face.family.startsWith('.'))?.family;
  const candidates = faces.filter(face => face.family.toLowerCase() === family?.toLowerCase());
  candidates.sort((a, b) => faceScore(a) - faceScore(b));
  const face = candidates[0];
  if (!face) throw new Error('Font family is unavailable');
  const data = bytes.toString('ascii', 0, 4) === 'ttcf' ? extractCollectionFace(bytes, face.index) : bytes;
  const signature = data.toString('ascii', 0, 4);
  const format = signature === 'OTTO' ? 'otf' : signature === 'wOF2' ? 'woff2' : signature === 'wOFF' ? 'woff' : 'ttf';
  const { index: _index, ...metadata } = face;
  return { data, format, ...metadata };
}

export function createFontCatalog(paths: string[], parse: FontParser) {
  const metadata = new Map<string, { identity: string; faces: ReturnType<typeof fontFaces> }>();
  const inspect = async (filename: string) => {
    const info = await stat(filename), identity = `${info.mtimeMs}:${info.size}`;
    if (metadata.get(filename)?.identity !== identity) metadata.set(filename, { identity, faces: fontFaces(await readFontFile(filename), parse) });
    return metadata.get(filename)!.faces;
  };
  let installed: Promise<Map<string, { path: string; score: number }>> | undefined;
  const load = () => installed ??= (async () => {
    const families = new Map<string, { path: string; score: number }>();
    for (const filename of new Set(paths)) {
      try { for (const face of await inspect(filename)) if (!face.family.startsWith('.') && (!families.has(face.family) || faceScore(face) < families.get(face.family)!.score)) families.set(face.family, { path: filename, score: faceScore(face) }); }
      catch { /* Unsupported or inaccessible installed fonts are not selectable. */ }
    }
    return families;
  })();
  return { inspect,
    families: async () => [...(await load()).keys()].sort((a, b) => a.localeCompare(b)),
    file: async (family: string) => {
      const match = [...await load()].find(([name]) => name.toLowerCase() === family.toLowerCase());
      if (!match) return null;
      return prepareFont(await readFontFile(match[1].path), parse, match[0]);
    },
  };
}

export function preparedFontResponse(font: ReturnType<typeof prepareFont>): Response {
  return new Response(new Blob([font.data]), { headers: { 'Content-Type': `font/${font.format}`,
    'Content-Length': String(font.data.length),
    'X-Font-Metadata': encodeURIComponent(JSON.stringify({ family: font.family, weight: font.weight, style: font.style, postscriptName: font.postscriptName })) } });
}
