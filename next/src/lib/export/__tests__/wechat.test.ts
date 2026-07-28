import { describe, expect, it } from "vitest";
import { renderToWechatHtml, toWechatHtml } from "../wechat";

describe("renderToWechatHtml (computed-style path)", () => {
  it("wraps body content in a WeChat section with the data-tool tag", async () => {
    const out = await renderToWechatHtml(
      `<!DOCTYPE html><html><body><h1>Title</h1><p>Body text</p></body></html>`,
    );
    expect(out.startsWith('<section data-tool="html-anything">')).toBe(true);
    expect(out).toContain("Title");
    expect(out).toContain("Body text");
  });

  it("inlines computed CSS so styles survive WeChat's <style> stripping", async () => {
    // happy-dom applies <style> to getComputedStyle; in a real browser this
    // also captures Tailwind-CDN rules (which is the whole point — juice
    // alone sees nothing for CDN-loaded CSS).
    const out = await renderToWechatHtml(
      `<!DOCTYPE html><html><head><style>p{color:rgb(255,0,0);font-weight:bold}</style></head>` +
        `<body><p class="red">red text</p></body></html>`,
    );
    // The <p>'s color should have been copied onto inline style.
    expect(out).toMatch(/<p[^>]*style="[^"]*color:\s*rgb\(255,\s*0,\s*0\)/i);
  });

  it("falls back gracefully when there is no usable iframe document", async () => {
    const out = await renderToWechatHtml(`<!DOCTYPE html><html><body><p>plain</p></body></html>`);
    expect(out).toContain("plain");
    expect(out.startsWith('<section data-tool="html-anything">')).toBe(true);
  });
});

describe("toWechatHtml (sync juice fallback)", () => {
  it("inlines static <style> rules and wraps in a section", () => {
    const out = toWechatHtml(
      `<!DOCTYPE html><html><head><style>p{color:red}</style></head><body><p>x</p></body></html>`,
    );
    expect(out.startsWith('<section data-tool="html-anything">')).toBe(true);
    expect(out).toMatch(/color:\s*red/i);
  });
});
