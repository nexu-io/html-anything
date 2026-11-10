import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { bundleEntries, materialize } from "@odsuite/release";
import { afterEach, expect, it } from "vitest";
import { inspect, pack } from "@";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((p) => rm(p, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "node-pack-"));
  roots.push(root);
  const source = join(root, "source");
  for (const file of [
    "main.mjs",
    "LICENSE",
    "NOTICE",
    "web/index.html",
    "daemon/main.mjs",
    "render/worker.mjs",
    ".codex-plugin/plugin.json",
  ]) {
    await mkdir(dirname(join(source, file)), { recursive: true });
    await writeFile(
      join(source, file),
      file === ".codex-plugin/plugin.json" ? JSON.stringify({ version: "1.2.3-beta.4" }) : file,
    );
  }
  await writeFile(
    join(source, "runtime.json"),
    JSON.stringify({
      carrier: "codexplugin",
      channel: "beta",
      version: "1.2.3-beta.4",
      files: ["main.mjs", "LICENSE", "NOTICE", "web/index.html", "daemon/main.mjs", "render/worker.mjs"],
    }),
  );
  return { root, source, carrier: "codexplugin" as const, channel: "beta", version: "1.2.3-beta.4" };
}
it("roundtrips a deterministic Node closure including hidden plugin metadata", async () => {
  const value = await fixture(),
    first = await pack({ ...value, output: join(value.root, "first.bundle") });
  const second = await pack({ ...value, output: join(value.root, "second.bundle") });
  expect(first.sha256).toBe(second.sha256);
  const bytes = await readFile(first.path);
  expect(inspect(bytes)).toMatchObject({ carrier: value.carrier, channel: value.channel, version: value.version });
  expect(bundleEntries(bytes).some((f) => f.path === ".codex-plugin/plugin.json")).toBe(true);
  const installed = join(value.root, "installed");
  await materialize(bytes, installed);
  expect(await readFile(join(installed, "main.mjs"), "utf8")).toBe("main.mjs");
});
it("rejects incomplete closures, channel mismatches, symlinks and overlapping output", async () => {
  const value = await fixture(),
    output = join(value.root, "output.bundle");
  await expect(pack({ ...value, channel: "stable", output })).rejects.toThrow("mismatch");
  await expect(pack({ ...value, output: join(value.source, "output.bundle") })).rejects.toThrow("overlap");
  await symlink(join(value.source, "main.mjs"), join(value.source, "link.mjs"));
  await expect(pack({ ...value, output })).rejects.toThrow("entries");
  await rm(join(value.source, "link.mjs"));
  await rm(join(value.source, "render/worker.mjs"));
  await expect(pack({ ...value, output })).rejects.toThrow("incomplete");
});
it("does not overwrite an existing delivery artifact", async () => {
  const value = await fixture(),
    output = join(value.root, "output.bundle");
  await writeFile(output, "prior artifact");
  await expect(pack({ ...value, output })).rejects.toThrow();
  expect(await readFile(output, "utf8")).toBe("prior artifact");
});
