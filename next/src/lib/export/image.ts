"use client";

import { domToBlob, waitUntilLoad } from "modern-screenshot";
import { copyImage } from "./clipboard";

export type ImageOpts = {
  scale?: number;
  type?: "image/png" | "image/jpeg" | "image/webp";
  backgroundColor?: string;
  /**
   * Maximum height in CSS pixels for the captured area.
   * Defaults to (16000 / scale) — the upper bound most browsers accept
   * for a single canvas / SVG foreignObject.
   */
  maxHeight?: number;
};

const NEXT_FRAME = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Wait until everything inside the iframe document is reasonably stable:
 * fonts loaded, images decoded, stylesheets applied, and Tailwind Play CDN
 * (which injects styles asynchronously) has had a chance to flush.
 */
async function waitForDocumentReady(doc: Document, win: Window): Promise<void> {
  if (doc.readyState !== "complete") {
    await new Promise<void>((res) => {
      const done = () => res();
      doc.addEventListener("readystatechange", () => {
        if (doc.readyState === "complete") done();
      });
      win.addEventListener?.("load", done, { once: true });
      setTimeout(done, 8000);
    });
  }

  const sheets = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  );
  await Promise.all(
    sheets.map(
      (link) =>
        new Promise<void>((res) => {
          if (link.sheet) return res();
          const done = () => res();
          link.addEventListener("load", done, { once: true });
          link.addEventListener("error", done, { once: true });
          setTimeout(done, 6000);
        }),
    ),
  );

  try {
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    /* noop */
  }

  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete && img.naturalWidth > 0) return res();
          const done = () => res();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          if ("decode" in img) img.decode().then(done, done);
          setTimeout(done, 6000);
        }),
    ),
  );

  try {
    await waitUntilLoad(doc.documentElement, { timeout: 6000 });
  } catch {
    /* noop */
  }

  // Tailwind Play CDN injects styles async; give it two frames + a small
  // idle window so utilities are applied before we measure layout.
  await NEXT_FRAME();
  await sleep(120);
  await NEXT_FRAME();
}

function resolveBackground(doc: Document, win: Window, override?: string): string {
  if (override) return override;
  const tryColor = (c?: string | null) => {
    if (!c) return null;
    const v = c.trim();
    if (!v || v === "transparent" || v === "rgba(0, 0, 0, 0)") return null;
    return v;
  };
  try {
    const bodyInline = tryColor(doc.body?.style.backgroundColor);
    if (bodyInline) return bodyInline;
    const bodyComputed = tryColor(win.getComputedStyle(doc.body).backgroundColor);
    if (bodyComputed) return bodyComputed;
    const htmlComputed = tryColor(
      win.getComputedStyle(doc.documentElement).backgroundColor,
    );
    if (htmlComputed) return htmlComputed;
  } catch {
    /* cross-origin or detached doc */
  }
  return "#ffffff";
}

function fullScrollHeight(doc: Document): number {
  const b = doc.body;
  const h = doc.documentElement;
  return Math.max(
    b?.scrollHeight ?? 0,
    b?.offsetHeight ?? 0,
    h?.scrollHeight ?? 0,
    h?.offsetHeight ?? 0,
    h?.clientHeight ?? 0,
  );
}

/** Render a DOM node to a Blob. Used for standalone elements; for iframes prefer {@link iframeToBlob}. */
export async function nodeToBlob(node: HTMLElement, opts: ImageOpts = {}): Promise<Blob> {
  const blob = await domToBlob(node, {
    scale: opts.scale ?? 2,
    type: opts.type ?? "image/png",
    backgroundColor: opts.backgroundColor,
  });
  if (!blob) throw new Error("screenshot failed");
  return blob;
}

/**
 * Render the contents of an <iframe> (built from srcdoc) to a PNG blob.
 *
 * Strategy (matters — the obvious approaches all break in subtle ways):
 *
 *   1. Wait for fonts / images / stylesheets / Tailwind CDN before measuring.
 *   2. Temporarily resize the iframe element to its content's full height so
 *      the browser lays out the entire page at the iframe's *natural* width.
 *      The iframe sits inside an `overflow:hidden` panel, so the user never
 *      sees this resize; meanwhile the layout we capture is byte-identical
 *      to the live preview (no subpixel-width drift, no off-by-one wrap).
 *   3. Use `documentElement.clientWidth` for the screenshot width — that's
 *      the exact viewport the browser used when measuring text. Using
 *      `scrollWidth` here causes a 1–2px drift that wraps Chinese titles to
 *      a new line and shoves them under the body text.
 *   4. Pass explicit width/height to modern-screenshot so the foreignObject
 *      SVG matches the laid-out size 1:1.
 */
export async function iframeToBlob(
  iframe: HTMLIFrameElement,
  opts: ImageOpts = {},
): Promise<Blob> {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) throw new Error("iframe not ready");

  await waitForDocumentReady(doc, win);

  // Snapshot inline styles we'll restore after the screenshot.
  const prevIframeHeight = iframe.style.height;
  const prevDocOverflow = doc.documentElement.style.overflow;
  const prevBodyOverflow = doc.body.style.overflow;

  // Force iframe to its content height so layout is fully resolved with no
  // hidden scroll regions. Parent has overflow:hidden so this is invisible.
  const fullHeight = fullScrollHeight(doc);
  if (!fullHeight) throw new Error("preview has no content yet");
  iframe.style.height = `${fullHeight}px`;
  doc.documentElement.style.overflow = "visible";
  doc.body.style.overflow = "visible";

  // Wait a couple of frames for the browser to re-flow at the new size.
  await NEXT_FRAME();
  await sleep(60);
  await NEXT_FRAME();

  try {
    const layoutWidth =
      doc.documentElement.clientWidth ||
      iframe.clientWidth ||
      doc.body.scrollWidth;
    const layoutHeight = fullScrollHeight(doc);

    const scale = opts.scale ?? 2;
    const safeMax = opts.maxHeight ?? Math.floor(16000 / scale);
    const captureHeight = Math.min(layoutHeight, safeMax);

    const backgroundColor = resolveBackground(doc, win, opts.backgroundColor);

    const blob = await domToBlob(doc.documentElement as unknown as HTMLElement, {
      scale,
      type: opts.type ?? "image/png",
      backgroundColor,
      width: layoutWidth,
      height: captureHeight,
      fetch: {
        requestInit: { cache: "force-cache" },
      },
    });
    if (!blob) throw new Error("screenshot failed");
    return blob;
  } finally {
    iframe.style.height = prevIframeHeight;
    doc.documentElement.style.overflow = prevDocOverflow;
    doc.body.style.overflow = prevBodyOverflow;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyIframeToClipboard(iframe: HTMLIFrameElement): Promise<void> {
  const blob = await iframeToBlob(iframe);
  await copyImage(blob);
}

export async function downloadIframeAsImage(
  iframe: HTMLIFrameElement,
  basename = "html-anything",
): Promise<void> {
  const blob = await iframeToBlob(iframe);
  downloadBlob(blob, `${basename}-${Date.now()}.png`);
}
