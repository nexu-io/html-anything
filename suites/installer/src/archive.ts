import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { type Entry, fromBuffer, type ZipFile } from "yauzl";
import { inside, io, raw, sync } from "./files.js";

const { chmod, lstat, mkdir, realpath, symlink } = io;

export async function extract(bytes: Uint8Array, root: string, name: string): Promise<string> {
  if (!/^[a-z][a-z0-9-]*\.app$/.test(name)) throw Error("invalid application archive root");
  await mkdir(root, { recursive: false, mode: 0o700 });
  const zip = await new Promise<ZipFile>((done, reject) =>
    fromBuffer(Buffer.from(bytes), { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (e, z) =>
      e ? reject(e) : done(z!),
    ),
  );
  const seen = new Set<string>(),
    links: { path: string; target: string }[] = [];
  let total = 0,
    count = 0;
  const stream = (entry: Entry) =>
    new Promise<NodeJS.ReadableStream>((done, reject) =>
      zip.openReadStream(entry, (e, s) => (e ? reject(e) : done(s!))),
    );
  const processEntry = async (entry: Entry) => {
    const filename = entry.fileName;
    if (
      filename.startsWith("/") ||
      filename.includes("\\") ||
      filename.split("/").some((p) => p === ".." || p === ".") ||
      filename.includes("\0")
    )
      throw Error("unsafe archive path");
    count++;
    total += entry.uncompressedSize;
    if (count > 30000 || total > 2 * 1024 ** 3 || entry.uncompressedSize > 512 * 1024 ** 2)
      throw Error("archive size limit");
    if (filename.startsWith("__MACOSX/")) return;
    if (filename !== `${name}/` && !filename.startsWith(`${name}/`)) throw Error("unexpected archive root");
    const path = resolve(root, filename);
    if (!inside(root, path) || seen.has(path)) throw Error("duplicate or escaping archive entry");
    seen.add(path);
    const mode = entry.externalFileAttributes >>> 16,
      type = mode & 0o170000;
    if (mode & 0o6000) throw Error("privileged archive mode");
    if (filename.endsWith("/")) {
      if (type !== 0 && type !== 0o040000) throw Error("invalid archive directory");
      await mkdir(path, { recursive: true, mode: mode & 0o777 || 0o755 });
      return;
    }
    await mkdir(dirname(path), { recursive: true, mode: 0o755 });
    if (type === 0o120000) {
      const chunks: Buffer[] = [];
      for await (const chunk of (await stream(entry)) as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
      const target = Buffer.concat(chunks).toString();
      if (!target || target.includes("\0") || !inside(join(root, name), resolve(dirname(path), target)))
        throw Error("escaping archive symlink");
      links.push({ path, target });
      return;
    }
    if (type !== 0 && type !== 0o100000) throw Error("unsupported archive entry type");
    await pipeline(
      await stream(entry),
      raw.createWriteStream(path, { flags: "wx", mode: mode & 0o777 || 0o644, flush: true }),
    );
    await chmod(path, mode & 0o777 || 0o644);
  };
  try {
    await new Promise<void>((done, reject) => {
      zip.on("error", reject);
      zip.on("end", done);
      zip.on("entry", (entry: Entry) => {
        void processEntry(entry).then(() => zip.readEntry(), reject);
      });
      zip.readEntry();
    });
    for (const link of links) {
      for (let parent = dirname(link.path); parent !== root; parent = dirname(parent)) {
        if ((await lstat(parent)).isSymbolicLink()) throw Error("archive symlink parent");
      }
      await symlink(link.target, link.path);
    }
    for (const link of links)
      if (!inside(join(root, name), await realpath(link.path))) throw Error("resolved archive symlink escape");
    await sync(root);
    return join(root, name);
  } finally {
    zip.close();
  }
}
