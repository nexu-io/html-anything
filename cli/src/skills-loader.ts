import fs from "node:fs";
import path from "node:path";

/**
 * File-based skill loader — adapted from next/src/lib/templates/loader.ts
 * This version accepts a skillsDir parameter instead of hardcoding process.cwd().
 */

export type SkillFrontmatter = {
  name?: string;
  zh_name?: string;
  en_name?: string;
  emoji?: string;
  description?: string;
  category?: string;
  scenario?: string;
  aspect_hint?: string;
  featured?: number;
  recommended?: number;
  tags?: string[];
  example_id?: string;
  example_name?: string;
  example_format?: string;
  example_tagline?: string;
  example_desc?: string;
  example_source_url?: string;
  example_source_label?: string;
};

export type SkillExampleMeta = {
  id: string;
  name: string;
  format: string;
  tagline: string;
  desc: string;
  source?: { url: string; label: string };
  hasHtml: boolean;
  hasMd: boolean;
};

export type SkillMeta = {
  id: string;
  zhName: string;
  enName: string;
  emoji: string;
  description: string;
  category: string;
  scenario: string;
  aspectHint: string;
  featured?: number;
  recommended?: number;
  tags: string[];
  example?: SkillExampleMeta;
};

export type LoadedSkill = SkillMeta & {
  body: string;
  exampleMd?: string;
  exampleHtml?: string;
};

function parseFrontmatter(raw: string): { fm: SkillFrontmatter; body: string } {
  const m = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/m.exec(raw);
  if (!m) return { fm: {}, body: raw };
  const block = m[1];
  const body = m[2] ?? "";
  const fm: SkillFrontmatter = {};
  for (const line of block.split(/\r?\n/)) {
    const mm = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/.exec(line);
    if (!mm) continue;
    const key = mm[1];
    let val: string = mm[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\"/g, '"');
    }
    switch (key) {
      case "featured": {
        const n = Number(val);
        if (Number.isFinite(n)) fm.featured = n;
        break;
      }
      case "recommended": {
        const n = Number(val);
        if (Number.isFinite(n)) fm.recommended = n;
        break;
      }
      case "tags": {
        const arr = /^\[(.*)\]$/.exec(val);
        if (arr) {
          fm.tags = arr[1]
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""))
            .map((s) => s.replace(/\\"/g, '"'))
            .filter(Boolean);
        }
        break;
      }
      case "name":
      case "zh_name":
      case "en_name":
      case "emoji":
      case "description":
      case "category":
      case "scenario":
      case "aspect_hint":
      case "example_id":
      case "example_name":
      case "example_format":
      case "example_tagline":
      case "example_desc":
      case "example_source_url":
      case "example_source_label":
        (fm as Record<string, string>)[key] = val;
        break;
    }
  }
  return { fm, body: body.trim() };
}

function safeRead(p: string): string | undefined {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

function fmToMeta(id: string, fm: SkillFrontmatter, hasHtml: boolean, hasMd: boolean): SkillMeta {
  const meta: SkillMeta = {
    id,
    zhName: fm.zh_name ?? fm.name ?? id,
    enName: fm.en_name ?? id,
    emoji: fm.emoji ?? "✨",
    description: fm.description ?? "",
    category: fm.category ?? "other",
    scenario: fm.scenario ?? "marketing",
    aspectHint: fm.aspect_hint ?? "",
    tags: Array.isArray(fm.tags) ? fm.tags : [],
  };
  if (typeof fm.featured === "number") meta.featured = fm.featured;
  if (typeof fm.recommended === "number") meta.recommended = fm.recommended;
  if (fm.example_id || hasMd || hasHtml) {
    meta.example = {
      id: fm.example_id ?? `example-${id}`,
      name: fm.example_name ?? `${meta.zhName} 示例`,
      format: fm.example_format ?? "markdown",
      tagline: fm.example_tagline ?? "",
      desc: fm.example_desc ?? "",
      hasHtml,
      hasMd,
      ...(fm.example_source_url
        ? {
            source: {
              url: fm.example_source_url,
              label: fm.example_source_label ?? fm.example_source_url,
            },
          }
        : {}),
    };
  }
  return meta;
}

function isValidId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/i.test(id);
}

export function listSkills(skillsDir: string): SkillMeta[] {
  const out: SkillMeta[] = [];
  let dirents: fs.Dirent[] = [];
  try {
    dirents = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of dirents) {
    if (!ent.isDirectory()) continue;
    const id = ent.name;
    if (!isValidId(id)) continue;
    const dir = path.join(skillsDir, id);
    const raw = safeRead(path.join(dir, "SKILL.md"));
    if (!raw) continue;
    const { fm } = parseFrontmatter(raw);
    const hasHtml = fs.existsSync(path.join(dir, "example.html"));
    const hasMd = fs.existsSync(path.join(dir, "example.md"));
    out.push(fmToMeta(id, fm, hasHtml, hasMd));
  }
  return out;
}

export function loadSkill(skillsDir: string, id: string): LoadedSkill | null {
  if (!isValidId(id)) return null;
  const dir = path.join(skillsDir, id);
  const raw = safeRead(path.join(dir, "SKILL.md"));
  if (!raw) return null;
  const { fm, body } = parseFrontmatter(raw);
  const exampleMd = safeRead(path.join(dir, "example.md"));
  const exampleHtml = safeRead(path.join(dir, "example.html"));
  const meta = fmToMeta(id, fm, !!exampleHtml, !!exampleMd);
  return { ...meta, body, exampleMd, exampleHtml };
}