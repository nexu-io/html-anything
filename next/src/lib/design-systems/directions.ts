/**
 * 5 deterministic design directions — adapted from open-design's
 * `apps/daemon/src/prompts/directions.ts` (distilled from huashu-design's
 * "5 schools × 20 philosophies").
 *
 * When the user hasn't selected a DESIGN.md but wants to see options, the
 * multi-template compare flow spawns 5 agents in parallel, each bound to one
 * of these directions. One local pick → a concrete OKLch palette + font stack,
 * no model guesswork.
 *
 * Adding a direction: append to DESIGN_DIRECTIONS. Keep them visually
 * distinct — two near-identical directions defeat the purpose.
 */

export type DirectionPalette = {
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  border: string;
  accent: string;
};

export type DesignDirection = {
  id: string;
  label: string;
  mood: string;
  references: string[];
  displayFont: string;
  bodyFont: string;
  monoFont?: string;
  palette: DirectionPalette;
  posture: string[];
};

export const DESIGN_DIRECTIONS: DesignDirection[] = [
  {
    id: "editorial-monocle",
    label: "Editorial — Monocle / FT magazine",
    mood:
      "Print-magazine feel for explicitly editorial or publishing briefs. Generous whitespace, large serif headlines, restrained palette of neutral paper + ink + a single brand-justified accent. Do not use this as the default for commerce, SaaS, dashboards, or product utilities.",
    references: ["Monocle", "The Financial Times Weekend", "NYT Magazine", "It's Nice That"],
    displayFont: "'Iowan Old Style', 'Charter', Georgia, serif",
    bodyFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    palette: {
      bg: "oklch(98% 0.004 95)",
      surface: "oklch(100% 0.002 95)",
      fg: "oklch(20% 0.018 70)",
      muted: "oklch(48% 0.012 70)",
      border: "oklch(90% 0.006 95)",
      accent: "oklch(52% 0.10 28)",
    },
    posture: [
      "serif display, sans body, mono for metadata only",
      "no shadows, no rounded cards — borders + whitespace do the work",
      "one decisive image, cropped only at the bottom",
      "kicker / eyebrow in mono uppercase, one accent color, used at most twice",
    ],
  },
  {
    id: "modern-minimal",
    label: "Modern minimal — Linear / Vercel",
    mood:
      "Quiet, precise, software-native. System fonts, crisp neutral foundations, and a small but visible product palette so the interface feels shipped rather than greyscale. The chrome stays restrained while interaction states, illustrations, charts, and product moments carry color.",
    references: ["Linear", "Vercel", "Notion 2024", "Stripe docs"],
    displayFont: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    bodyFont: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    palette: {
      bg: "oklch(99% 0.002 240)",
      surface: "oklch(100% 0 0)",
      fg: "oklch(18% 0.012 250)",
      muted: "oklch(54% 0.012 250)",
      border: "oklch(92% 0.005 250)",
      accent: "oklch(58% 0.18 255)",
    },
    posture: [
      "tight letter-spacing on display sizes (-0.02em)",
      "hairline borders only, no shadows except dropdowns/modals",
      "mono numerics with font-variant-numeric: tabular-nums",
      "controlled color system: primary action color + one secondary signal + status colors",
    ],
  },
  {
    id: "human-approachable",
    label: "Human / approachable — Airbnb / Duolingo",
    mood:
      "Friendly and tactile without the generic cozy canvas. Uses a clean neutral background, product-led color system, generous radii, and clear hierarchy. Good for consumer tools, marketplaces, wellness, education, and indie SaaS when the brand has not supplied a palette.",
    references: ["Airbnb", "Duolingo product surfaces", "Miro", "Mercury"],
    displayFont: "'Söhne', 'Avenir Next', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    bodyFont: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
    palette: {
      bg: "oklch(98% 0.004 240)",
      surface: "oklch(100% 0 0)",
      fg: "oklch(20% 0.02 240)",
      muted: "oklch(50% 0.018 240)",
      border: "oklch(90% 0.006 240)",
      accent: "oklch(56% 0.12 170)",
    },
    posture: [
      "sans display with strong weight contrast, system body for readability",
      "comfortable radii (12–18px) paired with crisp grid alignment",
      "primary action color plus a secondary/domain accent and clear status colors",
      "subtle elevation only on interactive cards",
    ],
  },
  {
    id: "tech-utility",
    label: "Tech / utility — Datadog / GitHub",
    mood:
      "Data-dense, monospace-friendly, dark or light + grid. Made for engineers and operators who want information per square inch, not vibes.",
    references: ["Datadog", "GitHub", "Cloudflare dashboard", "Sentry"],
    displayFont: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
    bodyFont: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace",
    palette: {
      bg: "oklch(98% 0.005 250)",
      surface: "oklch(100% 0 0)",
      fg: "oklch(22% 0.02 240)",
      muted: "oklch(50% 0.018 240)",
      border: "oklch(90% 0.008 240)",
      accent: "oklch(58% 0.16 145)",
    },
    posture: [
      "sans display + sans body (one family) is OK here — utility trumps editorial",
      "tabular numerics everywhere, mono for code / IDs / hashes",
      "dense tables with hairline borders, no row striping",
      "inline status pills (success / warn / danger) with restrained tinted backgrounds",
    ],
  },
  {
    id: "brutalist-experimental",
    label: "Brutalist / experimental — Are.na / Yale",
    mood:
      "Loud type. Visible grid. System sans + a single oversized serif. Deliberate ugliness as confidence. Great for art, indie, agency, manifesto pages.",
    references: ["Are.na", "Yale Center for British Art", "mschf", "Read.cv"],
    displayFont: "'Times New Roman', 'Iowan Old Style', Georgia, serif",
    bodyFont: "ui-monospace, 'IBM Plex Mono', 'JetBrains Mono', Menlo, monospace",
    palette: {
      bg: "oklch(98% 0.004 240)",
      surface: "oklch(100% 0 0)",
      fg: "oklch(15% 0.02 100)",
      muted: "oklch(40% 0.02 100)",
      border: "oklch(15% 0.02 100)",
      accent: "oklch(60% 0.22 25)",
    },
    posture: [
      "display = serif at extreme sizes (clamp(80px, 12vw, 200px))",
      "body = monospace — yes, monospace as body, deliberately",
      "borders are full-strength fg (1.5–2px), not muted greys",
      "asymmetric layouts: one column 70%, the other 30%",
      "almost no border-radius (0–2px). No shadows. No gradients.",
    ],
  },
];

/**
 * Build a compact prompt directive binding the agent to a single direction's
 * palette + font stack + posture rules. Injected above the shared directives
 * and skill body, like a DESIGN.md but from the direction library.
 */
export function directionPrompt(dir: DesignDirection): string {
  const parts: string[] = [];
  parts.push("## Design Direction: " + dir.label);
  parts.push("");
  parts.push("Visual posture: " + dir.mood);
  parts.push("References: " + dir.references.join(", "));
  parts.push("");
  parts.push("**Palette (OKLch):**");
  parts.push("- Background: " + dir.palette.bg);
  parts.push("- Surface:    " + dir.palette.surface);
  parts.push("- Foreground: " + dir.palette.fg);
  parts.push("- Muted:      " + dir.palette.muted);
  parts.push("- Border:     " + dir.palette.border);
  parts.push("- Accent:     " + dir.palette.accent);
  parts.push("");
  parts.push("**Fonts:** Display = " + dir.displayFont + " · Body = " + dir.bodyFont + (dir.monoFont ? " · Mono = " + dir.monoFont : ""));
  parts.push("");
  parts.push("**Layout rules:**");
  for (const p of dir.posture) {
    parts.push("- " + p);
  }
  return parts.join("\n");
}
