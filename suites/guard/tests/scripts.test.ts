import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { guard } from "@";

async function check(scripts: unknown, workspace = true, directory = false) {
  const root = await mkdtemp(join(tmpdir(), "scripts-policy-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ name: "fixture", scripts }));
    if (workspace) await writeFile(join(root, "pnpm-workspace.yaml"), "packages: [apps/*]\n");
    if (directory) await mkdir(join(root, "scripts"));
    return (await guard({ root })).findings.filter((f) => ["package.scripts", "directory.scripts"].includes(f.rule));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
it("accepts only same-name optional recursive dispatch at a workspace root", async () => {
  expect(
    await check({
      lint: "pnpm -r --if-present run lint",
      test: "pnpm -r --if-present run test",
      build: "pnpm -r --if-present run build",
    }),
  ).toEqual([]);
});
it.each([
  { postinstall: "node bootstrap.mjs" },
  { prepare: "git config core.hooksPath .githooks" },
  { guard: "odsuite guard" },
  { format: "biome check --write ." },
  { "verify:skeleton": "node verify.mjs" },
  { build: "pnpm -r --if-exists run build" },
  { build: "pnpm -r --if-present run test" },
  { build: "pnpm -r --if-present run build && node extra.mjs" },
  { lint: "biome check ." },
  { test: "pnpm --filter special test" },
  { build: 1 },
  [],
  "build",
])("rejects extra hooks, aliases, invalid values and altered dispatch: %j", async (scripts) => {
  expect(await check(scripts)).toContainEqual(expect.objectContaining({ rule: "package.scripts" }));
});
it("allows module-owned tools and rejects delegation back to the root", async () => {
  expect(
    await check(
      {
        lint: "biome check .",
        test: "vitest run -c vitest.config.ts",
        build: "node esbuild.config.mjs && tsc -p tsconfig.json --emitDeclarationOnly && tsc -p tsconfig.tests.json",
      },
      false,
    ),
  ).toEqual([]);
  expect(await check({ build: "pnpm -w build" }, false)).toHaveLength(1);
  expect(await check({ test: "vitest run; node extra.mjs" }, false)).toHaveLength(1);
});
it("rejects even empty scripts directories", async () => {
  expect(await check({}, true, true)).toContainEqual(
    expect.objectContaining({ path: "scripts", rule: "directory.scripts" }),
  );
});
it("does not let a linked manifest or scripts directory bypass inspection", async () => {
  const root = await mkdtemp(join(tmpdir(), "scripts-links-"));
  try {
    await writeFile(
      join(root, "manifest.json"),
      JSON.stringify({ name: "linked", scripts: { start: "node start.mjs" } }),
    );
    await symlink(join(root, "manifest.json"), join(root, "package.json"));
    await symlink(root, join(root, "scripts"), "dir");
    const report = await guard({ root });
    expect(report.findings).toContainEqual(expect.objectContaining({ path: "package.json", rule: "package.scripts" }));
    expect(report.findings).toContainEqual(expect.objectContaining({ path: "scripts", rule: "directory.scripts" }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
