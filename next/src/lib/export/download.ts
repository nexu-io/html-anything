"use client";

import { downloadBlob } from "./image";

export function downloadHtml(html: string, basename = "html-anything") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${basename}-${Date.now()}.html`);
}

export function downloadMarkdown(md: string, basename = "html-anything") {
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, `${basename}-${Date.now()}.md`);
}
