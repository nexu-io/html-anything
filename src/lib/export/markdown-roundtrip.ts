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
      return `\n\n${renderInline(el)}\n\n`;
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
      return renderInline(el);
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
      return `\`${(el.textContent ?? "").replace(/`/g, "\\`")}\``;
    case "s": case "del": case "strike":
      return `~~${inner()}~~`;
    case "br":
      return "  \n";
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const title = el.getAttribute("title");
      const text = inner() || href;
      return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`;
    }
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      const title = el.getAttribute("title");
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
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
  const raw = (code ?? el).textContent ?? "";
  return `\n\n\`\`\`${lang}\n${raw.replace(/\n$/, "")}\n\`\`\`\n\n`;
}

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

    // Split inline content from nested lists so the markdown nests cleanly.
    const inlineFrag = document.createElement("div");
    const nested: Element[] = [];
    for (const c of Array.from(li.childNodes)) {
      if (
        c.nodeType === Node.ELEMENT_NODE &&
        /^(ul|ol)$/i.test((c as Element).tagName)
      ) {
        nested.push(c as Element);
      } else {
        inlineFrag.appendChild(c.cloneNode(true));
      }
    }

    const inlineText = renderInline(inlineFrag).trim();
    let block = `${indent}${marker} ${inlineText}`;
    for (const nest of nested) {
      block += "\n" + renderList(nest, childCtx).replace(/\n+$/, "");
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
  // Escape only the characters that would otherwise produce stray markdown:
  // backslash, the inline markers, and unbalanced fences. Leave brackets /
  // parens alone — escaping them in prose looks worse than the rare false
  // link match.
  return s.replace(/([\\`*_])/g, "\\$1");
}

function collapseBlankLines(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n");
}
