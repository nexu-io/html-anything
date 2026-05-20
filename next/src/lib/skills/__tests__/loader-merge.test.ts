import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Verify the bundled-skill loader merges in user-installed skills with
 * namespaced ids. We seed the user-skills directory by hand (no install) so
 * the test stays focused on the loader codepath.
 */

const SKILL_MD = `---
name: usertest
zh_name: 用户测试
en_name: User Test
emoji: "🧪"
description: a user skill
category: article
scenario: marketing
aspect_hint: long page
tags: ["test"]
---

Body of the user skill.
`;

const MANIFEST = {
  id: "fake__pack",
  source: { type: "github", owner: "fake", repo: "pack", ref: "main" },
  installedAt: "2026-05-19T00:00:00.000Z",
  skills: ["usertest"],
};

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-loader-test-"));
  const userSkillsRoot = path.join(tmpRoot, "user-skills");
  const skillDir = path.join(userSkillsRoot, "fake__pack", "skills", "usertest");
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(userSkillsRoot, "fake__pack", "package.json"),
    JSON.stringify(MANIFEST, null, 2),
    "utf8",
  );
  await fs.writeFile(path.join(skillDir, "SKILL.md"), SKILL_MD, "utf8");
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = userSkillsRoot;
});

afterEach(async () => {
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("loader merge", () => {
  it("listSkills includes both bundled + user skills", async () => {
    const { listSkills, invalidateSkillsCache } = await import("../../templates/loader");
    invalidateSkillsCache();
    const all = listSkills();
    const ids = all.map((s) => s.id);
    // Bundled skill we know ships in the repo
    expect(ids).toContain("blog-post");
    // User skill we just seeded, namespaced
    expect(ids).toContain("pkg-fake__pack--usertest");
  });

  it("loadSkill returns body for a user-installed skill via its namespaced id", async () => {
    const { loadSkill, invalidateSkillsCache } = await import("../../templates/loader");
    invalidateSkillsCache();
    const skill = loadSkill("pkg-fake__pack--usertest");
    expect(skill).not.toBeNull();
    expect(skill?.body).toContain("Body of the user skill");
    expect(skill?.enName).toBe("User Test");
  });

  it("loadSkill returns null for an unknown namespaced id without throwing", async () => {
    const { loadSkill, invalidateSkillsCache } = await import("../../templates/loader");
    invalidateSkillsCache();
    expect(loadSkill("pkg-fake__pack--missing")).toBeNull();
  });

  it("bundled ids still resolve correctly", async () => {
    const { loadSkill, invalidateSkillsCache } = await import("../../templates/loader");
    invalidateSkillsCache();
    const blog = loadSkill("blog-post");
    expect(blog).not.toBeNull();
    expect(blog?.id).toBe("blog-post");
  });
});
