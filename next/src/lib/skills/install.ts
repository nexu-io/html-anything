import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { packageId, userSkillsDir } from "./paths";
import { readPackageManifest, type InstalledPackage } from "./registry";

/**
 * Marketplace install from a public GitHub repo. The repo must lay out its
 * skills in one of two shapes:
 *
 *   - **Single skill**: `SKILL.md` at the repo root → installed as one skill
 *     with the repo name as its original id.
 *   - **Multi-skill pack**: `skills/<original-id>/SKILL.md` at the repo root.
 *     Every direct subdirectory of `skills/` is treated as one skill.
 *
 * Layout discovery is intentionally simple and ignores nested matches so a
 * stray `SKILL.md` deep inside docs/ can't pollute the registry.
 */

const SKILL_MD_MAX_BYTES = 256 * 1024;
const EXAMPLE_HTML_MAX_BYTES = 2 * 1024 * 1024;
const EXAMPLE_MD_MAX_BYTES = 512 * 1024;
const TARBALL_MAX_BYTES = 32 * 1024 * 1024;
// GitHub's default branch is queryable via this API; we fall back to `main` if
// the request fails (handles offline-with-cache scenarios and public unauth
// rate limits).
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_CODELOAD_BASE = "https://codeload.github.com";

export type GitHubSpec = {
  owner: string;
  repo: string;
  /** Optional branch / tag / sha. Resolved against the repo's default branch when omitted. */
  ref?: string;
};

export class InstallError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "InstallError";
  }
}

/**
 * Accept `owner/repo`, `owner/repo#ref`, or a full `https://github.com/owner/repo[/tree/ref]` URL.
 * Returns `null` for anything else — the caller surfaces the error to the user.
 */
export function parseGitHubSpec(spec: string): GitHubSpec | null {
  const trimmed = spec.trim();
  if (!trimmed) return null;

  // Full URL form: https://github.com/owner/repo or .../tree/<ref>.
  // `ref` may contain slashes (e.g. `feat/foo`) — match anything up to `?` or `#`
  // and let isSafeRef vet the result.
  const urlMatch = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/tree\/([^\s#?]+))?/i.exec(
    trimmed,
  );
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2].replace(/\.git$/, "");
    const ref = urlMatch[3];
    if (!isSafeSegment(owner) || !isSafeSegment(repo)) return null;
    if (ref && !isSafeRef(ref)) return null;
    return ref ? { owner, repo, ref } : { owner, repo };
  }

  // Short form: owner/repo[#ref]
  const shortMatch = /^([^/\s#]+)\/([^/\s#]+?)(?:\.git)?(?:#(.+))?$/i.exec(trimmed);
  if (shortMatch) {
    const [, owner, repo, ref] = shortMatch;
    if (!isSafeSegment(owner) || !isSafeSegment(repo)) return null;
    if (ref && !isSafeRef(ref)) return null;
    return ref ? { owner, repo, ref } : { owner, repo };
  }

  return null;
}

function isSafeSegment(s: string): boolean {
  // GitHub usernames + repos allow `[a-z0-9._-]`, must not start with `.` or `-`.
  return /^[a-z0-9_][a-z0-9._-]*$/i.test(s) && s.length <= 100;
}

function isSafeRef(s: string): boolean {
  // Branches/tags/SHAs in practice: alphanum + `._-/`, must not contain `..`.
  return /^[a-z0-9._/-]+$/i.test(s) && !s.includes("..") && s.length <= 200;
}

async function fetchDefaultBranch(owner: string, repo: string, fetchImpl: typeof fetch): Promise<string> {
  try {
    const res = await fetchImpl(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return "main";
    const json = (await res.json()) as { default_branch?: string };
    return json.default_branch && isSafeRef(json.default_branch) ? json.default_branch : "main";
  } catch {
    return "main";
  }
}

async function downloadTarball(
  url: string,
  destPath: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  const res = await fetchImpl(url, { redirect: "follow" });
  if (!res.ok) {
    throw new InstallError(
      "download_failed",
      `failed to download ${url}: ${res.status} ${res.statusText}`,
    );
  }
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > TARBALL_MAX_BYTES) {
    throw new InstallError(
      "tarball_too_large",
      `tarball is ${declared} bytes (cap ${TARBALL_MAX_BYTES})`,
    );
  }
  // 32 MB cap, so buffering to memory is fine. Avoids the awkward
  // ReadableStream-↔-Node-stream interop and lets us double-check the actual
  // (post-decompression-of-transfer-encoding) byte count.
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > TARBALL_MAX_BYTES) {
    throw new InstallError(
      "tarball_too_large",
      `tarball is ${buf.byteLength} bytes (cap ${TARBALL_MAX_BYTES})`,
    );
  }
  await fs.writeFile(destPath, buf);
}

async function extractTarball(tarPath: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    // `--strip-components=1` drops the `<repo>-<sha>/` wrapper directory
    // GitHub adds. `--no-same-owner` keeps perms sane on shared boxes.
    const proc = spawn("tar", ["-xzf", tarPath, "-C", destDir, "--strip-components=1", "--no-same-owner"], {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => reject(new InstallError("tar_failed", `tar spawn failed: ${err.message}`)));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new InstallError("tar_failed", `tar exited ${code}: ${stderr.trim()}`));
    });
  });
}

type DiscoveredSkill = {
  originalId: string;
  /** Directory containing this skill's `SKILL.md`. */
  sourceDir: string;
};

async function discoverSkills(repoRoot: string, repoName: string): Promise<DiscoveredSkill[]> {
  // Shape 1: single skill at repo root.
  if (await exists(path.join(repoRoot, "SKILL.md"))) {
    const id = sanitizeSkillId(repoName);
    if (!id) {
      throw new InstallError("invalid_skill_id", `cannot derive skill id from repo name "${repoName}"`);
    }
    return [{ originalId: id, sourceDir: repoRoot }];
  }

  // Shape 2: skills/<id>/SKILL.md
  const skillsDir = path.join(repoRoot, "skills");
  const skillsStat = await safeStat(skillsDir);
  if (skillsStat?.isDirectory()) {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const found: DiscoveredSkill[] = [];
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const id = sanitizeSkillId(ent.name);
      if (!id) continue;
      const sourceDir = path.join(skillsDir, ent.name);
      if (await exists(path.join(sourceDir, "SKILL.md"))) {
        found.push({ originalId: id, sourceDir });
      }
    }
    if (found.length) return found;
  }

  throw new InstallError(
    "no_skills_found",
    `no SKILL.md found at repo root or under skills/`,
  );
}

function sanitizeSkillId(name: string): string | null {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
  if (!cleaned) return null;
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(cleaned)) return null;
  return cleaned;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function safeStat(p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function copyValidatedSkill(src: DiscoveredSkill, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });

  // SKILL.md is mandatory and capped.
  const skillMdPath = path.join(src.sourceDir, "SKILL.md");
  await assertNoSymlink(skillMdPath);
  const skillMdStat = await fs.stat(skillMdPath);
  if (skillMdStat.size > SKILL_MD_MAX_BYTES) {
    throw new InstallError(
      "skill_md_too_large",
      `${src.originalId}/SKILL.md is ${skillMdStat.size} bytes (cap ${SKILL_MD_MAX_BYTES})`,
    );
  }
  const raw = await fs.readFile(skillMdPath, "utf8");
  // Cheap frontmatter sanity check — full parse happens at load time, but we
  // reject obviously broken files up front so the picker doesn't show ghost
  // entries.
  if (!/^---\s*\r?\n[\s\S]*?\r?\n---/.test(raw)) {
    throw new InstallError(
      "skill_md_no_frontmatter",
      `${src.originalId}/SKILL.md is missing YAML frontmatter`,
    );
  }
  await fs.writeFile(path.join(destDir, "SKILL.md"), raw);

  // Optional example files.
  await copyOptional(src.sourceDir, destDir, "example.html", EXAMPLE_HTML_MAX_BYTES);
  await copyOptional(src.sourceDir, destDir, "example.md", EXAMPLE_MD_MAX_BYTES);
}

async function copyOptional(
  sourceDir: string,
  destDir: string,
  filename: string,
  maxBytes: number,
): Promise<void> {
  const srcPath = path.join(sourceDir, filename);
  if (!(await exists(srcPath))) return;
  await assertNoSymlink(srcPath);
  const stat = await fs.stat(srcPath);
  if (stat.size > maxBytes) {
    throw new InstallError(
      "example_too_large",
      `${filename} is ${stat.size} bytes (cap ${maxBytes})`,
    );
  }
  await fs.copyFile(srcPath, path.join(destDir, filename));
}

async function assertNoSymlink(p: string): Promise<void> {
  const stat = await fs.lstat(p);
  if (stat.isSymbolicLink()) {
    throw new InstallError("symlink_rejected", `symlinks are not allowed: ${p}`);
  }
}

export type InstallResult = {
  package: InstalledPackage;
};

export type InstallOptions = {
  /** Inject a fetch impl for tests; defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
};

/**
 * Install a skill pack from a GitHub repo. Idempotent — a re-install replaces
 * the existing package atomically.
 */
export async function installFromGitHub(spec: string, opts: InstallOptions = {}): Promise<InstallResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const parsed = parseGitHubSpec(spec);
  if (!parsed) {
    throw new InstallError("invalid_spec", `not a valid GitHub spec: "${spec}"`);
  }
  const { owner, repo } = parsed;
  const ref = parsed.ref ?? (await fetchDefaultBranch(owner, repo, fetchImpl));

  const pkgId = packageId(owner, repo);
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "ha-skill-install-"));
  try {
    const tarPath = path.join(workDir, "archive.tar.gz");
    const tarballUrl = `${GITHUB_CODELOAD_BASE}/${owner}/${repo}/tar.gz/${encodeURIComponent(ref)}`;
    await downloadTarball(tarballUrl, tarPath, fetchImpl);

    const extractDir = path.join(workDir, "extracted");
    await extractTarball(tarPath, extractDir);

    const discovered = await discoverSkills(extractDir, repo);

    // Stage the final layout in tmp before swapping into place.
    const stageDir = path.join(workDir, "stage");
    await fs.mkdir(path.join(stageDir, "skills"), { recursive: true });
    for (const skill of discovered) {
      await copyValidatedSkill(skill, path.join(stageDir, "skills", skill.originalId));
    }
    const manifest: InstalledPackage = {
      id: pkgId,
      source: { type: "github", owner, repo, ref },
      installedAt: new Date().toISOString(),
      skills: discovered.map((s) => s.originalId),
    };
    await fs.writeFile(
      path.join(stageDir, "package.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    // Atomic swap. `fs.rename` on the same filesystem is atomic; the
    // pre-existing dir (if any) is removed first under a backup name so we
    // can restore on failure.
    const targetDir = path.join(userSkillsDir(), pkgId);
    await fs.mkdir(path.dirname(targetDir), { recursive: true });
    let backupDir: string | null = null;
    if (await exists(targetDir)) {
      backupDir = `${targetDir}.bak-${Date.now()}`;
      await fs.rename(targetDir, backupDir);
    }
    try {
      await fs.rename(stageDir, targetDir);
    } catch (err) {
      // Roll back if the rename failed.
      if (backupDir) {
        await fs.rename(backupDir, targetDir).catch(() => undefined);
      }
      throw err;
    }
    if (backupDir) {
      await fs.rm(backupDir, { recursive: true, force: true }).catch(() => undefined);
    }

    return { package: manifest };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * Remove an installed package. Returns `true` if a package was removed,
 * `false` if no package with that id existed.
 */
export async function uninstallPackage(pkgId: string): Promise<boolean> {
  // Defend against `..` and other escapes — we only accept ids that look like
  // an actual installed package on disk.
  if (!readPackageManifest(pkgId)) return false;
  const targetDir = path.join(userSkillsDir(), pkgId);
  await fs.rm(targetDir, { recursive: true, force: true });
  return true;
}

