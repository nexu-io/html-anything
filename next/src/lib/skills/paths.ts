import os from "node:os";
import path from "node:path";

/**
 * User-installed skill packs live outside the repo so they survive `git clean`
 * and aren't accidentally committed. Default location: `~/.html-anything/skills/`.
 *
 * Tests override via `HTML_ANYTHING_USER_SKILLS_DIR`.
 */
export function userSkillsDir(): string {
  const override = process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  if (override) return override;
  return path.join(os.homedir(), ".html-anything", "skills");
}

/** Package id prefix used for namespaced skill ids. Always `pkg-<owner>-<repo>--<originalId>`. */
export const SKILL_ID_PKG_PREFIX = "pkg-";
export const SKILL_ID_SEPARATOR = "--";

/**
 * Make a stable, filesystem-safe package id from a GitHub `owner/repo` pair.
 * Example: `nexu-io`, `html-anything` → `nexu-io__html-anything`.
 */
export function packageId(owner: string, repo: string): string {
  return `${owner}__${repo}`;
}

/** Reverse of {@link packageId}: split `owner__repo` back into its parts. */
export function parsePackageId(id: string): { owner: string; repo: string } | null {
  const idx = id.indexOf("__");
  if (idx < 1 || idx === id.length - 2) return null;
  return { owner: id.slice(0, idx), repo: id.slice(idx + 2) };
}

/** Namespaced skill id used in the merged registry. */
export function makeSkillId(pkgId: string, originalId: string): string {
  return `${SKILL_ID_PKG_PREFIX}${pkgId}${SKILL_ID_SEPARATOR}${originalId}`;
}

/** Reverse of {@link makeSkillId}; returns `null` for bundled (non-pkg) ids. */
export function parseSkillId(id: string): { pkgId: string; originalId: string } | null {
  if (!id.startsWith(SKILL_ID_PKG_PREFIX)) return null;
  const rest = id.slice(SKILL_ID_PKG_PREFIX.length);
  const sepIdx = rest.indexOf(SKILL_ID_SEPARATOR);
  if (sepIdx < 1) return null;
  return {
    pkgId: rest.slice(0, sepIdx),
    originalId: rest.slice(sepIdx + SKILL_ID_SEPARATOR.length),
  };
}
