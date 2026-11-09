import { expect, it } from "vitest";
import { decode, Environments, encode, environment } from "@";

const facts = {
  schema: 1 as const,
  carrier: "standalone",
  system: { platform: "linux", release: "6.1", arch: "x64" },
  runtime: { name: "node", version: "24.18.0" },
};
it("registers immutable facts per composition and round-trips them without collecting OS facts", () => {
  const registry = new Environments();
  const value = registry.register(facts);
  facts.system.release = "changed";
  expect(value.system.release).toBe("6.1");
  expect(Object.isFrozen(value.system)).toBe(true);
  expect(decode(encode(value))).toEqual(value);
  expect(registry.get("standalone")).toBe(value);
  expect(() => registry.register(value)).toThrow("already");
  expect(() => new Environments().get("standalone")).toThrow("not registered");
});
it("rejects resources and release identity as environment facts", () => {
  for (const extra of [{ namespace: "primary" }, { port: 4000 }, { pid: 42 }, { version: "1.0.0" }])
    expect(() => environment({ ...facts, ...extra })).toThrow();
  expect(() => environment({ ...facts, system: { ...facts.system, data: "/tmp/data" } })).toThrow();
  expect(() => decode('{"schema":0}')).toThrow();
});
