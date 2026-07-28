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
 * Security shape (important): the live preview/deck iframes are sandboxed with
 * `allow-scripts` but NOT `allow-same-origin`, so agent-generated HTML runs in
 * an opaque origin and cannot reach parent.localStorage or call /api/* with the
 * host's credentials. That means we cannot read the live iframe's
 * contentDocument from here. Instead we read the `srcdoc` attribute — which the
 * parent set and therefore still owns regardless of the iframe's origin — and
 * render it into a throwaway offscreen iframe that IS same-origin, snapshot,
 * then remove it. That ephemeral snapshot is the only iframe that briefly
 * shares the host origin, and only during an explicit user-initiated export.
 *
 * Layout-fidelity strategy (still matters):
 *   1. Wait for fonts / images / stylesheets / Tailwind CDN before measuring.
 *   2. Size the snapshot iframe to its content's full height so the browser
 *      lays out the entire page at the preview's natural width.
 *   3. Use `documentElement.clientWidth` for the screenshot width — using
 *      `scrollWidth` causes a 1-2px drift that wraps Chinese titles.
 *   4. Pass explicit width/height to modern-screenshot so the foreignObject
 *      SVG matches the laid-out size 1:1.
 */
export async function iframeToBlob(
  iframe: HTMLIFrameElement,
  opts: ImageOpts = {},
): Promise<Blob> {
  const srcdoc = iframe.getAttribute("srcdoc");
  if (!srcdoc) throw new Error("preview has no content yet");

  const width = iframe.clientWidth || 1280;
  const snap = document.createElement("iframe");
  snap.setAttribute("sandbox", "allow-scripts allow-same-origin");
  snap.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:720px;border:0;`;
  snap.setAttribute("srcdoc", srcdoc);
  document.body.appendChild(snap);

  try {
    // Let the srcdoc parse before reading its document.
    await new Promise<void>((res) => {
      const done = () => res();
      snap.addEventListener("load", done, { once: true });
      setTimeout(done, 8000);
    });
    const doc = snap.contentDocument;
    const win = snap.contentWindow;
    if (!doc || !win) throw new Error("snapshot iframe not ready");

    await waitForDocumentReady(doc, win);

    const fullHeight = fullScrollHeight(doc);
    if (!fullHeight) throw new Error("preview has no content yet");
    // Size the snapshot to the full content height so layout fully resolves.
    snap.style.height = `${fullHeight}px`;
    doc.documentElement.style.overflow = "visible";
    doc.body.style.overflow = "visible";

    // Wait a couple frames for the browser to re-flow at the new size.
    await NEXT_FRAME();
    await sleep(60);
    await NEXT_FRAME();

    const layoutWidth = doc.documentElement.clientWidth || width || doc.body.scrollWidth;
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
    snap.remove();
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
