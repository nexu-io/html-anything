import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Library } from "@odsuite/blob";

import { type Channel, channel, digest, gates, namespace } from "@odsuite/protocol";
import { Authority, Feed, type Service, serve } from "@odsuite/publish";
import { compose, resolve } from "@odsuite/release";
import { Client, type Service as Sidecar, serve as sidecar } from "@odsuite/sidecar";
import { afterEach, describe, expect, it } from "vitest";

import { Generations } from "@";

const libraries: Library[] = [];
const roots: string[] = [];
const services: Service[] = [];
const sidecars: Sidecar[] = [];

async function product(lane: Channel, version: string, model: string) {
  return compose(resolve({}, { channel: lane, version }), {
    blobs: [{ path: model, slot: "model" }],
    capsule: dirname(fileURLToPath(import.meta.resolve("@odsuite/runtime"))),
    carrier: 1,
    daemon: dirname(fileURLToPath(import.meta.resolve("@open-motion/daemon"))),
    web: dirname(fileURLToPath(import.meta.resolve("@open-motion/web"))),
  });
}

async function commit(capsule: Generations, feed: Feed): Promise<void> {
  let attempt = await capsule.update(feed);
  if (!attempt) throw new Error("update missing");
  for (const gate of gates) attempt = await capsule.ready(attempt, gate);
  await capsule.commit(attempt);
}

afterEach(async () => {
  await Promise.all(libraries.splice(0).map((library) => library.close()));
  await Promise.all(services.splice(0).map((service) => service.close()));
  await Promise.all(sidecars.splice(0).map((service) => service.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("update", () => {
  it("isolates channel updates and preserves current after a failed upgrade", async () => {
    const root = await mkdtemp(join(tmpdir(), "update-"));
    roots.push(root);
    const host = await sidecar(join(root, "sidecar.sock"));
    sidecars.push(host);
    const client = new Client(host.endpoint, host.authority);
    const release = namespace("release");
    const data = await client.grant(
      { namespace: release, channel: channel("stable") },
      { kind: "data", name: "publish", scope: "factory" },
    );
    const socket = await client.grant(
      { namespace: release, channel: channel("stable") },
      {
        kind: "socket",
        name: "publish",
        owner: "server",
        scope: "attempt",
      },
    );
    const port = await client.grant(
      { namespace: release, channel: channel("stable") },
      {
        kind: "port",
        name: "publish",
        owner: "server",
        scheme: "http",
        scope: "attempt",
      },
    );
    const pair = generateKeyPairSync("ed25519");
    const privatekey = pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
    const publickey = pair.publicKey.export({ format: "pem", type: "spki" }).toString();
    const authority = await Authority.open({ privatekey, root: data.value });
    const server = await serve(authority, socket.value);
    services.push(server);
    await client.forward({ namespace: release, channel: channel("stable") }, port.lease, socket.lease);
    const feed = new Feed(port.value, publickey);
    const stable = channel("stable");
    const beta = channel("beta");
    const model = join(root, "model.bin");
    await writeFile(model, "model");
    const first = await product(stable, "1.0.0", model);
    const preview = await product(beta, "1.0.0-beta.1", model);
    await authority.publish(stable, 0, first.envelope, first.assets);
    await authority.publish(beta, 0, preview.envelope, preview.assets);
    const managed = async (lane: Channel) => {
      const factory = host.factory({ namespace: namespace("primary"), channel: lane });
      let library!: Library;
      await factory.expose({
        identity: { service: "electron", generation: digest(lane) },
        handlers: {},
        lifecycle: {
          initialize: async (context) => {
            library = await Library.open({ factory, context, name: "content" });
          },
          stop: async () => {},
        },
      });
      libraries.push(library);
      return new Generations(client, namespace("primary"), lane, library);
    };
    const primary = await managed(stable);
    const secondary = await managed(beta);

    await commit(primary, feed);
    await commit(secondary, feed);
    expect((await client.binding(namespace("primary"), stable)).state.current).toBe(first.envelope.digest);
    expect((await client.binding(namespace("primary"), beta)).state.current).toBe(preview.envelope.digest);
    const mounted = await primary.mount();
    expect(JSON.parse(await readFile(join(mounted.capsule, "release.json"), "utf8"))).toMatchObject({
      channel: "stable",
      identity: { version: "1.0.0" },
    });
    expect((await primary.mount()).target).toBe(mounted.target);
    const originalWeb = await readFile(join(mounted.web, "index.html"));
    await writeFile(join(mounted.web, "index.html"), "tampered");
    await expect(primary.mount()).rejects.toThrow("materialization integrity mismatch");
    await writeFile(join(mounted.web, "index.html"), originalWeb);
    await primary.resources.library.prefetch(
      { type: "directory", artifact: first.envelope.generation.web },
      async () => {
        throw Error("verified CAS must be reused");
      },
    );
    expect((await primary.mount()).target).toBe(mounted.target);
    expect(await primary.update(feed)).toBeUndefined();

    const second = await product(stable, "2.0.0", model);
    await authority.publish(stable, 1, second.envelope, second.assets);
    const forged = generateKeyPairSync("ed25519").publicKey.export({ format: "pem", type: "spki" }).toString();
    await expect(primary.update(new Feed(port.value, forged))).rejects.toThrow("trust");
    const attempt = await primary.update(feed);
    if (!attempt) throw new Error("second update missing");
    const candidate = await primary.prepare(attempt);
    expect(JSON.parse(await readFile(join(candidate.capsule, "release.json"), "utf8"))).toMatchObject({
      identity: { version: "2.0.0" },
    });
    await expect(primary.prepare({ ...attempt, nonce: "forged" })).rejects.toThrow("identity");
    await primary.fail(attempt, "daemon timeout");

    expect((await client.binding(namespace("primary"), stable)).state.current).toBe(first.envelope.digest);
    expect((await client.binding(namespace("primary"), beta)).state.current).toBe(preview.envelope.digest);
    await expect(primary.mount()).rejects.toThrow("blocked");
  }, 20000);
});
