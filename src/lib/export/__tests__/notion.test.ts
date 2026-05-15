/**
 * Tests for the Notion exporter. Notion's paste handler honors inline styles
 * (added by juice) but ignores classes and `<section>`/`<article>` wrappers,
 * so we verify the post-processing pipeline against real DOM parses.
 */
import { describe, it, expect } from "vitest";
import { toNotionHtml } from "../notion";

function parseFragment(html: string): HTMLBodyElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
    .body as HTMLBodyElement;
}

describe("toNotionHtml — wrapper unwrapping", () => {
  it("unwraps <section>/<article>/<header>/<footer>/<main>", () => {
    const html = toNotionHtml(
      "<section><article><header><h1>t</h1></header><main><p>body</p></main><footer><p>f</p></footer></article></section>",
    );
    const body = parseFragment(html);
    expect(body.querySelector("section")).toBeNull();
    expect(body.querySelector("article")).toBeNull();
    expect(body.querySelector("header")).toBeNull();
    expect(body.querySelector("main")).toBeNull();
    expect(body.querySelector("footer")).toBeNull();
    expect(body.querySelector("h1")?.textContent).toBe("t");
    expect(
      Array.from(body.querySelectorAll("p")).map((p) => p.textContent),
    ).toEqual(["body", "f"]);
  });
});

describe("toNotionHtml — noise attribute stripping", () => {
  it("strips data-* and class attributes from non-code elements", () => {
    const html = toNotionHtml(
      '<p class="prose" data-foo="bar">hello</p><span class="x" data-baz="qux">world</span>',
    );
    const body = parseFragment(html);
    const p = body.querySelector("p");
    expect(p?.getAttribute("class")).toBeNull();
    expect(p?.getAttribute("data-foo")).toBeNull();
    const span = body.querySelector("span");
    expect(span?.getAttribute("class")).toBeNull();
    expect(span?.getAttribute("data-baz")).toBeNull();
  });

  it("preserves inline styles (juice's output) so colors/weights survive paste", () => {
    const html = toNotionHtml(
      '<p style="color: red; font-weight: bold">styled</p>',
    );
    const p = parseFragment(html).querySelector("p");
    expect(p?.getAttribute("style")).toContain("color");
  });
});

describe("toNotionHtml — code block normalization", () => {
  it("keeps language-* class on <code> inside <pre>", () => {
    const html = toNotionHtml(
      '<pre><code class="language-ts">x</code></pre>',
    );
    const code = parseFragment(html).querySelector("pre code");
    expect(code?.getAttribute("class")).toMatch(/language-ts/);
  });

  it("strips non-language classes from <code>, keeping only language-*", () => {
    const html = toNotionHtml(
      '<pre><code class="hljs language-py extra">x</code></pre>',
    );
    const code = parseFragment(html).querySelector("pre code");
    const tokens = (code?.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);
    // All language-* tokens are present; nothing else.
    expect(tokens.every((t) => /^language-/.test(t))).toBe(true);
    expect(tokens).toContain("language-py");
  });

  it("adds language-plaintext when <pre><code> has no language hint", () => {
    const html = toNotionHtml("<pre><code>raw</code></pre>");
    const code = parseFragment(html).querySelector("pre code");
    expect(code?.getAttribute("class")).toMatch(/language-plaintext/);
  });

  it("wraps a <pre> with no inner <code> in one, with a language hint", () => {
    const html = toNotionHtml("<pre>orphan</pre>");
    const body = parseFragment(html);
    const code = body.querySelector("pre > code");
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe("orphan");
    expect(code?.getAttribute("class")).toMatch(/language-plaintext/);
  });
});
