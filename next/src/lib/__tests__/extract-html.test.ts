import { describe, expect, it } from "vitest";
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
});
