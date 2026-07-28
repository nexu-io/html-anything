/**
 * DESIGN.md loader — reads the open-design design-systems directory and parses
 * each DESIGN.md into a structured DesignSystem object ready for prompt injection.
 *
 * The open-design repo ships ~150 DESIGN.md files in a 9-section format:
 *   1. Visual Theme & Atmosphere
 *   2. Color Palette & Roles
 *   3. Typography Rules
 *   4. Component Stylings
 *   5. Layout Principles
 *   6. Depth & Elevation
 *   7. Do's and Don'ts
 *   8. Responsive Behavior
 *   9. Agent Prompt Guide
 *
 * We parse each section into discrete tokens (colors, font-stacks, rules) that
 * assemblePrompt can bind as :root custom properties and inject as style
 * directives.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Absolute path to the open-design design-systems directory. Hard-coded because
 * this is a local-dev-only integration — the DESIGN.md corpus doesn't travel
 * with html-anything's own source. On CI / deploy this directory won't exist
 * and the loader returns an empty catalog gracefully.
 */
const DESIGN_SYSTEMS_ROOT =
  process.env.DESIGN_SYSTEMS_ROOT ?? "C:/Users/13466/open-design/design-systems";

export type DesignSystemMeta = {
  /** Directory name (e.g. "linear-app", "vercel", "apple"). */
  id: string;
  /** The first top-level heading of the DESIGN.md. */
  name: string;
  /** Category line, if present. */
  category: string;
  /** Short description from the first paragraph. */
  description: string;
  /** Palette signature: 2-4 hex/oklch color values that represent this system. */
  palette: string[];
  /** Primary font family. */
  fontDisplay: string;
  /** Whether this is a dark-mode-first system. */
  darkMode: boolean;
};

export type DesignSystem = DesignSystemMeta & {
  /** Full raw markdown for prompt injection. */
  raw: string;
  /** :root { … } block built from the color palette section. */
  tokenCSS: string;
  /** Typography directives (a compact prompt-friendly block). */
  typographyDirective: string;
  /** Do's and Don'ts extracted as a prompt checklist. */
  dosAndDonts: string;
  /** Agent prompt guide section (if present). */
  agentPromptGuide: string;
};

// ---------------------------------------------------------------------------
// Directory scanning
// ---------------------------------------------------------------------------

export function listDesignSystemIds(): string[] {
  if (!fs.existsSync(DESIGN_SYSTEMS_ROOT)) return [];
  return fs
    .readdirSync(DESIGN_SYSTEMS_ROOT, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith(".") &&
        !d.name.startsWith("_") &&
        fs.existsSync(path.join(DESIGN_SYSTEMS_ROOT, d.name, "DESIGN.md")),
    )
    .map((d) => d.name);
}

// ---------------------------------------------------------------------------
// Markdown parser
// ---------------------------------------------------------------------------

/**
 * Split a DESIGN.md body into named sections by matching `## <header>` lines.
 * Section names are lowercased for lookup. The preamble (before any `##`) is
 * stored under the key "".
 */
function parseSections(body: string): Record<string, string> {
  const sections: Record<string, string> = { "": "" };
  const lines = body.split("\n");
  let current = "";
  for (const line of lines) {
    const m = /^##\s+(.+)/.exec(line);
    if (m) {
      current = m[1].toLowerCase();
      sections[current] = "";
    } else {
      sections[current] = (sections[current] ?? "") + line + "\n";
    }
  }
  // Trim trailing whitespace from each section.
  for (const k of Object.keys(sections)) sections[k] = sections[k].trim();
  return sections;
}

/** Pull the title from the first `# ` heading. */
function parseTitle(body: string): string {
  const m = /^#\s+(.+)/m.exec(body);
  return m?.[1].replace(/^Design System Inspired by\s+/i, "") ?? "Untitled";
}

/** Pull the category from a `> Category:` line. */
function parseCategory(body: string): string {
  const m = /> Category:\s*(.+)/.exec(body);
  return m?.[1] ?? "";
}

/** First non-empty non-heading paragraph after the title line. */
function parseDescription(body: string): string {
  const lines = body.split("\n");
  let pastTitle = false;
  for (const l of lines) {
    if (/^#/.test(l)) { pastTitle = true; continue; }
    if (!pastTitle) continue;
    const t = l.trim();
    if (t && !t.startsWith(">") && !t.startsWith("##")) return t.slice(0, 200);
  }
  return "";
}

// ---------------------------------------------------------------------------
// Token extraction (color palette → :root custom properties)
// ---------------------------------------------------------------------------

const HEX_RE = /#[a-fA-F0-9]{3,8}\b/g;
const RGB_RE = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
const OKLCH_RE = /\boklch?\([^)]+\)\s*/gi;
const COLOR_LINE_RE =
  /^-\s+(?:\*\*([^*]+)\*\*|`([^`]+)`|([^(]+))\s*[:：]\s*(`?)(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|oklch?\([^)]+\))/;

/**
 * Walk the color palette section (## color palette & role(s)?) and extract
 * named color tokens as `--name: value;` pairs. Each token is converted to
 * a CSS-safe kebab-case custom property name.
 */
function extractTokenCSS(sections: Record<string, string>): string {
  const paletteKey =
    Object.keys(sections).find(
      (k) => k.includes("color palette") || k.includes("palette & ro"),
    ) ?? "";

  const content = sections[paletteKey] ?? sections[""];
  if (!content) return "";

  const tokens: Array<{ name: string; value: string }> = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Try the structured bullet format: `- **Token Name**: #hex`
    const m = COLOR_LINE_RE.exec(line);
    if (m) {
      const rawName = (m[1] ?? m[2] ?? m[3] ?? "").trim();
      const value = (m[5] ?? "").trim();
      if (rawName && value) {
        tokens.push({ name: rawName, value });
        continue;
      }
    }
    // Fallback: any hex/rgb/oklch on a bullet line that names a role
    const hexes = line.match(HEX_RE);
    const rgbs = line.match(RGB_RE);
    const oklchs = line.match(OKLCH_RE);
    const colors = [...(hexes ?? []), ...(rgbs ?? []), ...(oklchs ?? [])];
    if (colors.length === 0) continue;
    // Derive a name from the line content.
    const stripped = line.replace(/^[-\s>*|]+/, "").trim();
    const name = tokenNameFromLine(stripped, tokens.length);
    for (const c of colors) tokens.push({ name, value: c });
  }

  if (tokens.length === 0) return "";

  return (
    ":root {\n" +
    tokens.map((t) => `  --${toKebab(t.name)}: ${t.value};`).join("\n") +
    "\n}\n"
  );
}

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function tokenNameFromLine(line: string, idx: number): string {
  const clean = line.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const words = clean.split(/\s+/).slice(0, 2);
  return words.length ? words.join(" ") : `color-${idx}`;
}

// ---------------------------------------------------------------------------
// Typography directive
// ---------------------------------------------------------------------------

function extractTypography(sections: Record<string, string>): string {
  const key =
    Object.keys(sections).find((k) => k.includes("typography")) ?? "";
  const content = sections[key];
  if (!content) return "";
  // Compact: take the first 8 non-empty lines as a compact prompt directive.
  const lines = content.split("\n").filter((l) => l.trim());
  // Drop markdown table rows (they don't compress well for prompts).
  const prose = lines.filter((l) => !l.startsWith("|")).slice(0, 12);
  return prose.join("\n");
}

// ---------------------------------------------------------------------------
// Do's and Don'ts
// ---------------------------------------------------------------------------

function extractDosAndDonts(sections: Record<string, string>): string {
  const key =
    Object.keys(sections).find(
      (k) => k.includes("do") && k.includes("don't"),
    ) ?? "";
  if (!key) return "";
  const content = sections[key];
  // Keep the ✅ and ❌ lines, one per bullet.
  return content
    .split("\n")
    .filter((l) => l.includes("✅") || l.includes("❌"))
    .map((l) => l.trim())
    .join("\n");
}

// ---------------------------------------------------------------------------
// Agent prompt guide
// ---------------------------------------------------------------------------

function extractAgentPromptGuide(sections: Record<string, string>): string {
  const key =
    Object.keys(sections).find((k) => k.includes("agent prompt")) ?? "";
  return sections[key] ?? "";
}

// ---------------------------------------------------------------------------
// Dark-mode detection
// ---------------------------------------------------------------------------

function isDarkModeFirst(body: string, tokenCSS: string): boolean {
  // Check the visual theme / atmosphere section for dark keywords.
  return (
    /dark[-\s]mode[-\s]first/i.test(body) ||
    /near-black canvas/i.test(body) ||
    /darkness as the native/i.test(body) ||
    (tokenCSS.includes("#08090a") || tokenCSS.includes("#0a0a0a") || tokenCSS.includes("#0D1117"))
  );
}

// ---------------------------------------------------------------------------
// Main parse
// ---------------------------------------------------------------------------

let cache: Map<string, DesignSystem> | null = null;

export function loadDesignSystem(id: string): DesignSystem | null {
  if (!cache) cache = new Map();
  const cached = cache.get(id);
  if (cached) return cached;

  const file = path.join(DESIGN_SYSTEMS_ROOT, id, "DESIGN.md");
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, "utf8");
  const sections = parseSections(raw);
  const tokenCSS = extractTokenCSS(sections);
  const title = parseTitle(raw);

  const ds: DesignSystem = {
    id,
    name: title,
    category: parseCategory(raw),
    description: parseDescription(raw),
    palette: extractPaletteSignature(tokenCSS),
    fontDisplay: extractFontDisplay(sections),
    darkMode: isDarkModeFirst(raw, tokenCSS),
    raw,
    tokenCSS,
    typographyDirective: extractTypography(sections),
    dosAndDonts: extractDosAndDonts(sections),
    agentPromptGuide: extractAgentPromptGuide(sections),
  };
  cache.set(id, ds);
  return ds;
}

function extractPaletteSignature(tokenCSS: string): string[] {
  // Pick up to 4 hex values as the visual signature.
  const hexes = tokenCSS.match(HEX_RE);
  return (hexes ?? []).slice(0, 4);
}

function extractFontDisplay(sections: Record<string, string>): string {
  const key =
    Object.keys(sections).find((k) => k.includes("typography")) ?? "";
  const content = sections[key] ?? "";
  const m = /(?:Primary|Display)[^'"]*['"]\s*([^'"]+)['"]/i.exec(content);
  return m?.[1] ?? "";
}

/** Invalidate the in-memory cache (call after a design-system sync). */
export function invalidateDesignSystemCache(): void {
  cache = null;
}

/**
 * Build a catalogue of all available design systems. Returns meta-only objects
 * (no raw body / tokenCSS) so the picker can enumerate them cheaply.
 */
export function listDesignSystems(): DesignSystemMeta[] {
  const ids = listDesignSystemIds();
  return ids.map((id) => {
    const ds = loadDesignSystem(id);
    return ds
      ? stripToMeta(ds)
      : {
          id,
          name: id,
          category: "",
          description: "",
          palette: [],
          fontDisplay: "",
          darkMode: false,
        };
  });
}

function stripToMeta(ds: DesignSystem): DesignSystemMeta {
  return {
    id: ds.id,
    name: ds.name,
    category: ds.category,
    description: ds.description,
    palette: ds.palette,
    fontDisplay: ds.fontDisplay,
    darkMode: ds.darkMode,
  };
}
