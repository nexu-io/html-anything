import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { guard } from "@";

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "odsuite-module-"));
  const files: Record<string, string> = {
    "package.json": JSON.stringify({
      name: "fixture",
      scripts: { test: "vitest run -c vitest.config.ts" },
      devDependencies: { typescript: "7.0.2", vitest: "4.1.6", "@biomejs/biome": "2.6.4" },
    }),
    "biome.json": "{}",
    "tsconfig.json": JSON.stringify({ compilerOptions: { strict: true }, include: ["src"] }),
    "tsconfig.tests.json": JSON.stringify({
      extends: "./tsconfig.json",
      compilerOptions: { paths: { "@": ["./src"] } },
      include: ["tests"],
    }),
    "vitest.config.ts": 'export default { test: { include: ["tests/**/*.test.ts"] } };',
    "src/index.ts": "export const value = 1;",
    "tests/value.test.ts": "export {};",
  };
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

describe("repository contracts", () => {
  it("accepts a complete non-Git module and ignores declared outputs", async () => {
    const root = await fixture();
    try {
      await mkdir(join(root, "node_modules", "deep"), { recursive: true });
      await writeFile(join(root, "node_modules", "deep", "bad.css"), "body{}");
      expect((await guard({ root })).findings).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects dependency ranges and wrong test aliases/discovery", async () => {
    const root = await fixture();
    try {
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({ name: "fixture", dependencies: { other: "^1.2.3" } }),
      );
      await writeFile(
        join(root, "tsconfig.tests.json"),
        JSON.stringify({ include: ["tests"], compilerOptions: { paths: { "@": ["../other/src"] } } }),
      );
      await writeFile(
        join(root, "vitest.config.ts"),
        '// tests/**/*.test.ts\nexport default { test: { include: ["tests/*.test.ts"] } };',
      );
      const findings = (await guard({ root })).findings;
      expect(findings).toContainEqual(expect.objectContaining({ rule: "dependency.version" }));
      expect(findings).toContainEqual(
        expect.objectContaining({ rule: "module.typescript", message: "test config must declare @ -> ./src" }),
      );
      expect(findings).toContainEqual(
        expect.objectContaining({
          rule: "module.vitest",
          message: "test.include must explicitly contain tests/**/*.test.ts",
        }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("enforces workspace dependencies and keeps aggregate root outside module width", async () => {
    const root = await fixture();
    try {
      await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
      await mkdir(join(root, "packages", "child"), { recursive: true });
      await mkdir(join(root, "packages", "orphan"), { recursive: true });
      await writeFile(
        join(root, "packages", "child", "package.json"),
        JSON.stringify({ name: "@fixture/child", dependencies: { fixture: "1.0.0" } }),
      );
      const report = await guard({ root });
      expect(report.findings).toContainEqual(
        expect.objectContaining({
          path: "packages/child/package.json",
          rule: "dependency.version",
          message: "dependencies.fixture must use workspace:*",
        }),
      );
      expect(report.findings.some((finding) => finding.path === "." && finding.rule === "directory.children")).toBe(
        false,
      );
      expect(report.findings).toContainEqual(
        expect.objectContaining({ path: "packages/child/tests", rule: "module.layout" }),
      );
      expect(report.findings).toContainEqual(
        expect.objectContaining({ path: "packages/orphan/package.json", rule: "module.layout" }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("applies ordered overrides and rule-specific exceptions", async () => {
    const root = await fixture();
    try {
      await writeFile(join(root, "src", "index.ts"), "// line\n".repeat(501));
      await writeFile(
        join(root, "odsuite.yaml"),
        "schemaVersion: 1\nguard:\n  overrides:\n    - paths: [src/**]\n      rules:\n        file.lines: {max: 600}\n    - paths: [src/index.ts]\n      rules:\n        file.lines: {max: 500}\n  exceptions:\n    - paths: [src/index.ts]\n      rules: [file.lines]\n      reason: Test exception\n",
      );
      expect((await guard({ root })).findings).toEqual([]);
      await writeFile(join(root, "src", "view.css"), "body{}");
      expect((await guard({ root })).findings).toContainEqual(expect.objectContaining({ rule: "file.style" }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not traverse links and rejects linked configuration", async () => {
    const root = await fixture();
    const outside = await mkdtemp(join(tmpdir(), "odsuite-outside-"));
    try {
      await writeFile(join(outside, "bad.css"), "body{}");
      await symlink(outside, join(root, "linked"), "dir");
      expect((await guard({ root })).findings).toContainEqual(
        expect.objectContaining({ path: "linked", rule: "directory.allowed" }),
      );
      await writeFile(join(outside, "odsuite.yaml"), "schemaVersion: 1\n");
      await symlink(join(outside, "bad.css"), join(root, "src", "linked.css"));
      expect((await guard({ root })).findings).toContainEqual(
        expect.objectContaining({ path: "src/linked.css", rule: "file.coverage" }),
      );
      await symlink(join(outside, "odsuite.yaml"), join(root, "odsuite.yaml"));
      await expect(guard({ root })).rejects.toThrow("regular file");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });
});
