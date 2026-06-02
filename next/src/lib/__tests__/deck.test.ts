import { describe, expect, it } from "vitest";
import { isDeck, parseDeck } from "../deck";

/**
 * Regression test for issue #74 — "PPT viewer shows inconsistent vertical
 * alignment across slides".
 *
 * Root cause: every deck skill that hides inactive slides via
 * `.slide { position:absolute; inset:0; opacity:0; ... }` ships a paired
 * `body.single .slide { position:relative; opacity:1; transform:none; ... }`
 * override that's specifically meant to fire when a single slide is
 * extracted into a standalone iframe (which is exactly what the deck
 * viewer does). `parseDeck` previously copied the original body class
 * verbatim, so `single` was never present, the override never fired, and
 * each extracted slide's visual layout drifted depending on which child
 * elements happened to win the absolute-positioned flex layout for that
 * particular slide's HTML structure.
 *
 * The fix appends `single` to the body class on every standalone slide.
 * For skills that don't use absolute-positioned slides, `single` is an
 * inert class that no rule selects.
 */

const BASE_HEAD = `<title>Test Deck</title>
<style>
  /* The pattern shipped by deck-tech-sharing, deck-pitch, deck-blueprint, ... */
  .deck { position:relative; width:100vw; height:100vh; overflow:hidden; }
  .slide {
    position:absolute; inset:0;
    display:flex; flex-direction:column; justify-content:center;
    padding:72px 96px;
    opacity:0; pointer-events:none;
    transform:translateX(30px);
  }
  .slide.is-active { opacity:1; transform:translateX(0); }
  /* The escape hatch that this fix activates. */
  body.single .slide {
    position:relative; width:100vw; height:100vh;
    opacity:1; transform:none; pointer-events:auto;
  }
</style>`;

/**
 * Build a deck doc whose slides have *deliberately mixed child structures* —
 * the exact condition the issue reporter highlighted as the trigger.
 *
 * - Slide 1: single wrapper div (the "well-behaved" shape)
 * - Slide 2: multiple direct flex children (the "drifts" shape)
 * - Slide 3: nested wrapper + sibling at the slide root (mixed)
 */
function buildMixedDeck(): string {
  return `<!DOCTYPE html>
<html>
<head>${BASE_HEAD}</head>
<body class="deck-tech-sharing">
  <div class="deck">
    <section class="slide" data-slide-id="1">
      <div class="slide-body">
        <h1>One wrapper</h1>
        <p>predictable centering</p>
      </div>
    </section>
    <section class="slide" data-slide-id="2">
      <h1>No wrapper</h1>
      <p>multiple direct flex children</p>
      <p>this is where alignment drifts</p>
    </section>
    <section class="slide" data-slide-id="3">
      <div class="slide-body">
        <h1>Mixed</h1>
      </div>
      <aside class="footnote">trailing sibling at slide root</aside>
      <aside class="notes">speaker notes that should not render</aside>
    </section>
  </div>
</body>
</html>`;
}

function bodyOpenTag(html: string): string {
  const m = /<body\b[^>]*>/i.exec(html);
  if (!m) throw new Error("no <body> tag in standalone slide HTML");
  return m[0];
}

function bodyClasses(html: string): string[] {
  const tag = bodyOpenTag(html);
  const m = /\bclass\s*=\s*["']([^"']*)["']/i.exec(tag);
  return m ? m[1].split(/\s+/).filter(Boolean) : [];
}

describe("isDeck", () => {
  it("recognises a doc with at least one section.slide", () => {
    expect(isDeck(buildMixedDeck())).toBe(true);
  });

  it("returns false for plain HTML with no slide sections", () => {
    expect(isDeck("<html><body><p>hello</p></body></html>")).toBe(false);
  });

  it("returns false for empty / nullish input", () => {
    expect(isDeck("")).toBe(false);
  });
});

describe("parseDeck — standalone slide assembly (issue #74)", () => {
  it("appends `single` to every standalone slide's body class so the body.single .slide override fires", () => {
    // Without this, deck-skill CSS that hides inactive slides via
    // `.slide { position:absolute; opacity:0 }` leaves the extracted slide
    // stuck in its inactive state when rendered alone in the deck viewer.
    const parsed = parseDeck(buildMixedDeck());
    expect(parsed.slides).toHaveLength(3);
    for (const slide of parsed.slides) {
      const classes = bodyClasses(slide.html);
      expect(classes).toContain("single");
    }
  });

  it("preserves the original body class alongside `single` (doesn't lose deck-skill scope hooks)", () => {
    // Many skills scope their styles to a body class (e.g.
    // `body.deck-tech-sharing ...`). Dropping that class on the standalone
    // slide would break the skill's typography, palette, etc.
    const parsed = parseDeck(buildMixedDeck());
    for (const slide of parsed.slides) {
      const classes = bodyClasses(slide.html);
      expect(classes).toContain("deck-tech-sharing");
      expect(classes).toContain("single");
    }
  });

  it("is a no-op for decks whose original body has no class (no leading whitespace, no empty token)", () => {
    // Edge case: body with no class attribute at all. The result should
    // still parse to a single `single` token, not `" single"` with leading
    // whitespace or two empty tokens.
    const html = `<!DOCTYPE html><html><head><title>x</title></head><body><div class="deck"><section class="slide"><h1>a</h1></section></div></body></html>`;
    const parsed = parseDeck(html);
    expect(parsed.slides).toHaveLength(1);
    const classes = bodyClasses(parsed.slides[0].html);
    expect(classes).toEqual(["single"]);
  });

  it("extracts each slide regardless of its child structure (mixed-children regression)", () => {
    // Mirrors the issue reporter's exact failure mode: slides with
    // different inner-HTML shapes must all parse, all get a slide id,
    // and all carry the new `single` body class.
    const parsed = parseDeck(buildMixedDeck());
    const ids = parsed.slides.map((s) => s.id);
    expect(ids).toEqual(["1", "2", "3"]);
    for (const slide of parsed.slides) {
      expect(slide.html).toMatch(/<section\b[^>]*\bclass\s*=\s*["'][^"']*\bslide\b/);
    }
  });

  it("strips speaker notes from the rendered slide and surfaces them on the parsed slide", () => {
    // Slide 3 has both a content body and a `<aside class="notes">`.
    // The notes panel must capture them, and the slide canvas must not
    // contain them (audience visibility).
    const parsed = parseDeck(buildMixedDeck());
    const third = parsed.slides[2];
    expect(third.notes).toMatch(/speaker notes/);
    expect(third.html).not.toMatch(/<aside\b[^>]*\bnotes\b/i);
  });

  it("returns isDeck:false and an empty slides array on a non-deck doc", () => {
    const parsed = parseDeck("<html><body><p>just an article</p></body></html>");
    expect(parsed.isDeck).toBe(false);
    expect(parsed.slides).toEqual([]);
  });
});
