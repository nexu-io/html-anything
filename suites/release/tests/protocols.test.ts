import { expect, it } from "vitest";
import { channelDescriptor, protocolIdentity } from "@";

it("keeps application-local URLs stable while channel OS entry schemes diverge", () => {
  const product = { appid: "io.test.od", name: "OD", scheme: "od" };
  for (const lane of ["stable", "preview", "beta"]) {
    const identity = channelDescriptor(lane, product);
    expect(protocolIdentity({ channel: lane, identity })).toEqual({
      internal: "od",
      external: `od-${lane}`,
      origin: "od://carrier",
    });
  }
  expect(() => protocolIdentity({ channel: "preview", identity: { scheme: "od" } })).toThrow("inconsistent");
});
