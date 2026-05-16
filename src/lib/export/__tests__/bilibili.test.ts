/**
 * Tests for the Bilibili 专栏 HTML sanitizer. The sanitizer runs in a real
 * (happy-dom) browser-like environment so it exercises the actual DOMParser
 * + Element APIs the production code uses. Each test parses the cleaned
 * output back through DOMParser and asserts on the resulting tree shape.
 */
import { describe, it, expect } from "vitest";
import { toBilibiliHtml } from "../bilibili";

function parseFragment(html: string): HTMLBodyElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
    .body as HTMLBodyElement;
}

describe("toBilibiliHtml — whitelist enforcement", () => {
  it("strips <script>/<iframe>/<style> wrappers entirely", () => {
    const html = toBilibiliHtml(
      "<p>keep</p><script>alert(1)</script><iframe></iframe><style>p{}</style>",
    );
    const body = parseFragment(html);
    expect(body.querySelector("script")).toBeNull();
    expect(body.querySelector("iframe")).toBeNull();
    expect(body.querySelector("style")).toBeNull();
    expect(body.querySelector("p")?.textContent).toBe("keep");
  });

  it("unwraps <div>/<section> but keeps their children", () => {
    const html = toBilibiliHtml(
      "<div><section><p>a</p></section><p>b</p></div>",
    );
    const body = parseFragment(html);
    expect(body.querySelector("div")).toBeNull();
    expect(body.querySelector("section")).toBeNull();
    const ps = Array.from(body.querySelectorAll("p")).map((p) => p.textContent);
    expect(ps).toEqual(["a", "b"]);
  });

  it("preserves headings, lists, code, blockquotes, hr, br", () => {
    const html = toBilibiliHtml(
      "<h2>Title</h2><ul><li>x</li></ul><pre><code>k</code></pre><blockquote>q</blockquote><hr><br>",
    );
    const body = parseFragment(html);
    expect(body.querySelector("h2")?.textContent).toBe("Title");
    expect(body.querySelector("ul li")?.textContent).toBe("x");
    expect(body.querySelector("pre code")?.textContent).toBe("k");
    expect(body.querySelector("blockquote")?.textContent).toBe("q");
    expect(body.querySelector("hr")).not.toBeNull();
    expect(body.querySelector("br")).not.toBeNull();
  });
});

describe("toBilibiliHtml — attribute filtering", () => {
  it("drops all attributes except those in the allow-list", () => {
    const html = toBilibiliHtml(
      '<p class="foo" data-x="y" onclick="alert(1)" id="z">hi</p>',
    );
    const p = parseFragment(html).querySelector("p");
    expect(p?.getAttribute("class")).toBeNull();
    expect(p?.getAttribute("data-x")).toBeNull();
    expect(p?.getAttribute("onclick")).toBeNull();
    expect(p?.getAttribute("id")).toBeNull();
    expect(p?.textContent).toBe("hi");
  });

  it("keeps href and title on <a>, drops javascript: hrefs", () => {
    const html = toBilibiliHtml(
      '<p><a href="https://example.com" title="t">ok</a> ' +
        '<a href="javascript:alert(1)">bad</a></p>',
    );
    const anchors = Array.from(parseFragment(html).querySelectorAll("a"));
    expect(anchors[0].getAttribute("href")).toBe("https://example.com");
    expect(anchors[0].getAttribute("title")).toBe("t");
    expect(anchors[1].hasAttribute("href")).toBe(false);
  });

  it("keeps only language-* classes on <code>", () => {
    const html = toBilibiliHtml(
      '<pre><code class="hljs language-ts other">x</code></pre>',
    );
    const code = parseFragment(html).querySelector("code");
    // Whitespace allowed, but the only token retained is language-ts.
    const tokens = (code?.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);
    expect(tokens).toEqual(["language-ts"]);
  });

  it("removes the class attribute entirely when no language-* token survives", () => {
    const html = toBilibiliHtml(
      '<pre><code class="hljs token-keyword">x</code></pre>',
    );
    const code = parseFragment(html).querySelector("code");
    expect(code?.hasAttribute("class")).toBe(false);
  });
});

describe("toBilibiliHtml — image rewriting", () => {
  it("leaves bilibili CDN images intact", () => {
    const html = toBilibiliHtml(
      '<p><img src="https://i0.hdslb.com/x.png" alt="a"></p>',
    );
    const img = parseFragment(html).querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://i0.hdslb.com/x.png");
    expect(img?.getAttribute("alt")).toBe("a");
    expect(img?.hasAttribute("data-bili-placeholder")).toBe(false);
  });

  it("replaces non-CDN images with a placeholder SVG and stashes the original src", () => {
    const html = toBilibiliHtml(
      '<p><img src="https://imgur.com/foo.png" alt="ext"></p>',
    );
    const img = parseFragment(html).querySelector("img");
    expect(img?.getAttribute("data-original-src")).toBe(
      "https://imgur.com/foo.png",
    );
    expect(img?.getAttribute("data-bili-placeholder")).toBe("true");
    expect(img?.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    expect(img?.getAttribute("alt")).toBe("ext");
  });

  it("rejects lookalike hostnames (no subdomain dot before the literal)", () => {
    // `evilhdslb.com` and `notbilibili.com` would slip past a `[^/]*` regex
    // and skip the placeholder swap — both must be treated as non-CDN.
    for (const src of [
      "https://evilhdslb.com/foo.png",
      "https://notbilibili.com/foo.png",
    ]) {
      const html = toBilibiliHtml(`<p><img src="${src}" alt="x"></p>`);
      const img = parseFragment(html).querySelector("img");
      expect(img?.getAttribute("data-bili-placeholder")).toBe("true");
      expect(img?.getAttribute("data-original-src")).toBe(src);
    }
  });

  it("accepts subdomains of the bilibili CDN", () => {
    for (const src of [
      "https://i0.hdslb.com/bfs/x.png",
      "https://album.bilibili.com/x.png",
      "https://hdslb.com/x.png", // bare apex
      "https://bilibili.com/foo.png", // bare apex
    ]) {
      const html = toBilibiliHtml(`<p><img src="${src}" alt="x"></p>`);
      const img = parseFragment(html).querySelector("img");
      expect(img?.hasAttribute("data-bili-placeholder")).toBe(false);
      expect(img?.getAttribute("src")).toBe(src);
    }
  });
});
