import { buildDocument } from "@hyperframes/sdk";
import { expect, it } from "vitest";
import { editInput, Motion } from "@";

const html = (extra = "") =>
  `<main data-composition-id="main" data-duration="8"><img data-hf-id="hf-image" src="assets/image.png" data-start="1" data-duration="1"><audio data-hf-id="hf-a" src="assets/a.wav" data-start="1" data-duration="1" data-source-duration="4" data-media-start="0" data-playback-rate="1" data-sync-origin="original"></audio><audio data-hf-id="hf-b" src="assets/b.wav" data-start="1" data-duration="1" data-source-duration="2" data-media-start="0" data-playback-rate="1"></audio>${extra}</main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:8})};</script>`;
const join = (model: Motion) => {
  model.edit({ html: "validation", action: "link", id: "hf-image", partner: "hf-a" });
  return model.edit({ html: "validation", action: "link", id: "hf-a", partner: "hf-b" });
};
it("creates and extends a source-owned group, preserving source and sync identity and deriving the weakest bound", async () => {
  const source = html('<div id="lk-1" data-sync-origin="lk-2"></div>'),
    model = await Motion.open(source);
  try {
    const changed = join(model);
    for (const id of ["hf-image", "hf-a", "hf-b"])
      expect(model.clips.find((c) => c.id === id)?.link).toEqual({
        id: "lk-3",
        members: ["hf-image", "hf-a", "hf-b"],
        reason: null,
        maximum: 2,
      });
    expect(changed).toContain('data-sync-origin="original"');
    expect(buildDocument(changed).gsapScript).toBe(buildDocument(source).gsapScript);
    model.patch("hf-image", { start: 2, duration: 1.5 });
    for (const c of model.clips.filter((c) => c.link)) expect(c).toMatchObject({ start: 2, duration: 1.5 });
    const edited = model.patch("hf-a", { duration: 0.5, audio: { inPoint: 1, rate: 2, volume: 0.25, muted: true } });
    for (const id of ["hf-a", "hf-b"])
      expect(model.clips.find((c) => c.id === id)).toMatchObject({
        duration: 0.5,
        link: { maximum: 0.5 },
        media: { audio: { inPoint: 1, rate: 2 } },
      });
    expect(model.clips.find((c) => c.id === "hf-a")?.media?.audio).toMatchObject({ volume: 0.25, muted: true });
    expect(model.clips.find((c) => c.id === "hf-b")?.media?.audio).toMatchObject({ volume: 1, muted: false });
    expect(buildDocument(edited).gsapScript).toBe(buildDocument(source).gsapScript);
    expect(edited).not.toMatch(/<img[^>]*(?:data-media-start|data-playback-rate|data-volume)/);
  } finally {
    model.dispose();
  }
});
it("rejects the entire group when a partner overruns or crosses the composition boundary", async () => {
  const model = await Motion.open(html());
  try {
    join(model);
    const before = model.clips;
    for (const values of [
      { start: 7.5 },
      { duration: 3 },
      { duration: 1.5, audio: { rate: 2, volume: 0, muted: true } },
      { audio: { inPoint: 1.5 } },
    ]) {
      expect(() => model.patch("hf-a", values)).toThrow();
      expect(model.clips).toEqual(before);
    }
    model.patch("hf-a", { duration: 1, audio: { rate: 2 } });
    expect(model.clips.find((c) => c.id === "hf-image")?.link?.maximum).toBe(1);
  } finally {
    model.dispose();
  }
});
it("unlinks the entire group, preserves sync-origin and resumes independent timing and removal", async () => {
  const model = await Motion.open(html());
  try {
    join(model);
    const changed = model.edit({ html: "validation", action: "unlink", id: "hf-b" });
    expect(changed).not.toContain("data-link=");
    expect(changed).toContain('data-sync-origin="original"');
    model.patch("hf-a", { start: 2 });
    expect(model.clips.find((c) => c.id === "hf-b")?.start).toBe(1);
    model.edit({ html: "validation", action: "remove", id: "hf-a" });
    expect(model.clips.some((c) => c.id === "hf-a")).toBe(false);
    expect(model.clips.some((c) => c.id === "hf-b")).toBe(true);
  } finally {
    model.dispose();
  }
});
it("deletes all proven linked members in one native source batch and protects animations", async () => {
  const model = await Motion.open(html());
  try {
    join(model);
    expect(() =>
      model.animate({ html: "validation", action: "remove", id: "hf-image", animationId: "missing" }),
    ).toThrow("解除链接");
    model.edit({ html: "validation", action: "remove", id: "hf-image" });
    expect(model.clips.filter((c) => c.media)).toHaveLength(0);
  } finally {
    model.dispose();
  }
});
it.each([
  ['data-start="2" data-duration="1"', "时长未对齐"],
  ['data-start="1" data-duration="2"', "时长未对齐"],
  ['data-start="1" data-duration="1" data-composition-id="nested"', "不受支持"],
])("refuses an unproven partner %s without creating a partial group", async (attrs, reason) => {
  const model = await Motion.open(
    html().replace(
      '<img data-hf-id="hf-image" src="assets/image.png" data-start="1" data-duration="1">',
      `<img data-hf-id="hf-image" src="assets/image.png" ${attrs}>`,
    ),
  );
  try {
    expect(() => model.edit({ html: "validation", action: "link", id: "hf-image", partner: "hf-a" })).toThrow(reason);
    expect(model.clips.some((c) => c.link)).toBe(false);
  } finally {
    model.dispose();
  }
});
it("isolates repeated raw link identities by composition scope and keeps unsupported groups read-only", async () => {
  const source = html()
    .replace('data-hf-id="hf-image"', 'data-link="same" data-hf-id="hf-image"')
    .replace('data-hf-id="hf-a"', 'data-link="same" data-hf-id="hf-a"')
    .replace('data-hf-id="hf-b"', 'data-link="same" data-hf-id="hf-b"');
  const model = await Motion.open(
    source.replace(
      "</main>",
      '<section data-hf-id="nested" data-composition-id="nested" data-duration="4"><img data-hf-id="other" src="assets/image.png" data-start="1" data-duration="1" data-link="same"></section></main>',
    ),
  );
  try {
    expect(model.clips.find((c) => c.id === "hf-a")?.link?.members).toEqual(["hf-image", "hf-a", "hf-b"]);
    const other = model.clips.find((c) => c.id.endsWith("other"));
    expect(other?.link?.reason).toContain("只读");
    model.patch("hf-a", { start: 2 });
    expect(model.clips.find((c) => c.id === other?.id)?.start).toBe(1);
  } finally {
    model.dispose();
  }
});
it("rejects unresolved script writers and cross-composition linking", async () => {
  for (const source of [
    html().replace(
      "window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:8})};",
      "const tl=gsap.timeline({paused:true});tl.to(getTarget(),{opacity:0,duration:1});window.__timelines={main:tl};",
    ),
    html()
      .replace(
        '<img data-hf-id="hf-image"',
        '<section data-hf-id="nested" data-composition-id="nested"><img data-hf-id="hf-image"',
      )
      .replace('<audio data-hf-id="hf-a"', '</section><audio data-hf-id="hf-a"'),
  ]) {
    const model = await Motion.open(source);
    try {
      const image = model.clips.find((c) => c.tag === "img");
      if (!image) throw Error("missing image");
      expect(() => model.edit({ html: "validation", action: "link", id: image.id, partner: "hf-a" })).toThrow("只读");
    } finally {
      model.dispose();
    }
  }
  for (const action of [
    { action: "link", id: "hf-a" },
    { action: "link", id: "hf-a", partner: "hf-b", scope: "global" },
    { action: "unlink", id: "hf-a", legacy: true },
  ])
    expect(editInput.safeParse({ html: html(), ...action }).success).toBe(false);
});
it("lets an invalid authored group be explicitly unlinked without deleting or normalizing source", async () => {
  const model = await Motion.open(html().replace('data-hf-id="hf-a"', 'data-link="broken" data-hf-id="hf-a"'));
  try {
    expect(() => model.patch("hf-a", { audio: { volume: 0.5 } })).toThrow("只读");
    model.edit({ html: "validation", action: "unlink", id: "hf-a" });
    expect(model.clips.find((c) => c.id === "hf-a")?.media?.audio?.reason).toBeNull();
  } finally {
    model.dispose();
  }
});
it.each([
  ['data-media-start="0"', 'data-media-start="1"'],
  ['data-playback-rate="1"', 'data-playback-rate="2"'],
] as const)("refuses unequal source clocks %s without partially linking", async (old, value) => {
  const source = html().replace(/<audio data-hf-id="hf-b"[^>]*>/, (tag) => tag.replace(old, value));
  const model = await Motion.open(source);
  try {
    expect(() => model.edit({ html: "validation", action: "link", id: "hf-a", partner: "hf-b" })).toThrow("未对齐");
    expect(model.clips.some((c) => c.link)).toBe(false);
  } finally {
    model.dispose();
  }
});
