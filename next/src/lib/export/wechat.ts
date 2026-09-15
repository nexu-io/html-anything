"use client";

import juice from "juice";
import { copyHtmlWhenReady } from "./clipboard";

/**
 * Clamp `margin` / `padding` to 48px. Poster- and deck-scale templates
 * routinely use 80-120px gutters that read as luxurious on a 1080 canvas
 * but blow up in WeChat's ~375-540px article flow. 48 ≈ 8px baseline × 6
 * lines — the comfortable max for mobile reading.
 */
const MAX_FLOW_SPACING_PX = 48;

const STYLE_PROPS = [
  "color",
  "background-color",
  "background-image",
  "background-position",
  "background-size",
  "background-repeat",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "text-transform",
  "white-space",
  "word-break",
  "overflow-wrap",
  "list-style-type",
  "list-style-position",
  "border-collapse",
  "box-shadow",
  "text-shadow",
  "opacity",
] as const;

/**
 * Take a full HTML document, extract <body> content, inline all CSS via juice,
 * and tag top-level children with data-tool="html-anything" so WeChat trusts the styles.
 * Returns the HTML to be pasted into WeChat editor.
 */
export function toWechatHtml(fullHtml: string): string {
  if (typeof window === "undefined") return fullHtml;

  const doc = new DOMParser().parseFromString(fullHtml, "text/html");

  // Collect all <style> contents + linked stylesheets we cannot follow.
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

/**
 * Export the rendered preview DOM. This preserves class/CDN/runtime styles by
 * reading computed styles from the browser before writing clipboard HTML.
 */
export function toWechatHtmlFromDocument(renderedDoc: Document): string {
  const body = renderedDoc.body;
  if (!body) return "";

  const view = renderedDoc.defaultView ?? window;
  const wrap = document.createElement("div");
  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      if (isComputedHidden(element, view)) continue;
    }
    const clone = child.cloneNode(true);
    if (child.nodeType === Node.ELEMENT_NODE && clone.nodeType === Node.ELEMENT_NODE) {
      inlineComputedTree(child as Element, clone as Element, view);
      (clone as Element).setAttribute("data-tool", "html-anything");
    }
    wrap.appendChild(clone);
  }

  const section = document.createElement("section");
  section.setAttribute("data-tool", "html-anything");
  const bodyStyle = computedStyleText(body, view, { skipMargin: true });
  if (bodyStyle) section.setAttribute("style", bodyStyle);
  section.innerHTML = wrap.innerHTML;
  return section.outerHTML;
}

/**
 * Render the complete source document in an offscreen iframe for every
 * toolbar WeChat export. This keeps Source/Log tabs and DeckViewer from
 * silently switching the export to a partial or unrendered document.
 */
export async function renderToWechatHtml(fullHtml: string): Promise<string> {
  if (typeof window === "undefined") return toWechatHtml(fullHtml);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.cssText =
    "position: fixed; left: 0; top: 0; width: 1280px; height: 960px; border: 0; opacity: 0; pointer-events: none; z-index: -2147483648;";
  iframe.srcdoc = fullHtml;
  document.body.appendChild(iframe);

  try {
    await waitForIframeLoad(iframe);
    const renderedDoc = iframe.contentDocument;
    if (!renderedDoc?.body) return toWechatHtml(fullHtml);
    await waitForDocumentReady(renderedDoc);
    return toWechatHtmlFromDocument(renderedDoc);
  } catch {
    return toWechatHtml(fullHtml);
  } finally {
    iframe.remove();
  }
}

export async function copyToWechat(fullHtml: string): Promise<void> {
  await copyHtmlWhenReady(renderToWechatHtml(fullHtml));
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeout = 0;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      iframe.removeEventListener("load", finish);
      resolve();
    };
    iframe.addEventListener("load", finish, { once: true });
    timeout = window.setTimeout(finish, 8000);
  });
}

async function waitForDocumentReady(doc: Document): Promise<void> {
  try {
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    // Font loading is best effort; computed styles are still useful without it.
  }

  const view = doc.defaultView ?? window;
  await nextFrame(view);
  await nextFrame(view);
  await new Promise<void>((resolve) => view.setTimeout(resolve, 50));

  for (const animation of doc.getAnimations?.() ?? []) {
    try {
      const timing = animation.effect?.getComputedTiming();
      if (Number.isFinite(Number(timing?.endTime))) animation.finish();
      animation.pause();
    } catch {
      // Infinite or script-controlled animations are sampled at their current state.
    }
  }
  await nextFrame(view);
}

function nextFrame(view: Window): Promise<void> {
  return new Promise((resolve) => view.requestAnimationFrame(() => resolve()));
}

function inlineComputedTree(source: Element, clone: Element, view: Window): void {
  if (isComputedHidden(source, view)) {
    clone.remove();
    return;
  }
  const styleText = computedStyleText(source, view);
  if (styleText) clone.setAttribute("style", styleText);
  materializePseudos(source, clone, view);

  // Pseudo-elements are materialized only in the clone, so global descendant
  // lists no longer have matching indexes. Recurse through real element
  // children in lockstep and ignore the generated pseudo spans when matching.
  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children).filter(
    (child) => !child.hasAttribute("data-pseudo"),
  );
  for (let i = 0; i < sourceChildren.length; i++) {
    const cloneChild = cloneChildren[i];
    if (cloneChild) inlineComputedTree(sourceChildren[i], cloneChild, view);
  }
}

function isComputedHidden(element: Element, view: Window): boolean {
  try {
    return view.getComputedStyle(element).display === "none";
  } catch {
    return false;
  }
}

/**
 * WeChat strips pseudo-elements entirely, and our computed-style walk only sees
 * real DOM nodes. Read ::before/::after from getComputedStyle and turn each into
 * a real <span> child so the rendered content (✓, Recommended badge, etc.) survives.
 */
function materializePseudos(source: Element, clone: Element, view: Window): void {
  const before = buildPseudoNode(source, view, "::before");
  if (before) clone.insertBefore(before, clone.firstChild);
  const after = buildPseudoNode(source, view, "::after");
  if (after) clone.appendChild(after);
}

function buildPseudoNode(source: Element, view: Window, pseudo: "::before" | "::after"): HTMLElement | null {
  let computed: CSSStyleDeclaration;
  try {
    computed = view.getComputedStyle(source, pseudo);
  } catch {
    return null;
  }
  const text = unquoteContent(computed.getPropertyValue("content").trim());
  if (text === null) return null;

  const span = document.createElement("span");
  span.setAttribute("data-pseudo", pseudo);
  if (text) span.textContent = text;
  const style = computedStyleText(source, view, { pseudoComputed: computed });
  if (style) span.setAttribute("style", style);
  return span;
}

/**
 * getComputedStyle returns `content` as a CSS token: a string literal (with quotes),
 * `none`, `normal`, or a function like `attr()` / `counter()` / `url()`. We only
 * materialize string-literal contents — anything else (including the no-content
 * sentinels) returns null so the pseudo is skipped.
 */
function unquoteContent(value: string): string | null {
  if (!value || value === "none" || value === "normal") return null;
  const match = value.match(/^"((?:[^"\\]|\\.)*)"$/) ?? value.match(/^'((?:[^'\\]|\\.)*)'$/);
  if (!match) return null;
  return match[1].replace(/\\(.)/g, "$1");
}

function computedStyleText(
  el: Element,
  view: Window,
  opts?: { skipMargin?: boolean; pseudoComputed?: CSSStyleDeclaration },
): string {
  let computed: CSSStyleDeclaration;
  if (opts?.pseudoComputed) {
    computed = opts.pseudoComputed;
  } else {
    try {
      computed = view.getComputedStyle(el);
    } catch {
      // Cross-origin frames or detached nodes throw here. Skip silently rather than abort the export.
      return "";
    }
  }
  const styles: string[] = [];

  addBox(styles, computed, "margin", opts?.skipMargin);
  addBox(styles, computed, "padding");
  addBorder(styles, computed);
  addBox(styles, computed, "border-radius");

  for (const prop of STYLE_PROPS) {
    addProp(styles, computed, prop);
  }

  return styles.join("; ");
}

function addProp(styles: string[], computed: CSSStyleDeclaration, prop: string): void {
  const value = computed.getPropertyValue(prop).trim();
  if (!shouldKeep(prop, value)) return;
  styles.push(`${prop}: ${value}`);
}

function addBox(
  styles: string[],
  computed: CSSStyleDeclaration,
  prefix: "margin" | "padding" | "border-radius",
  skip = false,
): void {
  if (skip) return;
  const keys =
    prefix === "border-radius"
      ? ["top-left", "top-right", "bottom-right", "bottom-left"].map((x) => `border-${x}-radius`)
      : ["top", "right", "bottom", "left"].map((x) => `${prefix}-${x}`);
  const values = keys.map((key) => normalizeBoxValue(prefix, computed.getPropertyValue(key).trim()));
  if (values.every((value) => !shouldKeep(prefix, value))) return;
  if (values.every((value) => value === values[0])) {
    styles.push(`${prefix}: ${values[0]}`);
    return;
  }
  keys.forEach((key, idx) => {
    if (shouldKeep(prefix, values[idx])) styles.push(`${key}: ${values[idx]}`);
  });
}

function addBorder(styles: string[], computed: CSSStyleDeclaration): void {
  for (const side of ["top", "right", "bottom", "left"]) {
    const width = computed.getPropertyValue(`border-${side}-width`).trim();
    const style = computed.getPropertyValue(`border-${side}-style`).trim();
    const color = computed.getPropertyValue(`border-${side}-color`).trim();
    if (!shouldKeep("border-width", width) || style === "none" || !style) continue;
    styles.push(`border-${side}: ${width} ${style} ${color}`);
  }
}

function shouldKeep(prop: string, value: string): boolean {
  if (!value) return false;
  if (value === "initial" || value === "inherit" || value === "unset") return false;
  if (prop.includes("color") && (value === "rgba(0, 0, 0, 0)" || value === "transparent")) return false;
  if (prop === "opacity" && (value === "1" || value === "1.0")) return false;
  if (prop.includes("shadow") && value === "none") return false;
  if (prop.includes("image") && value === "none") return false;
  if (prop.includes("radius") && isZero(value)) return false;
  if ((prop.includes("width") || prop.includes("height")) && value === "auto") return false;
  if ((prop === "margin" || prop === "padding") && isZero(value)) return false;
  if (prop.startsWith("border") && isZero(value)) return false;
  return true;
}

function normalizeBoxValue(prefix: "margin" | "padding" | "border-radius", value: string): string {
  if (prefix === "margin" && value.startsWith("-")) return "";
  if (prefix !== "margin" && prefix !== "padding") return value;

  const px = value.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (!px) return value;

  const n = Number(px[1]);
  if (n > MAX_FLOW_SPACING_PX) return `${MAX_FLOW_SPACING_PX}px`;
  return value;
}

function isZero(value: string): boolean {
  return /^0(?:px|em|rem|%)?(?:\s+0(?:px|em|rem|%)?){0,3}$/.test(value);
}
