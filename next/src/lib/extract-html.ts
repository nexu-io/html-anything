/**
 * Pulls the actual HTML document out of an agent's possibly chatty response.
 * Agents sometimes wrap output in ```html ... ``` fences or prepend explanation.
 */
export function extractHtml(streamed: string): string {
  if (!streamed) return "";

  // 1. Strip leading ```html fence (and trailing ```)
  const fence = streamed.match(/```(?:html|HTML)?\s*([\s\S]*?)```/);
  if (fence) {
    const inner = fence[1].trim();
    if (inner.startsWith("<")) return inner;
  }

  // 2. Find <!DOCTYPE html ... </html>
  const doctypeStart = streamed.search(/<!DOCTYPE\s+html/i);
  if (doctypeStart !== -1) {
    const closeIdx = streamed.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(doctypeStart, closeIdx + "</html>".length);
    }
    // streaming, partial — return from doctype to end
    return streamed.slice(doctypeStart);
  }

  // 3. Find <html> ... </html>
  const htmlStart = streamed.search(/<html[\s>]/i);
  if (htmlStart !== -1) {
    const closeIdx = streamed.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(htmlStart, closeIdx + "</html>".length);
    }
    return streamed.slice(htmlStart);
  }

  // 4. If it begins with < (root element), trust it
  if (streamed.trimStart().startsWith("<")) {
    return streamed;
  }

  // 5. Wrap whatever we got in a minimal scaffold so something renders
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 font-sans"><pre class="whitespace-pre-wrap">${escape(
    streamed,
  )}</pre></body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function injectPreviewBase(html: string, baseHref?: string): string {
  if (baseHref === undefined) return html;

  const base = `<base href="${escapeAttribute(baseHref)}">`;
  const documentTags = scanDocumentTags(html);
  if (documentTags.headContentStart !== undefined) {
    const offset = documentTags.headContentStart;
    return html.slice(0, offset) + base + html.slice(offset);
  }

  if (documentTags.htmlContentStart === undefined) return html;
  const offset = documentTags.htmlContentStart;
  return html.slice(0, offset) + `<head>${base}</head>` + html.slice(offset);
}

export function extractDocumentHead(html: string): string {
  const documentTags = scanDocumentTags(html);
  if (
    documentTags.headContentStart === undefined ||
    documentTags.headContentEnd === undefined
  ) {
    return "";
  }
  return html.slice(
    documentTags.headContentStart,
    documentTags.headContentEnd,
  );
}

type DocumentTags = {
  htmlContentStart?: number;
  headContentStart?: number;
  headContentEnd?: number;
};

type ParsedTag = {
  name: string;
  start: number;
  end: number;
  closing: boolean;
};

const RAW_TEXT_ELEMENTS = new Set([
  "iframe",
  "noembed",
  "noframes",
  // Both preview iframe paths enable scripts, so noscript tokenizes as raw text.
  "noscript",
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
]);

const HEAD_CONTENT_ELEMENTS = new Set([
  "base",
  "basefont",
  "bgsound",
  "link",
  "meta",
  "noembed",
  "noframes",
  "noscript",
  "script",
  "style",
  "template",
  "title",
]);

const HEAD_CLOSING_END_TAGS = new Set(["body", "br", "html"]);

function scanDocumentTags(html: string): DocumentTags {
  const found: DocumentTags = {};
  let bodyStarted = false;
  let offset = 0;

  while (offset < html.length) {
    const tagStart = html.indexOf("<", offset);
    if (tagStart === -1) break;

    if (
      found.headContentStart !== undefined &&
      found.headContentEnd === undefined
    ) {
      const bodyTextStart = firstNonWhitespace(html, offset, tagStart);
      if (bodyTextStart !== -1) {
        found.headContentEnd = bodyTextStart;
        bodyStarted = true;
      }
    }

    if (html.startsWith("<!--", tagStart)) {
      const commentEnd = findCommentEnd(html, tagStart);
      if (commentEnd === -1) break;
      offset = commentEnd;
      continue;
    }
    if (startsWithIgnoreCase(html, "<![CDATA[", tagStart)) {
      const cdataEnd = html.indexOf("]]>", tagStart + 9);
      if (cdataEnd === -1) break;
      offset = cdataEnd + 3;
      continue;
    }
    if (html.startsWith("<!", tagStart) || html.startsWith("<?", tagStart)) {
      const declarationEnd = findMarkupEnd(html, tagStart + 2, true);
      if (declarationEnd === -1) break;
      offset = declarationEnd;
      continue;
    }

    const parsed = parseTag(html, tagStart);
    if (parsed === "incomplete") break;
    if (parsed === null) {
      offset = tagStart + 1;
      continue;
    }

    const headOpen =
      found.headContentStart !== undefined &&
      found.headContentEnd === undefined;
    if (parsed.closing) {
      if (headOpen && parsed.name === "head") {
        found.headContentEnd = parsed.start;
      } else if (headOpen && HEAD_CLOSING_END_TAGS.has(parsed.name)) {
        found.headContentEnd = parsed.start;
        bodyStarted = true;
      }
      offset = parsed.end;
      continue;
    }

    if (
      headOpen &&
      parsed.name !== "head" &&
      parsed.name !== "html" &&
      !HEAD_CONTENT_ELEMENTS.has(parsed.name)
    ) {
      found.headContentEnd = parsed.start;
      bodyStarted = true;
    }

    if (parsed.name === "html" && found.htmlContentStart === undefined) {
      found.htmlContentStart = parsed.end;
    } else if (parsed.name === "head" && !bodyStarted) {
      found.headContentStart ??= parsed.end;
    } else if (parsed.name === "body") {
      bodyStarted = true;
    }

    if (parsed.name === "plaintext") break;
    if (RAW_TEXT_ELEMENTS.has(parsed.name)) {
      const closeStart = findRawTextClose(html, parsed.name, parsed.end);
      if (closeStart === -1) break;
      offset = closeStart;
    } else {
      offset = parsed.end;
    }
  }

  return found;
}

function firstNonWhitespace(html: string, start: number, end: number): number {
  for (let offset = start; offset < end; offset += 1) {
    if (!isHtmlWhitespace(html[offset])) return offset;
  }
  return -1;
}

function parseTag(html: string, start: number): ParsedTag | "incomplete" | null {
  let offset = start + 1;
  const closing = html[offset] === "/";
  if (closing) offset += 1;
  const nameStart = offset;
  while (offset < html.length && isTagNameCharacter(html[offset])) offset += 1;
  if (offset === nameStart) return null;
  const end = findMarkupEnd(html, offset, false);
  if (end === -1) return "incomplete";
  return {
    name: html.slice(nameStart, offset).toLowerCase(),
    start,
    end,
    closing,
  };
}

function findMarkupEnd(
  html: string,
  start: number,
  trackDeclarationSubset: boolean,
): number {
  let quote: '"' | "'" | undefined;
  let subsetDepth = 0;
  for (let offset = start; offset < html.length; offset += 1) {
    const character = html[offset];
    if (quote !== undefined) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (trackDeclarationSubset && character === "[") {
      subsetDepth += 1;
    } else if (trackDeclarationSubset && character === "]" && subsetDepth > 0) {
      subsetDepth -= 1;
    } else if (character === ">" && subsetDepth === 0) {
      return offset + 1;
    }
  }
  return -1;
}

function findRawTextClose(html: string, name: string, start: number): number {
  const lower = html.toLowerCase();
  if (name === "script") return findScriptClose(lower, start);
  const needle = `</${name}`;
  let offset = lower.indexOf(needle, start);
  while (offset !== -1) {
    const boundary = html[offset + needle.length];
    if (boundary === ">" || boundary === "/" || isHtmlWhitespace(boundary)) {
      return offset;
    }
    offset = lower.indexOf(needle, offset + needle.length);
  }
  return -1;
}

function findCommentEnd(html: string, start: number): number {
  if (html[start + 4] === ">") return start + 5;
  if (html.startsWith("->", start + 4)) return start + 6;
  const standard = html.indexOf("-->", start + 4);
  const alternate = html.indexOf("--!>", start + 4);
  if (standard === -1) return alternate === -1 ? -1 : alternate + 4;
  if (alternate === -1) return standard + 3;
  return standard < alternate ? standard + 3 : alternate + 4;
}

function findScriptClose(lowerHtml: string, start: number): number {
  let state: "data" | "escaped" | "double-escaped" = "data";
  let offset = start;
  while (offset < lowerHtml.length) {
    if (lowerHtml.startsWith("-->", offset) && state !== "data") {
      state = "data";
      offset += 3;
      continue;
    }
    if (state === "data" && lowerHtml.startsWith("<!--", offset)) {
      state = "escaped";
      offset += 4;
      continue;
    }
    if (
      state === "escaped" &&
      lowerHtml.startsWith("<script", offset) &&
      hasRawTextBoundary(lowerHtml[offset + "<script".length])
    ) {
      state = "double-escaped";
      offset += "<script".length;
      continue;
    }
    if (
      lowerHtml.startsWith("</script", offset) &&
      hasRawTextBoundary(lowerHtml[offset + "</script".length])
    ) {
      if (state !== "double-escaped") return offset;
      state = "escaped";
      offset += "</script".length;
      continue;
    }
    offset += 1;
  }
  return -1;
}

function hasRawTextBoundary(character: string | undefined): boolean {
  return character === ">" || character === "/" || isHtmlWhitespace(character);
}

function startsWithIgnoreCase(html: string, token: string, at: number): boolean {
  return html.slice(at, at + token.length).toLowerCase() === token.toLowerCase();
}

function isTagNameCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9:-]/u.test(character);
}

function isHtmlWhitespace(character: string | undefined): boolean {
  return character !== undefined && /[\t\n\f\r ]/u.test(character);
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/"/gu, "&quot;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;");
}

/**
 * For previews while the stream is still arriving — make sure we always
 * produce a closing </body></html> so the iframe can render incrementally.
 */
export function previewHtml(streamed: string): string {
  const html = extractHtml(streamed);
  if (!html) return "";
  if (/<\/html>/i.test(html)) return html;
  return html + "\n</body>\n</html>";
}
