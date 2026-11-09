import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel } from "@odsuite/protocol";
import { compose, resolve } from "@odsuite/release";
import { connectRoot, readDirectory } from "@odsuite/sidecar";
import { afterEach, expect, it } from "vitest";
import { Session, type SessionOptions, writeProduct } from "@";

const roots: string[] = [];
const sessions: Session[] = [];
afterEach(async () => {
  await Promise.all(sessions.splice(0).map((s) => s.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "runtime-"));
  roots.push(root);
  const manifest = resolve({}, { channel: channel("stable"), version: "1.0.0" });
  for (const name of ["capsule", "daemon", "web"]) await mkdir(join(root, name));
  await writeFile(
    join(root, "capsule/index.mjs"),
    'export function create(){return {handlers:{},ready:async()=>{},initialize:async c=>({loading:"Loading",window:{title:"fixture"},witness:c.generation}),stop:async()=>{}}}',
  );
  const sdk = fileURLToPath(new URL("../dist/index.mjs", import.meta.url));
  await writeFile(
    join(root, "daemon/main.mjs"),
    `import {serveDaemon} from ${JSON.stringify(new URL(`file://${sdk}`).href)}; await serveDaemon("daemon1");`,
  );
  await writeFile(join(root, "web/index.html"), "fixture");
  await writeFile(join(root, "model"), "model1");
  const product = await compose(manifest, {
    capsule: join(root, "capsule"),
    daemon: join(root, "daemon"),
    web: join(root, "web"),
    carrier: 1,
    blobs: [{ slot: "model", path: join(root, "model") }],
  });
  await writeProduct(join(root, "seed"), product);
  const options: SessionOptions = {
    carrier: 1,
    executable: process.execPath,
    manifest,
    namespace: "fixture",
    root: join(root, "state"),
    seed: join(root, "seed"),
  };
  return { root, options, product };
}

it("executes the payload, binds daemon evidence and preserves data across cold starts", async () => {
  const { options, product } = await fixture();
  const first = await Session.open(options);
  sessions.push(first);
  const payload = await first.activate();
  expect(payload.witness).toBe(product.envelope.digest);
  await first.start();
  await first.request("write", { value: "retained" });
  const receipt = await first.confirm(payload, "renderer1");
  expect(receipt.daemon).toMatchObject({ generation: receipt.generation, nonce: receipt.nonce, witness: "daemon1" });
  await first.expose<{ echo: { input: unknown; output: unknown } }>("probe", {
    handlers: { echo: (value) => value },
    lifecycle: { initialize: async () => {}, stop: async () => {} },
  });
  const { factory } = await connectRoot(options.root, receipt.factory);
  const probe = await factory.connect<{ echo: { input: unknown; output: unknown } }>({
    service: "probe",
    generation: receipt.generation,
  });
  expect(await probe.call("echo", { nonce: receipt.nonce })).toEqual({ nonce: receipt.nonce });
  expect(await first.close()).toEqual({ status: "stopped", survivors: [] });
  await expect(first.request("health")).rejects.toThrow("closed");
  const second = await Session.open(options);
  sessions.push(second);
  await second.activate();
  await second.start();
  expect(await second.request("read")).toEqual({ value: "retained" });
  expect(second.mount.target).toBe(receipt.generation);
  expect(second.nonce).not.toBe(receipt.nonce);
}, 20000);

it("blocks after a failed attempt and requires explicit recovery", async () => {
  const { options } = await fixture();
  const first = await Session.open(options);
  sessions.push(first);
  const payload = await first.activate();
  await first.start();
  await first.confirm(payload, "renderer");
  await first.close();
  const next = await Session.open({ ...options, recover: true });
  sessions.push(next);
  await next.close("injected failure");
  await expect(Session.open(options)).rejects.toThrow("blocked");
  const recovered = await Session.open({ ...options, recover: true });
  sessions.push(recovered);
  const composition = await recovered.activate();
  await recovered.start();
  await recovered.confirm(composition, "renderer");
}, 20000);

it("rejects incompatible carrier requirements before an activation attempt", async () => {
  const { options, product, root } = await fixture();
  const { identify } = await import("@odsuite/protocol");
  product.envelope.generation.carrier = 999;
  product.envelope.digest = identify(product.envelope.generation);
  await writeProduct(join(root, "bad"), product);
  await expect(Session.open({ ...options, candidate: join(root, "bad") })).rejects.toThrow("incompatible");
  const valid = await Session.open(options);
  sessions.push(valid);
  expect(valid.mount.target).not.toBe(product.envelope.digest);
});

it("keeps same-namespace channels isolated and preserves factory data across product versions", async () => {
  const { options, root } = await fixture();
  const run = async (manifest: SessionOptions["manifest"], seed: string, expected: unknown, value: string) => {
    const session = await Session.open({ ...options, manifest, seed, candidate: seed });
    sessions.push(session);
    const payload = await session.activate();
    await session.start();
    expect(await session.request("read")).toEqual(expected);
    await session.request("write", { value });
    const receipt = await session.confirm(payload, "renderer");
    expect(receipt.factory).toEqual({ namespace: "fixture", channel: manifest.channel });
    expect(receipt.directory.instances).toContainEqual(
      expect.objectContaining({
        kind: "process",
        service: "daemon",
        namespace: "fixture",
        channel: manifest.channel,
        generation: receipt.units.daemon.digest,
        pid: receipt.daemon.pid,
        phase: "ready",
      }),
    );
    await session.close();
    return receipt;
  };
  const seed = async (lane: string, version: string) => {
    const manifest = resolve({}, { channel: channel(lane), version });
    const product = await compose(manifest, {
      carrier: 1,
      capsule: join(root, "capsule"),
      daemon: join(root, "daemon"),
      web: join(root, "web"),
    });
    const path = join(root, version);
    await writeProduct(path, product);
    return { manifest, path };
  };
  const first = await run(options.manifest, options.seed, {}, "stable1");
  const beta = await seed("beta", "1.0.0-beta.1");
  await run(beta.manifest, beta.path, {}, "beta1");
  const next = await seed("stable", "2.0.0");
  const upgraded = await run(next.manifest, next.path, { value: "stable1" }, "stable2");
  expect(upgraded.generation).not.toBe(first.generation);
  await run(beta.manifest, beta.path, { value: "beta1" }, "beta2");
  const directory = await readDirectory(options.root);
  expect(directory.manager.phase).toBe("closed");
  expect(directory.factories.map((f) => [f.channel, f.namespace, f.phase]).sort()).toEqual([
    ["beta", "fixture", "closed"],
    ["stable", "fixture", "closed"],
  ]);
  expect(directory.instances.every((i) => i.phase === "retired")).toBe(true);
}, 30000);

it("rejects a foreign channel candidate before creating factory resources", async () => {
  const { root, options, product } = await fixture();
  const manifest = resolve({}, { channel: channel("beta"), version: "1.0.0-beta.1" });
  await writeProduct(join(root, "foreign"), { ...product, manifest });
  await expect(Session.open({ ...options, candidate: join(root, "foreign") })).rejects.toThrow("identity mismatch");
  const directory = await readDirectory(options.root);
  expect(directory.factories.every((f) => f.phase === "unopened")).toBe(true);
  expect(directory.instances).toEqual([]);
});
