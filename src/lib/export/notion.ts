"use client";

import juice from "juice";
import { copyHtml } from "./clipboard";

/**
 * Notion's paste handler converts HTML to native blocks. It honors inline
 * styles for text decoration (color, background, font-weight) but ignores
 * classes and section wrappers — so we juice the CSS in, then flatten the
 * outer container that WeChat needs but Notion drops.
 *
 * Quirks worth knowing about:
 *  - `<section>` / `<article>` wrappers around top-level blocks get unwrapped.
 *  - `<pre><code class="language-xxx">` is required for code blocks to
 *    land as Notion code blocks with the right language.
 *  - `<img>` is accepted but Notion re-uploads only when src is reachable;
 *    we leave the src as-is so the user can decide whether to host first.
 *  - `data-*` and `class` attributes survive paste as noise; strip them.
 */
export function toNotionHtml(fullHtml: string): string {
  if (typeof window === "undefined") return fullHtml;

  const doc = new DOMParser().parseFromString(fullHtml, "text/html");

  const css = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");

  const bodyHtml = doc.body?.innerHTML ?? fullHtml;

  let inlined: string;
  try {
    inlined = juice.inlineContent(bodyHtml, css, {
      inlinePseudoElements: true,
      preserveImportant: true,
    });
  } catch {
    inlined = bodyHtml;
  }

  // Post-process: unwrap section/article, strip class/data-*, normalize code blocks.
  const wrap = document.createElement("div");
  wrap.innerHTML = inlined;

  unwrapAll(wrap, ["section", "article", "header", "footer", "main"]);
  stripNoiseAttrs(wrap);
  normalizeCodeBlocks(wrap);

  return wrap.innerHTML;
}

export async function copyToNotion(fullHtml: string): Promise<void> {
  const html = toNotionHtml(fullHtml);
  await copyHtml(html);
}

function unwrapAll(root: HTMLElement, tags: string[]): void {
  for (const tag of tags) {
    const nodes = Array.from(root.querySelectorAll(tag));
    for (const node of nodes) {
      const parent = node.parentNode;
      if (!parent) continue;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
    }
  }
}

function stripNoiseAttrs(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let el = walker.nextNode() as Element | null;
  while (el) {
    // Keep code language class — Notion uses it to pick the syntax mode.
    const keepClass =
      el.tagName === "CODE" && /\blanguage-[\w-]+/.test(el.getAttribute("class") ?? "");
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === "class" && keepClass) continue;
      if (attr.name.startsWith("data-") || attr.name === "class") {
        el.removeAttribute(attr.name);
      }
    }
    el = walker.nextNode() as Element | null;
  }
}

function normalizeCodeBlocks(root: HTMLElement): void {
  // Ensure every <pre> has a <code> child with a language-* class; Notion
  // otherwise treats the block as plain text and you lose the code styling.
  root.querySelectorAll("pre").forEach((pre) => {
    let code = pre.querySelector(":scope > code");
    if (!code) {
      code = document.createElement("code");
      code.textContent = pre.textContent ?? "";
      pre.textContent = "";
      pre.appendChild(code);
    }
    const cls = code.getAttribute("class") ?? "";
    if (!/\blanguage-[\w-]+/.test(cls)) {
      code.setAttribute("class", `${cls} language-plaintext`.trim());
    }
  });
}
