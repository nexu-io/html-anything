import { describe, expect, it } from "vitest";
import { SHARED_DESIGN_DIRECTIVES, assemblePrompt } from "../shared";
import { loadSkill } from "../loader";

/**
 * Regression guards for nexu-io/html-anything#88.
 *
 * Two output bugs were observed when running `docs-page` with `haiku`:
 *
 *   1. Mermaid blocks emitted as `<div class="mermaid"><pre>…<br/>…</pre></div>`.
 *      The browser parses the inner `<br/>` as a real <br> element which gets
 *      collapsed to a newline in textContent, then mermaid sees an invalid
 *      multi-line message and renders "Syntax error in text".
 *
 *   2. Custom sidebar link classes (e.g. `.nav-link`) got padding / radius
 *      but no `display: block`. Anchors default to inline, so `space-y-*`
 *      is a no-op and the entire nav collapses onto one line.
 *
 * We can't catch the bugs at runtime without a live agent call (model output
 * is non-deterministic and live invocations are flaky in CI). Instead we
 * assert that the prompt assembled for every request contains the guardrail
 * text that steers the model away from these patterns — a pure-function
 * substring check.
 */

const MERMAID_MARKERS = [
  // Steers toward the robust textContent-injection pattern.
  "pre.textContent = source",
  // Forbids the broken pattern observed in the issue repro.
  "不要嵌套",
  // Tells the model how to escape <br/> if it does use the direct-div pattern.
  "&lt;br/&gt;",
];

const SIDEBAR_MARKERS = [
  "display: block",
  // The "why" — references space-y on inline anchors so future model retraining
  // has the failure mode spelled out, not just the rule.
  "space-y-",
];

describe("SHARED_DESIGN_DIRECTIVES (issue #88 guardrails)", () => {
  it("contains the Mermaid textContent-injection guidance", () => {
    for (const marker of MERMAID_MARKERS) {
      expect(SHARED_DESIGN_DIRECTIVES).toContain(marker);
    }
  });
});

describe("docs-page SKILL.md (issue #88 guardrails)", () => {
  it("contains the sidebar `display: block` rule", () => {
    const skill = loadSkill("docs-page");
    expect(skill).not.toBeNull();
    for (const marker of SIDEBAR_MARKERS) {
      expect(skill!.body).toContain(marker);
    }
  });
});

describe("assemblePrompt (issue #88 guardrails reach the model)", () => {
  it("includes both Mermaid and sidebar guardrails in the assembled prompt", () => {
    const skill = loadSkill("docs-page");
    expect(skill).not.toBeNull();
    const prompt = assemblePrompt({
      body: skill!.body,
      content: "minimal user input",
      format: "markdown",
    });
    for (const marker of [...MERMAID_MARKERS, ...SIDEBAR_MARKERS]) {
      expect(prompt).toContain(marker);
    }
  });
});
