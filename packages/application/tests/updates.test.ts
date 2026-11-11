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
import { candidate } from "@/candidate.js";
import { hash, type PackageManifest, type Selection } from "@/contract.js";
import { updates } from "@/updates.js";

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
    hold = false;
  const server = createServer((req, res) => {
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
  const run = (op: "check" | "prepare" | "discard", signal?: AbortSignal) =>
    updates(current.manifest, selection, op, options, signal);
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
    get objects() {
      return objects;
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
