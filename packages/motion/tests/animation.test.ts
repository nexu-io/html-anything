import { expect, it } from "vitest";
import { type AnimationInput, Motion } from "@";

const html =
  '<html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="5"><p data-hf-id="hf-text" data-start="1" data-duration="3">Hello</p><p data-hf-id="hf-other" data-start="0" data-duration="5">Other</p></main><script>const tl=gsap.timeline({paused:true});tl.to({},{duration:5});window.__timelines={main:tl};</script></body></html>';
const input: AnimationInput = {
  action: "put",
  html,
  id: "hf-text",
  property: "x",
  start: 1,
  duration: 3,
  frames: [
    { percentage: 0, value: 0, ease: "none" },
    { percentage: 50, value: 120, ease: "power1.inOut" },
    { percentage: 100, value: 240, ease: "none" },
  ],
};
it("round-trips a native keyframed tween, reparses its identity after replacement, and removes only that tween", async () => {
  let model = await Motion.open(html);
  try {
    const animated = model.animate(input),
      clip = model.clips.find((c) => c.id === "hf-text"),
      first = clip?.animations[0];
    expect(first).toMatchObject({ property: "x", start: 1, duration: 3, reason: null, frames: input.frames });
    expect(clip?.animationReason).toBeNull();
    expect(animated).toContain("keyframes");
    model.dispose();
    model = await Motion.open(animated);
    const id = model.clips.find((c) => c.id === "hf-text")?.animations[0]?.id;
    if (!id) throw new Error("missing animation");
    const changed = model.animate({
      ...input,
      animationId: id,
      frames: [
        { percentage: 0, value: 0, ease: "none" },
        { percentage: 100, value: 360, ease: "none" },
      ],
    });
    expect(model.clips.find((c) => c.id === "hf-text")?.animations).toHaveLength(1);
    expect(changed).toContain("360");
    const next = model.clips.find((c) => c.id === "hf-text")?.animations[0]?.id;
    if (!next) throw new Error("missing replacement");
    model.animate({ action: "remove", html: changed, id: "hf-text", animationId: next });
    expect(model.clips.find((c) => c.id === "hf-text")?.animations).toEqual([]);
    expect(model.clips.find((c) => c.id === "hf-other")?.text).toBe("Other");
  } finally {
    model.dispose();
  }
});
it("rejects stale/foreign animation identities, unordered frames and out-of-window values before changing source", async () => {
  const model = await Motion.open(html);
  try {
    const animated = model.animate(input),
      id = model.clips.find((c) => c.id === "hf-text")?.animations[0]?.id;
    if (!id) throw new Error("missing animation");
    for (const candidate of [
      { ...input, animationId: "missing" },
      { ...input, id: "hf-other", animationId: id },
      { ...input, animationId: id, start: 0 },
      { ...input, animationId: id, duration: 4 },
      { ...input, animationId: id, frames: [input.frames[1], input.frames[0], input.frames[2]] },
      { ...input, property: "opacity", animationId: id, frames: input.frames },
    ])
      expect(() => model.animate(candidate as AnimationInput)).toThrow();
    expect(model.clips.find((c) => c.id === "hf-text")?.animations[0]?.frames).toEqual(input.frames);
    expect(animated).toContain("Other");
  } finally {
    model.dispose();
  }
});
it("does not report an inline chained timeline as a successful animation write", async () => {
  const model = await Motion.open(
    html.replace(
      "const tl=gsap.timeline({paused:true});tl.to({},{duration:5});window.__timelines={main:tl};",
      "window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:5})};",
    ),
  );
  try {
    expect(model.clips.find((c) => c.id === "hf-text")?.animationReason).toBeTruthy();
    expect(() => model.animate(input)).toThrow("没有写入");
    expect(model.clips.find((c) => c.id === "hf-text")?.animations).toEqual([]);
  } finally {
    model.dispose();
  }
});
it("keeps dynamic and mixed-property scripts read-only instead of discarding authored behavior", async () => {
  const source = html.replace(
    "tl.to({},{duration:5});",
    'tl.to({},{duration:5});tl.to(\'[data-hf-id="hf-text"]\',{keyframes:{"0%":{x:0,opacity:0},"100%":{x:100,opacity:1}},duration:3},1);',
  );
  const model = await Motion.open(source);
  try {
    const clip = model.clips.find((c) => c.id === "hf-text"),
      id = clip?.animations[0]?.id;
    expect(clip?.animations[0]?.reason).toBeTruthy();
    expect(() => model.animate({ ...input, animationId: id })).toThrow("不支持编辑");
  } finally {
    model.dispose();
  }
});
it("edits closed appearance fields without flattening inherited or authored unrelated styling", async () => {
  const model = await Motion.open(
    html.replace(
      'data-hf-id="hf-text"',
      'data-hf-id="hf-text" style="font-weight:700;transform:scale(0.8);color:var(--title)"',
    ),
  );
  try {
    const changed = model.patch("hf-text", {
      appearance: { x: 40, y: 20, rotation: 15, opacity: 0.5, color: "#123456" },
    });
    expect(model.clips.find((c) => c.id === "hf-text")?.appearance).toEqual({
      x: 40,
      y: 20,
      rotation: 15,
      opacity: 0.5,
      color: "#123456",
    });
    expect(changed).toMatch(/font-weight:\s*700/);
    expect(changed).toContain("scale(0.8)");
    expect(() => model.patch("hf-text", { text: "must not apply", appearance: { opacity: 2 } })).toThrow();
    expect(model.clips.find((c) => c.id === "hf-text")?.text).toBe("Hello");
  } finally {
    model.dispose();
  }
});

it("refuses animation beyond the composition and preserves authored relative typography", async () => {
  const source = html
    .replace('data-duration="5"', 'data-duration="3"')
    .replace('data-hf-id="hf-text"', 'data-hf-id="hf-text" style="font-size:2em;color:var(--title)"');
  const model = await Motion.open(source);
  try {
    expect(() => model.animate(input)).toThrow("合成时长");
    expect(model.clips.find((c) => c.id === "hf-text")?.fontSize).toBeNull();
    const changed = model.patch("hf-text", { text: "new text" });
    expect(changed).toMatch(/font-size:\s*2em/);
    expect(changed).toContain("var(--title)");
  } finally {
    model.dispose();
  }
});
