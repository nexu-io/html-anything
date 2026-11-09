import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { define } from "@odsuite/config";
import { channel } from "@odsuite/protocol";
import { describe, expect, it } from "vitest";

import { decode, distinct, emit, emitBuildUnit, encode, parse, resolve } from "@";

it("emits channel versions centrally while distinguishing build markers from release identities", async () => {
  const root = await mkdtemp(join(tmpdir(), "unit-build-"));
  const defaults = { kind: "web" as const, baseVersion: "0.1.0", api: "probe/1" };
  await emitBuildUnit(root, defaults, { ODSUITE_BUILD: "1.2.3-preview.4" });
  expect(JSON.parse(await readFile(join(root, "unit.json"), "utf8"))).toMatchObject({
    version: "1.2.3-preview.4",
    api: "probe/1",
  });
  await emitBuildUnit(root, defaults, { ODSUITE_BUILD: "fixture" });
  expect(JSON.parse(await readFile(join(root, "unit.json"), "utf8"))).toMatchObject({ version: "0.1.0" });
  await expect(emitBuildUnit(root, defaults, { ODSUITE_UNIT_VERSION: "1.x" })).rejects.toThrow();
});

describe("release", () => {
  it("derives independent installation identity per channel", () => {
    const config = define();
    const stable = resolve(config, { channel: channel("stable"), version: "1.2.3" });
    const beta = resolve(config, { channel: channel("beta"), version: "1.2.3-beta.1" });

    expect(stable.identity).toMatchObject({
      appid: "io.openmotion.app",
      name: "open-motion",
      origin: "open-motion://carrier",
      scheme: "open-motion",
    });
    expect(beta.identity.appid).toBe("io.openmotion.app.beta");
    expect(() => distinct([stable, beta])).not.toThrow();
  });

  it("resolves optional capabilities through the same context", () => {
    const seen: string[] = [];
    const config = define({
      name: ({ channel }) => `Motion ${channel}`,
      scheme: ({ channel }) => `odsuite-${channel}`,
      version: ({ channel, version }) => {
        seen.push(channel);
        return version;
      },
    });
    const manifest = resolve(config, { channel: channel("canary"), version: "2.0.0-canary.1" });

    expect(manifest.identity).toMatchObject({
      name: "Motion canary",
      origin: "odsuite-canary://carrier",
      scheme: "odsuite-canary",
      version: "2.0.0-canary.1",
    });
    expect(seen).toEqual(["canary", "canary"]);
  });

  it("rejects nondeterminism and invalid platform identity", () => {
    let call = 0;
    const input = { channel: channel("stable"), version: "1.0.0" };

    expect(() =>
      resolve(
        define({
          name: () => {
            call += 1;
            return String(call);
          },
        }),
        input,
      ),
    ).toThrow("deterministic");
    expect(() => resolve(define({ scheme: () => "Bad Scheme" }), input)).toThrow("scheme");
    expect(() => resolve(define(), { ...input, version: "latest" })).toThrow("version");
  });

  it("rejects runtime manifests that drift from resolved identity", () => {
    const manifest = resolve(define(), { channel: channel("stable"), version: "1.0.0" });

    expect(() => parse({ ...manifest, extra: true })).toThrow("fields");
    expect(() =>
      parse({
        ...manifest,
        identity: { ...manifest.identity, origin: "other://carrier" },
      }),
    ).toThrow("inconsistent");
    expect(() =>
      parse({
        ...manifest,
        identity: { ...manifest.identity, version: "latest" },
      }),
    ).toThrow("version");
    expect(() => distinct([manifest, manifest])).toThrow("collision");
  });

  it("roundtrips one canonical build and runtime manifest", () => {
    const manifest = resolve(define(), { channel: channel("stable"), version: "1.0.0" });
    expect(decode(encode(manifest))).toEqual(manifest);
    expect(encode(manifest)).toBe(`${JSON.stringify(manifest)}\n`);
  });

  it("emits release identity outside source manifests", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-release-"));
    const manifest = resolve(define(), { channel: channel("stable"), version: "3.2.1" });
    const path = await emit(root, manifest);

    expect(decode(await readFile(path, "utf8"))).toEqual(manifest);
    expect(path).toBe(join(root, "release.json"));
  });
});
