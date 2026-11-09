import { expect, it } from "vitest";
import { editInput, Motion } from "@";
import { assembleProject } from "@/project/index.js";

const html =
  '<main data-composition-id="main" data-duration="5"></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:5})};</script>';
it("inserts typed native image/audio elements and trims audio without stretching its source", async () => {
  const model = await Motion.open(html);
  try {
    const image = model.edit({ html, action: "addImage", src: "assets/red.png", width: 32, height: 24 });
    expect(image).toContain('width="32"');
    expect(model.clips.find((c) => c.tag === "img")).toMatchObject({
      text: null,
      media: { kind: "image", src: "assets/red.png" },
      duration: 3,
    });
    model.edit({ html: image, action: "addAudio", src: "assets/tone.wav", duration: 2 });
    const audio = model.clips.find((c) => c.tag === "audio");
    if (!audio) throw Error("missing native audio");
    expect(audio).toMatchObject({ text: null, media: { kind: "audio", maximum: 2 }, duration: 2 });
    const trimmed = model.patch(audio.id, { start: 1, duration: 1 });
    expect(trimmed).toContain('data-source-duration="2"');
    expect(trimmed).toContain('data-playback-rate="1"');
    expect(model.clips.find((c) => c.id === audio.id)).toMatchObject({ start: 1, duration: 1 });
    expect(() => model.patch(audio.id, { duration: 3 })).toThrow("音频窗口");
    expect(() => model.patch(audio.id, { text: "not text" })).toThrow("媒体");
  } finally {
    model.dispose();
  }
});
it("rejects unproven audio clocks and nonlocal insertion sources instead of authoring arbitrary HTML", async () => {
  expect(
    editInput.safeParse({ html, action: "addImage", src: 'x" onerror="alert(1)', width: 32, height: 24 }).success,
  ).toBe(false);
  const model = await Motion.open(
    html.replace(
      "</main>",
      '<audio data-hf-id="hf-a" src="assets/tone.wav" data-start="0" data-duration="2" data-media-start="1" data-playback-rate="2" data-source-duration="4"></audio></main>',
    ),
  );
  try {
    expect(model.clips.find((clip) => clip.id === "hf-a")?.media?.maximum).toBeNull();
    expect(() => model.patch("hf-a", { duration: 1 })).toThrow("只读");
  } finally {
    model.dispose();
  }
});
it("assembles nested media through a finite snapshot manifest and rejects a missing replacement candidate", () => {
  const files = [
    {
      path: "index.html",
      content:
        '<main data-composition-id="main" data-duration="5"><section data-hf-id="host" data-composition-id="card" data-composition-src="scenes/card.html" data-start="0" data-duration="3"></section></main>',
    },
    {
      path: "scenes/card.html",
      content:
        '<template><main data-composition-id="card" data-duration="3"><img src="../assets/red.png" width="32" height="24" data-start="0" data-duration="3"></main></template>',
    },
  ];
  const result = assembleProject(files, [{ path: "assets/red.png", type: "image/png" }]);
  expect(result.html).toContain('src="assets/red.png"');
  expect(result.html).not.toContain('src="../assets/red.png"');
  expect(() => assembleProject(files)).toThrow("missing media resource");
});

it("keeps local media query/fragment semantics while rejecting encoded project escapes", () => {
  const source = (src: string) => [
    { path: "index.html", content: `<main data-composition-id="main" data-duration="3"><img src="${src}"></main>` },
  ];
  expect(
    assembleProject(source("assets/red.png?revision=1#sample"), [{ path: "assets/red.png", type: "image/png" }]).html,
  ).toContain("assets/red.png?revision=1#sample");
  for (const src of ["%2e%2e/escape.png", "https://example.invalid/red.png", "%252e%252e/red.png", "/assets/red.png"])
    expect(() => assembleProject(source(src), [{ path: "assets/red.png", type: "image/png" }])).toThrow();
});
