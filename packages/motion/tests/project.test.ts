import { parseHTMLContent } from "@hyperframes/core/compiler";
import { expect, it } from "vitest";
import { assembleProject, projectGraph, type Source } from "@/project/index.js";

const host = (id: string, file = "scenes/card.html", composition = "card") =>
  `<section data-hf-id="${id}" data-composition-id="${composition}" data-composition-src="${file}" data-start="1" data-duration="3"></section>`;
const page = (body: string, id = "main") =>
  `<html><head></head><body><main data-composition-id="${id}">${body}</main></body></html>`;
function fileAt(files: Source[], index: number) {
  const file = files[index];
  if (!file) throw Error("missing test file");
  return file;
}
const fixture = (): Source[] => [
  { path: "index.html", content: page(host("hf-a") + host("hf-b")) },
  {
    path: "scenes/card.html",
    content: page(
      `<p id="title" data-hf-id="hf-title">Card</p>${host("hf-child", "nested/leaf.html", "leaf")}`,
      "card",
    ),
  },
  { path: "scenes/nested/leaf.html", content: page('<b data-hf-id="hf-title">Leaf</b>', "leaf") },
];
it("builds stable repeated-instance scopes and source mappings without mutating authored files", () => {
  const files = [...fixture(), { path: ".hyperframes/studio-manual-edits.json", content: "{}" }],
    before = JSON.stringify(files),
    result = assembleProject(files);
  expect(JSON.stringify(files)).toBe(before);
  expect(assembleProject(files)).toEqual(result);
  expect(result.graph.files).toEqual(["index.html", "scenes/card.html", "scenes/nested/leaf.html"]);
  expect(result.graph.instances.map((instance) => instance.id)).toEqual([
    "hf-a",
    "hf-a/hf-child",
    "hf-b",
    "hf-b/hf-child",
  ]);
  expect(new Set(result.graph.instances.map((instance) => instance.runtimeCompositionId)).size).toBe(4);
  expect(result.graph.instances[1]).toMatchObject({
    parent: "hf-a",
    file: "scenes/nested/leaf.html",
    hostFile: "scenes/card.html",
    hostId: "hf-child",
    start: "1",
    duration: "3",
  });
  const document = parseHTMLContent(result.html);
  expect(document.querySelectorAll("[data-composition-src]").length).toBe(0);
  expect(document.querySelectorAll('[data-hf-id="hf-title"]').length).toBe(4);
  for (const instance of result.graph.instances) {
    const node = [...document.querySelectorAll("[data-open-motion-instance]")].find(
      (node) => node.getAttribute("data-open-motion-instance") === instance.id,
    );
    expect(node?.getAttribute("data-composition-id")).toBe(instance.runtimeCompositionId);
    expect(node?.getAttribute("data-composition-file")).toBe(instance.file);
  }
});
it("resolves parent-relative composition references within the snapshot", () => {
  const files = fixture();
  fileAt(files, 1).content = page(host("hf-child", "../scenes/nested/leaf.html", "leaf"), "card");
  expect(assembleProject(files).graph.instances[1]?.file).toBe("scenes/nested/leaf.html");
});
it("assembles canonical template content including its nested mounts and scoped styles", () => {
  const files = fixture();
  fileAt(files, 1).content =
    `<template data-composition-id="card"><div data-composition-id="card">${host("hf-child", "nested/leaf.html", "leaf")}</div><style>main{color:rgb(9,8,7)}</style></template>`;
  const result = assembleProject(files);
  expect(result.graph.instances).toHaveLength(4);
  expect(result.html).toContain('[data-composition-id="card__hf1"]');
  expect(result.html).toContain("rgb(9,8,7)");
});
it("rebases mounted images, stylesheets, inline CSS and external scripts from their owning file", () => {
  const files = fixture();
  fileAt(files, 1).content =
    `<html><head><link rel="stylesheet" href="./card.css"><style>.art{background:url(./art.svg)}</style></head><body><div data-composition-id="card"><img src="../shared.svg"><p style="background:url(./art.svg)">Asset</p></div><script src="./helper.js"></script></body></html>`;
  files.push(
    { path: "scenes/art.svg", content: "<svg/>" },
    { path: "shared.svg", content: "<svg/>" },
    { path: "scenes/card.css", content: "p{opacity:0.8}" },
    { path: "scenes/helper.js", content: "window.helper=true;" },
  );
  const html = assembleProject(files).html;
  expect(html).toContain('src="shared.svg"');
  expect(html).toContain('href="scenes/card.css"');
  expect(html).toContain('src="scenes/helper.js"');
  expect(html).toContain("url(scenes/art.svg)");
});
it.each([
  "https://example.com/card.html",
  "../../escape.html",
  "/outside.html",
  "scenes/card.html?q=1",
  "scenes/%63ard.html",
  "scenes/card.html#root",
])("rejects non-canonical composition reference %s", (reference) => {
  const files = fixture();
  fileAt(files, 0).content = page(host("hf-a", reference));
  expect(() => assembleProject(files)).toThrow(/reference/);
});
it("rejects cycles and missing sources before producing a partial composition", () => {
  const files = fixture();
  fileAt(files, 2).content = page(host("hf-loop", "../../index.html", "main"), "leaf");
  expect(() => assembleProject(files)).toThrow("circular");
  expect(() => assembleProject(fixture().slice(0, 2))).toThrow("missing composition: scenes/nested/leaf.html");
});
it("rejects empty, rootless, ambiguous and reserved identity source", () => {
  for (const content of [
    "",
    "<p>no root</p>",
    page("", "a") + page("", "b"),
    page('<b data-hf-id="same"></b><i data-hf-id="same"></i>', "card"),
    page('<b data-open-motion-instance="foreign"></b>', "card"),
  ]) {
    const files = fixture();
    fileAt(files, 1).content = content;
    expect(() => assembleProject(files)).toThrow();
  }
});
it("bounds exponential instance expansion independently of source file size", () => {
  const files: Source[] = [{ path: "index.html", content: page(host("hf-root", "0.html")) }];
  for (let index = 0; index < 9; index++)
    files.push({
      path: `${index}.html`,
      content: page(
        index === 8 ? "leaf" : host("hf-a", `${index + 1}.html`) + host("hf-b", `${index + 1}.html`),
        "card",
      ),
    });
  expect(() => projectGraph(files)).toThrow("instance count");
});
it("accepts the native twenty-edge nesting boundary and rejects a deeper graph", () => {
  const files: Source[] = [{ path: "index.html", content: page(host("hf-hop", "0.html")) }];
  for (let index = 0; index < 20; index++)
    files.push({
      path: `${index}.html`,
      content: page(index === 19 ? "leaf" : host("hf-hop", `${index + 1}.html`), "card"),
    });
  expect(assembleProject(files).graph.instances).toHaveLength(20);
  fileAt(files, 20).content = page(host("hf-hop", "20.html"), "card");
  files.push({ path: "20.html", content: page("too deep", "card") });
  expect(() => projectGraph(files)).toThrow("nesting exceeds");
});
it("bounds expanded source bytes even when the authored snapshot and instance count fit", () => {
  const files: Source[] = [
    {
      path: "index.html",
      content: page(Array.from({ length: 24 }, (_, index) => host(`hf-${index}`, "large.html")).join("")),
    },
    { path: "large.html", content: page("x".repeat(800000), "card") },
  ];
  expect(() => assembleProject(files)).toThrow("expanded composition source");
});
it("rejects ambiguous embedded/fallback boundaries and runtime ID collisions", () => {
  expect(() =>
    assembleProject([{ path: "index.html", content: page('<div data-composition-id="embedded"></div>') }]),
  ).toThrow("explicit file boundary");
  const files = fixture();
  fileAt(files, 0).content = page(host("hf-a") + host("hf-b") + host("hf-c", "scenes/card.html", "card__hf1"));
  expect(() => assembleProject(files)).toThrow("runtime composition identity");
});
