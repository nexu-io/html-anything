/**
 * Anti-AI-slop rule bank — adapted from open-design's craft/anti-ai-slop.md
 * and huashu-design SKILL.md §6.2-6.3 ("The seven cardinal sins" + "Soft
 * tells" + "Polish tells"), plus huashu-specific CJK/contrast/baseline checks.
 *
 * Three severity tiers:
 *   P0 (must-fix)   — regression; hard-enforced in the prompt
 *   P1 (should-fix) — soft warning shown to the user post-generation
 *   P2 (nice-to-fix) — informational, not blocking
 */

export type SlopSeverity = "P0" | "P1" | "P2";

export type SlopRule = {
  id: string;
  severity: SlopSeverity;
  /** Short human-readable label. */
  title: string;
  /** Why this is slop (the causal chain from "AI default" to "brand-erasing"). */
  why: string;
  /** Regex to test against raw agent HTML. If omitted the rule is prompt-side
   *  only (it can't be detected automatically in the output). */
  htmlPattern?: RegExp;
  /** Prompt directive injected into the system prompt. */
  promptDirective: string;
};

/**
 * The canonical rule set. Every rule declares *why* it matters — a rule
 * without "why" is just aesthetic preference, not design-system discipline.
 *
 * When adding a new rule: keep `htmlPattern` and `promptDirective` in sync
 * so the linter catches what the prompt tries to prevent.
 */
export const ANTI_SLOP_RULES: SlopRule[] = [
  // ── P0: regression blockers ─────────────────────────────────────────────
  {
    id: "indigo-accent",
    severity: "P0",
    title: "Default Tailwind indigo as accent",
    why: "#6366f1 / #4f46e5 / #8b5cf6 are the textbook AI tell — every LLM lands on indigo as the default accent. Use the DESIGN.md token or a single intentional oklch color.",
    htmlPattern: /(?<!var\(--)color:\s*(#6366f1|#4F46E5|#4338CA|#3730A3|#8b5cf6|#7c3aed|#a855f7)\b/gi,
    promptDirective: "NEVER use Tailwind default indigo (#6366f1, #4f46e5, #8b5cf6) as the accent. Use the --accent custom property from the DESIGN.md instead.",
  },
  {
    id: "two-stop-gradient",
    severity: "P0",
    title: "Two-stop purple→blue / indigo→pink gradient on the hero",
    why: "The 'trust gradient' (purple→blue, blue→cyan, indigo→pink) is the AI-landing-page fingerprint. A flat intentional surface + strong typography beats it.",
    htmlPattern: /from-(violet|purple|indigo|fuchsia)-.*\bto-(blue|cyan|pink|fuchsia|indigo)/i,
    promptDirective: "No two-stop 'trust' gradient (purple→blue, indigo→pink) on the hero. Use a single background color or a subtle radial texture.",
  },
  {
    id: "emoji-feature-icons",
    severity: "P0",
    title: "Emoji as feature icons (✨🚀🎯⚡🔥💡)",
    why: "Emoji icons signal 'the designer didn't have time to source proper icons' and are never on-brand. Every brand has a color; none has an emoji palette.",
    htmlPattern: /[✨🚀🎯⚡🔥💡🤖📊🔒🛡️🌈🌟💎⚙️🔑🏆]/u,
    promptDirective: "No emoji as functional icons in headings / buttons / feature lists. Use 1.6–1.8px-stroke monoline SVG with currentColor, or leave the icon out.",
  },
  {
    id: "rounded-card-left-border",
    severity: "P0",
    title: "Rounded card with a colored left-border accent",
    why: "The canonical AI dashboard tile shape (rounded-lg border-l-4 border-indigo-500). One of the most parroted patterns in LLM training data.",
    htmlPattern: /rounded.*border-l-\d+\s+border-(indigo|purple|fuchsia|violet|pink)/i,
    promptDirective: "No rounded card + coloured left-border accent combo. Drop either the radius or the left border — use whitespace or a hairline shadow for separation instead.",
  },
  {
    id: "invented-metrics",
    severity: "P0",
    title: "Invented metrics (10× faster, 99.9% uptime, 3× more productive)",
    why: "Fabricated stats don't carry information — they carry the shape of stats. An honest placeholder ('[real data]') is more trustworthy.",
    htmlPattern: /\b\d+[×x]\s*(faster|more|less|better|cheaper)\b|\b99[.,]\d+%\s*uptime/i,
    promptDirective: "No invented metrics. Use a labelled placeholder like [real data] if the user hasn't provided actual stats.",
  },
  {
    id: "lorem-filler",
    severity: "P0",
    title: "Lorem ipsum / filler copy",
    why: "Lorem ipsum in production output signals 'the designer ran out of ideas.' An empty section solved with composition is better than one solved with fake words.",
    htmlPattern: /lorem\s+ipsum|feature\s*(one|two|three)|placeholder\s+text/i,
    promptDirective: "Never use lorem ipsum. Use the user's real content. If content is missing, leave a labelled placeholder ([Content: ...]) instead of fake text.",
  },
  // ── P0: huashu-design specific ─────────────────────────────────────────
  {
    id: "cjk-font-stack",
    severity: "P0",
    title: "Missing CJK font fallback（中英文正文字体栈）",
    why: "Chinese characters need source-han / Noto SC fallback; Latin-only font stacks (Inter, Roboto, system-ui) produce 豆腐块 on CJK pages.",
    htmlPattern: /font-family:\s*(['"]?)(Inter|Roboto|system-ui|Segoe UI|Arial)(?!.*Noto.*SC)(?!.*source-han)/i,
    promptDirective: "Always include a CJK fallback in the font stack: body must use 'Noto Sans SC' or 'Source Han Sans SC' after the Latin primary. 中英文之间不加空格 (huashu-design specification).",
  },
  {
    id: "contrast-floor",
    severity: "P0",
    title: "Contrast below 4.5:1 on body text",
    why: "WCAG level AA is the minimum production bar. Gray-on-gray body text under 4.5:1 is a common sloppy-AI pattern.",
    htmlPattern: undefined, // needs a contrast calculator (axe-core) — can't regex-match
    promptDirective: "Body text must have a contrast ratio ≥ 4.5:1 against its background. No font-size below 14px on body.",
  },
  {
    id: "pure-black-white",
    severity: "P0",
    title: "Pure black (#000) or pure white (#fff) as a background",
    why: "Real displays don't emit #000 or #fff — they emit near-black/near-white. Pure hex values read as 'not designed.'",
    htmlPattern: /background(?:-color)?:\s*(#000000|#000\b|#ffffff|#fff\b|rgb\(0,\s*0,\s*0\)|rgb\(255,\s*255,\s*255\))/i,
    promptDirective: "Never use pure black (#000) or pure white (#fff) as a background. Use near-black (#0a0a0a, #111) and near-white (#fafafa, #f7f8f8).",
  },
  // ── P1: should-fix ─────────────────────────────────────────────────────
  {
    id: "unsplash-placeholder",
    severity: "P1",
    title: "External placeholder image CDN (unsplash, placehold.co, picsum)",
    why: "Live CDN image links rot within months. Use inline base64 or a .ph-img placeholder class.",
    htmlPattern: /(unsplash\.com|placehold\.co|picsum\.photos|placekitten\.com)/i,
    promptDirective: "No external placeholder images (unsplash, placehold.co, picsum). Use a labelled placeholder div or inline a public-domain image as base64.",
  },
  {
    id: "hex-sprawl",
    severity: "P1",
    title: "More than ~12 raw hex values outside :root",
    why: "Design tokens belong in :root custom properties. Too many inline hexes means the design-system token wasn't honoured.",
    htmlPattern: undefined, // needs AST-counting, not regex
    promptDirective: "All colours must be referenced from :root custom properties. Do not repeat raw hex values inline.",
  },
  {
    id: "inter-as-display",
    severity: "P1",
    title: "Inter / Roboto / Arial / system-ui forced as display font",
    why: "These are neutral body fonts, not display faces. A sans-serif body stack on headings reads as 'AI didn't choose a display font.' Use the DESIGN.md's display typeface.",
    htmlPattern: /font-family:\s*(['"]?)(Inter|Roboto|system-ui|Arial)\1\s*[;}]/i,
    promptDirective: "Headings must use the DESIGN.md's display font, not a default body sans-serif stack. If no display font is specified, use Newsreader or Source Serif.",
  },
  // ── P1: huashu-design specific ─────────────────────────────────────────
  {
    id: "svgs-as-imagery",
    severity: "P1",
    title: "SVG hand-drawn imagery / human faces",
    why: "AI-drawn SVG people are always anatomically deformed. For content-essential images use real photos (Wikimedia / Unsplash) or an honest placeholder.",
    htmlPattern: /<svg[^>]*>[\s\S]*?<(circle|cx|cy|path)[\s\S]*?(eye|face|head|person|human)/i,
    promptDirective: "Never draw human faces / people / organic objects in SVG. Use a real image (base64-inline a public-domain photo) or an honest grey placeholder box.",
  },
  // ── P2: nice-to-fix ────────────────────────────────────────────────────
  {
    id: "decorative-blob-svg",
    severity: "P2",
    title: "Decorative blob / wave SVG backgrounds",
    why: "'Blob aesthetics' are a default AI pattern with no author intent. An intentional background choice (gradient texture, noise, plain color) carries more signal.",
    htmlPattern: /<svg[^>]*>[\s\S]*?<path[^>]*d="M.*(?:C|Q).*(?:C|Q)/i,
    promptDirective: "No decorative blob / wave SVG backgrounds. Use a plain surface, subtle noise texture, or the DESIGN.md's background color.",
  },
];

/** Return all rules at a given severity. */
export function rulesBySeverity(level: SlopSeverity): SlopRule[] {
  return ANTI_SLOP_RULES.filter((r) => r.severity === level);
}

/** Run every rule that has an htmlPattern against `html` and return matches. */
export function lintHtml(html: string): Array<{ rule: SlopRule; match: string }> {
  const findings: Array<{ rule: SlopRule; match: string }> = [];
  for (const rule of ANTI_SLOP_RULES) {
    if (!rule.htmlPattern) continue;
    const m = rule.htmlPattern.exec(html);
    if (m) findings.push({ rule, match: m[0] });
    // Reset regex state for the next iteration (global flag).
    rule.htmlPattern.lastIndex = 0;
  }
  return findings;
}
