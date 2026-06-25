import { describe, expect, it } from "vitest";
import { parseHyperframes } from "./hyperframes";

describe("parseHyperframes", () => {
  it("preserves explicit zero durations from data attributes", () => {
    const parsed = parseHyperframes(`
      <!doctype html>
      <html>
        <body>
          <section class="frame" data-duration="0">
            <h1>Instant frame</h1>
          </section>
        </body>
      </html>
    `);

    expect(parsed.frames[0]?.duration).toBe(0);
  });

  it("preserves explicit zero durations from inline markers", () => {
    const parsed = parseHyperframes(`
      <!doctype html>
      <html>
        <body>
          <section class="frame">
            <h1>Instant marker frame</h1>
            <!-- frame:1 duration:0 transition:cut -->
          </section>
        </body>
      </html>
    `);

    expect(parsed.frames[0]?.duration).toBe(0);
  });
});
