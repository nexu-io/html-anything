import { describe, expect, it } from "vitest";
import { type Context, configuration } from "@";
import { file } from "@/rules/files.js";

const context: Context = {
  root: "/unused",
  entries: [],
  modules: [{ path: "packages/unit", name: "@test/unit", manifest: {} }],
  policy: configuration(undefined),
};

describe("files and tests", () => {
  it("accepts 500 physical lines and rejects 501, including comments", () => {
    const path = "packages/unit/tests/nested/unit.test.ts";
    expect(file(context, path, "// line\r\n".repeat(500))).toEqual([]);
    expect(file(context, path, "// line\n".repeat(501))).toContainEqual(
      expect.objectContaining({ rule: "file.lines" }),
    );
  });

  it("permits nested tests but rejects source-local and alternate test suffixes", () => {
    expect(file(context, "packages/unit/tests/nested/unit.test.ts", "export {};")).toEqual([]);
    expect(file(context, "packages/unit/src/unit.test.ts", "")).toContainEqual(
      expect.objectContaining({ rule: "file.test" }),
    );
    expect(file(context, "packages/unit/tests/unit.spec.ts", "")).toContainEqual(
      expect.objectContaining({ rule: "file.test" }),
    );
  });
});
