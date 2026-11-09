import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fontAssets } from "./fonts.js";

/** Link precompiled public styles at build time; callers never author/inject runtime CSS. */
export async function documentStyles(options: {
  source: string;
  output: string;
  styles: readonly URL[];
  fonts?: readonly URL[];
}): Promise<void> {
  const html = await readFile(options.source, "utf8");
  if (html.split("</head>").length !== 2) throw new Error("HTML requires one closing head");
  if (!options.styles.length || options.styles.some((url) => url.protocol !== "file:"))
    throw new Error("styles must be local compiled public exports");
  if ((options.fonts?.length ?? 0) > 1) throw new Error("one font catalog per document is supported");
  const fontCSS: string[] = [];
  for (const url of options.fonts ?? []) {
    if (url.protocol !== "file:") throw new Error("font catalogs must be local");
    fontCSS.push(await fontAssets({ manifest: fileURLToPath(url), output: dirname(options.output) }));
  }
  const css = [...(await Promise.all(options.styles.map((url) => readFile(url, "utf8")))), ...fontCSS].join("\n");
  await writeFile(join(dirname(options.output), "style.css"), css);
  await writeFile(options.output, html.replace("</head>", '<link rel="stylesheet" href="./style.css">\n</head>'));
}
