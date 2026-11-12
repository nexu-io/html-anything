import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { prepare, read } from "@";
import { manifestPath } from "@/contract";
import { zip } from "@/write";

const hash = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const goldenHex =
  "504b030414000000080000002100b98ebc338100000099000000190000002e6f70656e6d6f74696f6e2f6d616e69666573742e6a736f6e1dce4d0e82301040e1bbcc9a18a63f83f42a86c5b49dda26a086964443b8bbe8fa7d8bb7430d591606871da4324b0577dbe1c52d8383f288f2bee4b6ccd081ffb45fd5278ce52eb59da06656965cb2c8622c8ec4644754c846120f7e20e5a35657468c4125ad8d5786740842a3c63e45ee83b54c704c1dac529fdb1afe07d3f105504b030414000000080000002100748712631b0000001f0000000a000000696e6465782e68746d6cb3c94dccccb3f3cc4b492d48051279250ae9f93940da461f2c0100504b0102140314000000080000002100b98ebc338100000099000000190000000000000000000000a481000000002e6f70656e6d6f74696f6e2f6d616e69666573742e6a736f6e504b0102140314000000080000002100748712631b0000001f0000000a0000000000000000000000a481b8000000696e6465782e68746d6c504b050600000000020002007f000000fb0000000000";
it("reads an independent Python standard-library DEFLATE ZIP with CRC and inventory verification", async () => {
  const bytes = Buffer.from(goldenHex, "hex");
  const decoded = await read([bytes], "sha256:b75b8afa7b5e004a0b7fd76befb86b8693085cab995c926474c3be69883f664a");
  expect(decoded).toEqual({
    files: [{ path: "index.html", content: "<main>Independent golden</main>" }],
    resources: [],
  });
});
function base() {
  return Buffer.concat([
    ...prepare({ files: [{ path: "index.html", content: "<main>Original</main>" }], resources: [] }).chunks(),
  ]);
}
function central(bytes: Buffer) {
  return bytes.readUInt32LE(bytes.length - 6);
}
const corruptions: { name: string; change: (bytes: Buffer) => Buffer | void }[] = [
  {
    name: "a symlink",
    change: (b) => {
      b.writeUInt32LE((0o120777 << 16) >>> 0, central(b) + 38);
    },
  },
  {
    name: "an executable",
    change: (b) => {
      b.writeUInt32LE((0o100755 << 16) >>> 0, central(b) + 38);
    },
  },
  {
    name: "a directory entry",
    change: (b) => {
      b.writeUInt32LE((0o040755 << 16) >>> 0, central(b) + 38);
    },
  },
  {
    name: "encryption",
    change: (b) => {
      b.writeUInt16LE(0x801, central(b) + 8);
    },
  },
  {
    name: "a data descriptor",
    change: (b) => {
      b.writeUInt16LE(0x808, central(b) + 8);
    },
  },
  {
    name: "unknown compression",
    change: (b) => {
      b.writeUInt16LE(99, central(b) + 10);
    },
  },
  {
    name: "a multi-disk entry",
    change: (b) => {
      b.writeUInt16LE(1, central(b) + 34);
    },
  },
  {
    name: "a multi-disk envelope",
    change: (b) => {
      b.writeUInt16LE(1, b.length - 18);
    },
  },
  {
    name: "overlapping local entries",
    change: (b) => {
      b.writeUInt32LE(1, central(b) + 42);
    },
  },
  { name: "unclaimed trailing data", change: (b) => Buffer.concat([b, Buffer.from("unclaimed")]) },
  { name: "a truncated directory", change: (b) => b.subarray(0, b.length - 1) },
  {
    name: "a false entry count",
    change: (b) => {
      b.writeUInt16LE(3, b.length - 12);
    },
  },
  {
    name: "local/central name mismatch",
    change: (b) => {
      b[30] = 0x78;
    },
  },
  {
    name: "false compressed size",
    change: (b) => {
      b.writeUInt32LE(0xfffffff0, central(b) + 20);
    },
  },
  {
    name: "oversized expansion",
    change: (b) => {
      b.writeUInt32LE(0x10000000, central(b) + 24);
    },
  },
  {
    name: "a body with bad CRC",
    change: (b) => {
      b[30 + b.readUInt16LE(26)]! ^= 1;
    },
  },
];
it.each(corruptions)("rejects $name even when the caller's outer digest matches", async ({ change }) => {
  const original = base(),
    changed = change(original) ?? original;
  await expect(read([changed], hash(changed))).rejects.toMatchObject({ code: "invalid" });
});
function raw(files: { path: string; bytes: Buffer }[], metadata?: string) {
  const manifest =
    metadata ??
    JSON.stringify({
      schema: 1,
      files: files.map((file) => ({ path: file.path, bytes: file.bytes.length, digest: hash(file.bytes) })),
      resources: [],
    });
  return zip([{ path: manifestPath, bytes: Buffer.from(manifest) }, ...files]);
}
it("rejects extra, duplicate and case-colliding entries before returning content", async () => {
  const files = [{ path: "index.html", bytes: Buffer.from("main") }],
    metadata = JSON.stringify({
      schema: 1,
      files: files.map((f) => ({ path: f.path, bytes: f.bytes.length, digest: hash(f.bytes) })),
      resources: [],
    });
  for (const extra of ["extra.txt", "index.html", "INDEX.html", ".openmotion/extra.json"]) {
    const archive = raw([...files, { path: extra, bytes: Buffer.from("unclaimed") }], metadata);
    await expect(read(archive.chunks(), archive.digest)).rejects.toMatchObject({ code: "invalid" });
  }
});
it("rejects unsafe declarations, invalid UTF-8 and instruction files in otherwise regular ZIPs", async () => {
  for (const path of ["../escape.html", "AGENTS.md", "guide/CLAUDE.md", "CON.html", ".git/config.txt"]) {
    const archive = raw([
      { path: "index.html", bytes: Buffer.from("main") },
      { path, bytes: Buffer.from("payload") },
    ]);
    await expect(read(archive.chunks(), archive.digest)).rejects.toMatchObject({ code: "invalid" });
  }
  const archive = raw([{ path: "index.html", bytes: Buffer.from([0xc0, 0xaf]) }]);
  await expect(read(archive.chunks(), archive.digest)).rejects.toThrow("UTF-8");
});
it("requires exact canonical inventory rather than duplicate keys or undeclared authority", async () => {
  const bytes = Buffer.from("main"),
    files = [{ path: "index.html", bytes }],
    claims = [{ path: "index.html", bytes: 4, digest: hash(bytes) }];
  for (const metadata of [
    JSON.stringify({ schema: 1, files: claims, resources: [], namespace: "default" }),
    `{"schema":1,"schema":1,"files":${JSON.stringify(claims)},"resources":[]}`,
    JSON.stringify({ files: claims, schema: 1, resources: [] }),
    JSON.stringify({ schema: 1, files: [{ ...claims[0], digest: `sha256:${"0".repeat(64)}` }], resources: [] }),
  ]) {
    const archive = raw(files, metadata);
    await expect(read(archive.chunks(), archive.digest)).rejects.toMatchObject({ code: "invalid" });
  }
});
it("rejects a false media fact even when ZIP CRCs and declared byte digest are correct", async () => {
  const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
      "base64",
    ),
    source = Buffer.from("<main/>"),
    metadata = JSON.stringify({
      schema: 1,
      files: [{ path: "index.html", bytes: source.length, digest: hash(source) }],
      resources: [
        {
          path: "assets/image.png",
          name: "Image",
          digest: hash(png),
          bytes: png.length,
          type: "image/png",
          width: 33,
          height: 24,
        },
      ],
    });
  const archive = zip([
    { path: manifestPath, bytes: Buffer.from(metadata) },
    { path: "index.html", bytes: source },
    { path: "assets/image.png", bytes: png },
  ]);
  await expect(read(archive.chunks(), archive.digest)).rejects.toThrow("facts or hashes");
});

it("bounds actual DEFLATE output when local and central sizes both under-declare it", async () => {
  const bytes = Buffer.from(goldenHex, "hex");
  bytes.writeUInt32LE(1, 22);
  bytes.writeUInt32LE(1, central(bytes) + 24);
  await expect(read([bytes], hash(bytes))).rejects.toMatchObject({ code: "invalid" });
});
