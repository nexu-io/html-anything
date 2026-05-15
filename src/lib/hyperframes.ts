/**
 * Hyperframes mode helpers.
 *
 * The `video-hyperframes` skill (see
 * `src/lib/templates/skills/video-hyperframes/SKILL.md`) emits a document with
 *
 *   <section class="frame" data-duration="3000"> … </section>
 *   …
 *   <!-- HYPERFRAMES_META: {"frames":[{"i":1,"duration":3000,...}, …]} -->
 *
 * This module extracts the per-frame body + the META JSON so an exporter can
 * stamp out a Remotion project (one component per frame).
 */
export type HyperframeMetaEntry = {
  i: number;
  duration: number;
  transition?: string;
  scene?: string;
};

export type HyperFrame = {
  /** 1-based index from META, or DOM order */
  i: number;
  /** ms */
  duration: number;
  transition: string;
  scene: string;
  /** Inner HTML of the <section class="frame"> (no wrapper) */
  innerHtml: string;
  /** Best-effort background colour from inline style */
  bg?: string;
};

export type HyperframesParsed = {
  isHyperframes: boolean;
  frames: HyperFrame[];
  /** Original `<head>` contents (Tailwind CDN, fonts, inline <style>) */
  head: string;
  /** Body classes/style — re-applied to each frame component wrapper */
  bodyClass: string;
  bodyStyle: string;
  /** Document title for filenames */
  title: string;
  /** Source META JSON, if present */
  metaJson: string;
};

const FRAME_RE =
  /<section\b[^>]*\bclass\s*=\s*["'][^"']*\bframe\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi;
const META_RE = /<!--\s*HYPERFRAMES_META\s*:\s*([\s\S]*?)-->/i;

/** Cheap test — true if the document looks like a Hyperframes video. */
export function isHyperframes(html: string): boolean {
  if (!html) return false;
  FRAME_RE.lastIndex = 0;
  return FRAME_RE.test(html);
}

function pick(re: RegExp, src: string): string {
  const m = re.exec(src);
  return m ? m[1] : "";
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttr(tag: string, name: string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i");
  return pick(re, tag);
}

function parseMeta(html: string): { json: string; entries: HyperframeMetaEntry[] } {
  const raw = pick(META_RE, html).trim();
  if (!raw) return { json: "", entries: [] };
  try {
    const parsed = JSON.parse(raw) as { frames?: HyperframeMetaEntry[] };
    if (!parsed || !Array.isArray(parsed.frames)) return { json: raw, entries: [] };
    return { json: raw, entries: parsed.frames };
  } catch {
    // META is best-effort — agents sometimes emit slightly invalid JSON. We
    // fall back to per-frame `data-duration` / inline-comment markers.
    return { json: raw, entries: [] };
  }
}

/**
 * Pull duration / transition out of the inline `<!-- frame:N duration:3000
 * transition:fade -->` marker the skill plants at the bottom of each section.
 */
function parseInlineMarker(innerHtml: string): { duration?: number; transition?: string } {
  const m = /<!--\s*frame\s*:\s*\d+\s+duration\s*:\s*(\d+)(?:\s+transition\s*:\s*(\w+))?\s*-->/i.exec(
    innerHtml,
  );
  if (!m) return {};
  return { duration: Number(m[1]) || undefined, transition: m[2] };
}

/**
 * Parse a full Hyperframes HTML doc.
 * No-op + isHyperframes:false when the doc has no `<section class="frame">`.
 */
export function parseHyperframes(fullHtml: string): HyperframesParsed {
  const empty: HyperframesParsed = {
    isHyperframes: false,
    frames: [],
    head: "",
    bodyClass: "",
    bodyStyle: "",
    title: "hyperframes",
    metaJson: "",
  };
  if (!isHyperframes(fullHtml)) return empty;

  const head = pick(/<head\b[^>]*>([\s\S]*?)<\/head>/i, fullHtml);
  const bodyTag = pick(/<body\b([^>]*)>/i, fullHtml);
  const bodyClass = extractAttr(bodyTag, "class");
  const bodyStyle = extractAttr(bodyTag, "style");
  const title = stripTags(pick(/<title\b[^>]*>([\s\S]*?)<\/title>/i, head)) || "hyperframes";

  const { json: metaJson, entries } = parseMeta(fullHtml);
  const metaByIndex = new Map<number, HyperframeMetaEntry>();
  for (const e of entries) metaByIndex.set(e.i, e);

  const frames: HyperFrame[] = [];
  FRAME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = FRAME_RE.exec(fullHtml))) {
    idx += 1;
    const openTag = pick(/<section\b[^>]*>/i, m[0]);
    const dataDur = Number(extractAttr(openTag, "data-duration")) || undefined;
    const dataTransition = extractAttr(openTag, "data-transition") || undefined;
    const inlineStyle = extractAttr(openTag, "style");
    const bg = pick(/background(?:-color)?\s*:\s*([^;"']+)/i, inlineStyle).trim() || undefined;

    const innerHtml = m[1];
    const marker = parseInlineMarker(innerHtml);
    const meta = metaByIndex.get(idx);

    // Priority: META JSON > data-* attributes > inline comment > default
    const duration = meta?.duration ?? dataDur ?? marker.duration ?? 3000;
    const transition = meta?.transition ?? dataTransition ?? marker.transition ?? "fade";
    const scene = meta?.scene ?? "";

    frames.push({
      i: idx,
      duration,
      transition,
      scene,
      innerHtml,
      bg,
    });
  }

  return {
    isHyperframes: frames.length > 0,
    frames,
    head,
    bodyClass,
    bodyStyle,
    title,
    metaJson,
  };
}
