import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installFromGitHub, InstallError } from "../install";
import { listPackages } from "../registry";
import { userSkillsDir } from "../paths";

/**
 * Cover the negative paths of the installer. Each test builds a tarball that
 * trips one specific guard, then asserts the right `InstallError.code` and
 * confirms no partial-install was left on disk.
 */

const VALID_SKILL_MD = `---
name: t
zh_name: 测试
en_name: T
emoji: "🧪"
description: test
category: article
scenario: marketing
aspect_hint: a
tags: ["x"]
---
body
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

function fakeFetch(tarball: Buffer | null, opts: { defaultBranch?: string; tarballStatus?: number } = {}): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("api.github.com/repos/")) {
      return new Response(JSON.stringify({ default_branch: opts.defaultBranch ?? "main" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("codeload.github.com")) {
      if (opts.tarballStatus && opts.tarballStatus !== 200) {
        return new Response("not found", { status: opts.tarballStatus });
      }
      if (tarball === null) {
        return new Response("not found", { status: 404 });
      }
      return new Response(new Uint8Array(tarball), {
        status: 200,
        headers: { "content-type": "application/gzip" },
      });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-reject-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
});

afterEach(async () => {
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function buildTarballWith(fixtureName: string, setup: (wrapper: string) => Promise<void>): Promise<Buffer> {
  const wrapper = path.join(tmpRoot, "fixtures", fixtureName);
  await fs.mkdir(wrapper, { recursive: true });
  await setup(wrapper);
  const tarballPath = path.join(tmpRoot, "fixtures", `${fixtureName}.tar.gz`);
  await tarGzDir(wrapper, tarballPath);
  return fs.readFile(tarballPath);
}

describe("install rejections", () => {
  it("rejects SKILL.md without frontmatter", async () => {
    const tar = await buildTarballWith("nofm-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), "no frontmatter here\nbody\n", "utf8");
    });
    await expect(
      installFromGitHub("owner/nofm", { fetchImpl: fakeFetch(tar) }),
    ).rejects.toMatchObject({ code: "skill_md_no_frontmatter" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects SKILL.md larger than 256 KB", async () => {
    const huge = `${VALID_SKILL_MD}${"x".repeat(300 * 1024)}`;
    const tar = await buildTarballWith("huge-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), huge, "utf8");
    });
    await expect(
      installFromGitHub("owner/huge", { fetchImpl: fakeFetch(tar) }),
    ).rejects.toMatchObject({ code: "skill_md_too_large" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects example.html larger than 2 MB", async () => {
    const tar = await buildTarballWith("hugeex-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), VALID_SKILL_MD, "utf8");
      await fs.writeFile(path.join(w, "example.html"), "x".repeat(3 * 1024 * 1024), "utf8");
    });
    await expect(
      installFromGitHub("owner/hugeex", { fetchImpl: fakeFetch(tar) }),
    ).rejects.toMatchObject({ code: "example_too_large" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects a tarball containing a SKILL.md symlink", async () => {
    const tar = await buildTarballWith("syml-deadbeef", async (w) => {
      // Drop a real target and a SKILL.md symlinked to it. The preflight
      // rejects every non-file/non-directory entry up front so the symlink
      // never reaches the extractor — `forbidden_entry_type` fires before
      // the post-extract `symlink_rejected` defense ever has to.
      await fs.writeFile(path.join(w, "target.md"), VALID_SKILL_MD, "utf8");
      await fs.symlink("target.md", path.join(w, "SKILL.md"));
    });
    await expect(
      installFromGitHub("owner/syml", { fetchImpl: fakeFetch(tar) }),
    ).rejects.toMatchObject({ code: "forbidden_entry_type" });
    expect(listPackages()).toHaveLength(0);
  });

  it("propagates download failures as InstallError", async () => {
    await expect(
      installFromGitHub("owner/missing", { fetchImpl: fakeFetch(null, { tarballStatus: 404 }) }),
    ).rejects.toMatchObject({ code: "download_failed" });
    expect(listPackages()).toHaveLength(0);
  });

  it("rejects tarballs whose declared content-length blows past the cap", async () => {
    const oversizedFetch: typeof fetch = (async () => {
      return new Response(new Uint8Array([0]), {
        status: 200,
        headers: { "content-length": String(64 * 1024 * 1024), "content-type": "application/gzip" },
      });
    }) as typeof fetch;
    await expect(
      installFromGitHub("owner/big#main", { fetchImpl: oversizedFetch }),
    ).rejects.toMatchObject({ code: "tarball_too_large" });
    expect(listPackages()).toHaveLength(0);
  });

  it("falls back to main when the GitHub API call fails", async () => {
    const tar = await buildTarballWith("ok-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), VALID_SKILL_MD, "utf8");
    });
    const flaky: typeof fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("api.github.com")) {
        return new Response("nope", { status: 500 });
      }
      if (url.includes("codeload.github.com")) {
        return new Response(new Uint8Array(tar), { status: 200 });
      }
      return new Response("", { status: 404 });
    }) as typeof fetch;
    const result = await installFromGitHub("owner/ok", { fetchImpl: flaky });
    expect(result.package.source.ref).toBe("main");
  });

  it("does not leave a partial install behind on validation failure", async () => {
    // First install succeeds so a real package exists on disk.
    const good = await buildTarballWith("good-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), VALID_SKILL_MD, "utf8");
    });
    await installFromGitHub("owner/good", { fetchImpl: fakeFetch(good) });
    expect(listPackages()).toHaveLength(1);

    // Reinstall of the same owner/repo with a broken payload must NOT corrupt
    // the existing install — the atomic rename happens at the very end.
    const broken = await buildTarballWith("broken-deadbeef", async (w) => {
      await fs.writeFile(path.join(w, "SKILL.md"), "no frontmatter\n", "utf8");
    });
    await expect(
      installFromGitHub("owner/good", { fetchImpl: fakeFetch(broken) }),
    ).rejects.toBeInstanceOf(InstallError);

    // The original install is still intact.
    const pkgs = listPackages();
    expect(pkgs).toHaveLength(1);
    expect(pkgs[0].id).toBe("owner__good");
    const stillThere = await fs.readFile(
      path.join(userSkillsDir(), "owner__good", "skills", "good", "SKILL.md"),
      "utf8",
    );
    expect(stillThere.startsWith("---")).toBe(true);
  });
});

describe("registry edge cases", () => {
  it("listPackages returns [] when the user-skills directory does not exist", async () => {
    // beforeEach set HTML_ANYTHING_USER_SKILLS_DIR but never created it.
    expect(listPackages()).toEqual([]);
  });

  it("skips packages whose manifest is missing or malformed", async () => {
    const root = userSkillsDir();
    await fs.mkdir(path.join(root, "no__manifest", "skills"), { recursive: true });
    await fs.mkdir(path.join(root, "bad__manifest"), { recursive: true });
    await fs.writeFile(path.join(root, "bad__manifest", "package.json"), "{ not json", "utf8");
    expect(listPackages()).toEqual([]);
  });
});
