import { describe, expect, it } from "vitest";
import { parseGitHubSpec } from "../install";

describe("parseGitHubSpec", () => {
  it("parses owner/repo short form", () => {
    expect(parseGitHubSpec("nexu-io/html-anything")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
    });
  });

  it("parses owner/repo#ref short form", () => {
    expect(parseGitHubSpec("nexu-io/html-anything#main")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
      ref: "main",
    });
  });

  it("strips a trailing .git", () => {
    expect(parseGitHubSpec("nexu-io/html-anything.git")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
    });
  });

  it("parses a full https URL", () => {
    expect(parseGitHubSpec("https://github.com/nexu-io/html-anything")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
    });
  });

  it("parses a /tree/<ref> URL", () => {
    expect(parseGitHubSpec("https://github.com/nexu-io/html-anything/tree/feat/foo")).toEqual({
      owner: "nexu-io",
      repo: "html-anything",
      ref: "feat/foo",
    });
  });

  it("rejects path-traversal refs", () => {
    expect(parseGitHubSpec("foo/bar#../../etc/passwd")).toBeNull();
  });

  it("rejects shell-character owners", () => {
    expect(parseGitHubSpec("foo;rm-rf/bar")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseGitHubSpec("")).toBeNull();
    expect(parseGitHubSpec("   ")).toBeNull();
  });

  it("rejects URLs from other hosts", () => {
    expect(parseGitHubSpec("https://gitlab.com/foo/bar")).toBeNull();
  });
});
