"use client";

/**
 * Export the iframe contents as a PDF via the browser's native print dialog.
 *
 * Opens the HTML in a new window styled for A4 printing, then triggers
 * "Save as PDF". This gives vector text, proper CSS page breaks, and
 * correct pagination — much better than rasterizing to a PNG first.
 */
export function exportIframeAsPdf(
  iframe: HTMLIFrameElement,
  title = "html-anything",
): void {
  const doc = iframe.contentDocument;
  if (!doc) throw new Error("preview not ready");

  const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(doc.documentElement.outerHTML);
  const head = headMatch ? headMatch[1] : "";
  const body = doc.body.innerHTML;

  const w = window.open("", "_blank");
  if (!w) throw new Error("popup blocked — allow popups to print/PDF");

  w.document.open();
  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
${head}
<style>
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0; padding: 15mm;
    font-size: 12pt; line-height: 1.6;
    color: #000; background: #fff;
  }
  img { max-width: 100%; height: auto; }
  table { page-break-inside: avoid; }
  pre, blockquote { page-break-inside: avoid; }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  @media screen {
    body {
      max-width: 210mm; margin: 0 auto;
      padding: 15mm; box-shadow: 0 0 40px rgba(0,0,0,.12);
      background: #f5f5f5;
    }
  }
</style>
</head>
<body>
${body}
<script>
  function ready(cb) {
    if (document.readyState === 'complete') return cb();
    window.addEventListener('load', cb, { once: true });
  }
  ready(function () {
    setTimeout(function () { window.focus(); window.print(); }, 600);
  });
</script>
</body>
</html>`);
  w.document.close();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}
