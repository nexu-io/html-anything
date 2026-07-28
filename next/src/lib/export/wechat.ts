"use client";

import juice from "juice";
import { copyHtml } from "./clipboard";

/**
 * WeChat MP paste: WeChat strips every `<style>` tag and external stylesheet,
 * keeping only inline `style=""`. Templates here ship Tailwind via the Play
 * CDN, whose rules are injected at runtime by JS — so static `<style>`-based
 * inlining (juice alone) sees nothing and the paste loses all styling.
 *
 * Fix: render the document in a hidden iframe so Tailwind/CDN/fonts actually
 * apply, walk `getComputedStyle` onto each element's inline style, then
 * serialize. Falls back to the static juice path if the iframe walk fails.
 */

// Properties whose computed value we copy onto inline `style`. Longhand only
// (getComputedStyle returns longhand). Covers typography, box model, color,
// background, border, flex/grid layout, and effects — enough for article /
// deck / poster fidelity in WeChat's editor.
const INLINE_PROPS = [
  "color", "background-color",
  "font-family", "font-size", "font-weight", "font-style", "line-height",
  "letter-spacing", "word-spacing", "text-align", "text-decoration",
  "text-transform", "text-indent", "white-space", "word-break", "writing-mode",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-top-style", "border-top-color",
  "border-right-width", "border-right-style", "border-right-color",
  "border-bottom-width", "border-bottom-style", "border-bottom-color",
  "border-left-width", "border-left-style", "border-left-color",
  "border-top-left-radius", "border-top-right-radius",
  "border-bottom-right-radius", "border-bottom-left-radius",
  "width", "height", "max-width", "min-width", "max-height", "min-height",
  "box-sizing",
  "display", "flex-direction", "flex-wrap", "justify-content", "align-items",
  "align-self", "align-content", "flex-grow", "flex-shrink", "flex-basis",
  "gap", "row-gap", "column-gap", "order",
  "position", "top", "right", "bottom", "left", "z-index", "float", "clear",
  "overflow", "overflow-x", "overflow-y", "vertical-align",
  "opacity", "box-shadow", "text-shadow", "transform", "filter",
];

// Values that carry no visual information (they're the UA default). Skipping
// them keeps the inlined HTML from ballooning. "none" is skipped here too —
// losing a `display:none` on a hidden node is an acceptable trade for the
// size win, and WeChat content rarely hides nodes.
const SKIP_DEFAULTS = new Set([
  "", "initial", "inherit", "normal", "none", "0", "0px", "auto",
  "rgba(0, 0, 0, 0)", "transparent", "0%", "repeat",
]);

function isHidden(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.style.display === "none" || el.hidden;
}

function inlineComputedStyles(doc: Document, win: Window): void {
  const els = [doc.body, ...Array.from(doc.body?.querySelectorAll<HTMLElement>("*") ?? [])];
  for (const el of els) {
    if (!el || isHidden(el)) continue;
    let cs: CSSStyleDeclaration;
    try {
      cs = win.getComputedStyle(el);
    } catch {
      continue;
    }
    for (const prop of INLINE_PROPS) {
      let value: string;
      try {
        value = cs.getPropertyValue(prop);
      } catch {
        continue;
      }
      if (!value || SKIP_DEFAULTS.has(value.trim())) continue;
      el.style.setProperty(prop, value);
    }
  }
}

async function waitUntilRendered(doc: Document, win: Window): Promise<void> {
  if (doc.readyState !== "complete") {
    await new Promise<void>((res) => {
      const done = () => res();
      doc.addEventListener("readystatechange", () => {
        if (doc.readyState === "complete") done();
      });
      win.addEventListener?.("load", done, { once: true });
      setTimeout(done, 6000);
    });
  }
  // Let Tailwind Play CDN (which injects styles async) flush two frames.
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  await new Promise<void>((r) => setTimeout(r, 200));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  try {
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    /* noop */
  }
}

/**
 * Render `fullHtml` in a hidden iframe, copy computed styles inline, and
 * return a WeChat-pasteable `<section>`. Throws only if no DOM is available
 * (SSR); callers should fall back to {@link toWechatHtml}.
 */
export async function renderToWechatHtml(fullHtml: string): Promise<string> {
  if (typeof window === "undefined") return toWechatHtml(fullHtml);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.cssText = "position:fixed;left:-99999px;top:0;width:1280px;height:800px;border:0;";
  iframe.setAttribute("srcdoc", fullHtml);
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((res) => {
      const done = () => res();
      iframe.addEventListener("load", done, { once: true });
      setTimeout(done, 8000);
    });
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win || !doc.body) return toWechatHtml(fullHtml);

    await waitUntilRendered(doc, win);
    inlineComputedStyles(doc, win);

    const wrap = document.createElement("div");
    wrap.innerHTML = doc.body.innerHTML;
    Array.from(wrap.children).forEach((child) => {
      child.setAttribute("data-tool", "html-anything");
    });
    return `<section data-tool="html-anything">${wrap.innerHTML}</section>`;
  } catch {
    return toWechatHtml(fullHtml);
  } finally {
    iframe.remove();
  }
}

/**
 * Sync fallback: inline static `<style>` rules via juice only. Used when the
 * computed-style iframe walk is unavailable (SSR) or fails. For Tailwind-CDN
 * templates this loses styling — prefer {@link renderToWechatHtml}.
 */
export function toWechatHtml(fullHtml: string): string {
  if (typeof window === "undefined") return fullHtml;

  const doc = new DOMParser().parseFromString(fullHtml, "text/html");
  const styles: string[] = [];
  doc.querySelectorAll("style").forEach((s) => {
    styles.push(s.textContent ?? "");
  });
  const css = styles.join("\n");
  const bodyHtml = doc.body?.innerHTML ?? fullHtml;

  const wrap = document.createElement("div");
  wrap.innerHTML = bodyHtml;
  Array.from(wrap.children).forEach((child) => {
    child.setAttribute("data-tool", "html-anything");
  });
  const tagged = wrap.innerHTML;

  let inlined: string;
  try {
    inlined = juice.inlineContent(tagged, css, {
      inlinePseudoElements: true,
      preserveImportant: true,
    });
  } catch {
    inlined = tagged;
  }
  return `<section data-tool="html-anything">${inlined}</section>`;
}

export async function copyToWechat(fullHtml: string): Promise<void> {
  const html = await renderToWechatHtml(fullHtml);
  await copyHtml(html);
}
