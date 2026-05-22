import { describe, it, expect } from "vitest";
import { findCommonPath, resolveCollisionOutput } from "../collision-resolve.js";

describe("findCommonPath", () => {
  it('returns "" for empty array', () => {
    expect(findCommonPath([])).toBe("");
  });

  it("returns the resolved path of a single input", () => {
    expect(findCommonPath(["/tmp/x"])).toBe("tmp/x");
  });

  it("finds the common ancestor of two paths with a shared parent", () => {
    expect(
      findCommonPath(["/home/user/a/b/file.md", "/home/user/a/c/file.md"]),
    ).toBe("home/user/a");
  });

  it("returns path.sep when paths share only the root", () => {
    expect(findCommonPath(["/foo/a.md", "/bar/b.md"])).toBe("/");
  });
});

describe("resolveCollisionOutput", () => {
  it("maps a file under a subdirectory relative to the common root", () => {
    expect(
      resolveCollisionOutput("/repo/a/b/readme.md", "/out", "/repo/a"),
    ).toBe("/out/b/readme.html");
  });

  it("preserves deeply nested directory structure under the common root", () => {
    expect(
      resolveCollisionOutput("/repo/x/y/z/doc.md", "/out", "/repo"),
    ).toBe("/out/x/y/z/doc.html");
  });

  it("falls back to plain basename.html when the file is directly in the common root directory", () => {
    expect(
      resolveCollisionOutput("/repo/a/readme.md", "/out", "/repo/a"),
    ).toBe("/out/readme.html");
  });

  it("filters out '..' and '.' segments and produces a clean relative output", () => {
    expect(
      resolveCollisionOutput("/outside/tmp/a.md", "/out", "/outside"),
    ).toBe("/out/tmp/a.html");
  });
});
