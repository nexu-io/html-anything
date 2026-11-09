import { PNG } from "pngjs";
import { expect, it } from "vitest";
import { imageDifference } from "@";

it("counts changed pixels independently of channels and rejects incompatible viewports", () => {
  const image = new PNG({ width: 2, height: 1 });
  image.data.fill(255);
  const original = PNG.sync.write(image);
  image.data[0] = 0;
  image.data[1] = 0;
  image.data[2] = 0;
  expect(imageDifference(original, PNG.sync.write(image))).toEqual({ width: 2, height: 1, changed: 1, ratio: 0.5 });
  expect(imageDifference(original, original).ratio).toBe(0);
  expect(() => imageDifference(original, PNG.sync.write(new PNG({ width: 1, height: 1 })))).toThrow("dimensions");
});
