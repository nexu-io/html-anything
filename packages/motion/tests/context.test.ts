import { expect, it } from "vitest";
import { Motion } from "@";
import { inspectContext } from "@/project/index.js";

const host = (id: string, start: string, source = "card.html", composition = "card") =>
  `<div data-hf-id="${id}" data-composition-id="${composition}" data-composition-src="${source}" data-start="${start}" data-duration="4"></div>`;
const files = () => [
  {
    path: "index.html",
    content: `<main data-composition-id="main" data-duration="12">${host("hf-a", "1")}${host("hf-b", "6")}</main>`,
  },
  {
    path: "card.html",
    content: `<template><main data-composition-id="card" data-duration="4"><p data-hf-id="hf-title">Shared</p>${host("hf-inner", "2", "leaf.html", "leaf")}</main></template>`,
  },
  {
    path: "leaf.html",
    content: '<main data-composition-id="leaf" data-duration="1"><b data-hf-id="hf-title">Leaf</b></main>',
  },
];
it("keeps repeated-file identity distinct and composes local clocks through instance ancestry", async () => {
  const a = await inspectContext({ files: files(), instance: "hf-a" }),
    b = await inspectContext({ files: files(), instance: "hf-b" }),
    leaf = await inspectContext({ files: files(), instance: "hf-b/hf-inner" });
  expect(a.context).toMatchObject({ instance: "hf-a", file: "card.html", offset: 1, duration: 4 });
  expect(b.context).toMatchObject({ instance: "hf-b", file: "card.html", offset: 6, duration: 4 });
  expect(a.clips.map(({ host, ...local }) => local)).toEqual(b.clips.map(({ host, ...local }) => local));
  expect(a.clips.find((clip) => clip.host)?.host?.instance).toBe("hf-a/hf-inner");
  expect(b.clips.find((clip) => clip.host)?.host?.instance).toBe("hf-b/hf-inner");
  expect(leaf.context).toMatchObject({ file: "leaf.html", offset: 8, duration: 1 });
  expect(leaf.context.trail.map((node) => node.id)).toEqual(["hf-b", "hf-b/hf-inner"]);
  expect(leaf.clips.find((clip) => clip.id === "hf-title")?.text).toBe("Leaf");
});
it("edits the authored template file shared by instances without injecting compiled identity", async () => {
  const sources = files(),
    context = await inspectContext({ files: sources, instance: "hf-b" }),
    model = await Motion.open(context.html);
  try {
    const html = model.patch("hf-title", { text: "Shared edit" });
    expect(html).toContain("<template");
    expect(html).not.toContain("data-open-motion-instance");
    const changed = sources.map((file) => (file.path === context.context.file ? { ...file, content: html } : file));
    expect(changed[0]).toEqual(sources[0]);
    expect(changed[2]).toEqual(sources[2]);
    for (const instance of ["hf-a", "hf-b"])
      expect(
        (await inspectContext({ files: changed, instance })).clips.find((clip) => clip.id === "hf-title")?.text,
      ).toBe("Shared edit");
  } finally {
    model.dispose();
  }
});
it("marks unresolved clocks read-only without inventing a time mapping", async () => {
  const sources = files();
  sources[0] = {
    path: "index.html",
    content: `<main data-composition-id="main" data-duration="12">${host("hf-a", "intro + 1")}</main>`,
  };
  const model = await inspectContext({ files: sources, instance: "hf-a" });
  expect(model.context.offset).toBeNull();
  expect(model.context.clockReason).toContain("未解析");
  expect(model.html).toBe(sources[1]?.content);
});
it("explicitly invalidates a removed instance instead of selecting another mount of the same file", async () => {
  const sources = files();
  sources[0] = {
    path: "index.html",
    content: `<main data-composition-id="main" data-duration="12">${host("hf-a", "1")}</main>`,
  };
  const model = await inspectContext({ files: sources, instance: "hf-b" });
  expect(model.context).toMatchObject({ instance: null, file: "index.html", invalidated: true, offset: 0 });
});
it("clips local clock reach to ancestor windows and rejects windows that never become active", async () => {
  const sources = files();
  sources[0] = {
    path: "index.html",
    content: `<main data-composition-id="main" data-duration="7">${host("hf-b", "6")}</main>`,
  };
  expect((await inspectContext({ files: sources, instance: "hf-b" })).context.duration).toBe(1);
  expect((await inspectContext({ files: sources, instance: "hf-b/hf-inner" })).context.clockReason).toContain(
    "有效时间窗",
  );
});
it("projects unsupported qualified animation selectors as read-only before an edit is offered", async () => {
  const html =
    '<main data-composition-id="card" data-duration="3"><p data-hf-id="hf-title" data-start="0" data-duration="3">Title</p></main><script>const tl=gsap.timeline({paused:true});tl.to(\'p[data-hf-id="hf-title"]\',{keyframes:{"0%":{x:0},"100%":{x:80}},duration:3,ease:"none"},0);window.__timelines={card:tl};</script>';
  const model = await Motion.open(html);
  try {
    const animation = model.clips.find((clip) => clip.id === "hf-title")?.animations[0];
    expect(animation?.reason).toContain("只读");
    if (!animation) throw Error("missing qualified animation");
    expect(() => model.animate({ action: "remove", html, id: "hf-title", animationId: animation.id })).toThrow("身份");
  } finally {
    model.dispose();
  }
});
