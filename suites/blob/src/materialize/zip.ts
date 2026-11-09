import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import type { Readable } from "node:stream";
import { type Entry, open, type ZipFile } from "yauzl";
import { fs } from "../files.js";
import { archivePath, describe, maxEntries, maxExpanded, type TreeEntry } from "./tree.js";

async function zip(path: string): Promise<ZipFile> {
  return new Promise((resolve, reject) =>
    open(path, { lazyEntries: true, autoClose: false, validateEntrySizes: true, strictFileNames: true }, (e, z) =>
      e ? reject(e) : z ? resolve(z) : reject(Error("ZIP open failed")),
    ),
  );
}
async function stream(z: ZipFile, entry: Entry): Promise<Readable> {
  return new Promise((resolve, reject) =>
    z.openReadStream(entry, (e, s) => (e ? reject(e) : s ? resolve(s) : reject(Error("ZIP stream missing")))),
  );
}
async function scan(path: string, target?: string, limit = maxExpanded, signal?: AbortSignal) {
  const z = await zip(path),
    entries = new Map<string, TreeEntry>(),
    folded = new Map<string, string>(),
    explicit = new Set<string>();
  let bytes = 0,
    fault: Error | undefined;
  z.on("error", (e) => {
    fault = e;
  });
  const add = (entry: TreeEntry) => {
    const key = entry.path.normalize("NFC").toLowerCase(),
      old = folded.get(key),
      existing = entries.get(entry.path);
    if (old && old !== entry.path) throw Error("archive path collision");
    if (existing && (existing.type !== "directory" || entry.type !== "directory"))
      throw Error("archive path collision");
    entries.set(entry.path, entry);
    folded.set(key, entry.path);
    if (entries.size > maxEntries) throw Error("archive entry limit exceeded");
  };
  try {
    if (target) await fs.mkdir(target, { mode: 0o700 });
    for (;;) {
      signal?.throwIfAborted();
      if (fault) throw fault;
      const entry = await new Promise<Entry | null>((resolve, reject) => {
        const cleanup = () => {
          z.off("entry", got);
          z.off("end", end);
          z.off("error", error);
          z.off("close", closed);
        };
        const got = (e: Entry) => {
            cleanup();
            resolve(e);
          },
          end = () => {
            cleanup();
            resolve(null);
          },
          error = (e: Error) => {
            cleanup();
            reject(e);
          },
          closed = () => error(Error("archive closed before end"));
        z.once("entry", got);
        z.once("end", end);
        z.once("error", error);
        z.once("close", closed);
        z.readEntry();
      });
      if (!entry) break;
      const name = archivePath(entry.fileName),
        unix = entry.externalFileAttributes >>> 16,
        kind = unix & 0o170000,
        directory = entry.fileName.endsWith("/") || kind === 0o040000;
      if (explicit.has(name)) throw Error("duplicate archive entry");
      explicit.add(name);
      if (
        entry.generalPurposeBitFlag & 1 ||
        ![0, 8].includes(entry.compressionMethod) ||
        ![0, 0o100000, 0o040000].includes(kind)
      )
        throw Error("unsupported archive entry type");
      if (
        !Number.isSafeInteger(entry.uncompressedSize) ||
        entry.uncompressedSize < 0 ||
        bytes + entry.uncompressedSize > limit ||
        (directory && entry.uncompressedSize !== 0)
      )
        throw Error("archive expanded size exceeded");
      const parts = name.split("/");
      for (let i = 1; i < parts.length; i++) add({ path: parts.slice(0, i).join("/"), type: "directory" });
      if (directory) {
        add({ path: name, type: "directory" });
        if (target) await fs.mkdir(join(target, name), { recursive: true, mode: 0o700 });
        continue;
      }
      const mode = unix & 0o111 ? 0o755 : 0o644,
        hash = createHash("sha256"),
        input = await stream(z, entry);
      let size = 0;
      const destination = target ? join(target, name) : undefined;
      if (destination) await fs.mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      const handle = destination ? await fs.open(destination, "wx", mode) : undefined;
      try {
        for await (const chunk of input) {
          signal?.throwIfAborted();
          size += chunk.length;
          bytes += chunk.length;
          if (size > entry.uncompressedSize || bytes > limit) throw Error("archive expanded size exceeded");
          hash.update(chunk);
          await handle?.writeFile(chunk);
        }
        if (size !== entry.uncompressedSize) throw Error("archive file size mismatch");
        await handle?.sync();
      } finally {
        input.destroy();
        await handle?.close();
      }
      add({ path: name, type: "file", bytes: size, mode, digest: `sha256:${hash.digest("hex")}` });
    }
    if (fault) throw fault;
    return describe([...entries.values()]);
  } finally {
    z.close();
  }
}
/** Producer/build inspection: callers provide a verified source in their granted staging root. */
export function inspectZip(path: string) {
  return scan(path);
}
export async function extractZip(
  path: string,
  target: string,
  expected: { tree: string; expandedBytes: number },
  signal?: AbortSignal,
) {
  const actual = await scan(path, target, expected.expandedBytes, signal);
  if (actual.tree !== expected.tree || actual.expandedBytes !== expected.expandedBytes)
    throw Error("archive tree integrity mismatch");
}
