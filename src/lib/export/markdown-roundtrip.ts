"use client";

import { copyText } from "./clipboard";
import { downloadMarkdown } from "./download";

/**
 * Reverse trip: take a rendered HTML document and emit clean GitHub-flavored
 * Markdown that hugo / 11ty / Obsidian users can drop into a `.md` file.
 *
 * We deliberately do NOT pull in turndown — its rules table is large and
 * its handling of nested lists / tables drifts from CommonMark. A focused
 * walker over the subset we actually produce (the HTML the editor renders)
 * gives a more predictable result for ~150 lines.
 *
 * Supported: headings, paragraphs, emphasis, inline + fenced code, links,
 * images, ordered/unordered lists (nested), blockquotes, hr, tables, br.
 * Anything we don't recognize falls back to plain text.
 */
export function htmlToMarkdown(fullHtml: string): string {
  if (typeof window === "undefined") return fullHtml;

  const doc = new DOMParser().parseFromString(fullHtml, "text/html");
  const body = doc.body;
  if (!body) return "";

  const out = renderBlock(body, { listDepth: 0 });
  return collapseBlankLines(out).trim() + "\n";
}

export async function copyAsMarkdown(fullHtml: string): Promise<void> {
  await copyText(htmlToMarkdown(fullHtml));
}

export function downloadAsMarkdown(fullHtml: string, basename = "html-anything"): void {
  downloadMarkdown(htmlToMarkdown(fullHtml), basename);
}

type Ctx = { listDepth: number };

function renderBlock(node: Node, ctx: Ctx): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? "";
    return /\S/.test(t) ? t.replace(/\s+/g, " ") : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "h1": case "h2": case "h3": case "h4": case "h5": case "h6": {
      const level = Number(tag[1]);
      return `\n\n${"#".repeat(level)} ${renderInline(el)}\n\n`;
    }
    case "p":
      return `\n\n${escapeBlockStarts(renderInline(el))}\n\n`;
    case "blockquote": {
      const inner = childrenToBlocks(el, ctx).trim();
      return "\n\n" + inner.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
    }
    case "hr":
      return "\n\n---\n\n";
    case "br":
      return "  \n";
    case "pre":
      return renderPre(el);
    case "ul": case "ol":
      return renderList(el, ctx);
    case "table":
      return renderTable(el);
    case "figure":
      return childrenToBlocks(el, ctx);
    case "body": case "div": case "section": case "article":
    case "header": case "footer": case "main": case "aside":
      return childrenToBlocks(el, ctx);
    default:
      // Inline element at block position — wrap as paragraph if non-empty.
      return escapeBlockStarts(renderInline(el));
  }
}

function childrenToBlocks(el: Element, ctx: Ctx): string {
  let out = "";
  for (const child of Array.from(el.childNodes)) {
    out += renderBlock(child, ctx);
  }
  return out;
}

function renderInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeMd(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const inner = () =>
    Array.from(el.childNodes).map((c) => renderInline(c)).join("");

  switch (tag) {
    case "strong": case "b":
      return `**${inner()}**`;
    case "em": case "i":
      return `*${inner()}*`;
    case "code":
      // Inline code only — fenced blocks come through renderPre.
      // CommonMark forbids backslash-escaping backticks inside inline code;
      // use a fence longer than the longest backtick run in the body.
      return wrapInlineCode(el.textContent ?? "");
    case "s": case "del": case "strike":
      return `~~${inner()}~~`;
    case "br":
      return "  \n";
    case "a": {
      const rawHref = el.getAttribute("href") ?? "";
      const href = escapeHref(rawHref);
      const title = el.getAttribute("title");
      // inner() is already escapeMd-processed — only the bracket pair needs
      // additional escaping so [text](url) parses unambiguously.
      const text = escapeBrackets(inner() || escapeMd(rawHref));
      return title ? `[${text}](${href} "${escapeTitle(title)}")` : `[${text}](${href})`;
    }
    case "img": {
      const src = escapeHref(el.getAttribute("src") ?? "");
      const alt = escapeBrackets(escapeMd(el.getAttribute("alt") ?? ""));
      const title = el.getAttribute("title");
      return title ? `![${alt}](${src} "${escapeTitle(title)}")` : `![${alt}](${src})`;
    }
    case "span": case "u":
      return inner();
    default:
      // Unknown inline / block-ish element — recurse.
      return Array.from(el.childNodes).map((c) => renderInline(c)).join("");
  }
}

function renderPre(el: Element): string {
  const code = el.querySelector("code");
  const langCls = code?.getAttribute("class") ?? "";
  const langMatch = langCls.match(/language-([\w-]+)/);
  const lang = langMatch ? langMatch[1] : "";
  const raw = ((code ?? el).textContent ?? "").replace(/\n$/, "");
  // Fence must be longer than any backtick run in the body so the block
  // doesn't terminate early on embedded ```.
  const fence = backtickFence(raw, 3);
  return `\n\n${fence}${lang}\n${raw}\n${fence}\n\n`;
}

const LIST_BLOCK_TAGS = new Set([
  "p", "pre", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "figure", "div", "section", "article", "hr",
]);

function renderList(el: Element, ctx: Ctx): string {
  const ordered = el.tagName.toLowerCase() === "ol";
  const indent = "  ".repeat(ctx.listDepth);
  const items: string[] = [];
  let n = 1;
  for (const li of Array.from(el.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const marker = ordered ? `${n}.` : "-";
    n++;
    const childCtx = { listDepth: ctx.listDepth + 1 };
    const contIndent = indent + " ".repeat(marker.length + 1);

    // Partition children: inline (rendered into the marker line),
    // nested lists, and other block elements (paragraphs, code blocks, etc.).
    const inlineFrag = document.createElement("div");
    type ChildBlock = { kind: "list" | "block"; el: Element };
    const blockChildren: ChildBlock[] = [];
    for (const c of Array.from(li.childNodes)) {
      if (c.nodeType === Node.ELEMENT_NODE) {
        const t = (c as Element).tagName.toLowerCase();
        if (t === "ul" || t === "ol") {
          blockChildren.push({ kind: "list", el: c as Element });
          continue;
        }
        if (LIST_BLOCK_TAGS.has(t)) {
          blockChildren.push({ kind: "block", el: c as Element });
          continue;
        }
      }
      inlineFrag.appendChild(c.cloneNode(true));
    }

    // If the marker line would be empty (li had no inline children), promote
    // the first <p>'s inline content onto the marker line. Otherwise marked
    // sees "1. \n\n   text" and starts a new list from the next marker.
    if (!inlineFrag.childNodes.length && blockChildren.length) {
      const first = blockChildren[0];
      if (first.kind === "block" && first.el.tagName.toLowerCase() === "p") {
        for (const c of Array.from(first.el.childNodes)) {
          inlineFrag.appendChild(c.cloneNode(true));
        }
        blockChildren.shift();
      }
    }

    const inlineText = escapeBlockStarts(renderInline(inlineFrag)).trim();
    let block = `${indent}${marker} ${inlineText}`;
    for (const bc of blockChildren) {
      if (bc.kind === "list") {
        block += "\n" + renderList(bc.el, childCtx).replace(/\n+$/, "");
      } else {
        const rendered = renderBlock(bc.el, childCtx).replace(/^\n+/, "").replace(/\n+$/, "");
        if (!rendered) continue;
        const indented = rendered.split("\n").map((l) => (l ? contIndent + l : l)).join("\n");
        block += "\n\n" + indented;
      }
    }
    items.push(block);
  }
  return "\n" + items.join("\n") + "\n";
}

function renderTable(el: Element): string {
  const rows: string[][] = [];
  el.querySelectorAll("tr").forEach((tr) => {
    const cells: string[] = [];
    tr.querySelectorAll("th,td").forEach((cell) => {
      cells.push(renderInline(cell).replace(/\|/g, "\\|").trim());
    });
    if (cells.length) rows.push(cells);
  });
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const norm = rows.map((r) => {
    while (r.length < width) r.push("");
    return r;
  });
  const header = norm[0];
  const sep = header.map(() => "---");
  const body = norm.slice(1);
  const fmt = (r: string[]) => `| ${r.join(" | ")} |`;
  return ["\n", fmt(header), fmt(sep), ...body.map(fmt), "\n"].join("\n");
}

function escapeMd(s: string): string {
  // Escape inline-marker characters in plain text. Brackets / parens are
  // left alone — escaping them in prose looks worse than the rare false
  // link match. Line-starting block markers (#, >, -, +, digits.) are
  // handled separately in `escapeBlockStarts` so they only escape at the
  // position where they would actually trigger a block construct.
  return s.replace(/([\\`*_~])/g, "\\$1");
}

/**
 * Escape characters at the start of a line that would otherwise be parsed
 * as the opening of a block-level Markdown construct (heading, blockquote,
 * unordered/ordered list, hr). Only matches when the marker is followed by
 * whitespace or end-of-line — `#bar` mid-text isn't a heading.
 */
function escapeBlockStarts(s: string): string {
  return s.replace(
    /(^|\n)([ \t]*)(#{1,6}|>|[-+*]|\d+\.)(?=\s|$)/g,
    (_m, lead: string, ws: string, marker: string) =>
      `${lead}${ws}\\${marker}`,
  );
}

function collapseBlankLines(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n");
}

function backtickFence(body: string, min: number): string {
  let max = 0;
  const re = /`+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m[0].length > max) max = m[0].length;
  }
  return "`".repeat(Math.max(min, max + 1));
}

function wrapInlineCode(text: string): string {
  if (!text) return "``";
  const fence = backtickFence(text, 1);
  // CommonMark strips a single leading/trailing space if the content also
  // contains a non-space char — use that to allow the body to start or end
  // with a backtick (or only-spaces content) without parser ambiguity.
  const needsPad = text.startsWith("`") || text.endsWith("`");
  const pad = needsPad ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

/**
 * Render a URL safe for use inside the `(...)` of a Markdown link/image.
 * URLs containing spaces or parens are wrapped with angle brackets; any
 * embedded `<` / `>` are percent-encoded since they would close the bracket
 * form prematurely.
 */
function escapeHref(href: string): string {
  if (!href) return "";
  if (/[\s()<>]/.test(href)) {
    const encoded = href.replace(/[<>]/g, (c) => (c === "<" ? "%3C" : "%3E"));
    return `<${encoded}>`;
  }
  return href;
}

function escapeTitle(title: string): string {
  return title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeBrackets(text: string): string {
  // Backslash-escape brackets so they don't break the [text](url) form.
  // Caller is responsible for any other inline escaping needed.
  return text.replace(/([[\]])/g, "\\$1");
}
