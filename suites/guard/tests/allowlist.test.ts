import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { configuration, defaults, guard } from "@";

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "directory-policy-"));
  try {
    await writeFile(join(root, "package.json"), '{"name":"fixture"}');
    await writeFile(join(root, "pnpm-workspace.yaml"), "packages: [apps/*, packages/*]\n");
    for (const path of ["apps/unit/src", "apps/unit/tests", "packages/components/src"])
      await mkdir(join(root, path), { recursive: true });
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
const violations = (report: Awaited<ReturnType<typeof guard>>) =>
  report.findings.filter((finding) => finding.rule === "directory.allowed");
const policy = (paths: string[]) =>
  configuration({
    schemaVersion: 1,
    guard: { directories: { repository: [...defaults.directories.repository, ...paths] } },
  });

it("rejects unknown nodes throughout the repository, including empty/hidden/test/component directories", async () => {
  await fixture(async (root) => {
    const paths = [
      "specs",
      "skills",
      "assets",
      ".skills",
      ".github",
      "apps/unit/assets",
      "apps/unit/src/assets",
      "apps/unit/tests/fixtures",
      "packages/components/assets",
    ];
    for (const path of paths) await mkdir(join(root, path), { recursive: true });
    expect(
      violations(await guard({ root }))
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(paths.sort());
  });
});
it("approves bounded expansion node by node without authorizing descendants or other modules", async () => {
  await fixture(async (root) => {
    for (const path of ["apps/unit/tests/flows/login", "apps/unit/tests/flows/login/assets", "apps/other/tests/flows"])
      await mkdir(join(root, path), { recursive: true });
    const report = await guard({ root, policy: policy(["apps/unit/tests/flows", "apps/unit/tests/flows/*"]) });
    expect(
      violations(report)
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(["apps/other/tests/flows", "apps/unit/tests/flows/login/assets"]);
    const missingParent = await guard({ root, policy: policy(["apps/unit/tests/flows/*"]) });
    expect(violations(missingParent)).toContainEqual(expect.objectContaining({ path: "apps/unit/tests/flows" }));
  });
});
it("supports single modules while keeping root source trees closed at aggregate roots", async () => {
  await fixture(async (root) => {
    await mkdir(join(root, "src"));
    expect(violations(await guard({ root }))).toContainEqual(expect.objectContaining({ path: "src" }));
    await rm(join(root, "pnpm-workspace.yaml"));
    await rm(join(root, "apps"), { recursive: true });
    await rm(join(root, "packages"), { recursive: true });
    expect(violations(await guard({ root }))).toEqual([]);
  });
});
it("keeps depth and width constraints active after directory authorization", async () => {
  await fixture(async (root) => {
    const paths = Array.from({ length: 9 }, (_, n) => `apps/unit/tests/case${n}`);
    paths.push(
      "apps/unit/tests/a",
      "apps/unit/tests/a/b",
      "apps/unit/tests/a/b/c",
      "apps/unit/tests/a/b/c/d",
      "apps/unit/tests/a/b/c/d/e",
    );
    for (const path of paths) await mkdir(join(root, path), { recursive: true });
    const report = await guard({ root, policy: policy(paths) });
    expect(violations(report)).toEqual([]);
    expect(report.findings).toContainEqual(expect.objectContaining({ rule: "directory.depth" }));
    expect(report.findings).toContainEqual(expect.objectContaining({ rule: "directory.children" }));
  });
});
it("prunes only owned output boundaries and reports them without inspecting their contents", async () => {
  await fixture(async (root) => {
    for (const path of [
      "node_modules/deep",
      ".artifacts/seed",
      ".state/cache",
      "apps/unit/dist/assets",
      "apps/unit/coverage/html",
    ])
      await mkdir(join(root, path), { recursive: true });
    const report = await guard({ root });
    expect(violations(report)).toEqual([]);
    expect(report.pruned).toContain("apps/unit/dist");
    expect(report.directories).toEqual(defaults.directories);
    expect(report.paths).toBeLessThan(20);
    await mkdir(join(root, "apps/unit/src/dist"));
    await mkdir(join(root, "dist"));
    await mkdir(join(root, "apps/unit/.git"));
    expect(
      violations(await guard({ root }))
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(["apps/unit/.git", "apps/unit/src/dist", "dist"]);
  });
});
it("does not let exclude conceal an unknown or approved source directory", async () => {
  await fixture(async (root) => {
    await mkdir(join(root, "skills"));
    const value = policy([]);
    value.exclude.push("skills/**", "apps/unit/src/**");
    const report = await guard({ root, policy: value });
    expect(
      violations(report)
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(["apps/unit/src", "skills"]);
  });
});
it("rejects links even at approved or excluded boundaries without traversing targets", async () => {
  await fixture(async (root) => {
    const target = await mkdtemp(join(tmpdir(), "outside-policy-"));
    try {
      await mkdir(join(target, "assets"));
      await symlink(target, join(root, "node_modules"), "dir");
      await symlink(target, join(root, "apps/unit/tests/flows"), "dir");
      const report = await guard({ root, policy: policy(["apps/unit/tests/flows"]) });
      expect(
        violations(report)
          .map((finding) => finding.path)
          .sort(),
      ).toEqual(["apps/unit/tests/flows", "node_modules"]);
      expect(report.findings.some((finding) => finding.path.includes("flows/assets"))).toBe(false);
    } finally {
      await rm(target, { recursive: true, force: true });
    }
  });
});
it.each([null, [], { unknown: [] }, { module: ["src/**"] }, { repository: ["**"] }, { module: ["../outside"] }])(
  "rejects invalid or recursive directory policies: %j",
  (directories) => {
    expect(() => configuration({ schemaVersion: 1, guard: { directories } })).toThrow();
  },
);
it("inherits omitted scopes, replaces explicit arrays, and does not mutate defaults", () => {
  const value = configuration({ schemaVersion: 1, guard: { directories: { repository: [] } } });
  expect(value.directories.repository).toEqual([]);
  expect(value.directories.module).toEqual(defaults.directories.module);
  expect(configuration(undefined).directories.repository).toContain("apps");
});
