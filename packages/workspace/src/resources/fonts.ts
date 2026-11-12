import { brotliDecompressSync, inflateSync } from "node:zlib";
import { create } from "fontkit";
import { z } from "zod";
import { fontMetadata } from "./contract.js";

const decodedLimit = 32 * 1024 * 1024;
const table = z.object({
  tag: z.string().length(4),
  length: z.number().int().nonnegative().max(decodedLimit),
  offset: z.number().int().nonnegative().optional(),
  compLength: z.number().int().nonnegative().optional(),
  transformLength: z.number().int().nonnegative().max(decodedLimit).optional(),
  transformVersion: z.number().int().min(0).max(3).optional(),
});
/** Pinned fontkit 2.0.4 lazily decodes tables. Bound its directory before touching metadata getters. */
export function identifyFont(path: string, bytes: Buffer) {
  const signature = bytes.toString("ascii", 0, 4),
    suffix = path.split(".").at(-1)?.toLowerCase(),
    format = signature === "wOF2" ? "woff2" : signature === "wOFF" ? "woff" : signature === "OTTO" ? "otf" : "ttf",
    wrapped = format === "woff" || format === "woff2",
    header = format === "woff2" ? 48 : format === "woff" ? 44 : 12;
  if (
    bytes.length < header ||
    suffix !== format ||
    (!wrapped && signature !== "OTTO" && bytes.readUInt32BE(0) !== 0x00010000)
  )
    throw Error("unsupported font signature or extension; font collections are not supported");
  const count = bytes.readUInt16BE(wrapped ? 12 : 4);
  if (
    !count ||
    count > 128 ||
    (wrapped &&
      (bytes.readUInt32BE(8) !== bytes.length ||
        bytes.readUInt16BE(14) !== 0 ||
        ![0x00010000, 0x4f54544f].includes(bytes.readUInt32BE(4)) ||
        bytes.readUInt32BE(16) < 12 + count * 16 ||
        bytes.readUInt32BE(16) > decodedLimit))
  )
    throw Error("font directory outside supported bounds");
  const font = create(bytes);
  if ("fonts" in font) throw Error("font collections are not supported");
  const directory = z.object({ tables: z.record(z.string(), table) }).parse(Reflect.get(font, "directory")),
    entries = Object.values(directory.tables);
  if (entries.length !== count || entries.some((entry) => !/^[\x20-\x7e]{4}$/.test(entry.tag)))
    throw Error("invalid or duplicate font tables");
  let expanded = 12 + count * 16,
    transformed = 0;
  const ranges: [number, number][] = [];
  for (const entry of entries) {
    expanded += (entry.length + 3) & ~3;
    transformed += entry.transformLength ?? entry.length;
    if (expanded > decodedLimit || transformed > decodedLimit) throw Error("font decompression exceeds 32 MiB");
    if (format === "woff2") {
      const version = entry.transformVersion ?? 0;
      if (
        !(entry.tag === "glyf" || entry.tag === "loca" ? [0, 3] : entry.tag === "hmtx" ? [0, 1] : [0]).includes(version)
      )
        throw Error("unsupported font table transform");
    } else {
      const offset = entry.offset ?? -1,
        length = entry.compLength ?? entry.length;
      if (offset < header + count * (wrapped ? 20 : 16) || length > entry.length || offset + length > bytes.length)
        throw Error("font table escapes input bytes");
      if (length) ranges.push([offset, offset + length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  if (ranges.some((range, at) => at > 0 && range[0] < ranges[at - 1]![1])) throw Error("overlapping font tables");
  for (const tag of ["name", "head", "maxp", "hhea", "hmtx", "cmap"])
    if (!directory.tables[tag]?.length) throw Error(`missing font table: ${tag}`);
  if (!(directory.tables.glyf && directory.tables.loca) && !directory.tables["CFF "] && !directory.tables.CFF2)
    throw Error("missing font outline tables");
  let unpacked: Buffer | undefined;
  const offsets = new Map<string, number>();
  if (format === "woff2") {
    const offset = z.number().int().min(header).max(bytes.length).parse(Reflect.get(font, "_dataPos")),
      compressed = bytes.readUInt32BE(20);
    if (!compressed || offset + compressed > bytes.length) throw Error("truncated compressed font");
    unpacked = brotliDecompressSync(bytes.subarray(offset, offset + compressed), { maxOutputLength: decodedLimit });
    if (unpacked.length !== transformed) throw Error("font decompression length mismatch");
    let at = 0;
    for (const entry of entries) {
      offsets.set(entry.tag, at);
      at += entry.transformLength ?? entry.length;
    }
  }
  const read = (tag: string) => {
    const entry = directory.tables[tag];
    if (!entry) return undefined;
    if (unpacked) return unpacked.subarray(offsets.get(tag)!, offsets.get(tag)! + entry.length);
    const data = bytes.subarray(entry.offset!, entry.offset! + (entry.compLength ?? entry.length)),
      decoded =
        entry.compLength !== undefined && entry.compLength < entry.length
          ? inflateSync(data, { maxOutputLength: decodedLimit })
          : data;
    if (decoded.length !== entry.length) throw Error("font table length mismatch");
    return decoded;
  };
  const names = read("name")!;
  if (names.length < 6 || names.readUInt16BE(0) > 1) throw Error("invalid font name table");
  const records = names.readUInt16BE(2),
    storage = names.readUInt16BE(4);
  if (!records || records > 4096 || 6 + records * 12 > names.length || storage < 6 + records * 12)
    throw Error("font name directory exceeds supported bounds");
  let textBytes = 0;
  for (let at = 6; at < 6 + records * 12; at += 12) {
    const size = names.readUInt16BE(at + 8),
      offset = names.readUInt16BE(at + 10);
    textBytes += size;
    if (storage + offset + size > names.length || textBytes > 1024 * 1024)
      throw Error("font names exceed supported bounds");
  }
  if (names.readUInt16BE(0) === 1) {
    const at = 6 + records * 12;
    if (at + 2 > names.length) throw Error("truncated font language directory");
    const count = names.readUInt16BE(at);
    if (count > 256 || at + 2 + count * 4 > storage) throw Error("font language directory exceeds supported bounds");
    for (let offset = at + 2; offset < at + 2 + count * 4; offset += 4) {
      const length = names.readUInt16BE(offset);
      textBytes += length;
      if (storage + names.readUInt16BE(offset + 2) + length > names.length || textBytes > 1024 * 1024)
        throw Error("font language strings exceed supported bounds");
    }
  }
  const variation = read("fvar");
  if (variation && (variation.length < 16 || variation.readUInt16BE(8) > 64 || variation.readUInt16BE(12) > 256))
    throw Error("font variation directory exceeds supported bounds");
  if (
    !Number.isInteger(font.numGlyphs) ||
    font.numGlyphs < 1 ||
    font.numGlyphs > 65535 ||
    !Number.isInteger(font.unitsPerEm) ||
    font.unitsPerEm < 16 ||
    font.unitsPerEm > 16384
  )
    throw Error("invalid font metrics");
  const axis = font.variationAxes.wght,
    weight = axis ? [axis.min, axis.max] : [font["OS/2"].usWeightClass, font["OS/2"].usWeightClass];
  return {
    type: `font/${format}` as "font/ttf" | "font/otf" | "font/woff" | "font/woff2",
    ...fontMetadata.parse({
      family: font.getName("preferredFamily", "en") || font.familyName,
      postscriptName: font.postscriptName,
      weight,
      slant: font.italicAngle || /italic|oblique/i.test(font.subfamilyName) ? "italic" : "normal",
    }),
  };
}
