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
it("uses authored fixed rate for source bounds without moving or resizing the timeline clip", async () => {
  const source = html(),
    model = await Motion.open(source);
  try {
    const changed = model.patch("hf-a", { audio: { rate: 2 } });
    expect(model.clips.find((c) => c.id === "hf-a")).toMatchObject({
      start: 1,
      duration: 2,
      media: { maximum: 2, audio: { rate: 2, inPoint: 0, reason: null } },
    });
    expect(buildDocument(changed).gsapScript).toBe(buildDocument(source).gsapScript);
    expect(changed).not.toContain("data-volume");
    model.patch("hf-a", { duration: 1.5, audio: { rate: 2, inPoint: 1 } });
    expect(model.clips.find((c) => c.id === "hf-a")?.media?.maximum).toBe(1.5);
    model.patch("hf-a", { audio: { rate: 0.5 } });
    expect(model.clips.find((c) => c.id === "hf-a")).toMatchObject({
      start: 1,
      duration: 1.5,
      media: { maximum: 6, audio: { rate: 0.5, inPoint: 1 } },
    });
    model.patch("hf-a", { duration: 6 });
    expect(() => model.patch("hf-a", { duration: 6.01 })).toThrow("源素材");
  } finally {
    model.dispose();
  }
});
it("rejects an overrun before any rate, in-point, gain or mute write and accepts a coupled shorter window", async () => {
  const model = await Motion.open(html());
  try {
    const before = model.clips;
    expect(() => model.patch("hf-a", { audio: { rate: 2, inPoint: 1, volume: 0, muted: true } })).toThrow("源素材");
    expect(model.clips).toEqual(before);
    model.patch("hf-a", { duration: 1.5, audio: { rate: 2, inPoint: 1, volume: 0, muted: true } });
    expect(model.clips.find((c) => c.id === "hf-a")).toMatchObject({
      duration: 1.5,
      media: { maximum: 1.5, audio: { rate: 2, inPoint: 1, volume: 0, muted: true } },
    });
  } finally {
    model.dispose();
  }
});
it.each([0.1, 10])("accepts the native fixed-rate boundary %s without implicit clamping", async (rate) => {
  const model = await Motion.open(html());
  try {
    const result = model.patch("hf-a", { duration: 0.3, audio: { rate } });
    expect(result).toContain(`data-playback-rate="${rate}"`);
    expect(model.clips.find((c) => c.id === "hf-a")?.media?.maximum).toBe(4 / rate);
  } finally {
    model.dispose();
  }
});
it.each(["0", "0.099", "10.001", "2junk", "NaN", "", "0x2", "0b10"])(
  'keeps invalid authored rate "%s" read-only',
  async (rate) => {
    const model = await Motion.open(html().replace('data-playback-rate="1"', `data-playback-rate="${rate}"`));
    try {
      expect(model.clips.find((c) => c.id === "hf-a")?.media?.maximum).toBeNull();
      expect(() => model.patch("hf-a", { audio: { rate: 1 } })).toThrow("只读");
    } finally {
      model.dispose();
    }
  },
);
it("rejects invalid rate inputs instead of coercing or clamping them", () => {
  for (const rate of [0, -1, 0.099, 10.001, Infinity, NaN, "2"])
    expect(patchInput.safeParse({ html: html(), id: "hf-a", audio: { rate } }).success).toBe(false);
});
it.each([
  ["0.5", 0.5],
  ["2e0", 2],
  ["+1.0", 1],
] as const)("preserves a valid authored decimal rate %s when editing another field", async (raw, rate) => {
  const model = await Motion.open(html().replace('data-playback-rate="1"', `data-playback-rate="${raw}"`));
  try {
    expect(model.clips.find((c) => c.id === "hf-a")?.media).toMatchObject({
      maximum: 4 / rate,
      audio: { rate, reason: null },
    });
    expect(model.patch("hf-a", { audio: { volume: 0 } })).toContain(`data-playback-rate="${raw}"`);
  } finally {
    model.dispose();
  }
});
