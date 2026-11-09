import { expect, it } from "vitest";
import { create } from "@/capsule/index.js";

it("constructs separate product bodies with explicit initialize and stop", () => {
  const first = create(),
    second = create();
  expect(first).not.toBe(second);
  expect(typeof first.initialize).toBe("function");
  expect(typeof first.stop).toBe("function");
});
