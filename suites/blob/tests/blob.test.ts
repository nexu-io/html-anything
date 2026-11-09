import { mkdir, mkdtemp, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { Store } from "@";

const roots: string[] = [];

async function store(): Promise<{ root: string; store: Store }> {
  const root = await mkdtemp(join(tmpdir(), "odsuite-blob-"));
  roots.push(root);
  return { root, store: await Store.open({ root }) };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("blob", () => {
  it("stores immutable bytes once across logical slots", async () => {
    const current = await store();
    const [first, second] = await Promise.all([
      current.store.put("blob", "model", "content"),
      current.store.put("web", "fixture", "content"),
    ]);

    expect(first.digest).toBe(second.digest);
    expect(first.kind).toBe("blob");
    expect(second.kind).toBe("web");
    expect(first.slot).not.toBe(second.slot);
    expect(Buffer.from(await current.store.read(first)).toString()).toBe("content");
    expect(await readdir(join(current.root, "objects"))).toHaveLength(1);
  });

  it("detects corruption at the content address", async () => {
    const current = await store();
    const artifact = await current.store.put("daemon", "main", "content");
    await writeFile(join(current.root, "objects", artifact.digest.slice(7)), "changed");

    await expect(current.store.read(artifact)).rejects.toThrow("integrity");
    await expect(current.store.has(artifact)).rejects.toThrow("integrity");
  });

  it("rejects ambiguous logical names", async () => {
    const current = await store();
    await expect(current.store.put("capsule", "../model", "content")).rejects.toThrow("single word");
  });
});

it.runIf(process.platform !== "win32")("rejects swapped CAS directories and symlink objects", async () => {
  const current = await store(),
    foreign = join(current.root, "foreign");
  await mkdir(foreign);
  await rm(join(current.root, "objects"), { recursive: true });
  await symlink(foreign, join(current.root, "objects"), "dir");
  await expect(current.store.put("blob", "probe", "content")).rejects.toThrow("escaped");
  expect(await readdir(foreign)).toEqual([]);
  const other = await store(),
    artifact = await other.store.put("blob", "probe", "content"),
    external = join(other.root, "external");
  await writeFile(external, "content");
  await rm(join(other.root, "objects", artifact.digest.slice(7)));
  await symlink(external, join(other.root, "objects", artifact.digest.slice(7)));
  await expect(other.store.read(artifact)).rejects.toThrow("regular");
});
