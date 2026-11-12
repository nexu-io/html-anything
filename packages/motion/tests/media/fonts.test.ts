import { resourceFontFamily } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import { Motion } from "@";
import { assembleProject, type MediaFact } from "@/project/assemble.js";

const digest = `sha256:${"a".repeat(64)}`,
  family = resourceFontFamily(digest),
  html =
    '<html><head></head><body><main data-composition-id="main" data-width="320" data-height="180" data-duration="1"><p data-hf-id="title" data-start="0" data-duration="1">Title</p></main></body></html>',
  face: MediaFact = { path: "assets/face.woff2", digest, type: "font/woff2", weight: [100, 900], slant: "normal" };
it("writes only explicit font-family through SDK source edits and preserves inheritance on clear", async () => {
  const model = await Motion.open(html);
  try {
    const changed = model.patch("title", { fontFamily: family });
    expect(model.clips.find((c) => c.id === "title")?.fontFamily).toBe(family);
    expect(changed).not.toContain("@font-face");
    expect(changed).not.toContain("font-size");
    const compiled = assembleProject([{ path: "index.html", content: changed }], [face]);
    expect(compiled.html).toContain("@font-face");
    expect(compiled.html).toContain(face.path);
    expect(() => assembleProject([{ path: "index.html", content: changed }])).toThrow("missing project font");
    const cleared = model.patch("title", { fontFamily: null });
    expect(model.clips.find((c) => c.id === "title")?.fontFamily).toBeNull();
    expect(() => assembleProject([{ path: "index.html", content: cleared }])).not.toThrow();
  } finally {
    model.dispose();
  }
});
it("derives one face per byte identity and rejects missing stylesheet/custom-property bindings", () => {
  const compiled = assembleProject(
    [{ path: "index.html", content: html }],
    [face, { ...face, path: "assets/copy.woff2" }],
  );
  expect(compiled.html.match(/@font-face/g)).toHaveLength(1);
  for (const css of [`p{font-family:"${family}"}`, `:root{--font:"${family}"}p{font-family:var(--font)}`]) {
    expect(() =>
      assembleProject([{ path: "index.html", content: html.replace("</head>", `<style>${css}</style></head>`) }]),
    ).toThrow("missing project font");
    expect(() =>
      assembleProject([
        { path: "index.html", content: html },
        { path: "text.css", content: css },
      ]),
    ).toThrow("missing project font");
  }
  expect(() =>
    assembleProject([
      { path: "index.html", content: html.replace("</head>", `<style>/* ${family} */</style></head>`) },
    ]),
  ).not.toThrow();
});
