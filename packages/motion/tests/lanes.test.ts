import { expect, it } from "vitest";
import { Motion } from "@";
import { progressAtTime, timeAtProgress } from "@/editing/easing.js";

const template = (script: string) =>
  `<html><body><main data-composition-id="main" data-duration="5"><p data-hf-id="hf-text" data-start="0" data-duration="4">Text</p></main><script>const tl=gsap.timeline({paused:true});${script}window.__timelines={main:tl};</script></body></html>`;
const flat = template(
  `tl.fromTo('[data-hf-id="hf-text"]',{x:0,y:20,opacity:0.2},{x:240,y:120,opacity:1,duration:4,ease:"power2.inOut"},0);`,
);
const curved = template(
  `tl.to('[data-hf-id="hf-text"]',{keyframes:{"0%":{x:0},"25%":{x:80,ease:"power1.inOut"},"100%":{x:240,ease:"none"}},duration:4,ease:"power2.inOut"},0);`,
);
const clip = (model: Motion) => {
  const value = model.clips.find((c) => c.id === "hf-text");
  if (!value) throw Error("missing clip");
  return value;
};
it("converts explicit fromTo, separates its authored properties and keeps native values and segment easing", async () => {
  const model = await Motion.open(flat);
  try {
    const first = clip(model).animations[0];
    if (!first) throw Error("missing tween");
    expect(first.convertible).toBe(true);
    let html = model.animate({ action: "convert", html: flat, id: "hf-text", animationId: first.id });
    const converted = clip(model).animations[0];
    if (!converted) throw Error("missing converted tween");
    expect(converted.separable).toBe(true);
    html = model.animate({ action: "separate", html, id: "hf-text", animationId: converted.id });
    expect(
      clip(model)
        .animations.map((a) => a.property)
        .sort(),
    ).toEqual(["opacity", "x", "y"]);
    const x = clip(model).animations.find((a) => a.property === "x");
    if (!x) throw Error("missing x");
    expect(x.frames).toEqual([
      { percentage: 0, value: 0, ease: "power2.inOut" },
      { percentage: 100, value: 240, ease: "power2.inOut" },
    ]);
    const y = clip(model).animations.find((a) => a.property === "y");
    model.animate({
      action: "put",
      html,
      id: "hf-text",
      animationId: x.id,
      property: "x",
      start: 0,
      duration: 4,
      frames: [
        { percentage: 0, value: 0, ease: "none" },
        { percentage: 100, value: 480, ease: "none" },
      ],
    });
    expect(clip(model).animations.find((a) => a.property === "y")?.frames).toEqual(y?.frames);
  } finally {
    model.dispose();
  }
});
it("retimes an eased interior key and endpoint without changing other key values, easing or absolute key times", async () => {
  const model = await Motion.open(curved);
  try {
    let a = clip(model).animations[0];
    if (!a) throw Error("missing animation");
    const oldTime = (timeAtProgress(a.ease, 25) / 100) * 4;
    let html = model.animate({
      action: "retime",
      html: curved,
      id: "hf-text",
      animationId: a.id,
      percentage: 25,
      time: 2,
    });
    a = clip(model).animations[0];
    if (!a) throw Error("missing retimed animation");
    expect(a.frames[1]?.percentage).toBeCloseTo(50);
    expect(a.ease).toBe("power2.inOut");
    expect(a.frames[1]?.ease).toBe("power1.inOut");
    html = model.animate({ action: "retime", html, id: "hf-text", animationId: a.id, percentage: 0, time: 0.5 });
    a = clip(model).animations[0];
    if (!a) throw Error("missing resized animation");
    expect(a.start).toBe(0.5);
    expect(a.duration).toBe(3.5);
    expect(0.5 + (timeAtProgress(a.ease, a.frames[1]?.percentage ?? 0) / 100) * 3.5).toBeCloseTo(2, 6);
    expect(a.frames.map((f) => f.value)).toEqual([0, 80, 240]);
    expect(oldTime).not.toBeCloseTo(1);
  } finally {
    model.dispose();
  }
});
it("moves and scales all numeric child tweens with a clip and rejects out-of-composition or relative timing", async () => {
  const model = await Motion.open(curved);
  try {
    model.patch("hf-text", { start: 1, duration: 3 });
    const a = clip(model).animations[0];
    expect(a?.start).toBe(1);
    expect(a?.duration).toBe(3);
    expect(() => model.patch("hf-text", { start: 4 })).toThrow("合成时长");
    expect(clip(model).start).toBe(1);
  } finally {
    model.dispose();
  }
  const relative = await Motion.open(template(`tl.to('[data-hf-id="hf-text"]',{x:100,duration:2},'+=1');`));
  try {
    expect(() => relative.patch("hf-text", { start: 1 })).toThrow("不可安全重排");
    expect(clip(relative).start).toBe(0);
  } finally {
    relative.dispose();
  }
});
it("refuses crossing neighboring keys and dynamic or overlapping lane decomposition without source changes", async () => {
  const model = await Motion.open(curved);
  try {
    const a = clip(model).animations[0];
    if (!a) throw Error("missing");
    expect(() =>
      model.animate({ action: "retime", html: curved, id: "hf-text", animationId: a.id, percentage: 25, time: 4.5 }),
    ).toThrow("边界");
    expect(clip(model).animations[0]?.frames[1]?.value).toBe(80);
  } finally {
    model.dispose();
  }
  const unspecified = await Motion.open(flat.replace(',ease:"power2.inOut"', ""));
  try {
    expect(clip(unspecified).animations[0]?.convertible).toBe(false);
  } finally {
    unspecified.dispose();
  }
  const dynamic = await Motion.open(template(`tl.fromTo('[data-hf-id="hf-text"]',{x:0},{x:()=>240,duration:4},0);`));
  try {
    const a = clip(dynamic).animations[0];
    expect(a?.convertible).toBe(false);
    if (a)
      expect(() => dynamic.animate({ action: "convert", html: flat, id: "hf-text", animationId: a.id })).toThrow(
        "安全转换",
      );
  } finally {
    dynamic.dispose();
  }
});
it("inverts the closed GSAP time warp rather than placing a percentage at linear elapsed time", () => {
  for (const ease of ["power1.in", "power2.out", "power2.inOut", "power4.inOut"] as const)
    for (const pct of [1, 25, 50, 80, 99]) expect(progressAtTime(ease, timeAtProgress(ease, pct))).toBeCloseTo(pct, 7);
});

it("refuses separation across competing writers and retains native segment defaults", async () => {
  const overlap = await Motion.open(
    flat.replace("window.__timelines", `tl.to('[data-hf-id="hf-text"]',{x:900,duration:1},3);window.__timelines`),
  );
  try {
    const a = clip(overlap).animations[0];
    if (!a) throw Error("missing");
    const html = overlap.animate({ action: "convert", html: flat, id: "hf-text", animationId: a.id });
    const converted = clip(overlap).animations[0];
    if (!converted) throw Error("missing");
    expect(() => overlap.animate({ action: "separate", html, id: "hf-text", animationId: converted.id })).toThrow(
      "写入顺序",
    );
    expect(clip(overlap).animations).toHaveLength(2);
  } finally {
    overlap.dispose();
  }
  const native = await Motion.open(
    template(`tl.to('[data-hf-id="hf-text"]',{keyframes:{'0%':{x:0},'100%':{x:240}},duration:4},0);`),
  );
  try {
    const a = clip(native).animations[0];
    if (!a) throw Error("missing");
    expect(a.frames[1]?.ease).toBeUndefined();
    native.animate({ action: "retime", html: flat, id: "hf-text", animationId: a.id, percentage: 100, time: 3 });
    expect(clip(native).animations[0]?.frames[1]?.ease).toBeUndefined();
  } finally {
    native.dispose();
  }
});
