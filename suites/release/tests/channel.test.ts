import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel } from "@odsuite/protocol";
import { expect, it } from "vitest";
import {
  channelDescriptor,
  decode,
  emit,
  encode,
  formatReleaseVersion,
  parse,
  parseReleaseVersion,
  releaseChannel,
  releaseMetadataVersionFields,
  resolve,
} from "@";

const product = { appid: "io.openmotion.fixture", name: "Open Motion Fixture", scheme: "motionfixture" };
it("normalizes data-defined release channels and reserves local for development", () => {
  for (const lane of ["stable", "prerelease", "beta", "qa2", "123", "qa1234567890"]) {
    expect(releaseChannel(lane)).toBe(lane);
  }
  expect(channel("local")).toBe("local");
  for (const lane of ["local", "Beta", "qa-2", "qa12345678901", "", "beta\n", " beta", "beta/../stable"]) {
    expect(() => releaseChannel(lane)).toThrow();
  }
});
it("roundtrips stable and counted versions with canonical safe integer fields", () => {
  for (const lane of ["stable", "prerelease", "qa2", "123"]) {
    for (const base of ["0.0.0", "1.2.3", "9007199254740991.0.0"]) {
      const version = formatReleaseVersion(lane, base, lane === "stable" ? undefined : 7);
      expect(parseReleaseVersion(version, lane)).toEqual({
        channel: lane,
        baseVersion: base,
        releaseVersion: version,
        ...(lane === "stable" ? {} : { number: 7 }),
      });
    }
  }
  expect(releaseMetadataVersionFields("stable", "1.2.3")).toEqual({
    baseVersion: "1.2.3",
    releaseVersion: "1.2.3",
    stableVersion: "1.2.3",
  });
  expect(releaseMetadataVersionFields("qa2", "1.2.3-qa2.7")).toEqual({
    baseVersion: "1.2.3",
    releaseVersion: "1.2.3-qa2.7",
    releaseNumber: 7,
  });
});
it("rejects ambiguous, out-of-range and channel-inconsistent release inputs", () => {
  for (const version of [
    "v1.2.3",
    "01.2.3",
    "1.2.3\n",
    "1.2.3+build",
    "1.2.3-beta",
    "1.2.3-beta.0",
    "1.2.3-beta.01",
    "1.2.3-stable.1",
    "1.2.3-local.1",
    "1.2.3-beta-internal.1",
    "1.2.3-beta.9007199254740992",
    "9007199254740992.0.0",
  ]) {
    expect(() => parseReleaseVersion(version)).toThrow();
  }
  expect(() => parseReleaseVersion("1.2.3-beta.1", "stable")).toThrow("mismatch");
  expect(() => parseReleaseVersion("1.2.3", "beta")).toThrow("mismatch");
  expect(() => formatReleaseVersion("stable", "1.2.3", 1)).toThrow();
  for (const number of [undefined, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => formatReleaseVersion("beta", "1.2.3", number)).toThrow();
  }
  expect(() => formatReleaseVersion("beta", "1.2.3\n", 1)).toThrow();
});
it("derives installation and storage identity from a product-owned channel descriptor", () => {
  const stable = channelDescriptor("stable", product),
    qa = channelDescriptor("qa2", product);
  expect(stable).toMatchObject({ ...product, channel: "stable", counted: false, storagePrefix: "stable" });
  expect(qa).toMatchObject({
    appid: "io.openmotion.fixture.qa2",
    name: "Open Motion Fixture Qa2",
    scheme: "motionfixture-qa2",
    origin: "motionfixture-qa2://carrier",
    counted: true,
    storagePrefix: "qa2",
  });
  expect(Object.isFrozen(qa)).toBe(true);
  for (const invalid of [
    { ...product, appid: "invalid" },
    { ...product, name: " " },
    { ...product, scheme: "bad scheme" },
  ]) {
    expect(() => channelDescriptor("stable", invalid)).toThrow();
  }
});
it("validates the same version/channel contract before resolution and manifest consumption", () => {
  const input = { channel: channel("beta"), version: "1.2.3-beta.7" };
  const manifest = resolve({}, input, product);
  expect(manifest.identity.appid).toBe("io.openmotion.fixture.beta");
  expect(decode(encode(manifest))).toEqual(manifest);
  expect(() => resolve({}, { ...input, version: "1.2.3" }, product)).toThrow("mismatch");
  expect(() => resolve({ version: () => "1.2.3" }, input, product)).toThrow("mismatch");
  expect(() => parse({ ...manifest, channel: "stable" })).toThrow("mismatch");
  expect(() =>
    decode(JSON.stringify({ ...manifest, identity: { ...manifest.identity, version: "1.2.3-qa2.7" } })),
  ).toThrow("mismatch");
});
it("preserves full counted identity in emitted build/runtime metadata and rejects drift", async () => {
  const root = await mkdtemp(join(tmpdir(), "release-channel-"));
  try {
    const manifest = resolve({}, { channel: channel("qa2"), version: "2.0.0-qa2.9" }, product);
    const file = await emit(root, manifest);
    const before = await readFile(file);
    expect(decode(before.toString())).toEqual(manifest);
    await expect(emit(root, { ...manifest, channel: channel("stable") })).rejects.toThrow("mismatch");
    expect(await readFile(file)).toEqual(before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
