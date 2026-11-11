import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { kitMetadata, kitPaths, signHead } from "@odsuite/distribution/kit";
import { open } from "@odsuite/installer";
import { npm } from "@odsuite/pack/npm";
import { channel, digest, namespace } from "@odsuite/protocol";
import { bundle, resolve as release } from "@odsuite/release";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { hash, type PackageManifest, type Selection } from "@/contract.js";
import { candidate } from "@/update/candidate.js";
import { collect } from "@/update/gc.js";
import { type Operation, updates } from "@/update/index.js";
import type { Options } from "@/update/plan.js";

async function fixture() {
  const base = resolve("../../.artifacts/kit-application");
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(join(base, "candidate-")),
    scope = { channel: channel("stable"), namespace: namespace("candidate") },
    home = join(root, "installation"),
    data = join(root, "runtime");
  const build = async (version: string, extra = false) => {
    const files: Record<string, Uint8Array> = {},
      carriers: PackageManifest["carriers"] = {} as PackageManifest["carriers"];
    for (const c of ["standalone", "codexplugin"] as const) {
      const path = join(root, c + version);
      await mkdir(path);
      const required = [
        "main.mjs",
        "LICENSE",
        "NOTICE",
        "web/index.html",
        "daemon/main.mjs",
        "render/worker.mjs",
        ...(c === "codexplugin" ? [".codex-plugin/plugin.json", "mcp.json"] : []),
      ];
      for (const name of required) {
        await mkdir(join(path, name, ".."), { recursive: true });
        await writeFile(
          join(path, name),
          name === "main.mjs" ? "#!/usr/bin/env node\nexport const fixture=true;" : "fixture bytes",
        );
      }
      await writeFile(
        join(path, "runtime.json"),
        JSON.stringify({ carrier: c, version, channel: "stable", files: required }),
      );
      const bytes = await bundle(path);
      files[`payload/${c}.bundle`] = bytes;
      carriers[c] = { file: `${c}.bundle`, bytes: bytes.length, sha256: hash(bytes) };
    }
    const manifest: PackageManifest = {
      schemaVersion: 1,
      product: { appid: "io.test.app", name: "Test", scheme: "test" },
      release: release({}, { version, channel: scope.channel }, { appid: "io.test.app", name: "Test", scheme: "test" }),
      namespace: scope.namespace,
      carriers,
    };
    files["payload/manifest.json"] = Buffer.from(JSON.stringify(manifest));
    for (const name of ["LICENSE", "NOTICE", "main.mjs", "codex-worker.mjs"])
      files["dist/" + name] = Buffer.from(
        name === "main.mjs" ? '#!/usr/bin/env node\nconsole.log("candidate must not run");' : "fixture bytes",
      );
    if (extra) files["extra.mjs"] = Buffer.from('throw Error("must not execute");');
    const archive = await npm({
      name: "fixture-app",
      version,
      license: "Apache-2.0",
      bin: { odsuite: "dist/main.mjs" },
      files,
      output: join(root, version + ".tgz"),
    });
    return { manifest, files, archive, bytes: await readFile(archive.path) };
  };
  const current = await build("1.0.0"),
    next = await build("2.0.0"),
    bad = await build("3.0.0", true),
    selected = await open({ home, product: "io.test.app", scope });
  try {
    for (const c of ["standalone", "codexplugin"] as const)
      await selected.install({
        data,
        requestId: randomUUID(),
        source: { bytes: current.files[`payload/${c}.bundle`]!, sha256: current.manifest.carriers[c].sha256 },
      });
  } finally {
    await selected.close();
  }
  const managerRoot = join(root, "feed"),
    manager = await serve(managerEndpoint(managerRoot), { root: managerRoot }),
    factory = manager.factory(scope),
    keys = generateKeyPairSync("ed25519"),
    privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString(),
    contents = new Map<string, Uint8Array>();
  let origin = "",
    objects = 0,
    hold = false,
    offline = false;
  const server = createServer((req, res) => {
    if (offline) {
      res.writeHead(503);
      res.end();
      return;
    }
    if (req.url?.includes("/objects/")) {
      objects++;
      if (hold) {
        res.writeHead(200);
        res.write(" ");
        return;
      }
    }
    const b = contents.get(req.url!);
    res.writeHead(b ? 200 : 404);
    res.end(b);
  });
  await factory.expose({
    identity: { service: "source", generation: digest("kit-application-feed") },
    handlers: {},
    lifecycle: {
      initialize: async (ctx) => {
        const port = await ctx.allocate({ kind: "port", name: "source", scheme: "http" }),
          socket = await ctx.allocate({ kind: "socket", name: "source" });
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
  const publish = (value = next, revision = 1) => {
    const metadata = kitMetadata({
      schema: 1,
      product: "io.test.app",
      channel: "stable",
      version: value.manifest.release.identity.version,
      revision,
      source: null,
      fingerprint: "a".repeat(64),
      package: {
        name: "fixture-app",
        artifact: { kind: "blob", slot: "kit", bytes: value.bytes.length, digest: digest(value.bytes) },
      },
    });
    const paths = kitPaths(metadata);
    contents.set("/" + paths.head, Buffer.from(JSON.stringify(signHead(metadata, privatekey))));
    contents.set("/" + paths.metadata, Buffer.from(JSON.stringify(metadata)));
    contents.set("/" + paths.object, value.bytes);
    return metadata;
  };
  const selection: Selection = {
    home,
    data,
    scope,
    carrier: "standalone",
    profile: join(root, "profile"),
    skills: join(root, "skills"),
  };
  const options = { endpoint: origin, publickey, name: "fixture-app" };
  const run = (op: Operation, signal?: AbortSignal, extra: Partial<Options> = {}) =>
    updates(current.manifest, selection, op, { ...options, ...extra }, signal);
  const inspect = async () => {
    const session = await open({ home, product: "io.test.app", scope });
    try {
      const grants = (await session.factory.resources()).grants,
        entry = grants.find((g) => g.kind === "data" && g.name === "kits")!;
      const state = entry
        ? JSON.parse(await readFile(join(entry.value, "library.json"), "utf8"))
        : { entries: {}, references: [] };
      return { state, receipts: await Promise.all(["standalone", "codexplugin"].map((c) => session.read(c))) };
    } finally {
      await session.close();
    }
  };
  return {
    root,
    home,
    data,
    scope,
    current,
    next,
    bad,
    contents,
    publish,
    run,
    inspect,
    collect: (
      description: PackageManifest,
      operation: "plan" | "apply" | "status",
      extra: { requestId?: string; expected?: string } = {},
    ) => collect(description, selection, operation, { worker: resolve("dist/codex-worker.mjs"), ...extra }),
    get objects() {
      return objects;
    },
    offline: () => {
      offline = true;
    },
    later: async () => {
      const session = await open({ home, product: "io.test.app", scope });
      try {
        for (const c of ["standalone", "codexplugin"] as const)
          await session.install({
            data,
            requestId: randomUUID(),
            source: { bytes: bad.files[`payload/${c}.bundle`]!, sha256: bad.manifest.carriers[c].sha256 },
          });
      } finally {
        await session.close();
      }
    },
    hold: (v: boolean) => {
      hold = v;
    },
    close: async () => {
      await manager.close();
      expect(await observeProcesses(managerRoot)).toEqual([]);
      expect((await readDirectory(join(home, "authority", "io.test.app"))).manager.phase).toBe("closed");
      expect(await observeProcesses(join(home, "authority", "io.test.app"))).toEqual([]);
    },
  };
}

it("prepares verified inert kit bytes, reuses cache after owner reopen and discards only its prepared reference", async () => {
  const f = await fixture();
  try {
    const metadata = f.publish();
    expect((await f.run("check")).state).toBe("available");
    expect(f.objects).toBe(0);
    const before = await f.inspect();
    expect((await f.run("prepare")).state).toBe("prepared");
    expect(f.objects).toBe(1);
    const prepared = await f.inspect();
    expect(prepared.receipts).toEqual(before.receipts);
    expect(prepared.state.references).toEqual([{ kind: "prepared", name: "application", keys: [expect.any(String)] }]);
    expect(Object.values(prepared.state.entries).every((e: any) => e.uses.length === 0)).toBe(true);
    expect((await f.run("prepare")).state).toBe("prepared");
    expect(f.objects).toBe(1);
    const bad = f.publish(f.bad, 2);
    expect(() => candidate(f.bad.bytes, bad, f.current.manifest)).toThrow("identity");
    await expect(f.run("prepare")).rejects.toThrow("identity");
    expect((await f.inspect()).state.references).toEqual(prepared.state.references);
    expect((await f.run("discard")).state).toBe("discarded");
    const discarded = await f.inspect();
    expect(discarded.state.references).toEqual([]);
    expect(discarded.receipts).toEqual(before.receipts);
    expect(metadata.package.artifact.digest).toBe(digest(f.next.bytes));
  } finally {
    await f.close();
  }
}, 30000);
it("aborts a real candidate transfer, leaves the installed selections intact and retries without pinning failure", async () => {
  const f = await fixture();
  try {
    f.publish();
    const before = await f.inspect();
    f.hold(true);
    const controller = new AbortController(),
      pending = f.run("prepare", controller.signal);
    await expect.poll(() => f.objects).toBe(1);
    controller.abort(Error("cancel candidate"));
    await expect(pending).rejects.toThrow();
    const cancelled = await f.inspect();
    expect(cancelled.receipts).toEqual(before.receipts);
    expect(cancelled.state.references).toEqual([]);
    f.hold(false);
    expect((await f.run("prepare")).state).toBe("prepared");
  } finally {
    await f.close();
  }
}, 30000);

it("activates offline after a partial selection commit and replays completed intent without rewinding", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  try {
    f.publish();
    await f.run("prepare");
    f.offline();
    await expect(
      f.run("activate", undefined, {
        requestId,
        onCheckpoint: async (phase) => {
          if (phase === "selected") throw Error("checkpoint interrupted");
        },
      }),
    ).rejects.toThrow("checkpoint interrupted");
    expect((await f.inspect()).receipts.every((r) => r?.version === "2.0.0")).toBe(true);
    await expect(f.run("discard")).rejects.toThrow("resume first");
    await expect(f.run("activate", undefined, { requestId: randomUUID() })).rejects.toThrow("resume first");
    expect(await f.run("status", undefined, { requestId })).toMatchObject({
      state: "pending",
      phase: "selected",
      version: "2.0.0",
    });
    const done = await f.run("activate", undefined, { requestId });
    expect(done).toMatchObject({ state: "activated", version: "2.0.0" });
    expect((await f.inspect()).state.references).toEqual([]);
    await expect(readFile(join(f.data, "manager.sqlite"))).rejects.toThrow();
    await f.later();
    expect(await f.run("activate", undefined, { requestId })).toEqual(done);
    expect((await f.inspect()).receipts.every((r) => r?.version === "3.0.0")).toBe(true);
  } finally {
    await f.close();
  }
}, 30000);
it("preserves the prior signed prepared candidate when a newer candidate fails validation", async () => {
  const f = await fixture();
  try {
    f.publish();
    await f.run("prepare");
    f.publish(f.bad, 2);
    await expect(f.run("prepare")).rejects.toThrow("identity");
    f.offline();
    expect(await f.run("activate", undefined, { requestId: randomUUID() })).toMatchObject({
      state: "activated",
      version: "2.0.0",
    });
    expect((await f.inspect()).receipts.every((r) => r?.version === "2.0.0")).toBe(true);
  } finally {
    await f.close();
  }
}, 30000);

it("keeps both old selections after a staged interruption and resumes only the original intent", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  try {
    f.publish();
    await f.run("prepare");
    await expect(
      f.run("activate", undefined, {
        requestId,
        onCheckpoint: async (phase) => {
          if (phase === "staged") throw Error("staged interruption");
        },
      }),
    ).rejects.toThrow("staged interruption");
    expect((await f.inspect()).receipts.every((r) => r?.version === "1.0.0")).toBe(true);
    await expect(f.run("activate", undefined, { requestId, name: "foreign-app" })).rejects.toThrow("intent differs");
    expect(await f.run("status")).toMatchObject({
      state: "pending",
      phase: "staged",
      requestId,
      callerVersion: "1.0.0",
    });
    expect(await f.run("activate", undefined, { requestId })).toMatchObject({ state: "activated", version: "2.0.0" });
    expect(await f.run("status")).toEqual({ state: "idle" });
  } finally {
    await f.close();
  }
}, 30000);

it("collects superseded activated kit closures offline, preserves prepared cache and replays activation history", async () => {
  const f = await fixture(),
    requestId = randomUUID();
  try {
    const original = (await f.inspect()).receipts;
    f.publish();
    await f.run("prepare");
    f.offline();
    const activated = await f.run("activate", undefined, { requestId });
    const plan = (await f.collect(f.next.manifest, "plan")) as import("@odsuite/installer").CollectionPlan;
    expect(
      plan.entries
        .filter((e) => !e.reasons.length)
        .map((e) => e.receipt.path)
        .sort(),
    ).toEqual(original.map((r) => r!.path).sort());
    const id = randomUUID();
    expect(await f.collect(f.next.manifest, "apply", { requestId: id, expected: plan.fingerprint })).toMatchObject({
      complete: true,
      retired: expect.any(Array),
    });
    expect(await f.collect(f.next.manifest, "status", { requestId: id })).toMatchObject({
      state: "status",
      collection: { complete: true },
    });
    expect(await f.run("activate", undefined, { requestId })).toEqual(activated);
    expect((await f.inspect()).receipts.every((r) => r?.version === "2.0.0")).toBe(true);
    await f.later();
    const next = (await f.collect(f.bad.manifest, "plan")) as import("@odsuite/installer").CollectionPlan;
    expect(next.entries.filter((e) => !e.reasons.length).map((e) => e.receipt.version)).toEqual(["2.0.0", "2.0.0"]);
    await f.collect(f.bad.manifest, "apply", { requestId: randomUUID(), expected: next.fingerprint });
    expect(await f.run("activate", undefined, { requestId })).toEqual(activated);
    expect((await f.inspect()).receipts.every((r) => r?.version === "3.0.0")).toBe(true);
  } finally {
    await f.close();
  }
}, 30000);
