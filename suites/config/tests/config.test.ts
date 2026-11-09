import { channel } from "@odsuite/protocol";
import { describe, expect, it } from "vitest";

import { define } from "@";

describe("config", () => {
  it("provides one optional capability entry", () => {
    const config = define({ name: ({ channel }) => `suite ${channel}` });
    expect(config.name?.({ channel: channel("stable"), version: "1.0.0" })).toBe("suite stable");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("rejects values outside the capability shape", () => {
    expect(() => define({ name: "suite" } as never)).toThrow("function");
  });
});
