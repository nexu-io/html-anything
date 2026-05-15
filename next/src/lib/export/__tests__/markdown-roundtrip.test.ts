/**
 * Tests for the HTML → Markdown emitter. Each case is verified two ways:
 *   1. The emitted Markdown matches expectations (substring / regex / exact).
 *   2. The emitted Markdown is fed through `marked` (a real CommonMark/GFM
 *      parser, also a runtime dependency) and the resulting HTML is asserted
 *      to round-trip the structural intent. This is the closest "simulate
 *      real" check we can do without spinning up Hugo / 11ty / Obsidian.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { marked } from "marked";

import { htmlToMarkdown } from "../markdown-roundtrip";

beforeAll(() => {
  marked.setOptions({ async: false, gfm: true, breaks: false });
});

function mdToDoc(md: string): Document {
  const html = marked.parse(md) as string;
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
}

function roundtripTags(html: string): string[] {
  const md = htmlToMarkdown(html);
  const doc = mdToDoc(md);
  return Array.from(doc.body.children).map((c) => c.tagName.toLowerCase());
}

describe("htmlToMarkdown — headings", () => {
  it("emits ATX headings for h1–h6", () => {
    for (let lvl = 1; lvl <= 6; lvl++) {
      const md = htmlToMarkdown(`<h${lvl}>Title ${lvl}</h${lvl}>`);
      expect(md).toContain(`${"#".repeat(lvl)} Title ${lvl}`);
      const doc = mdToDoc(md);
      const h = doc.body.querySelector(`h${lvl}`);
      expect(h?.textContent).toBe(`Title ${lvl}`);
    }
  });
});

describe("htmlToMarkdown — paragraphs and inline marks", () => {
  it("renders **strong**, *em*, ~~del~~", () => {
    const md = htmlToMarkdown(
      "<p><strong>bold</strong> <em>it</em> <s>gone</s></p>",
    );
    expect(md).toMatch(/\*\*bold\*\*/);
    expect(md).toMatch(/\*it\*/);
    expect(md).toMatch(/~~gone~~/);
    const doc = mdToDoc(md);
    expect(doc.body.querySelector("strong")?.textContent).toBe("bold");
    expect(doc.body.querySelector("em")?.textContent).toBe("it");
    expect(doc.body.querySelector("del,s")?.textContent).toBe("gone");
  });

  it("escapes literal *, _, ~ in plain text so they don't become marks", () => {
    const md = htmlToMarkdown("<p>5 * 3 = 15 and _foo_ and ~~bar~~ literal</p>");
    // None of these should round-trip as <em>/<strong>/<del>.
    const doc = mdToDoc(md);
    expect(doc.body.querySelector("em")).toBeNull();
    expect(doc.body.querySelector("strong")).toBeNull();
    expect(doc.body.querySelector("del,s")).toBeNull();
    expect(doc.body.textContent).toContain("5 * 3 = 15");
    expect(doc.body.textContent).toContain("_foo_");
    expect(doc.body.textContent).toContain("~~bar~~");
  });
});

describe("htmlToMarkdown — inline code with backticks", () => {
  it("handles content containing a single backtick with a longer fence", () => {
    const md = htmlToMarkdown("<p>see <code>a `b` c</code> done</p>");
    const doc = mdToDoc(md);
    const code = doc.body.querySelector("code");
    expect(code).not.toBeNull();
    // The textContent must include the literal backticks, not be split by them.
    expect(code!.textContent).toContain("`b`");
  });

  it("handles content starting and ending with a backtick", () => {
    const md = htmlToMarkdown("<p><code>`tick`</code></p>");
    const doc = mdToDoc(md);
    const code = doc.body.querySelector("code");
    expect(code!.textContent?.trim()).toBe("`tick`");
  });
});

describe("htmlToMarkdown — fenced code blocks", () => {
  it("uses the language hint from class=language-*", () => {
    const md = htmlToMarkdown(
      '<pre><code class="language-ts">const x: number = 1;</code></pre>',
    );
    expect(md).toMatch(/```ts\nconst x: number = 1;\n```/);
    const doc = mdToDoc(md);
    expect(doc.body.querySelector("pre code")?.textContent?.trim()).toBe(
      "const x: number = 1;",
    );
  });

  it("uses a longer fence when the body contains triple backticks", () => {
    const md = htmlToMarkdown(
      "<pre><code>before\n```\nfake fence inside\n```\nafter</code></pre>",
    );
    // Body still has the original triple backticks; the outer fence is longer.
    expect(md).toContain("```\nfake fence inside\n```");
    // Outer fence is at least 4 backticks long.
    expect(md).toMatch(/````+\n[\s\S]*```\nfake fence inside\n```/);
    const doc = mdToDoc(md);
    const code = doc.body.querySelector("pre code");
    expect(code?.textContent).toContain("fake fence inside");
    expect(code?.textContent).toContain("before");
    expect(code?.textContent).toContain("after");
  });
});

describe("htmlToMarkdown — links and images", () => {
  it("emits a plain [text](url) for simple links", () => {
    const md = htmlToMarkdown(
      '<p><a href="https://example.com">site</a></p>',
    );
    expect(md).toMatch(/\[site\]\(https:\/\/example\.com\)/);
    const a = mdToDoc(md).body.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.textContent).toBe("site");
  });

  it("wraps URLs containing spaces or parens with <…>", () => {
    const md = htmlToMarkdown(
      '<p><a href="https://example.com/foo (bar)/baz">click</a></p>',
    );
    expect(md).toContain("(<https://example.com/foo (bar)/baz>)");
    // marked URL-encodes spaces during HTML rendering — verify the decoded
    // form so we're testing the source-of-truth (the markdown the user pastes
    // into Hugo/Obsidian preserves the unencoded URL).
    const a = mdToDoc(md).body.querySelector("a");
    expect(decodeURI(a?.getAttribute("href") ?? "")).toBe(
      "https://example.com/foo (bar)/baz",
    );
  });

  it("escapes quotes and backslashes inside the title", () => {
    const md = htmlToMarkdown(
      '<p><a href="https://x.com" title="say &quot;hi&quot; \\back">t</a></p>',
    );
    // Title quotes are backslash-escaped, so the link form remains valid.
    expect(md).toMatch(/"say \\"hi\\" \\\\back"/);
    const a = mdToDoc(md).body.querySelector("a");
    expect(a?.getAttribute("title")).toBe('say "hi" \\back');
  });

  it("escapes [ and ] inside link text", () => {
    const md = htmlToMarkdown(
      '<p><a href="https://x.com">[bracketed] text</a></p>',
    );
    expect(md).toMatch(/\\\[bracketed\\\] text/);
    const a = mdToDoc(md).body.querySelector("a");
    expect(a?.textContent).toBe("[bracketed] text");
  });

  it("renders images with alt, src and optional title", () => {
    const md = htmlToMarkdown(
      '<p><img src="https://x.com/a.png" alt="hello" title="t"></p>',
    );
    expect(md).toMatch(/!\[hello\]\(https:\/\/x\.com\/a\.png "t"\)/);
    const img = mdToDoc(md).body.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://x.com/a.png");
    expect(img?.getAttribute("alt")).toBe("hello");
    expect(img?.getAttribute("title")).toBe("t");
  });
});

describe("htmlToMarkdown — line-start block-marker escaping", () => {
  it("escapes a paragraph that starts with '1. ' so it stays a paragraph", () => {
    const tags = roundtripTags("<p>1. First item, not a list</p>");
    expect(tags).toEqual(["p"]);
  });

  it("escapes a paragraph starting with '# '", () => {
    const tags = roundtripTags("<p># Not a heading</p>");
    expect(tags).toEqual(["p"]);
  });

  it("escapes a paragraph starting with '> '", () => {
    const tags = roundtripTags("<p>> Not a quote</p>");
    expect(tags).toEqual(["p"]);
  });

  it("escapes a paragraph starting with '- '", () => {
    const tags = roundtripTags("<p>- Not a bullet</p>");
    expect(tags).toEqual(["p"]);
  });

  it("does NOT escape mid-text markers", () => {
    // "#hashtag" mid-text is not a heading and should not be escaped.
    const md = htmlToMarkdown("<p>see #hashtag here</p>");
    expect(md).not.toMatch(/\\#hashtag/);
  });
});

describe("htmlToMarkdown — lists", () => {
  it("renders a simple unordered list", () => {
    const md = htmlToMarkdown("<ul><li>a</li><li>b</li></ul>");
    const doc = mdToDoc(md);
    const items = Array.from(doc.body.querySelectorAll("ul > li")).map(
      (li) => li.textContent?.trim(),
    );
    expect(items).toEqual(["a", "b"]);
  });

  it("renders a nested list with correct indentation", () => {
    const md = htmlToMarkdown(
      "<ul><li>outer<ul><li>inner-a</li><li>inner-b</li></ul></li><li>other</li></ul>",
    );
    const doc = mdToDoc(md);
    const outer = doc.body.querySelector("ul");
    const innerLis = outer
      ?.querySelector("li > ul")
      ?.querySelectorAll(":scope > li");
    expect(innerLis?.length).toBe(2);
    expect(innerLis?.[0].textContent?.trim()).toBe("inner-a");
  });

  it("renders a list item with a paragraph and a code block inside", () => {
    const md = htmlToMarkdown(
      "<ol><li><p>step one</p><pre><code class=\"language-js\">x++;</code></pre></li><li>step two</li></ol>",
    );
    const doc = mdToDoc(md);
    const lis = doc.body.querySelectorAll("ol > li");
    expect(lis.length).toBe(2);
    // First <li> contains both a paragraph and a fenced code block.
    expect(lis[0].querySelector("p")?.textContent?.trim()).toBe("step one");
    expect(lis[0].querySelector("pre code")?.textContent?.trim()).toBe("x++;");
    expect(lis[1].textContent?.trim()).toBe("step two");
  });
});

describe("htmlToMarkdown — blockquotes, hr, tables, br", () => {
  it("renders blockquotes with > prefix", () => {
    const md = htmlToMarkdown(
      "<blockquote><p>line one</p><p>line two</p></blockquote>",
    );
    const doc = mdToDoc(md);
    const bq = doc.body.querySelector("blockquote");
    expect(bq).not.toBeNull();
    expect(bq?.textContent).toMatch(/line one/);
    expect(bq?.textContent).toMatch(/line two/);
  });

  it("renders a horizontal rule", () => {
    const md = htmlToMarkdown("<p>before</p><hr><p>after</p>");
    const doc = mdToDoc(md);
    expect(doc.body.querySelector("hr")).not.toBeNull();
  });

  it("renders a GFM table", () => {
    const md = htmlToMarkdown(
      "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table>",
    );
    const doc = mdToDoc(md);
    const headers = Array.from(doc.body.querySelectorAll("thead th")).map(
      (th) => th.textContent?.trim(),
    );
    expect(headers).toEqual(["A", "B"]);
    const rows = Array.from(doc.body.querySelectorAll("tbody tr")).map((tr) =>
      Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim()),
    );
    expect(rows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("escapes pipes inside table cells", () => {
    const md = htmlToMarkdown(
      "<table><tr><th>a|b</th></tr><tr><td>c|d</td></tr></table>",
    );
    expect(md).toMatch(/a\\\|b/);
    expect(md).toMatch(/c\\\|d/);
  });
});

describe("htmlToMarkdown — full document smoke", () => {
  it("round-trips a deck-style document end-to-end", () => {
    const html = `
      <body>
        <h1>Demo Deck</h1>
        <p>An intro paragraph with <strong>bold</strong> and a <a href="https://example.com/page (v2)">tricky link</a>.</p>
        <h2>Steps</h2>
        <ol>
          <li>Install
            <pre><code class="language-bash">npm i</code></pre>
          </li>
          <li>Run with a <code>foo \`bar\` baz</code> snippet</li>
        </ol>
        <blockquote><p>Quote with 1. literal numeric prefix.</p></blockquote>
      </body>`;
    const md = htmlToMarkdown(html);
    const doc = mdToDoc(md);
    expect(doc.body.querySelector("h1")?.textContent).toBe("Demo Deck");
    expect(doc.body.querySelector("h2")?.textContent).toBe("Steps");
    expect(doc.body.querySelector("ol > li pre code")?.textContent).toContain(
      "npm i",
    );
    expect(doc.body.querySelector("blockquote p")?.textContent).toMatch(
      /1\. literal numeric prefix/,
    );
    // Tricky-link href survives the angle-bracket wrap (decoded form,
    // since marked percent-encodes spaces in the rendered HTML).
    const a = doc.body.querySelector("a");
    expect(decodeURI(a?.getAttribute("href") ?? "")).toBe(
      "https://example.com/page (v2)",
    );
  });
});
