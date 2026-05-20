import { describe, expect, it } from "vitest";
import {
  makeSkillId,
  packageId,
  parsePackageId,
  parseSkillId,
  SKILL_ID_PKG_PREFIX,
} from "../paths";

describe("packageId", () => {
  it("joins owner and repo with double underscore", () => {
    expect(packageId("nexu-io", "html-anything")).toBe("nexu-io__html-anything");
  });
});

describe("parsePackageId", () => {
  it("round-trips a normal id", () => {
    expect(parsePackageId("nexu-io__html-anything")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
    });
  });

  it("rejects ids without a separator", () => {
    expect(parsePackageId("foobar")).toBeNull();
  });

  it("rejects ids with an empty owner or repo", () => {
    expect(parsePackageId("__foo")).toBeNull();
    expect(parsePackageId("foo__")).toBeNull();
  });
});

describe("makeSkillId / parseSkillId", () => {
  it("namespaces user skills with the pkg- prefix", () => {
    const id = makeSkillId("owner__repo", "blog-post");
    expect(id.startsWith(SKILL_ID_PKG_PREFIX)).toBe(true);
    expect(id).toBe("pkg-owner__repo--blog-post");
  });

  it("round-trips through parseSkillId", () => {
    const id = makeSkillId("nexu-io__html-anything", "magazine");
    expect(parseSkillId(id)).toEqual({
      pkgId: "nexu-io__html-anything",
      originalId: "magazine",
    });
  });

  it("returns null for bundled (non-pkg) ids", () => {
    expect(parseSkillId("article-magazine")).toBeNull();
  });

  it("returns null for malformed pkg ids missing the separator", () => {
    expect(parseSkillId("pkg-owner__repo")).toBeNull();
  });
});
