"use client";

import { toWechatHtml } from "./wechat";
import { copyHtml } from "./clipboard";

/**
 * Zhihu accepts the same kind of inlined HTML as WeChat, but math expressions
 * need <img data-eeimg="true" alt="LATEX">. We strip MathJax containers and replace.
 */
export function toZhihuHtml(fullHtml: string): string {
  let html = toWechatHtml(fullHtml);

  // Replace any mjx-container with the data-eeimg image markup
  html = html.replace(
    /<mjx-container[^>]*?>([\s\S]*?)<\/mjx-container>/g,
    (_full, inner) => {
      const tex = (inner.match(/aria-label="([^"]*)"/) ?? [])[1] ??
        (inner.match(/<math[^>]*?>([\s\S]*?)<\/math>/) ?? [])[1] ??
        "";
      const safe = tex.replace(/"/g, "&quot;");
      return `<img class="Formula-image" data-eeimg="true" src="" alt="${safe}">`;
    },
  );

  return html;
}

export async function copyToZhihu(fullHtml: string): Promise<void> {
  const html = toZhihuHtml(fullHtml);
  await copyHtml(html);
}
