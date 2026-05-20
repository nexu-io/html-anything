import { describe, expect, it } from "vitest";
import { extractHtml, previewHtml } from "../extract-html";

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
