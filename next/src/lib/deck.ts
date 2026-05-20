/**
 * Deck mode helpers.
 *
 * The convention adopted by every deck skill (see
 * `src/lib/templates/skills/deck-<id>/SKILL.md`) is that each page is a top-level
 *
 *   <section class="slide" data-slide-id="N"> … </section>
 *
 * inside `<body>`. Optional speaker notes live in a `<aside class="notes">`
 * inside that section. This module extracts those sections and rebuilds each
 * one as a standalone HTML document so the deck viewer can render and
 * screenshot slides one-by-one.
 */
export type DeckSlide = {
  /** Standalone HTML doc (head + just-this-slide body) for srcdoc / screenshot */
  html: string;
  /** Speaker notes plain text, if any */
  notes: string;
  /** Slide id from data-slide-id, or 1-based index */
  id: string;
  /** Section's bg color (best-effort) for the strip thumbnail bg */
  bg?: string;
};

export type DeckParsed = {
  isDeck: boolean;
  slides: DeckSlide[];
  /** Original `<head>` (used to copy fonts, Tailwind CDN, custom <style>) */
  head: string;
  /** Body classes — copied so per-slide layout stays consistent */
  bodyClass: string;
  bodyStyle: string;
  /** Document title for filenames */
  title: string;
};

const SLIDE_RE = /<section\b[^>]*\bclass\s*=\s*["'][^"']*\bslide\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;

/** Cheap test — true if the document looks like a deck (has ≥1 `<section class="slide">`). */
export function isDeck(html: string): boolean {
  if (!html) return false;
  SLIDE_RE.lastIndex = 0;
  return SLIDE_RE.test(html);
}

function pick(re: RegExp, src: string): string {
  const m = re.exec(src);
  return m ? m[1] : "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function extractAttr(tag: string, name: string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i");
  return pick(re, tag);
}

/**
 * Parse a full deck HTML doc into per-slide standalone docs.
 * No-op + isDeck:false when the doc has no `<section class="slide">`.
 */
export function parseDeck(fullHtml: string): DeckParsed {
  const empty: DeckParsed = {
    isDeck: false,
    slides: [],
    head: "",
    bodyClass: "",
    bodyStyle: "",
    title: "deck",
  };
  if (!isDeck(fullHtml)) return empty;

  const head = pick(/<head\b[^>]*>([\s\S]*?)<\/head>/i, fullHtml);
  const bodyTag = pick(/<body\b([^>]*)>/i, fullHtml);
  const bodyClass = extractAttr(bodyTag, "class");
  const bodyStyle = extractAttr(bodyTag, "style");
  const title = stripTags(pick(/<title\b[^>]*>([\s\S]*?)<\/title>/i, head)) || "deck";

  const slides: DeckSlide[] = [];
  SLIDE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = SLIDE_RE.exec(fullHtml))) {
    idx += 1;
    const sectionHtml = m[0];
    const openTag = pick(/<section\b[^>]*>/i, sectionHtml);
    const dataId = extractAttr(openTag, "data-slide-id");
    const inlineStyle = extractAttr(openTag, "style");
    const bg = pick(/background(?:-color)?\s*:\s*([^;"']+)/i, inlineStyle).trim() || undefined;

    // Pull out speaker notes — show them in the notes panel, hide them in
    // the slide canvas (they're meant for the speaker, not the audience).
    let notes = "";
    const slideForRender = sectionHtml.replace(
      /<aside\b[^>]*\bclass\s*=\s*["'][^"']*\bnotes\b[^"']*["'][^>]*>([\s\S]*?)<\/aside>/i,
      (_full, inner: string) => {
        notes = stripTags(inner);
        return "";
      },
    );

    const standalone =
      `<!DOCTYPE html><html><head>${head}\n` +
      // Make a single slide fill the iframe regardless of the original page's
      // global flex / grid centering. Most deck templates already use
      // `.slide { width:1920px; height:1080px; transform: scale(...) }`,
      // so we just neutralize body padding and let the slide live alone.
      `<style>
  html, body { margin:0; padding:0; }
  body { display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .slide { transform-origin: center center !important; }
</style></head>` +
      `<body class="${bodyClass}" style="${bodyStyle}">${slideForRender}</body></html>`;

    slides.push({
      html: standalone,
      notes,
      id: dataId || String(idx),
      bg,
    });
  }

  return {
    isDeck: slides.length > 0,
    slides,
    head,
    bodyClass,
    bodyStyle,
    title,
  };
}
