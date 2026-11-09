import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, win32 } from "node:path";

import { define } from "@odsuite/config";
import { channel, envelope } from "@odsuite/protocol";
import { afterEach, describe, expect, it } from "vitest";

import { bundle, compose, decode, materialize, resolve } from "@";
import { bundleDestination } from "@/bundle.js";

const roots: string[] = [];

async function root(): Promise<string> {
  const value = await mkdtemp(join(tmpdir(), "release-"));
  roots.push(value);
  return value;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((value) => rm(value, { force: true, recursive: true })));
});

describe("bundle", () => {
  it("contains Windows destinations using native path semantics", () => {
    expect(bundleDestination("C:\\product", "nested/main.mjs", win32)).toBe("C:\\product\\nested\\main.mjs");
    for (const name of ["../escape", "C:\\product-other\\file", "D:\\file", "."])
      expect(() => bundleDestination("C:\\product", name, win32)).toThrow("escaped");
  });
  it("packs deterministic files and materializes without path inference", async () => {
    const source = await root();
    const target = await root();
    await mkdir(join(source, "nested"));
    await writeFile(join(source, "main.mjs"), "main");
    await chmod(join(source, "main.mjs"), 0o755);
    await writeFile(join(source, "nested", "asset.js"), "asset");
    const first = await bundle(source, { "release.json": "identity" });
    const second = await bundle(source, { "release.json": "identity" });

    expect(first).toEqual(second);
    await materialize(first, target);
    expect(await readFile(join(target, "main.mjs"), "utf8")).toBe("main");
    expect(await readFile(join(target, "nested", "asset.js"), "utf8")).toBe("asset");
    expect(await readFile(join(target, "release.json"), "utf8")).toBe("identity");
  });

  it("builds generation identity from actual bundles and release identity", async () => {
    const base = await root();
    const capsule = join(base, "capsule");
    const daemon = join(base, "daemon");
    const web = join(base, "web");
    const model = join(base, "model.bin");
    for (const path of [capsule, daemon, web]) await mkdir(path);
    await writeFile(join(capsule, "index.mjs"), "capsule");
    await writeFile(join(daemon, "main.mjs"), "daemon");
    await writeFile(join(web, "index.html"), "web");
    await writeFile(model, "model");
    const stable = channel("stable");
    const first = resolve(define(), { channel: stable, version: "1.0.0" });
    const second = resolve(define(), { channel: stable, version: "2.0.0" });
    const source = { blobs: [{ path: model, slot: "model" }], capsule, carrier: 1, daemon, web };
    const initial = await compose(first, source);
    const update = await compose(second, source);

    expect(envelope(initial.envelope)).toEqual(initial.envelope);
    expect(initial.envelope.generation.web).toEqual(update.envelope.generation.web);
    expect(initial.envelope.generation.capsule.digest).not.toBe(update.envelope.generation.capsule.digest);
    const target = await root();
    const asset = initial.assets[0];
    if (!asset) throw new Error("asset missing");
    await materialize(asset.bytes, target);
    expect(decode(await readFile(join(target, "release.json"), "utf8"))).toEqual(first);
  });

  it("rejects traversal and file collisions", async () => {
    const target = await root();
    const traversal = JSON.stringify({ files: [{ bytes: "", mode: 420, path: "../escape" }], schema: 1 });
    const collision = JSON.stringify({
      files: [
        { bytes: "", mode: 420, path: "item" },
        { bytes: "", mode: 420, path: "item/file" },
      ],
      schema: 1,
    });

    await expect(materialize(traversal, target)).rejects.toThrow("path");
    await expect(materialize(collision, target)).rejects.toThrow("collision");
  });
});
