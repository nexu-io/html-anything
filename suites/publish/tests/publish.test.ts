import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  type Artifact,
  channel,
  digest,
  type Envelope,
  type Generation,
  identify,
  type Kind,
  namespace,
} from "@odsuite/protocol";
import { Client, type Service as Sidecar, serve as sidecar } from "@odsuite/sidecar";
import { afterEach, describe, expect, it } from "vitest";

import { type Asset, Authority, Feed, type Service, serve } from "@";

const roots: string[] = [];
const services: Service[] = [];
const sidecars: Sidecar[] = [];

function artifact(kind: Kind, slot: string, bytes: string): Artifact {
  return { bytes: Buffer.byteLength(bytes), digest: digest(bytes), kind, slot };
}

function fixture(seed: string): { assets: Asset[]; envelope: Envelope } {
  const values = {
    blob: `${seed}blob`,
    capsule: `${seed}capsule`,
    daemon: `${seed}daemon`,
    web: `${seed}web`,
  };
  const generation: Generation = {
    blobs: [artifact("blob", "model", values.blob)],
    capsule: artifact("capsule", "main", values.capsule),
    carrier: 1,
    daemon: artifact("daemon", "main", values.daemon),
    schema: 1,
    web: artifact("web", "main", values.web),
  };
  const blob = generation.blobs[0];
  if (!blob) throw new Error("blob missing");
  return {
    assets: [
      { artifact: generation.capsule, bytes: values.capsule },
      { artifact: generation.daemon, bytes: values.daemon },
      { artifact: generation.web, bytes: values.web },
      { artifact: blob, bytes: values.blob },
    ],
    envelope: { digest: identify(generation), generation, schema: 1 },
  };
}

function keys(): { privatekey: string; publickey: string } {
  const pair = generateKeyPairSync("ed25519");
  return {
    privatekey: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publickey: pair.publicKey.export({ format: "pem", type: "spki" }).toString(),
  };
}

afterEach(async () => {
  await Promise.all(services.splice(0).map((service) => service.close()));
  await Promise.all(sidecars.splice(0).map((service) => service.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("publish", () => {
  it("publishes isolated channel heads through a trusted localhost feed", async () => {
    const root = await mkdtemp(join(tmpdir(), "publish-"));
    roots.push(root);
    const host = await sidecar(join(root, "sidecar.sock"));
    sidecars.push(host);
    const client = new Client(host.endpoint, host.authority);
    const scope = namespace("publisher");
    const data = await client.grant(
      { namespace: scope, channel: channel("stable") },
      { kind: "data", name: "publish", scope: "factory" },
    );
    const socket = await client.grant(
      { namespace: scope, channel: channel("stable") },
      {
        kind: "socket",
        name: "publish",
        owner: "server",
        scope: "attempt",
      },
    );
    const port = await client.grant(
      { namespace: scope, channel: channel("stable") },
      {
        kind: "port",
        name: "publish",
        owner: "server",
        scheme: "http",
        scope: "attempt",
      },
    );
    const trust = keys();
    const authority = await Authority.open({ privatekey: trust.privatekey, root: data.value });
    const server = await serve(authority, socket.value);
    services.push(server);
    await client.forward({ namespace: scope, channel: channel("stable") }, port.lease, socket.lease);
    const feed = new Feed(port.value, trust.publickey);
    const stable = channel("stable");
    const beta = channel("beta");
    const first = fixture("stable");
    const preview = fixture("beta");

    await authority.publish(stable, 0, first.envelope, first.assets);
    await authority.publish(beta, 0, preview.envelope, preview.assets);
    const head = await feed.head(stable);
    if (!head.head) throw new Error("stable head missing");
    const release = await feed.release(stable, head.head);

    expect(release.envelope).toEqual(first.envelope);
    expect(release.assets.map((asset) => Buffer.from(asset.bytes).toString())).toEqual([
      "stablecapsule",
      "stabledaemon",
      "stableweb",
      "stableblob",
    ]);
    expect((await feed.head(beta)).head?.generation).toBe(preview.envelope.digest);
    await expect(new Feed(port.value, keys().publickey).release(stable, head.head)).rejects.toThrow("trust");
    await writeFile(join(data.value, "objects", first.envelope.generation.web.digest.slice(7)), "tampered");
    await expect(feed.release(stable, head.head)).rejects.toThrow("integrity");
  });

  it("rejects stale publishers and restores persisted heads", async () => {
    const root = await mkdtemp(join(tmpdir(), "publish-"));
    roots.push(root);
    const trusted = keys();
    const authority = await Authority.open({ privatekey: trusted.privatekey, root });
    const lane = channel("stable");
    const first = fixture("first");
    const second = fixture("second");
    await authority.publish(lane, 0, first.envelope, first.assets);

    await expect(authority.publish(lane, 0, second.envelope, second.assets)).rejects.toThrow("conflict");
    expect((await Authority.open({ privatekey: trusted.privatekey, root })).read(lane)).resolves.toEqual(
      await authority.read(lane),
    );
  });
});
