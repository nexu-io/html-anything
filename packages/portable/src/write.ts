import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
import type { Entry } from "./content.js";
import { type Archive, invalid, limits } from "./contract.js";

/** Deterministic classic ZIP: UTF-8 regular files, fixed dates, stored content, no extra fields. */
export function zip(entries: Entry[]): Archive {
  const local: Buffer[] = [],
    central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path),
      crc = crc32(entry.bytes) >>> 0,
      header = Buffer.alloc(30),
      record = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(entry.bytes.length, 18);
    header.writeUInt32LE(entry.bytes.length, 22);
    header.writeUInt16LE(name.length, 26);
    record.writeUInt32LE(0x02014b50);
    record.writeUInt16LE(0x314, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(entry.bytes.length, 20);
    record.writeUInt32LE(entry.bytes.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    record.writeUInt32LE(offset, 42);
    local.push(header, name, entry.bytes);
    central.push(record, name);
    offset += header.length + name.length + entry.bytes.length;
  }
  const directoryBytes = central.reduce((sum, chunk) => sum + chunk.length, 0),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directoryBytes, 12);
  end.writeUInt32LE(offset, 16);
  const parts = [...local, ...central, end],
    bytes = offset + directoryBytes + end.length;
  if (bytes > limits.archiveBytes || entries.length > limits.entries) invalid("portable ZIP exceeds limit");
  const hash = createHash("sha256");
  for (const part of parts) hash.update(part);
  return Object.freeze({
    digest: `sha256:${hash.digest("hex")}`,
    bytes,
    entries: entries.length,
    *chunks() {
      for (const part of parts)
        for (let at = 0; at < part.length; at += limits.chunkBytes)
          yield Buffer.from(part.subarray(at, at + limits.chunkBytes));
    },
  });
}
