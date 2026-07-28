/**
 * DESIGN.md adapter — converts a parsed DesignSystem into prompt-injectable
 * fragments that assemblePrompt can slot into the agent prompt.
 *
 * Two key outputs:
 *   1. `tokenCSS` — :root { } block with --custom-property definitions. The
 *      agent drops this verbatim into the <head> so Tailwind can reference
 *      `var(--accent)`, `var(--bg)`, etc.
 *   2. `systemPrompt` — a compact section injected into the system prompt
 *      that tells the agent which tokens / fonts / layout rules to honour.
 */

import type { DesignSystem } from "./loader";
import { rulesBySeverity } from "../quality/anti-slop";

export type AdapterResult = {
  /**
   * A <style> block with :root custom properties. The agent is instructed to
   * place this in the <head> of the generated HTML *before* the Tailwind CDN
   * script so utilities like `bg-[var(--accent)]` resolve at render time.
   */
  tokenCSS: string;
  /**
   * A markdown section appended to the system prompt. Contains:
   *   - The design system's name and a one-line personality summary.
   *   - The tokenCSS block (agent pastes into <head>).
   *   - Typography and layout rules condensed from the DESIGN.md.
   *   - P0 anti-slop rules as MUST-NOT directives.
   */
  systemPrompt: string;
  /** Palette colours for the picker badge. */
  palette: string[];
  /** Name for the picker UI. */
  name: string;
};

/**
 * Build the full adapter result for a given design system.
 */
export function adapt(designSystem: DesignSystem): AdapterResult {
  const { tokenCSS, name, palette, typographyDirective, dosAndDonts, agentPromptGuide } = designSystem;

  const p0Rules = rulesBySeverity("P0");
  const p1Rules = rulesBySeverity("P1");

  const sections: string[] = [];

  // ── Design system identity ───────────────────────────────────────────────
  sections.push(`## Active Design System: ${name}`);
  sections.push("");
  sections.push("You are designing in the **" + name + "** design language. Honour every rule below.");

  // ── Token CSS block ──────────────────────────────────────────────────────
  if (tokenCSS) {
    sections.push("");
    sections.push("### Design Tokens (" + name + ")");
    sections.push("");
    sections.push("Paste the following `<style>` block into the `<head>` of your HTML **before** the Tailwind CDN script. Reference these tokens with Tailwind arbitrary values, e.g. `bg-[var(--bg)]`, `text-[var(--accent)]`, `border-[var(--border)]`.");
    sections.push("");
    sections.push("```css");
    sections.push(tokenCSS);
    sections.push("```");
  }

  // ── Typography ───────────────────────────────────────────────────────────
  if (typographyDirective) {
    sections.push("");
    sections.push("### Typography");
    sections.push("");
    sections.push(typographyDirective);
  }

  // ── Do's and Don'ts ──────────────────────────────────────────────────────
  if (dosAndDonts) {
    sections.push("");
    sections.push("### Do's and Don'ts");
    sections.push("");
    sections.push(dosAndDonts);
  }

  // ── Anti-slop P0 rules ───────────────────────────────────────────────────
  if (p0Rules.length) {
    sections.push("");
    sections.push("### Absolute Constraints (P0 — must-fix regression)");
    sections.push("");
    for (const r of p0Rules) {
      sections.push("- ❌ **" + r.title + "**: " + r.promptDirective);
    }
  }

  // ── Anti-slop P1 soft rules ──────────────────────────────────────────────
  if (p1Rules.length) {
    sections.push("");
    sections.push("### Quality Guidelines (P1 — should-fix)");
    sections.push("");
    for (const r of p1Rules) {
      sections.push("- " + r.promptDirective);
    }
  }

  // ── Agent prompt guide (from the DESIGN.md itself) ───────────────────────
  if (agentPromptGuide) {
    sections.push("");
    sections.push("### Design System Prompt Guide");
    sections.push("");
    sections.push(agentPromptGuide);
  }

  return {
    tokenCSS,
    systemPrompt: sections.join("\n"),
    palette,
    name,
  };
}

/**
 * No-design-system fallback — used when the user hasn't selected one. Gives
 * the agent a minimal set of anti-slop constraints and a neutral default.
 */
export function fallbackAdapter(): AdapterResult {
  const p0Rules = rulesBySeverity("P0");
  const sections: string[] = [];

  sections.push("## Design System: Neutral Default");
  sections.push("");
  sections.push("No design system was selected. Use a clean, product-oriented default — calm, functional, content-first. Apply the following absolute constraints:");

  sections.push("");
  sections.push("### Absolute Constraints (P0 — must-fix regression)");
  for (const r of p0Rules) {
    sections.push("- ❌ **" + r.title + "**: " + r.promptDirective);
  }

  return {
    tokenCSS: "",
    systemPrompt: sections.join("\n"),
    palette: [],
    name: "Neutral Default",
  };
}
