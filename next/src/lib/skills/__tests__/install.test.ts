import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installFromGitHub, uninstallPackage, InstallError } from "../install";
import { listPackages, listUserSkills, readPackageManifest } from "../registry";
import { userSkillsDir, makeSkillId } from "../paths";

/**
 * End-to-end tests for the marketplace install flow. We build a real .tar.gz
 * fixture on disk (mimicking GitHub's `<repo>-<sha>/...` wrapper layout) and
 * stub `fetch` to return its bytes — so the real `tar -xzf` codepath runs.
 */

const SKILL_MD = `---
name: hello-world
zh_name: 测试 skill
en_name: Hello World
emoji: "👋"
description: a test skill
category: article
scenario: marketing
aspect_hint: long page
tags: ["test"]
---

Body of the skill.
`;

async function tarGzDir(dir: string, outPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const parent = path.dirname(dir);
    const base = path.basename(dir);
    const proc = spawn("tar", ["-czf", outPath, "-C", parent, base]);
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar -czf failed (${code}): ${stderr}`));
    });
  });
}

type Fixture = {
  /** Absolute path to the built tarball. */
  tarballPath: string;
  /** Bytes of the tarball. */
  tarballBytes: Buffer;
};

async function buildSingleSkillFixture(workDir: string): Promise<Fixture> {
  // Mimic GitHub's tarball wrapper directory.
  const wrapper = path.join(workDir, "owner-repo-deadbeef");
  await fs.mkdir(wrapper, { recursive: true });
  await fs.writeFile(path.join(wrapper, "SKILL.md"), SKILL_MD, "utf8");
  await fs.writeFile(path.join(wrapper, "example.md"), "# example", "utf8");
  await fs.writeFile(path.join(wrapper, "example.html"), "<html>example</html>", "utf8");
  const tarballPath = path.join(workDir, "archive.tar.gz");
  await tarGzDir(wrapper, tarballPath);
  const tarballBytes = await fs.readFile(tarballPath);
  return { tarballPath, tarballBytes };
}

async function buildMultiSkillFixture(workDir: string): Promise<Fixture> {
  const wrapper = path.join(workDir, "owner-pack-cafef00d");
  await fs.mkdir(path.join(wrapper, "skills", "first"), { recursive: true });
  await fs.mkdir(path.join(wrapper, "skills", "second"), { recursive: true });
  await fs.writeFile(path.join(wrapper, "skills", "first", "SKILL.md"), SKILL_MD, "utf8");
  await fs.writeFile(path.join(wrapper, "skills", "second", "SKILL.md"), SKILL_MD, "utf8");
  // A stray SKILL.md at the root must be ignored by the multi-skill discovery
  // because the `skills/` directory wins.
  // (We don't add one here; the discovery code prefers root-level if it
  // exists, so testing the precedence requires a separate fixture.)
  const tarballPath = path.join(workDir, "archive.tar.gz");
  await tarGzDir(wrapper, tarballPath);
  const tarballBytes = await fs.readFile(tarballPath);
  return { tarballPath, tarballBytes };
}

function fakeFetch(tarballBytes: Buffer): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("api.github.com/repos/")) {
      return new Response(JSON.stringify({ default_branch: "main" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("codeload.github.com")) {
      return new Response(new Uint8Array(tarballBytes), {
        status: 200,
        headers: { "content-type": "application/gzip" },
      });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-install-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
});

afterEach(async () => {
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("installFromGitHub", () => {
  it("installs a single-SKILL.md repo, writes a manifest, and registers the skill", async () => {
    const { tarballBytes } = await buildSingleSkillFixture(path.join(tmpRoot, "fixture"));
    const result = await installFromGitHub("owner/repo", { fetchImpl: fakeFetch(tarballBytes) });

    expect(result.package.source).toEqual({ type: "github", owner: "owner", repo: "repo", ref: "main" });
    expect(result.package.skills).toEqual(["repo"]);

    // Manifest persisted to disk
    const manifest = readPackageManifest("owner__repo");
    expect(manifest).toMatchObject({ id: "owner__repo", skills: ["repo"] });

    // SKILL.md ended up at the expected location
    const skillPath = path.join(userSkillsDir(), "owner__repo", "skills", "repo", "SKILL.md");
    expect((await fs.readFile(skillPath, "utf8")).startsWith("---")).toBe(true);

    // Example files were copied too
    expect(
      await fs
        .access(path.join(userSkillsDir(), "owner__repo", "skills", "repo", "example.html"))
        .then(() => true)
        .catch(() => false),
    ).toBe(true);

    // Registry walks user-skills + flattens with the namespaced id
    const entries = listUserSkills();
    const expectedId = makeSkillId("owner__repo", "repo");
    expect(entries.map((e) => e.id)).toContain(expectedId);
  });

  it("installs a skills/<id>/SKILL.md multi-skill pack", async () => {
    const { tarballBytes } = await buildMultiSkillFixture(path.join(tmpRoot, "fixture"));
    const result = await installFromGitHub("owner/pack", { fetchImpl: fakeFetch(tarballBytes) });
    expect(result.package.skills.sort()).toEqual(["first", "second"]);
    const entries = listUserSkills();
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toEqual([
      makeSkillId("owner__pack", "first"),
      makeSkillId("owner__pack", "second"),
    ]);
  });

  it("is idempotent — reinstalling replaces the existing package atomically", async () => {
    const { tarballBytes } = await buildSingleSkillFixture(path.join(tmpRoot, "fixture"));
    await installFromGitHub("owner/repo", { fetchImpl: fakeFetch(tarballBytes) });
    await installFromGitHub("owner/repo", { fetchImpl: fakeFetch(tarballBytes) });
    expect(listPackages()).toHaveLength(1);
  });

  it("rejects an invalid spec without any fetch", async () => {
    let fetched = false;
    const sentinelFetch: typeof fetch = (async () => {
      fetched = true;
      return new Response("", { status: 200 });
    }) as typeof fetch;
    await expect(installFromGitHub("not a spec", { fetchImpl: sentinelFetch })).rejects.toBeInstanceOf(
      InstallError,
    );
    expect(fetched).toBe(false);
  });

  it("rejects a repo with no SKILL.md", async () => {
    const wrapper = path.join(tmpRoot, "fixture", "owner-empty-cafe");
    await fs.mkdir(wrapper, { recursive: true });
    await fs.writeFile(path.join(wrapper, "README.md"), "# nothing here", "utf8");
    const tarballPath = path.join(tmpRoot, "fixture", "archive.tar.gz");
    await tarGzDir(wrapper, tarballPath);
    const tarball = await fs.readFile(tarballPath);
    await expect(
      installFromGitHub("owner/empty", { fetchImpl: fakeFetch(tarball) }),
    ).rejects.toMatchObject({ code: "no_skills_found" });
  });
});

describe("uninstallPackage", () => {
  it("removes the package directory and reports success", async () => {
    const { tarballBytes } = await buildSingleSkillFixture(path.join(tmpRoot, "fixture"));
    await installFromGitHub("owner/repo", { fetchImpl: fakeFetch(tarballBytes) });
    expect(listPackages()).toHaveLength(1);

    const removed = await uninstallPackage("owner__repo");
    expect(removed).toBe(true);
    expect(listPackages()).toHaveLength(0);
    expect(listUserSkills()).toHaveLength(0);
  });

  it("returns false for an unknown package id", async () => {
    expect(await uninstallPackage("does__not-exist")).toBe(false);
  });
});
