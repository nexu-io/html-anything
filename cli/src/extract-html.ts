/**
 * Extract HTML from agent output — adapted from next/src/lib/extract-html.ts
 */

export function extractHtml(streamed: string): string {
  if (!streamed) return "";

  const fence = streamed.match(/```(?:html|HTML)?\s*([\s\S]*?)```/);
  if (fence) {
    const inner = fence[1].trim();
    if (inner.startsWith("<")) return inner;
  }

  const doctypeStart = streamed.search(/<!DOCTYPE\s+html/i);
  if (doctypeStart !== -1) {
    const closeIdx = streamed.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(doctypeStart, closeIdx + "</html>".length);
    }
    return streamed.slice(doctypeStart);
  }

  const htmlStart = streamed.search(/<html[\s>]/i);
  if (htmlStart !== -1) {
    const closeIdx = streamed.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(htmlStart, closeIdx + "</html>".length);
    }
    return streamed.slice(htmlStart);
  }

  if (streamed.trimStart().startsWith("<")) {
    return streamed;
  }

  return "";
}