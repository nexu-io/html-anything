"use client";

import { copyHtml } from "./clipboard";

/**
 * Bilibili 专栏 (column) editor accepts a narrow subset of HTML and rejects
 * everything else (drops the tag, sometimes drops the whole paste). Images
 * must be on a bili-hosted CDN — external src URLs are silently stripped at
 * publish time. We replace external images with a placeholder that the user
 * can re-upload through bilibili's image button, preserving alt + a hint
 * data attribute so the source URL isn't lost.
 */
const ALLOWED_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "b", "em", "i", "u", "s", "del", "br", "hr",
  "a", "img", "figure", "figcaption", "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "data-bili-placeholder", "data-original-src"]),
  span: new Set(["style"]),
  code: new Set(["class"]),
};

const PLACEHOLDER_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">` +
      `<rect width="100%" height="100%" fill="#f1f2f3"/>` +
      `<text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#999" ` +
      `text-anchor="middle" dominant-baseline="middle">Re-upload to Bilibili CDN</text>` +
      `</svg>`,
  );

/** Whitelist HTML to the subset bilibili's column editor accepts. */
export function toBilibiliHtml(fullHtml: string): string {
  if (typeof window === "undefined") return fullHtml;

  const doc = new DOMParser().parseFromString(fullHtml, "text/html");
  const body = doc.body;
  if (!body) return fullHtml;

  const cleaned = sanitize(body);
  return cleaned.innerHTML;
}

export async function copyToBilibili(fullHtml: string): Promise<void> {
  const html = toBilibiliHtml(fullHtml);
  await copyHtml(html);
}

function sanitize(node: Element): HTMLElement {
  const out = document.createElement("div");
  for (const child of Array.from(node.childNodes)) {
    const c = sanitizeNode(child);
    if (c) out.appendChild(c);
  }
  return out;
}

function sanitizeNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // Drop the wrapper but keep the children (e.g. unwrap divs, sections).
    const frag = document.createDocumentFragment();
    for (const child of Array.from(el.childNodes)) {
      const c = sanitizeNode(child);
      if (c) frag.appendChild(c);
    }
    return frag.childNodes.length ? frag : null;
  }

  const fresh = document.createElement(tag);
  const allowed = ALLOWED_ATTRS[tag];
  if (allowed) {
    for (const attr of Array.from(el.attributes)) {
      if (allowed.has(attr.name)) fresh.setAttribute(attr.name, attr.value);
    }
  }

  if (tag === "a") {
    const href = fresh.getAttribute("href") ?? "";
    // Bilibili scrubs javascript: schemes anyway, but strip defensively.
    if (/^javascript:/i.test(href)) fresh.removeAttribute("href");
  }

  if (tag === "code") {
    // Keep only `language-*` classes; bilibili strips arbitrary classes
    // server-side but the language hint can influence syntax styling.
    const cls = fresh.getAttribute("class") ?? "";
    const langOnly = cls
      .split(/\s+/)
      .filter((c) => /^language-[\w-]+$/.test(c))
      .join(" ");
    if (langOnly) fresh.setAttribute("class", langOnly);
    else fresh.removeAttribute("class");
  }

  if (tag === "img") {
    const src = fresh.getAttribute("src") ?? "";
    if (!isBilibiliCdn(src)) {
      fresh.setAttribute("data-original-src", src);
      fresh.setAttribute("data-bili-placeholder", "true");
      fresh.setAttribute("src", PLACEHOLDER_SRC);
    }
  }

  for (const child of Array.from(el.childNodes)) {
    const c = sanitizeNode(child);
    if (c) fresh.appendChild(c);
  }
  return fresh;
}

function isBilibiliCdn(src: string): boolean {
  return /^https?:\/\/[^/]*(?:hdslb\.com|bilibili\.com)\//i.test(src);
}
