import { parseHTMLContent } from "@hyperframes/core/compiler";
import { canonical, digest as hash } from "@odsuite/protocol";
import { assembleProject } from "@open-motion/motion/project";
import { Fault, initialFiles, type SourceFile } from "@open-motion/workspace/contract";
import type { Descriptor, TemplateInput } from "./contract.js";
import fonts from "./native/fonts.json" with { type: "json" };
import graph from "./native/graph.json" with { type: "json" };
import promo from "./native/promo.json" with { type: "json" };
import tree from "./native/tree.json" with { type: "json" };

const adaptations = [
  "Pinned local GSAP is injected only into derived previews/captures; CDN scripts are removed.",
  "Original Latin font faces are embedded in editable source CSS with verified bytes and OFL notices; no font network dependency.",
  "Product Promo captions use an explicit external composition file, preserving authored timing and animation.",
];
for (const face of fonts.faces) {
  const bytes = Buffer.from(face.data, "base64");
  if (
    bytes.subarray(0, 4).toString() !== "wOF2" ||
    bytes.length !== face.bytes ||
    hash(bytes) !== `sha256:${face.sha256}`
  )
    throw Error("native template font integrity mismatch");
}
function prepare(input: typeof promo) {
  const files: SourceFile[] = input.files.map((file) => {
    if (hash(file.content) !== `sha256:${input.upstream.find((entry) => entry.path === file.path)?.sha256}`)
      throw Error("native template source integrity mismatch");
    return {
      ...file,
      content: file.path.endsWith(".html")
        ? file.content
            .replace(
              /<script\s+src="https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@3\.14\.2\/dist\/gsap\.min\.js"\s*><\/script>/g,
              "",
            )
            .replace(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/g, "")
        : file.content,
    };
  });
  const entry = files.find((file) => file.path === "index.html")!;
  if (input.id === "product-promo") {
    const document = parseHTMLContent(entry.content),
      captions = document.querySelector("#captions-comp"),
      style = document.querySelector("style");
    if (!captions || !style) throw Error("Product Promo captions contract changed");
    let css = "";
    for (const selector of ["caption-text-wrapper", "caption-line"]) {
      const pattern = new RegExp(`\\.${selector}\\s*\\{[^}]+\\}`, "g"),
        matches = style.textContent?.match(pattern);
      if (matches?.length !== 1) throw Error("Product Promo caption styles changed");
      css += matches[0];
      style.textContent = style.textContent!.replace(pattern, "");
    }
    files.push({
      path: "compositions/captions.html",
      content: `<template id="captions-template"><div data-composition-id="captions" data-width="1920" data-height="1080" data-duration="12.5">${captions.innerHTML}<style>${css}</style></div></template>`,
    });
    captions.innerHTML = "";
    captions.setAttribute("data-composition-src", "compositions/captions.html");
    entry.content = document.toString();
  }
  entry.content = entry.content.replace(/<head>/i, '<head><link rel="stylesheet" href="assets/fonts.css">');
  const families = input.id === "nyt-graph" ? ["Libre Baskerville", "Libre Franklin"] : ["Inter"];
  files.push(
    {
      path: "assets/fonts.css",
      content: fonts.faces
        .filter((face) => families.includes(face.family))
        .map(
          (face) =>
            `@font-face{font-family:'${face.family}';font-style:normal;font-weight:${face.weight};font-display:block;src:url(data:font/woff2;base64,${face.data}) format('woff2');}`,
        )
        .join("\n"),
    },
    {
      path: "licenses/templates.txt",
      content: `${fonts.templateLicense}\n${fonts.templateNotice}\nOpenMotion adaptations: ${adaptations.join(" ")}`,
    },
    {
      path: "licenses/fonts.txt",
      content: Object.entries(fonts.licenses)
        .filter(([id]) => (input.id === "nyt-graph" ? id !== "inter" : id === "inter"))
        .map(([name, text]) => `${name}\n${text}`)
        .join("\n\n"),
    },
    initialFiles().find((file) => file.path === "hyperframes.json")!,
  );
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const provenance = {
    schema: 1,
    id: input.id,
    title: input.title,
    description: input.description,
    spec: { width: input.width, height: input.height, duration: input.duration },
    license: input.license,
    source: input.source,
    upstream: input.upstream,
    fontSource: fonts.source,
    fonts: fonts.faces.filter((face) => families.includes(face.family)).map(({ data: _data, ...face }) => face),
    adaptations,
  };
  const contentHash = hash(canonical({ ...provenance, files }));
  files.push({ path: "template.json", content: canonical({ ...provenance, contentHash }) });
  const assembled = assembleProject(files);
  const root = parseHTMLContent(assembled.html).querySelector("[data-composition-id]");
  for (const key of ["width", "height", "duration"] as const)
    if (Number(root?.getAttribute(`data-${key}`)) !== input[key])
      throw Error("template metadata differs from native source");
  const template: Descriptor = {
    id: input.id,
    title: input.title,
    description: input.description,
    contentHash,
    duration: input.duration,
    width: input.width,
    height: input.height,
    source: input.source,
    license: input.license,
    adaptations,
    files: files.map((file) => ({
      path: file.path,
      bytes: Buffer.byteLength(file.content),
      digest: hash(file.content),
    })),
  };
  return { template, files };
}
const catalog = [promo, graph, tree].map(prepare);
export function list() {
  return { templates: catalog.map((entry) => structuredClone(entry.template)), catalog: null };
}
export function read(input: TemplateInput<"template_read">) {
  const entry = catalog.find((entry) => entry.template.id === input.id);
  if (!entry) throw new Fault("missing", "template is not in the finite catalog");
  if (entry.template.contentHash !== input.contentHash)
    throw new Fault("conflict", "template content changed; read the catalog again");
  return structuredClone(entry);
}
