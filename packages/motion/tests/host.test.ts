import { buildDocument } from "@hyperframes/sdk";
import { expect, it } from "vitest";
import { inspectContext, retimeHost } from "@/project/index.js";

const files = () => [
  {
    path: "index.html",
    content:
      '<main data-composition-id="main" data-duration="12"><div data-hf-id="hf-a" data-composition-id="card" data-composition-src="card.html" data-start="1" data-duration="4"></div><div data-hf-id="hf-b" data-composition-id="card" data-composition-src="card.html" data-start="6" data-duration="4"></div></main><script>const tl=gsap.timeline({paused:true});tl.to({},{duration:12});window.__timelines={main:tl};</script>',
  },
  {
    path: "card.html",
    content:
      '<template><main data-composition-id="card" data-duration="4"><p data-hf-id="hf-title" data-start="0" data-duration="4">Shared</p><div data-hf-id="hf-leaf" data-composition-id="leaf" data-composition-src="leaf.html" data-start="2" data-duration="1"></div></main><script>const tl=gsap.timeline({paused:true});tl.to(\'[data-hf-id="hf-title"]\',{x:80,duration:4},0);window.__timelines={card:tl};</script></template>',
  },
  {
    path: "leaf.html",
    content: '<main data-composition-id="leaf" data-duration="1"><p data-hf-id="hf-caption">Leaf</p></main>',
  },
];
it("moves and trims one parent-file host without stretching or rewriting shared child source", async () => {
  const sources = files(),
    before = JSON.stringify(sources),
    result = await retimeHost({ files: sources, instance: null, id: "hf-a", start: 2, duration: 2 });
  expect(result.file).toBe("index.html");
  expect(JSON.stringify(sources)).toBe(before);
  expect(buildDocument(result.html).gsapScript).toBe(buildDocument(sources[0]?.content ?? "").gsapScript);
  const changed = sources.map((file) => (file.path === result.file ? { ...file, content: result.html } : file));
  expect(changed.slice(1)).toEqual(sources.slice(1));
  const root = await inspectContext({ files: changed, instance: null });
  expect(root.clips.find((clip) => clip.id === "hf-a")).toMatchObject({
    start: 2,
    duration: 2,
    host: { source: "card.html", maximum: 4, reason: null },
  });
  expect(root.clips.find((clip) => clip.id === "hf-b")).toMatchObject({ start: 6, duration: 4 });
  expect(root.clips.find((clip) => clip.composition && !clip.host)?.duration).toBe(12);
  expect((await inspectContext({ files: changed, instance: "hf-a" })).context).toMatchObject({
    offset: 2,
    duration: 2,
  });
});
it("retimes a nested host in its shared parent definition and reprojects every instance clock", async () => {
  const sources = files(),
    result = await retimeHost({ files: sources, instance: "hf-b", id: "hf-leaf", start: 1, duration: 0.8 });
  expect(result.file).toBe("card.html");
  expect(result.html).toContain("<template");
  expect(buildDocument(result.html).gsapScript).toBe(buildDocument(sources[1]?.content ?? "").gsapScript);
  const changed = sources.map((file) => (file.path === result.file ? { ...file, content: result.html } : file));
  expect(changed[0]).toEqual(sources[0]);
  expect(changed[2]).toEqual(sources[2]);
  expect((await inspectContext({ files: changed, instance: "hf-a/hf-leaf" })).context).toMatchObject({
    offset: 2,
  });
  expect((await inspectContext({ files: changed, instance: "hf-b/hf-leaf" })).context).toMatchObject({
    offset: 7,
  });
  expect((await inspectContext({ files: changed, instance: "hf-b/hf-leaf" })).context.duration).toBeCloseTo(0.8, 8);
});
it.each([
  { start: 9, duration: 4 },
  { start: 0, duration: 5 },
  { start: -1, duration: 1 },
  { start: 0, duration: 0 },
])("rejects an invalid proposed window %j without changing any input", async (timing) => {
  const sources = files(),
    before = JSON.stringify(sources);
  await expect(retimeHost({ files: sources, instance: null, id: "hf-a", ...timing })).rejects.toThrow();
  expect(JSON.stringify(sources)).toBe(before);
});
it("rejects roots, stale contexts and a host selected through the wrong parent", async () => {
  const sources = files();
  for (const [instance, id] of [
    [null, "hf-leaf"],
    ["hf-a", "hf-b"],
    ["missing", "hf-leaf"],
  ])
    await expect(retimeHost({ files: sources, instance, id, start: 0, duration: 1 })).rejects.toThrow();
  const model = await inspectContext({ files: sources, instance: null }),
    root = model.clips.find((clip) => clip.composition && !clip.host);
  await expect(retimeHost({ files: sources, instance: null, id: root?.id, start: 0, duration: 1 })).rejects.toThrow();
});
it("projects animated, dynamic and linked hosts read-only and refuses their mutation", async () => {
  for (const code of [
    "tl.to('[data-hf-id=\"hf-a\"]',{opacity:0.5,duration:1},0);",
    "tl.to(getTarget(),{x:20,duration:1},0);",
    "linked",
  ]) {
    const sources = files(),
      root = sources[0];
    if (!root) throw Error("missing root");
    root.content =
      code === "linked"
        ? root.content.replace('data-hf-id="hf-a"', 'data-hf-id="hf-a" data-link="hf-b"')
        : root.content.replace("window.__timelines=", code + "window.__timelines=");
    expect(
      (await inspectContext({ files: sources, instance: null })).clips.find((clip) => clip.id === "hf-a")?.host?.reason,
    ).toBeTruthy();
    await expect(retimeHost({ files: sources, instance: null, id: "hf-a", start: 2, duration: 2 })).rejects.toThrow();
  }
});
it("uses the same deterministic native ID for an unmarked host before and after authoring timing", async () => {
  const sources = files(),
    root = sources[0];
  if (!root) throw Error("missing root");
  root.content = root.content.replace(' data-hf-id="hf-a"', "");
  const host = (await inspectContext({ files: sources, instance: null })).clips.find(
    (clip) => clip.host?.instance !== "hf-b" && clip.host,
  );
  if (!host) throw Error("missing unmarked host");
  const result = await retimeHost({ files: sources, instance: null, id: host.id, start: 2, duration: 3 });
  expect(result.html).toContain(`data-hf-id="${host.id}"`);
  expect(result.html).not.toContain("data-open-motion-instance");
});
