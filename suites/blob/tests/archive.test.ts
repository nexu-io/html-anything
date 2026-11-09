import { mkdtemp, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";
import { canonical, channel, digest, namespace } from "@odsuite/protocol";
import { type Context, managerEndpoint, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { inspectZip, Library, type Resource, resourceKey } from "@";

type File = { path: string; bytes: Buffer; mode?: number };
/** Small, real ZIP fixture producer; native bounds are asserted independently below. */
function zip(files: File[]) {
  const locals: Buffer[] = [],
    central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.path),
      compressed = deflateRawSync(file.bytes),
      local = Buffer.alloc(30),
      directory = Buffer.alloc(46),
      checksum = crc32(file.bytes);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(file.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    directory.writeUInt32LE(0x02014b50);
    directory.writeUInt16LE(0x0314, 4);
    local.copy(directory, 6, 4, 30);
    directory.writeUInt32LE(((file.mode ?? 0o100644) * 65536) >>> 0, 38);
    directory.writeUInt32LE(offset, 42);
    locals.push(local, name, compressed);
    central.push(directory, name);
    offset += local.length + name.length + compressed.length;
  }
  const records = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(records.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, records, end]);
}
async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "blob-archive-"))),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("archive") });
  let library!: Library, context!: Context;
  const attachment = await factory.expose({
    identity: { service: "render", generation: digest("archive test") },
    handlers: {},
    lifecycle: {
      initialize: async (ctx) => {
        context = ctx;
        library = await Library.open({ factory, context: ctx, retentionMs: 0 });
      },
      stop: async () => {},
    },
  });
  return {
    root,
    library,
    context,
    factory,
    close: async () => {
      await library.close();
      await attachment.close();
      await manager.close();
    },
  };
}
it("streams a native file above 64 MiB, protects its actual Use and checks the publisher tree on reuse", async () => {
  const f = await fixture();
  try {
    const native = Buffer.alloc(65 * 1024 ** 2, 97),
      archive = zip([
        { path: "bin/tool", bytes: native, mode: 0o100755 },
        { path: "empty/", bytes: Buffer.alloc(0), mode: 0o040755 },
      ]),
      path = join(f.context.roots.runtime, "native.zip");
    await writeFile(path, archive);
    const expected = {
      tree: digest(
        canonical({
          schema: 1,
          entries: [
            { path: "bin", type: "directory" },
            { path: "bin/tool", type: "file", bytes: native.length, digest: digest(native), mode: 0o755 },
            { path: "empty", type: "directory" },
          ],
        }),
      ),
      expandedBytes: native.length,
    };
    expect(await inspectZip(path)).toEqual(expected);
    const resource: Resource = {
      type: "archive",
      ...expected,
      artifact: { kind: "blob", slot: "native", bytes: archive.length, digest: digest(archive) },
    };
    const use = await f.library.acquire(resource, async () =>
      (async function* () {
        for (let i = 0; i < archive.length; i += 8192) yield archive.subarray(i, i + 8192);
      })(),
    );
    expect((await stat(join(use.path, "bin/tool"))).size).toBe(native.length);
    if (process.platform !== "win32") expect((await stat(join(use.path, "bin/tool"))).mode & 0o111).toBe(0o111);
    expect((await stat(join(use.path, "empty"))).isDirectory()).toBe(true);
    await expect(f.library.session((l) => l.read(resource))).rejects.toThrow("verified paths");
    expect(await f.library.collect()).toEqual([]);
    await writeFile(join(use.path, "bin/tool"), "corrupt");
    await expect(f.library.acquire(resource, async () => archive)).rejects.toThrow("integrity");
    expect(await f.library.collect()).toEqual([]);
    await f.library.release(use);
    expect(await f.library.collect()).toEqual([resourceKey(resource)]);
    await expect(stat(use.path)).rejects.toThrow("ENOENT");
    await expect(
      f.library.acquire({ ...resource, tree: digest("wrong publisher tree") }, async () => archive),
    ).rejects.toThrow("tree integrity");
    expect((await f.library.status()).entries[resourceKey(resource)]).toBeUndefined();
  } finally {
    await f.close();
  }
}, 30000);

it("rejects traversal, ambiguous paths, links, conflicting entries and expanded-size lies", async () => {
  const f = await fixture();
  try {
    const path = join(f.context.roots.runtime, "invalid.zip");
    for (const files of [
      [{ path: "../escape", bytes: Buffer.from("x") }],
      [{ path: "/escape", bytes: Buffer.from("x") }],
      [{ path: "a\\b", bytes: Buffer.from("x") }],
      [{ path: "bad. ", bytes: Buffer.from("x") }],
      [{ path: "CON.txt", bytes: Buffer.from("x") }],
      [{ path: "a?b", bytes: Buffer.from("x") }],
      [{ path: "link", bytes: Buffer.from("target"), mode: 0o120777 }],
      [
        { path: "a", bytes: Buffer.from("x") },
        { path: "a/child", bytes: Buffer.from("x") },
      ],
      [
        { path: "A", bytes: Buffer.from("x") },
        { path: "a", bytes: Buffer.from("x") },
      ],
      [
        { path: "a", bytes: Buffer.from("x") },
        { path: "a", bytes: Buffer.from("x") },
      ],
    ]) {
      await writeFile(path, zip(files));
      await expect(inspectZip(path)).rejects.toThrow();
    }
    const archive = zip([{ path: "tool", bytes: Buffer.from("native") }]);
    await writeFile(path, archive);
    const expected = await inspectZip(path),
      resource: Resource = {
        type: "archive",
        ...expected,
        expandedBytes: 1,
        artifact: { kind: "blob", slot: "bad", bytes: archive.length, digest: digest(archive) },
      };
    const sentinel = join(f.context.roots.data, "sentinel");
    await writeFile(sentinel, "user state");
    await expect(f.library.acquire(resource, async () => archive)).rejects.toThrow("expanded size");
    expect(await readFile(sentinel, "utf8")).toBe("user state");
    expect((await f.factory.resources()).grants.filter((g) => g.kind === "staging" && g.name === "blob")).toEqual([]);
  } finally {
    await f.close();
  }
});
