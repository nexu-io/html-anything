import { describe, expect, it } from "vitest";
import { type Context, configuration, type Entry } from "@";
import { tree } from "@/rules/tree.js";

function context(entries: Entry[], components: string[] = []): Context {
  return {
    root: "/unused",
    policy: configuration({ schemaVersion: 1, guard: { components } }),
    modules: [{ path: "packages/unit", name: "@test/unit", manifest: {} }],
    entries,
  };
}

describe("module directory limits", () => {
  it("counts a nested module root as a direct child of its containing module", () => {
    const entries: Entry[] = Array.from({ length: 8 }, (_, index) => ({
      path: `packages/unit/src/item${index}.ts`,
      kind: "file",
    }));
    entries.push({ path: "packages/unit/src/nested", kind: "directory" });
    const value = context(entries);
    value.modules.push({ path: "packages/unit/src/nested", name: "@test/nested", manifest: {} });
    expect(tree(value)).toContainEqual(
      expect.objectContaining({ path: "packages/unit/src", rule: "directory.children" }),
    );
  });
  it("counts src and tests from module root and includes empty directories", () => {
    const entries: Entry[] = [
      { path: "packages/unit/src/a/b/c/d", kind: "directory" },
      { path: "packages/unit/tests/a/b/c/d/e", kind: "directory" },
    ];
    expect(tree(context(entries))).toEqual([
      expect.objectContaining({ path: "packages/unit/tests/a/b/c/d/e", rule: "directory.depth" }),
    ]);
  });

  it("counts files and directories equally, exempting exact width only", () => {
    const entries: Entry[] = Array.from({ length: 9 }, (_, index) => ({
      path: `packages/unit/tests/item${index}`,
      kind: "directory",
    }));
    expect(tree(context(entries))).toContainEqual(
      expect.objectContaining({ rule: "directory.children", path: "packages/unit/tests" }),
    );
    expect(tree(context(entries, ["packages/unit/tests"]))).toEqual([]);
    const deep: Entry = { path: "packages/unit/tests/a/b/c/d/e", kind: "directory" };
    expect(tree(context([...entries, deep], ["packages/unit/tests"]))).toContainEqual(
      expect.objectContaining({ rule: "directory.depth" }),
    );
  });
});
