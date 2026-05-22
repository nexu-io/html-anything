import fs from "node:fs";
import path from "node:path";
import { userSkillsDir, makeSkillId } from "./paths";

/**
 * Disk layout written by {@link install}:
 *
 *   ~/.html-anything/skills/<package-id>/
 *     package.json             — install manifest
 *     skills/<original-id>/
 *       SKILL.md
 *       example.html?
 *       example.md?
 *
 * `package-id` is `<owner>__<repo>` (see {@link packageId}). The actual id seen
 * by the rest of the app is `pkg-<package-id>--<original-id>` so it can't
 * collide with bundled skills.
 */

export type InstalledPackage = {
  /**
   * Manifest schema version. Older installs that predate the field read back
   * as `undefined` and are treated as v0 by callers that care; new installs
   * always write the current version.
   */
  schemaVersion?: number;
  id: string;
  source: {
    type: "github";
    owner: string;
    repo: string;
    ref: string;
  };
  installedAt: string;
  skills: string[];
};

export type UserSkillEntry = {
  /** Namespaced id used in the merged registry. */
  id: string;
  /** Original id as written inside the package. */
  originalId: string;
  /** Owning package id. */
  packageId: string;
  /** Absolute path to the skill directory containing `SKILL.md`. */
  dir: string;
};

function safeReadDir(p: string): fs.Dirent[] {
  try {
    return fs.readdirSync(p, { withFileTypes: true });
  } catch {
    return [];
  }
}

function isValidSegment(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(name);
}

/** Read one package's manifest. Returns `null` for malformed or missing manifests. */
export function readPackageManifest(pkgId: string): InstalledPackage | null {
  const manifestPath = path.join(userSkillsDir(), pkgId, "package.json");
  let raw: string;
  try {
    raw = fs.readFileSync(manifestPath, "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const source = obj.source as Record<string, unknown> | undefined;
  if (
    typeof obj.id !== "string" ||
    typeof obj.installedAt !== "string" ||
    !Array.isArray(obj.skills) ||
    !source ||
    source.type !== "github" ||
    typeof source.owner !== "string" ||
    typeof source.repo !== "string" ||
    typeof source.ref !== "string"
  ) {
    return null;
  }
  return {
    schemaVersion: typeof obj.schemaVersion === "number" ? obj.schemaVersion : undefined,
    id: obj.id,
    source: {
      type: "github",
      owner: source.owner,
      repo: source.repo,
      ref: source.ref,
    },
    installedAt: obj.installedAt,
    skills: obj.skills.filter((s): s is string => typeof s === "string"),
  };
}

/** Every installed package with a valid manifest. */
export function listPackages(): InstalledPackage[] {
  const root = userSkillsDir();
  const out: InstalledPackage[] = [];
  for (const ent of safeReadDir(root)) {
    if (!ent.isDirectory()) continue;
    if (!isValidSegment(ent.name)) continue;
    const pkg = readPackageManifest(ent.name);
    if (pkg) out.push(pkg);
  }
  return out;
}

/**
 * Every skill from every installed package, flattened with namespaced ids.
 * Skills whose folder is missing `SKILL.md` are silently skipped so a partially-
 * broken pack doesn't take down the registry.
 */
export function listUserSkills(): UserSkillEntry[] {
  const root = userSkillsDir();
  const out: UserSkillEntry[] = [];
  for (const pkg of listPackages()) {
    const skillsRoot = path.join(root, pkg.id, "skills");
    for (const ent of safeReadDir(skillsRoot)) {
      if (!ent.isDirectory()) continue;
      const originalId = ent.name;
      if (!isValidSegment(originalId)) continue;
      const dir = path.join(skillsRoot, originalId);
      if (!fs.existsSync(path.join(dir, "SKILL.md"))) continue;
      out.push({
        id: makeSkillId(pkg.id, originalId),
        originalId,
        packageId: pkg.id,
        dir,
      });
    }
  }
  return out;
}

/** Look up one user skill by namespaced id. */
export function findUserSkill(id: string): UserSkillEntry | null {
  for (const entry of listUserSkills()) {
    if (entry.id === id) return entry;
  }
  return null;
}
