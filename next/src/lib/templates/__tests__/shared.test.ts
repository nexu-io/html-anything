import { describe, expect, it } from "vitest";
import { SHARED_DESIGN_DIRECTIVES, assemblePrompt } from "../shared";

/**
 * Regression tests for the prompt-level guardrail that prevents the
 * "content disappears after entry animation finishes" bug reported in
 * issue #89.
 *
 * The bug: the agent emitted an entry animation that paired inline
 * `opacity: 0` with a non-persistent `animation: fadeIn 0.6s ease-out`
 * (no `forwards`). After the keyframe sequence finished, every animated
 * element fell back to its inline `opacity: 0` and the page rendered
 * blank except for the title (which was not animated).
 *
 * The fix lives in `SHARED_DESIGN_DIRECTIVES` because every skill prompt
 * is assembled through `assemblePrompt`, so a single directive covers all
 * 75 skills without per-skill changes. These tests pin the directive
 * shape so a future copy-edit cannot silently drop the guardrail.
 */
describe("SHARED_DESIGN_DIRECTIVES — entry-animation safety", () => {
  it("includes a dedicated section about entry animations not hiding content", () => {
    // The section header should be findable so reviewers know exactly which
    // block of the prompt enforces the rule.
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/入场动画安全规则/);
  });

  it("requires animations that hide elements to use animation-fill-mode forwards (or both)", () => {
    // The three accepted strategies all need to be discoverable in the
    // prompt body, otherwise the model has no concrete target to copy.
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/animation-fill-mode:\s*forwards/);
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/forwards/);
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/both/);
  });

  it("explicitly forbids the broken pattern from issue #89 (inline opacity:0 + non-persistent fadeIn)", () => {
    // The "禁止" line must reference both halves of the broken combination so
    // the agent can pattern-match on it instead of inferring intent.
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/绝对禁止/);
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/opacity:\s*0/);
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/fadeIn/);
  });

  it("requires prefers-reduced-motion to fully disable the hiding state, not just shorten it", () => {
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/prefers-reduced-motion/);
    // The reduced-motion branch must restore visibility, not just animation
    // duration. Pin the literal so we don't regress to "animation: none"
    // alone (which would still leave inline opacity:0 visible).
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/opacity:\s*1/);
  });

  it("requires a JS-failure fallback for IntersectionObserver-driven reveals", () => {
    // If the agent gates visibility on JS, broken JS must still leave the
    // page readable. Reference at minimum that a fallback is mandatory.
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/IntersectionObserver/);
    expect(SHARED_DESIGN_DIRECTIVES).toMatch(/fallback/i);
  });
});

describe("assemblePrompt — directives propagate to every skill", () => {
  it("prepends the shared directives ahead of the per-skill body", () => {
    const out = assemblePrompt({
      body: "【模板: Demo】\nbody-marker",
      content: "user content",
      format: "markdown",
    });
    // Directives ship before the skill body so the safety rules cannot be
    // overridden by a skill author who forgets them.
    const directivesIdx = out.indexOf("入场动画安全规则");
    const bodyIdx = out.indexOf("body-marker");
    expect(directivesIdx).toBeGreaterThan(-1);
    expect(bodyIdx).toBeGreaterThan(directivesIdx);
  });

  it("carries the forwards / prefers-reduced-motion / fallback requirements into the assembled prompt", () => {
    const out = assemblePrompt({
      body: "noop",
      content: "noop",
      format: "markdown",
    });
    expect(out).toMatch(/forwards/);
    expect(out).toMatch(/prefers-reduced-motion/);
    expect(out).toMatch(/IntersectionObserver/);
  });
});
