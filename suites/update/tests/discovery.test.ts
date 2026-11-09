import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Library, type Resource, resourceKey } from "@odsuite/blob";
import {
  type Artifact,
  canonical,
  channel,
  digest,
  type Envelope,
  type Generation,
  identify,
  namespace,
} from "@odsuite/protocol";
import { Authority, Feed, type Release, writeFeed } from "@odsuite/publish";
import { Sources } from "@odsuite/serve";
import type { Context, Factory } from "@odsuite/sidecar";
import { serve } from "@odsuite/sidecar";
import { it } from "vitest";
import { type Status, watch } from "@/index.js";

function release(web: string, daemon = "daemon", capsule = "capsule"): Release {
  const assets = [
    { kind: "capsule", value: capsule },
    { kind: "web", value: web },
    { kind: "daemon", value: daemon },
  ].map(({ kind, value }) => ({
    artifact: {
      kind,
      slot: "main",
      bytes: Buffer.byteLength(
        canonical({
          schema: 1,
          files: [{ path: "fixture", mode: 0o644, bytes: Buffer.from(value).toString("base64") }],
        }),
      ),
      digest: digest(
        canonical({
          schema: 1,
          files: [{ path: "fixture", mode: 0o644, bytes: Buffer.from(value).toString("base64") }],
        }),
      ),
    },
    bytes: canonical({
      schema: 1,
      files: [{ path: "fixture", mode: 0o644, bytes: Buffer.from(value).toString("base64") }],
    }),
  }));
  const generation = {
    schema: 1,
    carrier: 1,
    capsule: assets[0]?.artifact,
    web: assets[1]?.artifact,
    daemon: assets[2]?.artifact,
    blobs: [],
  } as Generation;
  return { envelope: { schema: 1, generation, digest: identify(generation) }, assets: assets as Release["assets"] };
}
async function contentHost(factory: Factory, initial: Release) {
  let library!: Library;
  const attachment = await factory.expose({
    identity: { service: "electron", generation: initial.envelope.digest },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        library = await Library.open({ factory, context, name: "content", retentionMs: 0 });
      },
      stop: async () => {},
    },
  });
  const spec = (artifact: Artifact): Resource => ({ artifact, type: artifact.kind === "blob" ? "file" : "directory" });
  const list = (value: Envelope) => {
    const g = value.generation;
    return [g.capsule, g.daemon, g.web, ...g.blobs];
  };
  await library.retain("current", initial.envelope.digest, list(initial.envelope).map(spec));
  for (const a of initial.assets) await library.prefetch(spec(a.artifact), async () => Buffer.from(a.bytes));
  return {
    library,
    close: async () => {
      await library.close();
      await attachment.close();
    },
    host: {
      cacheContent: async (name: string, release: Release) =>
        library.session(async (l) => {
          await l.retain("prepared", name, list(release.envelope).map(spec));
          for (const a of release.assets) await l.prefetch(spec(a.artifact), async () => Buffer.from(a.bytes));
        }),
      releaseContent: (name: string) => library.session((l) => l.unretain("prepared", name)),
      cachedContent: (artifact: Artifact) =>
        library.session(async (l) =>
          (await l.status()).entries[resourceKey(spec(artifact))]?.phase === "ready"
            ? l.read(spec(artifact))
            : undefined,
        ),
      cachedRelease: (value: Envelope) =>
        library.session(async (l) => {
          const assets: Release["assets"] = [];
          for (const artifact of list(value)) assets.push({ artifact, bytes: await l.read(spec(artifact)) });
          return { envelope: value, assets };
        }),
    },
  };
}
async function until(read: () => Status, accept: (value: Status) => boolean) {
  const end = Date.now() + 5000;
  while (Date.now() < end) {
    const value = read();
    if (accept(value)) return value;
    await new Promise((done) => setTimeout(done, 10));
  }
  throw new Error(`discovery condition timeout: ${JSON.stringify(read())}`);
}

it("automatically prepares signed leaf candidates, rejects faults/regressions and cancels under sidecar lifetime", async () => {
  const root = await mkdtemp(join(tmpdir(), "discovery-")),
    content = join(root, "public");
  await mkdir(content);
  const pair = generateKeyPairSync("ed25519"),
    lane = channel("beta");
  const privatekey = pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const publickey = pair.publicKey.export({ format: "pem", type: "spki" }).toString();
  const authority = await Authority.open({ root: join(root, "authority"), privatekey });
  const initial = release("web1");
  await authority.publish(lane, 0, initial.envelope, initial.assets);
  const first = await writeFeed(authority, lane, content);
  const scope = { channel: lane, namespace: namespace("probe") };
  const source = await Sources.open({ data: join(root, "source"), scope, sources: { feed: { directory: content } } });
  const manager = await serve(join(root, "manager.sock"), { root: join(root, "manager") });
  const factory = manager.factory(scope),
    before = await factory.binding();
  const cache = await contentHost(factory, initial);
  const observer = await watch(
    {
      ...cache.host,
      anchor: initial.envelope.digest,
      get currentTarget() {
        return initial.envelope.digest;
      },
      content: async () => initial,
      expose: (name, options) =>
        factory.expose({ ...options, identity: { service: name, generation: initial.envelope.digest } }),
    },
    { endpoint: source.endpoints[0]?.url ?? "", publickey, intervalMs: 50, timeoutMs: 1500 },
  );
  try {
    await until(observer.status, (s) => s.phase === "idle" && s.checks > 0 && s.revision === 1);
    const next = release("web2");
    // Unchanged content is obtained from the verified seed cache, not fetched again.
    await source.fault("feed", {
      path: `/objects/${initial.envelope.generation.capsule.digest.slice(7)}`,
      mode: "missing",
    });
    await authority.publish(lane, 1, next.envelope, next.assets);
    await writeFeed(authority, lane, content);
    assert.deepEqual((await until(observer.status, (s) => s.phase === "prepared")).prepared?.changed, ["web"]);
    assert.equal((await observer.candidate())?.envelope.digest, next.envelope.digest);
    const copy = await observer.candidate();
    assert.ok(copy);
    copy.envelope.generation.carrier = 999;
    assert.equal((await observer.candidate())?.envelope.generation.carrier, 1);
    let revision = 2;
    for (const mode of ["missing", "corrupt", "truncate"] as const) {
      const incoming = release(`web-${mode}`),
        path = `/objects/${incoming.envelope.generation.web.digest.slice(7)}`;
      await source.fault("feed", { path, mode });
      await authority.publish(lane, revision++, incoming.envelope, incoming.assets);
      await writeFeed(authority, lane, content);
      const failure = await until(observer.status, (s) => s.phase === "failed" && s.revision === revision);
      assert.ok(failure.error);
      assert.equal(failure.current, initial.envelope.digest);
      assert.deepEqual(await factory.binding(), before);
      await source.fault("feed", null);
      await until(observer.status, (s) => s.phase === "prepared" && s.prepared?.target === incoming.envelope.digest);
    }
    const incompatible = release("web-bad", "daemon", "capsule2");
    await authority.publish(lane, revision++, incompatible.envelope, incompatible.assets);
    await writeFeed(authority, lane, content);
    assert.match(
      (await until(observer.status, (s) => s.phase === "failed" && s.revision === revision)).error ?? "",
      /requires capsule/,
    );
    await writeFile(join(content, "channels", lane), JSON.stringify(first));
    assert.match(
      (await until(observer.status, (s) => s.error?.includes("regressed") ?? false)).error ?? "",
      /regressed/,
    );
    const stalled = release("web-stalled");
    await source.fault("feed", { path: `/objects/${stalled.envelope.generation.web.digest.slice(7)}`, mode: "stall" });
    await authority.publish(lane, revision, stalled.envelope, stalled.assets);
    await writeFeed(authority, lane, content);
    const feed = new Feed(source.endpoints[0]?.url ?? "", publickey, { timeoutMs: 100 });
    const head = await feed.head(lane);
    assert.ok(head.head);
    await assert.rejects(feed.release(lane, head.head), /timeout/);
    await assert.rejects(
      new Feed(source.endpoints[0]?.url ?? "", publickey, { maxBytes: 1 }).release(lane, head.head),
      /limit/,
    );
    await until(observer.status, (s) => s.phase === "checking" && s.revision === revision + 1);
    const began = Date.now();
    await observer.close();
    assert.ok(Date.now() - began < 1000);
    assert.equal(observer.status().phase, "stopped");
    assert.ok((await cache.library.status()).references.every((r) => r.kind !== "prepared"));
    await assert.rejects(observer.check(), /stopped/);
    assert.deepEqual(await factory.binding(), before);
    assert.ok(!(await readFile(join(content, "channels", lane), "utf8")).includes("PRIVATE KEY"));
  } finally {
    await observer.close();
    await cache.close();
    await source.close();
    await manager.close();
    await rm(root, { recursive: true, force: true });
  }
}, 20000);

it("starts a fresh controller for background activation without retaining the initialize session", async () => {
  const root = await mkdtemp(join(tmpdir(), "activation-controller-")),
    content = join(root, "public");
  await mkdir(content);
  const pair = generateKeyPairSync("ed25519"),
    lane = channel("beta");
  const authority = await Authority.open({
    root: join(root, "authority"),
    privatekey: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  });
  const initial = release("one"),
    incoming = release("two");
  await authority.publish(lane, 0, initial.envelope, initial.assets);
  await writeFeed(authority, lane, content);
  const scope = { channel: lane, namespace: namespace("probe") };
  const source = await Sources.open({ data: join(root, "source"), scope, sources: { feed: { directory: content } } });
  const manager = await serve(join(root, "manager.sock"), { root: join(root, "manager") });
  const factory = manager.factory(scope);
  let context: Context | undefined;
  let applied = 0;
  let actual = initial;
  const cache = await contentHost(factory, initial);
  const observer = await watch(
    {
      ...cache.host,
      anchor: initial.envelope.digest,
      get currentTarget() {
        return actual.envelope.digest;
      },
      content: async () => actual,
      expose: (name, options) =>
        factory.expose({
          ...options,
          identity: { service: name, generation: initial.envelope.digest },
          lifecycle: {
            ...options.lifecycle,
            initialize: async (ctx) => {
              context = ctx;
              await options.lifecycle.initialize(ctx);
            },
          },
        }),
    },
    {
      endpoint: source.endpoints[0]?.url ?? "",
      publickey: pair.publicKey.export({ format: "pem", type: "spki" }).toString(),
      intervalMs: 50,
      activate: async (candidate) => {
        await factory.session(async (f) => {
          await f.grant({ kind: "data", name: "activation", scope: "factory" });
        });
        applied++;
        actual = candidate;
        if (applied > 1) throw new Error("commit persisted; cleanup failed");
        return { generation: candidate.envelope.digest };
      },
    },
  );
  try {
    await until(observer.status, (s) => s.revision === 1 && s.phase === "idle");
    assert.throws(() => context?.background(() => 1), /during initialization/);
    await authority.publish(lane, 1, incoming.envelope, incoming.assets);
    await writeFeed(authority, lane, content);
    await until(observer.status, (s) => s.current === incoming.envelope.digest && s.phase === "idle");
    assert.equal(applied, 1);
    const committed = release("three");
    await authority.publish(lane, 2, committed.envelope, committed.assets);
    await writeFeed(authority, lane, content);
    const failed = await until(observer.status, (s) => s.current === committed.envelope.digest && s.phase === "failed");
    assert.match(failed.error ?? "", /cleanup failed/);
    await new Promise((done) => setTimeout(done, 100));
    assert.equal(observer.status().current, committed.envelope.digest);
    assert.notEqual(observer.status().phase, "idle");
  } finally {
    await observer.close();
    await cache.close();
    await source.close();
    await manager.close();
    await rm(root, { recursive: true, force: true });
  }
});

it("keeps the stable Capsule observer separate and drains an accepted activation before taking its stop lane", async () => {
  const root = await mkdtemp(join(tmpdir(), "capsule-observer-")),
    content = join(root, "public");
  await mkdir(content);
  const keys = generateKeyPairSync("ed25519"),
    lane = channel("stable"),
    scope = { channel: lane, namespace: namespace("probe") };
  const authority = await Authority.open({
    root: join(root, "authority"),
    privatekey: keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  });
  const initial = release("web1");
  let actual = initial,
    entered = false,
    proceed = () => {};
  const gate = new Promise<void>((done) => {
    proceed = done;
  });
  await authority.publish(lane, 0, initial.envelope, initial.assets);
  await writeFeed(authority, lane, content);
  const sources = await Sources.open({ data: join(root, "sources"), scope, sources: { feed: { directory: content } } });
  const manager = await serve(join(root, "manager.sock"), { root: join(root, "state") }),
    factory = manager.factory(scope);
  const cache = await contentHost(factory, initial);
  const observer = await watch(
    {
      ...cache.host,
      anchor: initial.envelope.digest,
      get currentTarget() {
        return actual.envelope.digest;
      },
      content: async () => actual,
      expose: (name, options) =>
        factory.expose({ ...options, identity: { service: name, generation: initial.envelope.digest } }),
    },
    {
      layer: "capsule",
      endpoint: sources.endpoints[0]!.url,
      publickey: keys.publicKey.export({ format: "pem", type: "spki" }).toString(),
      intervalMs: 50,
      activate: async (candidate) => {
        entered = true;
        await gate;
        await factory.session(async (f) => {
          await f.grant({ kind: "data", name: "activation", scope: "factory" });
        });
        actual = candidate;
        return { generation: candidate.envelope.digest };
      },
    },
  );
  try {
    await until(observer.status, (s) => s.phase === "idle" && s.revision === 1);
    const leafOnly = release("web2");
    await authority.publish(lane, 1, leafOnly.envelope, leafOnly.assets);
    await writeFeed(authority, lane, content);
    await until(observer.status, (s) => s.phase === "idle" && s.revision === 2);
    assert.equal(entered, false);
    const candidate = release("web2", "daemon", "capsule2");
    await authority.publish(lane, 2, candidate.envelope, candidate.assets);
    await writeFeed(authority, lane, content);
    await until(observer.status, (s) => s.phase === "activating");
    assert.equal(entered, true);
    const closed = observer.close();
    await new Promise((done) => setTimeout(done, 25));
    proceed();
    await Promise.race([
      closed,
      new Promise((_, reject) => setTimeout(() => reject(Error("stop lane deadlocked")), 2000)),
    ]);
    assert.equal(actual.envelope.digest, candidate.envelope.digest);
    assert.equal(observer.status().phase, "stopped");
    assert.ok((await cache.library.status()).references.every((r) => r.kind !== "prepared"));
    const directory = await factory.directory();
    assert.equal(directory.instances.find((i) => i.service === "bootstrapupdates")?.phase, "retired");
    assert.ok(directory.instances.every((i) => i.service !== "capsule"));
  } finally {
    proceed();
    await observer.close();
    await manager.close();
    await sources.close();
    await rm(root, { recursive: true, force: true });
  }
}, 15000);
