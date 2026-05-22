import { describe, it, expect } from "vitest";
import { extractHtml } from "../extract-html.js";

describe("extractHtml", () => {
  it('returns "" for agent error text ("rate limit exceeded")', () => {
    expect(extractHtml("rate limit exceeded")).toBe("");
  });

  it('returns "" for empty string input', () => {
    expect(extractHtml("")).toBe("");
  });

  it('returns "" for plain text without HTML markers ("Here is your result: some text")', () => {
    expect(extractHtml("Here is your result: some text")).toBe("");
  });

  it('returns "" for non-HTML fenced code block (```json {"a":1} ```)', () => {
    expect(extractHtml('```json\n{"a":1}\n```')).toBe("");
  });

  it("extracts DOCTYPE + full HTML from text with surrounding content", () => {
    const input = "Sure!\n<!DOCTYPE html><html><body>ok</body></html>";
    expect(extractHtml(input)).toBe("<!DOCTYPE html><html><body>ok</body></html>");
  });

  it("extracts inner content from fenced HTML code block", () => {
    const input = "```html\n<html><body>ok</body></html>\n```";
    expect(extractHtml(input)).toBe("<html><body>ok</body></html>");
  });

  it("returns content starting with < that is valid HTML snippet", () => {
    const input = "<div><p>Hello</p></div>";
    expect(extractHtml(input)).toBe("<div><p>Hello</p></div>");
  });

  it("returns HTML content when closing </html> is missing (streaming)", () => {
    const input = "<html><body>streaming...";
    expect(extractHtml(input)).toBe("<html><body>streaming...");
  });

  it("returns plain <html> tag content without DOCTYPE", () => {
    const input = "<html>\n<body>ok</body>\n</html>";
    expect(extractHtml(input)).toBe("<html>\n<body>ok</body>\n</html>");
  });
});
