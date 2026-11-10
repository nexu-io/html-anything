import { createHash } from "node:crypto";
import { posix } from "node:path";
import { expect, it } from "vitest";
import { guidanceSkills, listGuidance, localGuidance, readGuidance } from "@/content/guidance.js";
import { schemas } from "@/contract.js";

const names = [
  "motion-production",
  "motion-director",
  "motion-template-to-video",
  "motion-recreate",
  "motion-video-to-template",
];
const methods = [
  "production",
  "native",
  "templates",
  "verification",
  "director",
  "template",
  "recreate",
  "videotemplate",
  "context",
  "edit",
  "intake",
  "actionscript",
  "craft",
  "phrases",
  "examples",
  "decisions",
  "sound",
  "review",
  "recreateverify",
  "videoverify",
  "rebuild",
  "measure",
  "videorebuild",
  "portable",
  "rules",
];
const digest = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

it("provides all five creative routes and their complete, closed current-contract methods", () => {
  const resources = listGuidance();
  expect(guidanceSkills.map((entry) => entry.name)).toEqual(names);
  expect(resources.map((entry) => entry.name).sort()).toEqual([...methods].sort());
  for (const entry of resources) {
    const document = readGuidance(entry.uri);
    expect(document.content.length).toBeGreaterThan(1500);
    expect(document.contentHash).toBe(digest(document.content));
    expect(document.contentHash).toBe(entry.contentHash);
    expect(document.source.commit).toBe("03d6df8615a2cb87727241406b9671c184ff497a");
    for (const path of document.source.paths)
      expect(path).toMatch(/^skills\/motion-[a-z-]+\/(?:references\/)?[a-zA-Z.-]+$/);
    for (const reference of document.references)
      expect(resources.some((target) => target.uri === reference)).toBe(true);
    for (const operation of document.content.match(
      /\b(?:workspace|session|message|artifact|project|resource|export|template|motion)_[a-z_]+\b/g,
    ) ?? [])
      expect(Object.hasOwn(schemas, operation), `${entry.name}: ${operation}`).toBe(true);
    expect(document.content).not.toMatch(
      /motion:\/\/workflow|motion:\/\/engine|motion_(?:get|create|edit|open|import|export|list|restore)_/,
    );
  }
  const sources = resources.flatMap((entry) => readGuidance(entry.uri).source.paths);
  expect(new Set(sources).size).toBe(26);
  expect(readGuidance("open-motion://guidance/production").source.paths).toContain(
    "skills/motion-production/references/production.md",
  );
  const context = readGuidance("open-motion://guidance/context");
  for (const skill of guidanceSkills) {
    expect(readGuidance(`open-motion://guidance/${skill.entry}`).content).toContain("open-motion://guidance/context");
    if (skill.entry !== "production") expect(context.references).toContain(`open-motion://guidance/${skill.entry}`);
  }
  for (const value of ["file:///etc/passwd", "open-motion://guidance/../native", "open-motion://guidance/unknown"])
    expect(() => readGuidance(value)).toThrow("registered");
});

it("ships every local body from the canonical graph with reversible links and actual-file hashes", () => {
  const files = localGuidance();
  expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
  const manifest = JSON.parse(files.find((file) => file.path === "skills/manifest.json")!.content) as {
    schema: number;
    skills: { name: string; entry: string; description: string }[];
    documents: { documentId: string; path: string; contentHash: string; localContentHash: string }[];
  };
  expect(manifest.schema).toBe(1);
  expect(manifest.skills.map((entry) => entry.name)).toEqual(names);
  expect(manifest.documents).toHaveLength(25);
  expect(files).toHaveLength(26);
  for (const entry of manifest.documents) {
    const file = files.find((file) => file.path === `skills/${entry.path}`)!;
    expect(posix.normalize(file.path)).toBe(file.path);
    expect(file.path).not.toMatch(/(^|\/)\.\.\//);
    expect(digest(file.content)).toBe(entry.localContentHash);
    const body = file.content.replace(/^---\n[\s\S]*?\n---\n\n/, ""),
      restored = body.replace(/\]\(([^)]+)\)/g, (match, reference: string) => {
        if (/^[a-z]+:/.test(reference)) return match;
        const target = posix.normalize(posix.join(posix.dirname(entry.path), reference));
        const document = manifest.documents.find((candidate) => candidate.path === target);
        expect(document, `${entry.path} -> ${reference}`).toBeDefined();
        return `](${document!.documentId})`;
      });
    expect(restored).toBe(readGuidance(entry.documentId).content);
    expect(digest(restored)).toBe(entry.contentHash);
  }
  for (const skill of manifest.skills) {
    const file = files.find((file) => file.path === `skills/${skill.name}/SKILL.md`)!;
    expect(file.content).toContain(`name: ${skill.name}\n`);
    expect(file.content).toContain(`description: ${JSON.stringify(skill.description)}\n`);
  }
});
