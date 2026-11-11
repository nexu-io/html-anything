import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { KitCatalog, kitMetadata, kitPaths, signHead } from "@/kit.js";

async function fixture() {
  const base = resolve("../../.artifacts/kit-catalog");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "catalog-")),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("stable"), namespace: namespace("catalog") });
  const keys = generateKeyPairSync("ed25519"),
    privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString();
  const files = new Map<string, Uint8Array>(),
    requests: string[] = [];
  let origin = "",
    data = "",
    hold = "",
    unavailable = false;
  const server = createServer((req, res) => {
    requests.push(req.url!);
    if (unavailable) {
      res.writeHead(503);
      res.end();
      return;
    }
    if (req.url === hold) {
      res.writeHead(200);
      res.write(" ");
      return;
    }
    const bytes = files.get(req.url!);
    res.writeHead(bytes ? 200 : 404);
    res.end(bytes);
  });
  await factory.expose({
    identity: { service: "source", generation: digest("kit-source") },
    handlers: {},
    lifecycle: {
      initialize: async (ctx) => {
        data = ctx.roots.data;
        const port = await ctx.allocate({ kind: "port", name: "feed", scheme: "http" }),
          socket = await ctx.allocate({ kind: "socket", name: "feed" });
        await new Promise<void>((done, reject) => server.listen(socket.value, done).once("error", reject));
        await ctx.forward(port.value, socket.value);
        origin = port.value;
      },
      stop: async () => {
        server.closeAllConnections();
        await new Promise<void>((done, reject) => server.close((e) => (e ? reject(e) : done())));
      },
    },
  });
  const bytes = Buffer.from("candidate bytes"),
    make = (version = "1.1.0", revision = 1) =>
      kitMetadata({
        schema: 1,
        product: "io.test.app",
        channel: "stable",
        version,
        revision,
        source: null,
        fingerprint: "a".repeat(64),
        package: {
          name: "fixture-app",
          artifact: { kind: "blob", slot: "kit", bytes: bytes.length, digest: digest(bytes) },
        },
      });
  const publish = (value = make()) => {
    const paths = kitPaths(value),
      head = signHead(value, privatekey);
    files.set("/" + paths.head, Buffer.from(JSON.stringify(head)));
    files.set("/" + paths.metadata, Buffer.from(JSON.stringify(value)));
    files.set("/" + paths.object, bytes);
    return { value, head, paths };
  };
  const catalog = (key = publickey) =>
    new KitCatalog({ endpoint: origin, publickey: key, product: "io.test.app", channel: "stable", root: data });
  return {
    root,
    files,
    requests,
    bytes,
    make,
    publish,
    catalog,
    data,
    hold: (path: string) => {
      hold = path;
    },
    offline: () => {
      unavailable = true;
    },
    close: async () => {
      await manager.close();
      expect(await observeProcesses(root)).toEqual([]);
    },
  };
}

it("discovers signed metadata without downloading content, pins clones and survives reopen without regression", async () => {
  const f = await fixture();
  try {
    const first = f.publish(),
      c = f.catalog(),
      value = await c.refresh();
    expect(value).toEqual(first.value);
    expect(f.requests.filter((p) => p.includes("/objects/"))).toHaveLength(0);
    expect(await c.download(value)).toEqual(f.bytes);
    value.package.name = "tampered";
    await expect(c.download(value)).rejects.toThrow("not selected");
    expect((await c.refresh()).package.name).toBe("fixture-app");
    const second = f.publish(f.make("1.2.0", 2));
    await expect(c.refresh()).resolves.toEqual(second.value);
    const reopened = f.catalog();
    f.publish(first.value);
    await expect(reopened.refresh()).rejects.toThrow("regressed");
    f.publish(f.make("1.3.0", 2));
    await expect(reopened.refresh()).rejects.toThrow("conflicted");
    f.publish(f.make("1.2.0", 3));
    await expect(reopened.refresh()).rejects.toThrow("content changed");
    f.publish(f.make("1.0.0", 3));
    await expect(reopened.refresh()).rejects.toThrow("version regressed");
    f.publish(second.value);
    await expect(reopened.refresh()).resolves.toEqual(second.value);
    f.offline();
    await expect(reopened.refresh()).rejects.toThrow("503");
    expect(JSON.parse(await readFile(join(f.data, "kit-distribution.json"), "utf8")).metadata).toEqual(second.value);
  } finally {
    await f.close();
  }
});
it("rejects wrong signatures, metadata substitution, oversized bodies and corrupt package bytes", async () => {
  const f = await fixture();
  try {
    const p = f.publish(),
      c = f.catalog(),
      other = generateKeyPairSync("ed25519").publicKey.export({ format: "pem", type: "spki" }).toString();
    await expect(f.catalog(other).refresh()).rejects.toThrow("signature");
    f.files.set("/" + p.paths.metadata, Buffer.from(JSON.stringify({ ...p.value, fingerprint: "b".repeat(64) })));
    await expect(c.refresh()).rejects.toThrow("head mismatch");
    f.publish();
    await c.refresh();
    f.files.set("/" + p.paths.object, Buffer.from("wrong"));
    await expect(c.download(p.value)).rejects.toThrow("integrity");
    f.files.set("/" + p.paths.head, Buffer.alloc(32769, 32));
    await expect(c.refresh()).rejects.toThrow("limit");
  } finally {
    await f.close();
  }
});
it("cancels an actual pending metadata response without committing an unverified selection", async () => {
  const f = await fixture();
  try {
    const p = f.publish(),
      c = f.catalog();
    f.hold("/" + p.paths.metadata);
    const abort = new AbortController(),
      pending = c.refresh(abort.signal);
    await expect.poll(() => f.requests.includes("/" + p.paths.metadata)).toBe(true);
    abort.abort(Error("qualification cancelled"));
    await expect(pending).rejects.toThrow();
    await expect(readFile(join(f.data, "kit-distribution.json"))).rejects.toThrow();
    f.hold("");
    await expect(c.refresh()).resolves.toEqual(p.value);
  } finally {
    await f.close();
  }
});
it("keeps the kit contract closed and rejects oversized or foreign identities", () => {
  const value = {
    schema: 1,
    product: "io.test.app",
    channel: "stable",
    version: "1.0.0",
    revision: 1,
    source: null,
    fingerprint: "a".repeat(64),
    package: { name: "fixture-app", artifact: { kind: "blob", slot: "kit", bytes: 1, digest: digest("x") } },
  };
  expect(() => kitMetadata({ ...value, other: true })).toThrow();
  expect(() => kitMetadata({ ...value, channel: "beta" })).toThrow();
  expect(() =>
    kitMetadata({
      ...value,
      package: { ...value.package, artifact: { ...value.package.artifact, bytes: 64 * 1024 ** 2 + 1 } },
    }),
  ).toThrow();
  expect(() => kitMetadata({ ...value, product: "../escape" })).toThrow();
});
