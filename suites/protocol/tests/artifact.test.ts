import { describe, expect, it } from "vitest";

import { canonical, digest, envelope, type Generation, identify, parse, verify } from "@";

function generation(): Generation {
  const item = (kind: "capsule" | "web" | "daemon" | "blob", slot: string, value: string) => ({
    bytes: Buffer.byteLength(value),
    digest: digest(value),
    kind,
    slot,
  });

  return {
    blobs: [item("blob", "model", "blob")],
    capsule: item("capsule", "capsule", "capsule"),
    carrier: 1,
    daemon: item("daemon", "daemon", "daemon"),
    schema: 1,
    web: item("web", "web", "web"),
  };
}

describe("artifact", () => {
  it("canonicalizes object keys before hashing", () => {
    expect(canonical({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(digest(canonical({ b: 2, a: 1 }))).toBe(digest(canonical({ a: 1, b: 2 })));
  });

  it("binds an envelope to the complete generation", () => {
    const value = generation();
    const wrapped = { digest: identify(value), generation: value, schema: 1 };

    expect(envelope(wrapped)).toEqual(wrapped);
    expect(() => envelope({ ...wrapped, digest: digest("tampered") })).toThrow("mismatch");
  });

  it("verifies both artifact size and bytes", () => {
    const item = generation().web;

    expect(verify(item, "web")).toBe(true);
    expect(verify(item, "Web")).toBe(false);
    expect(verify({ ...item, bytes: item.bytes + 1 }, "web")).toBe(false);
  });

  it("rejects mutable and ambiguous generation shapes", () => {
    const value = generation();
    const blobs = [
      { ...value.blobs[0], slot: "zeta" },
      { ...value.blobs[0], slot: "alpha" },
    ];

    expect(() => parse({ ...value, latest: true })).toThrow("invalid fields");
    expect(() => parse({ ...value, blobs })).toThrow("unique sorted slots");
    expect(() => parse({ ...value, web: { ...value.web, digest: "latest" } })).toThrow("sha256");
  });
});
