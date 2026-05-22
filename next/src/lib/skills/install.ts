import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { packageId, userSkillsDir } from "./paths";
import { readPackageManifest, type InstalledPackage } from "./registry";

/** Bump when the on-disk manifest schema changes incompatibly. */
const MANIFEST_SCHEMA_VERSION = 1;

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
/**
 * Cap on the *decompressed* size of the tarball. Defends against gzip bombs
 * where the 32 MB compressed cap above could still expand to many GB and
 * exhaust /tmp during extraction. 96 MB is roomy enough for any plausible
 * skill pack while keeping the bomb amplification ratio bounded.
 */
const TARBALL_MAX_UNCOMPRESSED_BYTES = 96 * 1024 * 1024;
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

/**
 * Walk every header in a tar archive and reject anything dangerous BEFORE
 * we hand the file to `tar -xzf`. The system `tar` binary alone is not a
 * reliable security boundary — BSD tar on macOS happily extracts symlinks
 * that point outside the destination, and a `symlink → ../../etc` entry
 * followed by a `link/passwd` regular-file entry is a classic write-through-
 * symlink primitive. So we:
 *
 *   1. Decompress with a hard `maxOutputLength` cap to defuse gzip bombs.
 *   2. Parse every 512-byte header, enforcing:
 *      - only regular files ('0', '\0') and directories ('5') allowed; any
 *        symlink ('2'), hardlink ('1'), char/block/fifo/socket entry is rejected;
 *      - no absolute paths, `..` segments, or NUL chars in the name;
 *      - cumulative declared sizes within {@link TARBALL_MAX_UNCOMPRESSED_BYTES}.
 *
 * Returns silently on success; throws {@link InstallError} on any violation.
 */
async function preflightTarball(tarPath: string): Promise<void> {
  const gz = await fs.readFile(tarPath);
  let plain: Buffer;
  try {
    plain = zlib.gunzipSync(gz, { maxOutputLength: TARBALL_MAX_UNCOMPRESSED_BYTES });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ERR_BUFFER_TOO_LARGE") {
      throw new InstallError(
        "tarball_uncompressed_too_large",
        `tarball would decompress to more than ${TARBALL_MAX_UNCOMPRESSED_BYTES} bytes`,
      );
    }
    throw new InstallError(
      "tarball_corrupt",
      `failed to decompress tarball: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const BLOCK = 512;
  let off = 0;
  let totalDeclared = 0;
  while (off + BLOCK <= plain.length) {
    const header = plain.subarray(off, off + BLOCK);
    // End-of-archive marker: two consecutive all-zero blocks.
    if (header.every((b) => b === 0)) break;

    const name = readCString(header, 0, 100);
    const prefix = readCString(header, 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeStr = readCString(header, 124, 12);
    const size = sizeStr ? Number.parseInt(sizeStr, 8) : 0;
    const typeFlag = String.fromCharCode(header[156] || 0x30); // '0' default

    if (!Number.isFinite(size) || size < 0) {
      throw new InstallError("tarball_corrupt", `tar entry "${fullName}" has invalid size header`);
    }
    if (fullName.includes("\0") || fullName.startsWith("/")) {
      throw new InstallError("unsafe_path", `tar entry has unsafe path: ${JSON.stringify(fullName)}`);
    }
    const segments = fullName.split("/");
    if (segments.some((seg) => seg === "..")) {
      throw new InstallError("unsafe_path", `tar entry contains '..' segment: ${JSON.stringify(fullName)}`);
    }
    // Allow regular files ('0' or '\0' for legacy), directories ('5'), and
    // PAX extended-header pseudo-entries ('x', 'g'). Reject everything else
    // — symlinks ('2'), hardlinks ('1'), char ('3'), block ('4'), fifo ('6'),
    // and the GNU long-name extensions ('K', 'L') which can smuggle paths
    // past the 100-byte name check we already did.
    const allowed = new Set(["0", "\0", "5", "x", "g"]);
    if (!allowed.has(typeFlag)) {
      throw new InstallError(
        "forbidden_entry_type",
        `tar entry "${fullName}" has forbidden type ${JSON.stringify(typeFlag)}`,
      );
    }

    totalDeclared += size;
    if (totalDeclared > TARBALL_MAX_UNCOMPRESSED_BYTES) {
      throw new InstallError(
        "tarball_uncompressed_too_large",
        `cumulative declared size exceeds ${TARBALL_MAX_UNCOMPRESSED_BYTES} bytes`,
      );
    }

    off += BLOCK + Math.ceil(size / BLOCK) * BLOCK;
  }
}

function readCString(buf: Buffer, offset: number, length: number): string {
  const slice = buf.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? slice.length : end).toString("utf8");
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
  // Download / extract scratch space goes in `os.tmpdir()` — those files are
  // transient and the temp filesystem is the right place for them. The
  // *staged final layout*, on the other hand, must live on the destination
  // filesystem so the atomic-swap `rename(2)` below stays intra-FS. On many
  // Linux hosts `/tmp` is a separate tmpfs mount, and a cross-device rename
  // throws `EXDEV`, which would break every install in production.
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "ha-skill-install-"));
  const targetDir = path.join(userSkillsDir(), pkgId);
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  // Hidden temp dir alongside the target — same filesystem by construction.
  // The `.stage-` prefix keeps it from being picked up by `listPackages`
  // (which requires a leading alphanumeric segment), and the random suffix
  // makes concurrent installs of different packages collision-free.
  const stageDir = path.join(
    path.dirname(targetDir),
    `.stage-${pkgId}-${randomBytes(8).toString("hex")}`,
  );
  try {
    const tarPath = path.join(workDir, "archive.tar.gz");
    const tarballUrl = `${GITHUB_CODELOAD_BASE}/${owner}/${repo}/tar.gz/${encodeURIComponent(ref)}`;
    await downloadTarball(tarballUrl, tarPath, fetchImpl);
    // Validate every tar header before invoking the system `tar` binary —
    // see {@link preflightTarball} for the threat model.
    await preflightTarball(tarPath);

    const extractDir = path.join(workDir, "extracted");
    await extractTarball(tarPath, extractDir);

    const discovered = await discoverSkills(extractDir, repo);

    // Build the final layout in `stageDir` (which lives next to `targetDir`).
    await fs.mkdir(path.join(stageDir, "skills"), { recursive: true });
    for (const skill of discovered) {
      await copyValidatedSkill(skill, path.join(stageDir, "skills", skill.originalId));
    }
    const manifest: InstalledPackage = {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
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

    // Atomic swap. `stageDir` and `targetDir` share a parent dir, so the
    // rename is always intra-filesystem and atomic. The pre-existing dir
    // (if any) is moved aside under a backup name so we can restore on
    // failure.
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
    // Best-effort cleanup of both scratch areas. `stageDir` is normally
    // consumed by the rename above; this only matters on the error paths.
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    await fs.rm(stageDir, { recursive: true, force: true }).catch(() => undefined);
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

