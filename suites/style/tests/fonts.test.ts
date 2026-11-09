import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { fontAssets, fontCatalog } from "@";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
async function fixture(run: (directory: string, face: Record<string, unknown>) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "font-catalog-")),
    directory = join(root, "source");
  await mkdir(directory);
  const bytes = Buffer.from([0, 1, 0, 0, 0, 0, 0, 0]),
    license = Buffer.from("Copyright example. SIL OPEN FONT LICENSE Version 1.1");
  const face = {
    family: "Test Font",
    file: "font.ttf",
    license: "license.txt",
    sha256: digest(bytes),
    licenseSha256: digest(license),
    weight: [400, 400],
  };
  await writeFile(join(directory, "font.ttf"), bytes);
  await writeFile(join(directory, "license.txt"), license);
  await writeFile(join(directory, "manifest.json"), JSON.stringify({ schema: 1, faces: [face] }));
  try {
    await run(directory, face);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
it("ships a closed font/license/catalog set and emits only declared local font faces", () =>
  fixture(async (directory) => {
    const output = join(directory, "..", "dist");
    const css = await fontAssets({ manifest: join(directory, "manifest.json"), output });
    expect(css).toContain("url('./fonts/font.ttf') format('truetype')");
    expect(css).toContain("font-family: 'Test Font'");
    expect(await readFile(join(output, "fonts/font.ttf"))).toEqual(await readFile(join(directory, "font.ttf")));
    await expect(fontCatalog(join(output, "fonts/manifest.json"))).resolves.toHaveProperty("css", css);
    await expect(fontAssets({ manifest: join(output, "fonts/manifest.json"), output })).rejects.toThrow("differ");
  }));
it("refuses tampering, unlicensed resources, undeclared files, path escapes and symlinks", () =>
  fixture(async (directory, face) => {
    const manifest = join(directory, "manifest.json");
    for (const patch of [
      { sha256: "0".repeat(64) },
      { file: "../font.ttf" },
      { family: "Test'; color:red" },
      { weight: [400, 100] },
      { family: ["Test Font"] },
      { extra: true },
    ]) {
      await writeFile(manifest, JSON.stringify({ schema: 1, faces: [{ ...face, ...patch }] }));
      await expect(fontCatalog(manifest)).rejects.toBeDefined();
    }
    await writeFile(manifest, JSON.stringify({ schema: 1, faces: [face] }));
    await writeFile(join(directory, "unknown.bin"), "extra");
    await expect(fontCatalog(manifest)).rejects.toThrow("unregistered");
    await rm(join(directory, "unknown.bin"));
    const original = await readFile(join(directory, "font.ttf"));
    await rm(join(directory, "font.ttf"));
    await writeFile(join(directory, "..", "real.ttf"), original);
    await symlink(join(directory, "..", "real.ttf"), join(directory, "font.ttf"));
    await expect(fontCatalog(manifest)).rejects.toThrow("regular");
    await rm(join(directory, "font.ttf"));
    await writeFile(join(directory, "font.ttf"), original);
    await writeFile(join(directory, "license.txt"), "not an OFL license");
    await expect(fontCatalog(manifest)).rejects.toThrow("license mismatch");
  }));
