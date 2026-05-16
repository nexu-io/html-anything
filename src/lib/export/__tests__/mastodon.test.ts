/**
 * Tests for `truncateForPost` — shared by both Mastodon (500 cap) and
 * Bluesky (300 cap). Verifies that the function never splits a surrogate
 * pair and stays under the platform limit for compound emoji (ZWJ
 * sequences count as multiple code points, which is conservative).
 */
import { describe, it, expect } from "vitest";
import { truncateForPost } from "../mastodon";

describe("truncateForPost — basic length handling", () => {
  it("returns the trimmed input when under the limit", () => {
    expect(truncateForPost("   hello world  ", 50)).toBe("hello world");
  });

  it("collapses internal whitespace runs", () => {
    expect(truncateForPost("a   b\t\tc\n\nd", 50)).toBe("a b c d");
  });

  it("truncates a long ASCII string with an ellipsis", () => {
    const long = "abcdefghij".repeat(10); // 100 chars
    const out = truncateForPost(long, 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("truncateForPost — Unicode safety", () => {
  it("does not split a surrogate pair", () => {
    // 5 single-code-point emoji = 5 code points = 10 UTF-16 units.
    const s = "🎉🎉🎉🎉🎉";
    const out = truncateForPost(s, 3);
    // Output is at most 3 code points; ellipsis takes 1, so we keep 2 emoji.
    const points = Array.from(out);
    expect(points.length).toBeLessThanOrEqual(3);
    // No lone surrogate should appear in the output.
    for (const ch of out) {
      const code = ch.codePointAt(0)!;
      const isSurrogate = code >= 0xd800 && code <= 0xdfff;
      // `for…of` on a string iterates by code point, so any individual char
      // in this loop should already be a full code point, never a surrogate.
      expect(isSurrogate).toBe(false);
    }
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns input unchanged when code-point count is within limit even if UTF-16 length exceeds it", () => {
    // 10 emoji = 10 code points but 20 UTF-16 units.
    const s = "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉";
    expect(s.length).toBe(20); // UTF-16 units
    expect(Array.from(s).length).toBe(10); // code points
    // Limit 15: collapsed.length=20 > 15, but code points 10 <= 15, so the
    // fast path's second check returns the string unchanged.
    expect(truncateForPost(s, 15)).toBe(s);
  });

  it("counts ZWJ-joined emoji as multiple code points (documented conservative behavior)", () => {
    // 👨‍👩‍👧 = 5 code points (3 emoji + 2 zero-width joiners) but 1 grapheme.
    // The doc comment on truncateForPost calls this out — verify the behavior.
    const family = "👨‍👩‍👧";
    expect(Array.from(family).length).toBe(5);
    // With limit 3, the family alone (5 code points) exceeds it.
    const out = truncateForPost(family, 3);
    expect(Array.from(out).length).toBeLessThanOrEqual(3);
  });
});

describe("truncateForPost — boundary cases", () => {
  it("handles empty input", () => {
    expect(truncateForPost("", 10)).toBe("");
  });

  it("handles limit equal to length", () => {
    expect(truncateForPost("hello", 5)).toBe("hello");
  });

  it("handles limit exactly one less than length", () => {
    const out = truncateForPost("hello", 4);
    expect(out.endsWith("…")).toBe(true);
    expect(Array.from(out).length).toBeLessThanOrEqual(4);
  });
});
