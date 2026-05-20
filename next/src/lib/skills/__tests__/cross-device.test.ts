import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFromGitHub } from "../install";
import { listPackages } from "../registry";
import { userSkillsDir } from "../paths";

/**
 * Regression test for the maintainer-flagged EXDEV blocker: the previous
 * implementation staged the package layout under `os.tmpdir()` and then
 * called `fs.rename(stageDir, targetDir)`. On Linux hosts where `/tmp` is a
 * separate tmpfs mount, that rename throws `EXDEV` and every install fails.
 *
 * The fix is to stage on the *destination* filesystem (next to `targetDir`)
 * so the swap is always intra-FS. We verify it two ways:
 *
 *   1. Spy on `fs.rename` and assert both arguments share a parent dir —
 *      i.e. no cross-device rename is ever attempted. Holds regardless of
 *      whether the test runner actually has a separate `/tmp` mount.
 *   2. Force `fs.rename` to throw `EXDEV` if the parent dirs ever *do*
 *      differ. If the staging path ever regresses back into `/tmp`, this
 *      blows up with the same error a real Linux host would see.
 */

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

const VALID_SKILL_MD = `---
name: x
zh_name: X
en_name: X
emoji: "✅"
description: x
category: article
scenario: marketing
aspect_hint: a
tags: ["x"]
---
body
`;

function fakeFetch(tarball: Buffer): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("api.github.com/repos/")) {
      return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
    }
    if (url.includes("codeload.github.com")) {
      return new Response(new Uint8Array(tarball), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

let tmpRoot: string;
let originalRename: typeof fs.rename;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-xdev-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
  originalRename = fs.rename;
});

afterEach(async () => {
  Object.defineProperty(fs, "rename", { value: originalRename, configurable: true, writable: true });
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

async function buildTarball(name: string): Promise<Buffer> {
  const wrapper = path.join(tmpRoot, name);
  await fs.mkdir(wrapper, { recursive: true });
  await fs.writeFile(path.join(wrapper, "SKILL.md"), VALID_SKILL_MD, "utf8");
  const tarballPath = path.join(tmpRoot, `${name}.tar.gz`);
  await tarGzDir(wrapper, tarballPath);
  return fs.readFile(tarballPath);
}

describe("cross-device-safe staging", () => {
  it("never renames across filesystems — both args always share a parent dir", async () => {
    const tar = await buildTarball("ok");
    const renameSpy = vi.spyOn(fs, "rename");

    const result = await installFromGitHub("owner/ok", { fetchImpl: fakeFetch(tar) });

    expect(result.package.id).toBe("owner__ok");
    expect(listPackages()).toHaveLength(1);

    // At least one rename ran (the atomic swap), and every rename has both
    // src and dst under the same parent directory.
    expect(renameSpy.mock.calls.length).toBeGreaterThan(0);
    for (const [src, dst] of renameSpy.mock.calls) {
      expect(path.dirname(String(src))).toBe(path.dirname(String(dst)));
    }
  });

  it("survives an `EXDEV` simulator that fails any cross-device rename", async () => {
    // If staging ever regresses back into /tmp, this hook would fire and the
    // install would fail with EXDEV — exactly as it would on a real Linux
    // host with /tmp as tmpfs.
    Object.defineProperty(fs, "rename", {
      value: async (src: string, dst: string) => {
        if (path.dirname(src) !== path.dirname(dst)) {
          const err = new Error(`EXDEV: cross-device link not permitted, rename '${src}' -> '${dst}'`);
          (err as NodeJS.ErrnoException).code = "EXDEV";
          throw err;
        }
        return originalRename(src, dst);
      },
      configurable: true,
      writable: true,
    });

    const tar = await buildTarball("ok2");
    const result = await installFromGitHub("owner/ok2", { fetchImpl: fakeFetch(tar) });
    expect(result.package.id).toBe("owner__ok2");
    expect(listPackages().map((p) => p.id)).toContain("owner__ok2");
  });

  it("hidden stage dirs are not visible to listPackages", async () => {
    const tar = await buildTarball("vis");
    await installFromGitHub("owner/vis", { fetchImpl: fakeFetch(tar) });

    // Drop a leftover stage dir to simulate a prior crashed install. The
    // `.stage-` prefix means `listPackages` (whose segment validator
    // requires a leading alphanumeric) must skip it.
    await fs.mkdir(path.join(userSkillsDir(), ".stage-owner__vis-abcdef"), { recursive: true });

    const pkgs = listPackages();
    expect(pkgs.map((p) => p.id)).toEqual(["owner__vis"]);
  });
});
