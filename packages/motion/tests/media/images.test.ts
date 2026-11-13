import { expect, it } from "vitest";
import { Motion } from "@";

it.each(["media-start", "playback-start"])(
  "extends and trims an image without assigning a %s source clock",
  async (attribute) => {
    const html = `<main data-composition-id="main" data-width="320" data-height="180" data-duration="8"><img data-hf-id="photo" src="assets/photo.png" data-start="3" data-duration="2" data-${attribute}="0"></main>`,
      model = await Motion.open(html);
    try {
      const changed = model.patch("photo", { start: 1.5, duration: 3.5 });
      expect(changed).toContain(`data-${attribute}="0"`);
      expect(model.clips.find((c) => c.id === "photo")).toMatchObject({ start: 1.5, duration: 3.5 });
      const trimmed = model.patch("photo", { start: 2, duration: 3 });
      expect(model.clips.find((c) => c.id === "photo")).toMatchObject({ start: 2, duration: 3 });
      expect(trimmed).toContain(`data-${attribute}="0"`);
      expect(trimmed).not.toContain("data-playback-rate");
    } finally {
      model.dispose();
    }
  },
);
