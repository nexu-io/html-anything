import { createHash } from "node:crypto";
import { initialFiles, type SourcePayload } from "@open-motion/workspace";
import { resourceBytesLimit, resourceLimit, sourceLimits } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import { limits, prepare, read } from "@";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
function wave(length = 16044) {
  const bytes = Buffer.alloc(length);
  bytes.write("RIFF");
  bytes.writeUInt32LE(length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24);
  bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(length - 44, 40);
  return bytes;
}
function payload(): SourcePayload {
  return {
    files: [
      ...initialFiles(),
      { path: "compositions/场景.html", content: "<p>Editable 场景</p>" },
      { path: "licenses/fonts.txt", content: "Retain explicit source notices." },
      { path: ".hyperframes/studio-motion.json", content: "{}" },
    ],
    resources: [
      { path: "assets/poster.png", name: "海报", bytes: Buffer.from(png) },
      { path: "assets/sound.wav", name: "Source sound", bytes: wave() },
    ],
  };
}
const order = <T extends { path: string }>(a: T, b: T) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
function* fragments(bytes: Buffer, size: number) {
  for (let at = 0; at < bytes.length; at += size) yield bytes.subarray(at, at + size);
}
it.each([1, 7, limits.chunkBytes])(
  "preserves native source, Studio files, named PNG/WAV and notices through %i-byte input fragments",
  async (size) => {
    const original = payload(),
      archive = prepare(original),
      chunks = [...archive.chunks()],
      bytes = Buffer.concat(chunks);
    expect(chunks.every((chunk) => chunk.length <= limits.chunkBytes)).toBe(true);
    expect(bytes.length).toBe(archive.bytes);
    expect(`sha256:${createHash("sha256").update(bytes).digest("hex")}`).toBe(archive.digest);
    const decoded = await read(fragments(bytes, size), archive.digest);
    expect(decoded.files).toEqual(original.files.sort(order));
    expect(decoded.resources).toEqual(original.resources.sort(order));
    expect(prepare(decoded).digest).toBe(archive.digest);
  },
);
it("owns immutable prepared bytes across caller mutations and independent consumers", async () => {
  const original = payload(),
    archive = prepare(original),
    digest = archive.digest,
    pngBefore = Buffer.from(original.resources[0]!.bytes);
  original.files[0]!.content = "Changed after preparation";
  original.resources[0]!.bytes.fill(0);
  const first = archive.chunks()[Symbol.iterator]();
  first.next().value?.fill(0);
  first.return?.();
  const decoded = await read(archive.chunks(), digest);
  expect(decoded.files.some((file) => file.content === "Changed after preparation")).toBe(false);
  expect(decoded.resources.find((resource) => resource.path === "assets/poster.png")?.bytes).toEqual(pngBefore);
  expect(prepare(decoded).digest).toBe(digest);
});
it("is deterministic across source and resource input order", () => {
  const original = payload(),
    first = prepare(original);
  original.files.reverse();
  original.resources.reverse();
  const second = prepare(original);
  expect(second.digest).toBe(first.digest);
  expect(Buffer.concat([...second.chunks()])).toEqual(Buffer.concat([...first.chunks()]));
});
const badPaths = [
  "../escape.html",
  "/absolute.html",
  "C:/host.html",
  "a\\b.html",
  "AGENTS.md",
  "guide/claude.md",
  "CON.txt",
  "parts/file?.html",
  "parts/trailing .",
  "parts/e\u0301.html",
];
it.each(badPaths)("rejects unsafe or nonportable source name %s without rewriting it", (path) => {
  const input = payload();
  input.files.push({ path, content: "Do not materialize this" });
  expect(() => prepare(input)).toThrow();
});
it.each([
  ["parts/A.html", "parts/a.html"],
  ["Parts/a.html", "parts/b.html"],
  ["entry.html", "entry.html/child.html"],
  ["same.txt", "same.txt"],
])("rejects file/directory and case-fold collisions: %s / %s", (first, second) => {
  const input = payload();
  input.files.push({ path: first, content: "A" }, { path: second, content: "B" });
  expect(() => prepare(input)).toThrow();
});
it("rejects a resource path used as a source directory", () => {
  const input = payload();
  input.files.push({ path: "assets/poster.png/child.html", content: "collision" });
  expect(() => prepare(input)).toThrow("collision");
});
it("rejects malformed bodies and mismatched types before creating an archive", () => {
  const bad = payload();
  bad.resources[1]!.bytes = Buffer.from("not WAV");
  expect(() => prepare(bad)).toThrow();
  bad.resources[1]!.bytes = png;
  expect(() => prepare(bad)).toThrow();
  bad.resources = [];
  bad.files = [{ path: "other.html", content: "missing index" }];
  expect(() => prepare(bad)).toThrow("index.html");
  bad.files = [{ path: "index.html", content: "\ud800" }];
  expect(() => prepare(bad)).toThrow("UTF-8");
});
it("preflights resource and source bounds before media decoding", () => {
  const input = payload(),
    invalidPng = Buffer.alloc(resourceLimit);
  input.resources = Array.from({ length: 11 }, (_, n) => ({
    path: `assets/image${n}.png`,
    name: "Invalid",
    bytes: invalidPng,
  }));
  expect(() => prepare(input)).toThrow("64 MiB");
  input.resources = [];
  input.files = Array.from({ length: 5 }, (_, n) => ({
    path: n ? `part${n}.txt` : "index.html",
    content: "x".repeat(sourceLimits.fileCharacters),
  }));
  expect(() => prepare(input)).toThrow("4 MiB");
});
it("accepts the finite 128-source/64-media inventory without extra entries", async () => {
  const input: SourcePayload = {
    files: Array.from({ length: 128 }, (_, n) => ({ path: n ? `part${n}.txt` : "index.html", content: "" })),
    resources: Array.from({ length: 64 }, (_, n) => ({ path: `assets/image${n}.png`, name: `Image ${n}`, bytes: png })),
  };
  const archive = prepare(input);
  expect(archive.entries).toBe(limits.entries);
  expect((await read(archive.chunks(), archive.digest)).resources).toHaveLength(64);
  input.resources.push({ path: "assets/extra.png", name: "Overflow", bytes: png });
  expect(() => prepare(input)).toThrow("count");
});
it("streams an actual 4 MiB source + 64 MiB PCM project beyond the JSON business-body limit", async () => {
  const input: SourcePayload = {
    files: Array.from({ length: 4 }, (_, n) => ({
      path: n ? `part${n}.txt` : "index.html",
      content: "x".repeat(sourceLimits.fileCharacters),
    })),
    resources: Array.from({ length: Math.ceil(resourceBytesLimit / resourceLimit) }, (_, n) => ({
      path: `assets/sound${n}.wav`,
      name: `Sound ${n}`,
      bytes: wave(Math.min(resourceLimit, resourceBytesLimit - n * resourceLimit)),
    })),
  };
  expect(input.resources.reduce((sum, entry) => sum + entry.bytes.byteLength, 0)).toBe(resourceBytesLimit);
  const archive = prepare(input);
  expect(archive.bytes).toBeGreaterThan(68 * 1024 ** 2);
  expect(archive.bytes).toBeLessThan(limits.archiveBytes);
  const decoded = await read(archive.chunks(), archive.digest);
  expect(decoded.files).toEqual(input.files.sort(order));
  expect(
    decoded.resources.map((entry) => ({ path: entry.path, name: entry.name, bytes: entry.bytes.byteLength })),
  ).toEqual(
    input.resources.sort(order).map((entry) => ({ path: entry.path, name: entry.name, bytes: entry.bytes.byteLength })),
  );
  for (const entry of decoded.resources)
    expect(
      Buffer.from(entry.bytes).equals(Buffer.from(input.resources.find((value) => value.path === entry.path)!.bytes)),
    ).toBe(true);
}, 20000);
it("rejects a wrong fixed digest and closes oversized/interrupted producers", async () => {
  const archive = prepare(payload());
  await expect(read(archive.chunks(), `sha256:${"0".repeat(64)}`)).rejects.toMatchObject({ code: "integrity" });
  let closed = false;
  async function* overflow() {
    try {
      const chunk = Buffer.alloc(10 * 1024 ** 2);
      for (let n = 0; n < 8; n++) yield chunk;
    } finally {
      closed = true;
    }
  }
  await expect(read(overflow(), archive.digest)).rejects.toThrow("72 MiB");
  expect(closed).toBe(true);
  closed = false;
  async function* interrupted() {
    try {
      yield Buffer.from("partial");
      throw Error("transport interrupted");
    } finally {
      closed = true;
    }
  }
  await expect(read(interrupted(), archive.digest)).rejects.toThrow("transport interrupted");
  expect(closed).toBe(true);
});

it("preserves the existing character limit while bounding aggregate UTF-8 bytes", async () => {
  const input: SourcePayload = {
    files: [
      { path: "index.html", content: "中".repeat(sourceLimits.fileCharacters) },
      { path: "ascii.txt", content: "x".repeat(sourceLimits.fileCharacters) },
    ],
    resources: [],
  };
  expect(input.files.reduce((sum, file) => sum + Buffer.byteLength(file.content), 0)).toBe(sourceLimits.bytes);
  const archive = prepare(input),
    decoded = await read(archive.chunks(), archive.digest);
  expect(decoded.files).toEqual(input.files.sort(order));
});
