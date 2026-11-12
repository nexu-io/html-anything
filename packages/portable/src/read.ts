import { createHash } from "node:crypto";
import type { Readable } from "node:stream";
import { crc32 } from "node:zlib";
import {
  Fault,
  resourceBytesLimit,
  resourceLimit,
  type SourcePayload,
  sourceLimits,
} from "@open-motion/workspace/contract";
import { type Entry, fromBuffer, type ZipFile } from "yauzl";
import { content } from "./content.js";
import { digest, invalid, inventory, limits, manifestPath, names } from "./contract.js";

async function collect(source: AsyncIterable<Uint8Array> | Iterable<Uint8Array>, expected: string) {
  if (!digest.safeParse(expected).success) invalid("invalid fixed archive digest");
  const chunks: Buffer[] = [],
    hash = createHash("sha256");
  let total = 0,
    pending: Buffer | undefined,
    used = 0;
  for await (const chunk of source) {
    if (!(chunk instanceof Uint8Array)) invalid("archive chunks must be bytes");
    total += chunk.byteLength;
    if (total > limits.archiveBytes) invalid("archive exceeds 72 MiB");
    for (let at = 0; at < chunk.byteLength; ) {
      pending ??= Buffer.allocUnsafe(limits.chunkBytes);
      const length = Math.min(pending.length - used, chunk.byteLength - at);
      pending.set(chunk.subarray(at, at + length), used);
      hash.update(pending.subarray(used, used + length));
      used += length;
      at += length;
      if (used === pending.length) {
        chunks.push(pending);
        pending = undefined;
        used = 0;
      }
    }
  }
  if (`sha256:${hash.digest("hex")}` !== expected)
    throw new Fault("integrity", "archive digest does not match fixed intent");
  if (pending && used) chunks.push(pending.subarray(0, used));
  return Buffer.concat(chunks, total);
}
function envelope(bytes: Buffer) {
  if (bytes.length < 22) invalid("truncated portable ZIP");
  const end = bytes.length - 22;
  if (
    bytes.readUInt32LE(end) !== 0x06054b50 ||
    bytes.readUInt16LE(end + 4) ||
    bytes.readUInt16LE(end + 6) ||
    bytes.readUInt16LE(end + 20)
  )
    invalid("unsupported ZIP envelope");
  const count = bytes.readUInt16LE(end + 10),
    directory = bytes.readUInt32LE(end + 16),
    size = bytes.readUInt32LE(end + 12);
  if (!count || count > limits.entries || bytes.readUInt16LE(end + 8) !== count || directory + size !== end)
    invalid("invalid ZIP directory bounds");
  return { count, directory, size };
}
function open(bytes: Buffer): Promise<ZipFile> {
  return new Promise((resolve, reject) =>
    fromBuffer(
      bytes,
      { lazyEntries: true, autoClose: false, validateEntrySizes: true, strictFileNames: true },
      (error, zip) => (error ? reject(error) : zip ? resolve(zip) : reject(Error("ZIP reader missing"))),
    ),
  );
}
async function entries(zip: ZipFile, bytes: Buffer, directory: number) {
  const found: Entry[] = [];
  let offset = 0,
    expanded = 0,
    central = 0;
  for (;;) {
    const entry = await new Promise<Entry | undefined>((resolve, reject) => {
      const cleanup = () => {
        zip.off("entry", got);
        zip.off("end", end);
        zip.off("error", error);
        zip.off("close", close);
      };
      const got = (value: Entry) => {
          cleanup();
          resolve(value);
        },
        end = () => {
          cleanup();
          resolve(undefined);
        },
        error = (value: Error) => {
          cleanup();
          reject(value);
        },
        close = () => error(Error("ZIP closed during scan"));
      zip.once("entry", got);
      zip.once("end", end);
      zip.once("error", error);
      zip.once("close", close);
      zip.readEntry();
    });
    if (!entry) break;
    if (
      found.length >= limits.entries ||
      ![0, 0x800].includes(entry.generalPurposeBitFlag) ||
      ![0, 8].includes(entry.compressionMethod) ||
      entry.extraFieldLength ||
      entry.fileCommentLength ||
      entry.extraFields.length ||
      bytes.readUInt16LE(directory + central + 34) ||
      entry.externalFileAttributes >>> 16 !== 0o100644 ||
      entry.relativeOffsetOfLocalHeader !== offset
    )
      invalid("unsupported portable ZIP entry");
    const name = Buffer.from(entry.fileName),
      bound = entry.fileName === manifestPath ? limits.manifestBytes : resourceLimit;
    expanded += entry.uncompressedSize;
    if (
      !Number.isSafeInteger(entry.uncompressedSize) ||
      entry.uncompressedSize > bound ||
      expanded > limits.expandedBytes ||
      offset + 30 + name.length + entry.compressedSize > directory
    )
      invalid("ZIP expansion exceeds declared bounds");
    if (
      bytes.readUInt32LE(offset) !== 0x04034b50 ||
      bytes.readUInt16LE(offset + 6) !== entry.generalPurposeBitFlag ||
      bytes.readUInt16LE(offset + 8) !== entry.compressionMethod ||
      bytes.readUInt32LE(offset + 14) !== entry.crc32 ||
      bytes.readUInt32LE(offset + 18) !== entry.compressedSize ||
      bytes.readUInt32LE(offset + 22) !== entry.uncompressedSize ||
      bytes.readUInt16LE(offset + 26) !== name.length ||
      bytes.readUInt16LE(offset + 28) ||
      !bytes.subarray(offset + 30, offset + 30 + name.length).equals(name)
    )
      invalid("ZIP local/central identity mismatch");
    offset += 30 + name.length + entry.compressedSize;
    central += 46 + name.length;
    found.push(entry);
  }
  if (offset !== directory) invalid("unclaimed ZIP local bytes");
  names(found.map((entry) => entry.fileName));
  return { found, central };
}
async function extract(zip: ZipFile, entry: Entry): Promise<Buffer> {
  const stream = await new Promise<Readable>((resolve, reject) =>
    zip.openReadStream(entry, (error, stream) =>
      error ? reject(error) : stream ? resolve(stream) : reject(Error("ZIP stream missing")),
    ),
  );
  const bytes = Buffer.allocUnsafe(entry.uncompressedSize);
  let size = 0,
    crc = 0;
  try {
    for await (const chunk of stream) {
      if (size + chunk.length > entry.uncompressedSize) invalid("ZIP entry expanded beyond declaration");
      bytes.set(chunk, size);
      crc = crc32(bytes.subarray(size, size + chunk.length), crc) >>> 0;
      size += chunk.length;
    }
    if (size !== entry.uncompressedSize || crc !== entry.crc32) invalid("ZIP entry size or CRC mismatch");
    return bytes;
  } finally {
    stream.destroy();
  }
}
/** Transport cancellation and deadlines belong to the producer; this owns no path/listener/timer. */
export async function read(
  source: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  expected: string,
): Promise<SourcePayload> {
  let zip: ZipFile | undefined, fault: Error | undefined;
  try {
    const bytes = await collect(source, expected),
      shape = envelope(bytes);
    zip = await open(bytes);
    zip.on("error", (error) => {
      fault = error;
    });
    const scanned = await entries(zip, bytes, shape.directory);
    if (fault) throw fault;
    if (scanned.found.length !== shape.count || scanned.central !== shape.size) invalid("ZIP inventory count mismatch");
    const map = new Map(scanned.found.map((entry) => [entry.fileName, entry])),
      meta = map.get(manifestPath);
    if (!meta) invalid("portable inventory missing");
    const metadata = await extract(zip, meta),
      parsed = inventory.safeParse(JSON.parse(metadata.toString("utf8")));
    if (!parsed.success || JSON.stringify(parsed.data) !== metadata.toString("utf8"))
      invalid("invalid canonical portable inventory");
    const selected = parsed.data,
      claims = [...selected.files, ...selected.resources];
    names([manifestPath, ...claims.map((claim) => claim.path)]);
    if (
      selected.files.reduce((sum, file) => sum + file.bytes, 0) > sourceLimits.bytes ||
      selected.resources.reduce((sum, resource) => sum + resource.bytes, 0) > resourceBytesLimit
    )
      invalid("portable inventory content exceeds limits");
    if (map.size !== claims.length + 1) invalid("unlisted ZIP content");
    for (const claim of claims)
      if (!map.has(claim.path) || map.get(claim.path)!.uncompressedSize !== claim.bytes)
        invalid("ZIP inventory size/name mismatch");
    const payload: SourcePayload = { files: [], resources: [] };
    for (const claim of selected.files) {
      const data = await extract(zip, map.get(claim.path)!);
      if (Buffer.from(data.toString("utf8")).compare(data)) invalid("source bytes are not valid UTF-8");
      payload.files.push({ path: claim.path, content: data.toString("utf8") });
    }
    for (const claim of selected.resources)
      payload.resources.push({ path: claim.path, name: claim.name, bytes: await extract(zip, map.get(claim.path)!) });
    const verified = content(payload);
    if (JSON.stringify(verified.inventory) !== JSON.stringify(selected))
      invalid("portable content facts or hashes changed");
    return verified.payload;
  } catch (error) {
    if (error instanceof Fault) throw error;
    throw new Fault("invalid", error instanceof Error ? error.message : "portable ZIP could not be verified");
  } finally {
    zip?.close();
  }
}
