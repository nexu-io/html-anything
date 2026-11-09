import { buildDocument } from "@hyperframes/sdk";
import { expect, it } from "vitest";
import { Motion, patchInput } from "@";
import { assembleProject } from "@/project/index.js";

const html = (extra = "", script = "") =>
  `<main data-composition-id="main" data-duration="8"><audio data-hf-id="hf-a" src="assets/tone.wav" data-start="1" data-duration="2" data-source-duration="4" data-media-start="0" data-playback-rate="1" ${extra}></audio><p data-hf-id="hf-title">Text</p></main><script>const tl=gsap.timeline({paused:true});tl.to({},{duration:8});${script}window.__timelines={main:tl};</script>`;
it("moves the source in-point without moving the clip, preserves script and exposes the remaining source window", async () => {
  const source = html(),
    model = await Motion.open(source);
  try {
    const changed = model.patch("hf-a", { audio: { inPoint: 1, volume: 0.25, muted: true } }),
      clip = model.clips.find((c) => c.id === "hf-a");
    expect(clip).toMatchObject({
      start: 1,
      duration: 2,
      media: { maximum: 3, audio: { sourceDuration: 4, inPoint: 1, volume: 0.25, muted: true, reason: null } },
    });
    expect(buildDocument(changed).gsapScript).toBe(buildDocument(source).gsapScript);
    expect(changed).toContain('data-source-duration="4"');
    expect(changed).toContain('data-playback-rate="1"');
    model.patch("hf-a", { audio: { muted: false } });
    expect(model.clips.find((c) => c.id === "hf-a")?.media?.audio).toMatchObject({
      inPoint: 1,
      volume: 0.25,
      muted: false,
    });
    expect(() => model.patch("hf-a", { duration: 3.1 })).toThrow("源素材");
    model.patch("hf-a", { duration: 3 });
    expect(model.clips.find((c) => c.id === "hf-a")?.duration).toBe(3);
  } finally {
    model.dispose();
  }
});
it("validates coupled in-point and duration atomically and leaves untouched audio attributes absent", async () => {
  const model = await Motion.open(html());
  try {
    const before = model.clips;
    expect(() => model.patch("hf-a", { audio: { inPoint: 3, volume: 0.25, muted: true } })).toThrow("源素材");
    expect(model.clips).toEqual(before);
    const changed = model.patch("hf-a", { duration: 1, audio: { inPoint: 3 } });
    expect(changed).not.toContain("data-volume");
    expect(changed).not.toMatch(/\smuted(?:[\s=>])/);
    expect(model.clips.find((c) => c.id === "hf-a")).toMatchObject({
      duration: 1,
      media: { maximum: 1, audio: { inPoint: 3, volume: 1, muted: false } },
    });
    expect(() => model.patch("hf-title", { audio: { volume: 0.5 } })).toThrow("独立音频");
  } finally {
    model.dispose();
  }
});
it.each([
  'data-link="pair"',
  'data-automation="{}"',
  'data-fx-chain="[]"',
  'data-audio-group="bus"',
  'data-fade-in="0"',
  'data-playback-start="0"',
  "loop",
])("keeps unproven %s audio read-only without changing source", async (extra) => {
  const model = await Motion.open(html(extra));
  try {
    expect(model.clips.find((c) => c.id === "hf-a")?.media).toMatchObject({
      maximum: null,
      audio: { reason: expect.any(String) },
    });
    expect(() => model.patch("hf-a", { audio: { volume: 0.5 } })).toThrow("只读");
  } finally {
    model.dispose();
  }
});
it("refuses host-script and unresolved-selector audio writers and invalid values", async () => {
  for (const script of [
    "tl.to('[data-hf-id=\"hf-a\"]',{volume:0.5,duration:1});",
    "tl.to(getTarget(),{volume:0.5,duration:1});",
  ]) {
    const model = await Motion.open(html("", script));
    try {
      expect(() => model.patch("hf-a", { audio: { volume: 0.5 } })).toThrow("只读");
    } finally {
      model.dispose();
    }
  }
  for (const audio of [{ volume: 1.01 }, { volume: -1 }, { inPoint: -1 }, { muted: "false" }, {}])
    expect(patchInput.safeParse({ html: html(), id: "hf-a", audio }).success).toBe(false);
});
it("validates rendered audio metadata against immutable media facts instead of trusting an authored length hint", () => {
  const files = [{ path: "index.html", content: html() }],
    facts = [{ path: "assets/tone.wav", type: "audio/wav" as const, duration: 4 }];
  expect(assembleProject(files, facts).html).toContain('data-source-duration="4"');
  expect(() => assembleProject(files, [{ path: "assets/tone.wav", type: "audio/wav", duration: 2 }])).toThrow(
    "verified resource",
  );
  expect(() => assembleProject(files, [{ path: "assets/tone.wav", type: "image/png" }])).toThrow("media type");
});
