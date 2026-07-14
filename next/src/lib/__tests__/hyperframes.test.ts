import { describe, it, expect } from "vitest";
import { parseHyperframes, isHyperframes } from "../hyperframes";

describe("parseHyperframes", () => {
  it("parses a minimal hyperframes document", () => {
    const html = `
      <html>
        <head><title>Test</title></head>
        <body class="foo">
          <section class="frame" data-duration="3000">
            <p>Frame 1</p>
          </section>
          <!-- HYPERFRAMES_META: {"frames":[{"i":1,"duration":3000}]} -->
        </body>
      </html>
    `;
    const result = parseHyperframes(html);
    expect(result.isHyperframes).toBe(true);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].duration).toBe(3000);
    expect(result.frames[0].innerHtml).toContain("Frame 1");
    expect(result.title).toBe("Test");
  });

  it("preserves zero duration from data-duration attribute (issue #110)", () => {
    const html = `
      <html>
        <head><title>Zero Dur</title></head>
        <body>
          <section class="frame" data-duration="0">
            <p>Instant frame</p>
          </section>
        </body>
      </html>
    `;
    const result = parseHyperframes(html);
    expect(result.isHyperframes).toBe(true);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].duration).toBe(0);
  });

  it("preserves zero duration from inline comment marker fallback (issue #110)", () => {
    const html = `
      <html>
        <head><title>Marker Zero</title></head>
        <body>
          <section class="frame">
            <p>Instant frame via marker</p>
            <!-- frame:1 duration:0 -->
          </section>
        </body>
      </html>
    `;
    const result = parseHyperframes(html);
    expect(result.isHyperframes).toBe(true);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].duration).toBe(0);
  });

  it("falls back to default when data-duration is absent", () => {
    const html = `
      <html>
        <head><title>No Dur</title></head>
        <body>
          <section class="frame">
            <p>Frame</p>
          </section>
        </body>
      </html>
    `;
    const result = parseHyperframes(html);
    expect(result.isHyperframes).toBe(true);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].duration).toBe(3000);
  });

  it("parses multiple frames with mixed durations including zero", () => {
    const html = `
      <html>
        <head><title>Mixed</title></head>
        <body>
          <section class="frame" data-duration="0"><p>A</p></section>
          <section class="frame" data-duration="1000"><p>B</p></section>
          <section class="frame"><p>C</p></section>
        </body>
      </html>
    `;
    const result = parseHyperframes(html);
    expect(result.frames).toHaveLength(3);
    expect(result.frames[0].duration).toBe(0);
    expect(result.frames[1].duration).toBe(1000);
    expect(result.frames[2].duration).toBe(3000);
  });
});

describe("isHyperframes", () => {
  it("returns false for empty or non-hyperframes html", () => {
    expect(isHyperframes("")).toBe(false);
    expect(isHyperframes("<html><body><p>hello</p></body></html>")).toBe(false);
  });

  it("returns true when at least one frame section exists", () => {
    const html = `<html><body><section class="frame"><p>hi</p></section></body></html>`;
    expect(isHyperframes(html)).toBe(true);
  });
});
