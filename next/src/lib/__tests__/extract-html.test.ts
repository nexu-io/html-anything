import { describe, expect, it } from "vitest";
import { parseDeck } from "../deck";
import { extractHtml, injectPreviewBase, previewHtml } from "../extract-html";

describe("extractHtml", () => {
  it("extracts fenced HTML", () => {
    expect(extractHtml("```html\n<html><body>ok</body></html>\n```")).toBe(
      "<html><body>ok</body></html>",
    );
  });

  it("extracts a full document from chatty output", () => {
    const source = "Here you go:\n<!DOCTYPE html><html><body>ok</body></html>\nDone.";
    expect(extractHtml(source)).toBe("<!DOCTYPE html><html><body>ok</body></html>");
  });

  it("wraps plain text in a previewable scaffold", () => {
    const html = extractHtml("hello <world>");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("hello &lt;world&gt;");
  });
});

describe("previewHtml", () => {
  it("closes partial streamed HTML for iframe rendering", () => {
    expect(previewHtml("<html><body><main>streaming")).toContain("</body>\n</html>");
  });
});

describe("injectPreviewBase", () => {
  it("inserts the preview base as the first child of an existing head", () => {
    const source =
      '<!doctype html><html><head data-x="1"><base href="https://attacker.invalid/"><title>Demo</title></head><body /></html>';

    const result = injectPreviewBase(source, "/api/projects/project-id/");

    expect(result).toBe(
      '<!doctype html><html><head data-x="1"><base href="/api/projects/project-id/"><base href="https://attacker.invalid/"><title>Demo</title></head><body /></html>',
    );
    expect(result.indexOf('/api/projects/project-id/')).toBeLessThan(
      result.indexOf("https://attacker.invalid/"),
    );
  });

  it("creates a head immediately after html when a complete document has none", () => {
    const source = '<!doctype html><html lang="en"><body>Demo</body></html>';

    expect(injectPreviewBase(source, "/api/projects/id/")).toBe(
      '<!doctype html><html lang="en"><head><base href="/api/projects/id/"></head><body>Demo</body></html>',
    );
  });

  it("injects into a partial streaming document with an existing head", () => {
    const source = "<html><head><meta charset=\"utf-8\"><body>streaming";

    expect(injectPreviewBase(source, "/api/projects/id/")).toBe(
      '<html><head><base href="/api/projects/id/"><meta charset="utf-8"><body>streaming',
    );
  });

  it("creates a head in a partial streaming document without one", () => {
    const source = "<html><body>streaming";

    expect(injectPreviewBase(source, "/api/projects/id/")).toBe(
      '<html><head><base href="/api/projects/id/"></head><body>streaming',
    );
  });

  it("escapes base text for a double-quoted HTML attribute", () => {
    expect(
      injectPreviewBase(
        "<html><head></head><body></body></html>",
        'https://host.invalid/?a="<&',
      ),
    ).toBe(
      '<html><head><base href="https://host.invalid/?a=&quot;&lt;&amp;"></head><body></body></html>',
    );
  });

  it("returns the exact input when no base is supplied", () => {
    const source = "<!doctype html><html><body>unchanged</body></html>";

    expect(injectPreviewBase(source)).toBe(source);
  });

  it("does not mutate the source string", () => {
    const source = "<html><head><title>Original</title></head></html>";
    const snapshot = source;

    injectPreviewBase(source, "/api/projects/id/");

    expect(source).toBe(snapshot);
  });

  it("ignores fake head tags in comments, raw text, and quoted attributes", () => {
    const source =
      '<!doctype html><html data-note="> <head>"><!-- <head> --><script>const fake = "<head>";</script><style>.fake::before { content: "<head>"; }</style><head><base href="https://attacker.invalid/"><title>Demo</title></head><body>Demo</body></html>';

    const result = injectPreviewBase(source, "/api/projects/project-id/");

    expect(result).toContain(
      '<head><base href="/api/projects/project-id/"><base href="https://attacker.invalid/">',
    );
    expect(result.indexOf('/api/projects/project-id/')).toBeLessThan(
      result.indexOf("https://attacker.invalid/"),
    );
  });

  it("finds the real html tag in partial streaming input after fake tags", () => {
    const source =
      '<!-- <html><head> --><script>const fake = "<html><head>";</script><html data-note="<head> >"><body>streaming';

    expect(injectPreviewBase(source, "/api/projects/id/")).toBe(
      '<!-- <html><head> --><script>const fake = "<html><head>";</script><html data-note="<head> >"><head><base href="/api/projects/id/"></head><body>streaming',
    );
  });

  it("ignores fake head tags inside declarations", () => {
    const source =
      '<!DOCTYPE html [<!ENTITY fake "<head>">]><html><head><base href="https://attacker.invalid/"></head><body>Demo</body></html>';

    expect(injectPreviewBase(source, "/api/projects/id/")).toContain(
      '<head><base href="/api/projects/id/"><base href="https://attacker.invalid/">',
    );
  });

  it("ignores fake head tags in double-escaped script data", () => {
    const source =
      '<!doctype html><html><script><!--<script></script><head>--></script><head><base href="https://attacker.invalid/"></head><body>Demo</body></html>';

    expect(injectPreviewBase(source, "/api/projects/id/")).toContain(
      '<head><base href="/api/projects/id/"><base href="https://attacker.invalid/">',
    );
  });

  it("recognizes the HTML alternate comment closing sequence", () => {
    const source =
      '<!doctype html><html><!-- <head> --!><head><base href="https://attacker.invalid/"></head><body>Demo</body></html>';

    expect(injectPreviewBase(source, "/api/projects/id/")).toContain(
      '<head><base href="/api/projects/id/"><base href="https://attacker.invalid/">',
    );
  });

  it("keeps the project base first in each standalone deck document", () => {
    const source =
      '<!doctype html><html><!-- <head> --><head><base href="https://attacker.invalid/"><title>Deck</title></head><body><section class="slide" data-slide-id="1">Slide</section></body></html>';

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(deck.isDeck).toBe(true);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<head><base href="/api/projects/project-id/"><base href="https://attacker.invalid/">',
    );
    expect(deck.slides[0].html.indexOf('/api/projects/project-id/')).toBeLessThan(
      deck.slides[0].html.indexOf("https://attacker.invalid/"),
    );
  });

  it("copies an implicitly closed complete head into each deck slide", () => {
    const source =
      '<!doctype html><html><head><title>Deck</title><style>.slide { color: red; }</style><script>window.deckReady = true;</script><body><section class="slide" data-slide-id="1">Slide</section></body></html>';

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<base href="/api/projects/project-id/">',
    );
    expect(deck.slides[0].html).toContain(".slide { color: red; }");
    expect(deck.slides[0].html).toContain("window.deckReady = true;");
  });

  it("copies a partial deck head implicitly closed by body content", () => {
    const source =
      '<html><head><style>.slide { color: blue; }</style><section class="slide" data-slide-id="1">Streaming slide</section>';

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<base href="/api/projects/project-id/">',
    );
    expect(deck.slides[0].html).toContain(".slide { color: blue; }");
  });

  it("ignores scripting-enabled noscript data in normal and deck previews", () => {
    const source =
      '<!doctype html><html><noscript><head></noscript><base href="https://attacker.invalid/"><body><section class="slide" data-slide-id="1">Slide</section></body></html>';

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(rendered).toContain(
      '<html><head><base href="/api/projects/project-id/"></head><noscript><head></noscript><base href="https://attacker.invalid/">',
    );
    expect(rendered.indexOf('/api/projects/project-id/')).toBeLessThan(
      rendered.indexOf("https://attacker.invalid/"),
    );
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<head><base href="/api/projects/project-id/">',
    );
    expect(deck.slides[0].html).not.toContain("https://attacker.invalid/");
  });

  it("preserves an omitted-end deck head around nested template flow content", () => {
    const source =
      '<!doctype html><html><head><title>Deck</title><template><section>outer<template><div>nested</div></template></section></template><style>.slide{color:red}</style><script>window.ok=true</script><body><section class="slide" data-slide-id="1">Slide</section></body></html>';

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<base href="/api/projects/project-id/">',
    );
    expect(deck.slides[0].html).toContain(
      "<template><section>outer<template><div>nested</div></template></section></template>",
    );
    expect(deck.slides[0].html).toContain(".slide{color:red}");
    expect(deck.slides[0].html).toContain("window.ok=true");
  });

  it("ignores a fake head in nested templates before a later attacker base", () => {
    const source =
      '<!doctype html><html><template><section><template><head></template></section></template><base href="https://attacker.invalid/"><body><section class="slide" data-slide-id="1">Slide</section></body></html>';
    const snapshot = source;

    const rendered = injectPreviewBase(source, "/api/projects/project-id/");
    const deck = parseDeck(rendered);

    expect(rendered).toContain(
      '<html><head><base href="/api/projects/project-id/"></head><template><section><template><head></template></section></template><base href="https://attacker.invalid/">',
    );
    expect(rendered.indexOf('/api/projects/project-id/')).toBeLessThan(
      rendered.indexOf("https://attacker.invalid/"),
    );
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].html).toContain(
      '<head><base href="/api/projects/project-id/">',
    );
    expect(deck.slides[0].html).not.toContain("https://attacker.invalid/");
    expect(source).toBe(snapshot);
  });
});
