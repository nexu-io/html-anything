import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { channel, digest, identify } from "@odsuite/protocol";
import { it } from "vitest";
import { compare, metadata, negotiate, ShellRequired, signHead, trustHead } from "@";

function fixture() {
  const artifact = (kind: "capsule" | "web" | "daemon") => ({
    kind,
    slot: "main",
    digest: digest(kind),
    bytes: kind.length,
  });
  const generation = {
    schema: 1 as const,
    carrier: 1,
    capsule: artifact("capsule"),
    web: artifact("web"),
    daemon: artifact("daemon"),
    blobs: [],
  };
  return {
    schema: 1,
    product: "io.openmotion.probe",
    channel: "stable",
    version: "2.0.0",
    revision: 1,
    minShellVersion: "1.2.0",
    content: { schema: 1, digest: identify(generation), generation },
    units: { capsule: "1.0.0", web: "1.0.0", daemon: "1.0.0" },
    shells: [{ platform: "mac", arch: "arm64", version: "2.0.0", digest: digest("shell"), bytes: 5, format: "zip" }],
  };
}
it("negotiates independent shell and content versions and rejects malformed compatibility contracts", () => {
  const value = metadata(fixture());
  assert.throws(() => metadata({ ...value, shells: [] }), /shell targets/);
  negotiate(value, "1.2.0", "mac", "arm64");
  assert.throws(
    () => negotiate(value, "1.1.9", "mac", "arm64"),
    (e) => e instanceof ShellRequired && e.shell?.version === "2.0.0",
  );
  assert.throws(() => metadata({ ...value, shells: [...value.shells, ...value.shells] }), /duplicate/);
  assert.throws(() => metadata({ ...value, minShellVersion: "3.0.0" }), /below minimum/);
  assert.throws(() => metadata({ ...value, minShellVersion: "1.0.0-preview.1" }), /channel mismatch/);
  assert.throws(() => metadata({ ...value, arbitrary: true }), /fields/);
  assert.equal(compare("1.2.0-preview.10", "1.2.0-preview.2", "preview"), 1);
});
it("binds signed heads to product, channel, version, revision and metadata digest", () => {
  const keys = generateKeyPairSync("ed25519"),
    value = metadata(fixture());
  const privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString();
  const head = signHead(value, privatekey),
    expected = { product: value.product, channel: channel("stable") };
  assert.deepEqual(trustHead(head, publickey, expected), head);
  for (const field of ["revision", "version", "metadata"] as const) {
    const changed = { ...head, [field]: field === "revision" ? 2 : field === "version" ? "3.0.0" : digest("tampered") };
    assert.throws(() => trustHead(changed, publickey, expected), /signature/);
  }
  assert.throws(() => trustHead(head, publickey, { ...expected, product: "io.foreign.product" }), /head/);
});
