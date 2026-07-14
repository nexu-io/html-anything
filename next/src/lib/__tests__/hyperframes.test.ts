import { describe, expect, it } from "vitest";
import { parseHyperframes } from "../hyperframes";

/** Minimal helper: wraps section(s) in a hyperframes-shaped document. */
function makeDoc(sections: string): string {
  return `<!DOCTYPE html><html><head><title>test</title></head><body>${sections}</body></html>`;
}

describe("parseHyperframes", () => {
  it("preserves data-duration=0 instead of falling back to default (3000)", () => {
    const html = makeDoc(
      '<section class="frame" data-duration="0"><p>instant</p></section>',
    );
    const result = parseHyperframes(html);
    expect(result.isHyperframes).toBe(true);
    expect(result.frames).toHaveLength(1);
    expect(result.frames[0].duration).toBe(0);
  });

  it("treats missing data-duration as undefined → defaults to 3000", () => {
    const html = makeDoc(
      '<section class="frame"><p>no duration attr</p></section>',
    );
    const result = parseHyperframes(html);
    expect(result.frames[0].duration).toBe(3000);
  });

  it("parses a positive data-duration correctly", () => {
    const html = makeDoc(
      '<section class="frame" data-duration="5000"><p>slow</p></section>',
    );
    const result = parseHyperframes(html);
    expect(result.frames[0].duration).toBe(5000);
  });

  it("handles mixed frames: zero, positive, and missing", () => {
    const html = makeDoc(
      '<section class="frame" data-duration="0"><p>a</p></section>' +
        '<section class="frame" data-duration="2000"><p>b</p></section>' +
        '<section class="frame"><p>c</p></section>',
    );
    const result = parseHyperframes(html);
    expect(result.frames).toHaveLength(3);
    expect(result.frames[0].duration).toBe(0);
    expect(result.frames[1].duration).toBe(2000);
    expect(result.frames[2].duration).toBe(3000);
  });
});
