import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pack } from "@odsuite/pack";
import { canonical, channel, digest, namespace } from "@odsuite/protocol";
import { materialize } from "@odsuite/release";
import { connectRoot, observeProcesses, readDirectory, startManager, stopManager } from "@odsuite/sidecar";
import type { Tools } from "@open-motion/render";
import type { RenderMethods } from "@open-motion/render/contract";
import { nativeTools } from "@open-motion/render/tools";
import { expect, it } from "vitest";
import { open, openPreparation } from "@";

it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST) && process.platform === "darwin" && process.arch === "arm64")(
  "starts the actual installed preparation entry with a manager stamp and never activates application or export services",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "installed-native-prepare-")),
      path = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
      manifest = JSON.parse(await readFile(path, "utf8")),
      built = JSON.parse(await readFile(new URL("../dist/runtime/runtime.json", import.meta.url), "utf8")),
      scope = { channel: channel(built.channel), namespace: namespace("installed-prep") };
    const tool = (name: keyof Tools) => {
      const spec = manifest[name] as { path: string; resource: Tools["browser"]["resource"]; executable: string };
      return {
        resource: spec.resource,
        executable: spec.executable,
        load: async () => createReadStream(resolve(dirname(path), spec.path)),
      };
    };
    const warm = await openPreparation({
      root,
      scope,
      version: built.version,
      tools: { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") },
    });
    try {
      expect(await warm.prepare()).toMatchObject({ state: "ready" });
    } finally {
      await warm.close();
    }
    const owner = await startManager({
      root,
      scope,
      command: process.execPath,
      args: [
        fileURLToPath(new URL("../dist/runtime/main.mjs", import.meta.url)),
        "--root",
        root,
        "--channel",
        built.channel,
        "--namespace",
        "installed-prep",
        "--mode",
        "prepare",
      ],
      log: join(root, "private-manager.log"),
    });
    try {
      expect(owner.pid).not.toBe(process.pid);
      const { factory } = await connectRoot(root, scope),
        peer = await factory.connect<RenderMethods>({ service: "renderer", generation: digest(built.version) });
      expect(
        (await factory.directory()).instances.filter((entry) => entry.phase === "ready").map((entry) => entry.service),
      ).toEqual(["renderer"]);
      expect(await peer.call("native_prepare", {})).toMatchObject({ ok: true, value: { state: "preparing" } });
      await expect
        .poll(
          async () => {
            const reply = await peer.call("native_prepare_read", {});
            return reply.ok ? reply.value.state : reply.error.message;
          },
          { timeout: 10000 },
        )
        .toBe("ready");
      expect(await peer.call("export_list", { sessionId: randomUUID(), artifactId: randomUUID() })).toMatchObject({
        ok: false,
        error: { code: "invalid" },
      });
      for (const grant of (await factory.resources()).grants.filter((grant) => grant.kind === "data"))
        await expect(readFile(join(grant.value, "exports.sqlite"))).rejects.toMatchObject({ code: "ENOENT" });
      expect(await factory.inspect()).toEqual([]);
    } finally {
      await stopManager(owner);
      expect((await readDirectory(root)).manager.phase).toBe("closed");
      expect(await observeProcesses(root)).toEqual([]);
    }
  },
  60000,
);

it("prepares in the same renderer cache factory without composing Web, Daemon or an export queue", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-preparation-")),
    bytes = Buffer.from(
      canonical({
        schema: 1,
        files: [{ path: "binary", mode: 0o755, bytes: Buffer.from("materialization fixture only").toString("base64") }],
      }),
    ),
    tool = (slot: string) => ({
      resource: {
        type: "directory" as const,
        artifact: { kind: "blob" as const, slot, bytes: bytes.length, digest: digest(bytes) },
      },
      executable: "binary",
      load: async () => bytes,
    }),
    runtime = await openPreparation({
      root,
      scope: { channel: channel("stable"), namespace: namespace("prep") },
      version: "0.6.1",
      tools: { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") },
    });
  try {
    expect(runtime.manager.directory().instances.map((entry) => entry.service)).toEqual(["renderer"]);
    expect(await runtime.status()).toMatchObject({ mode: "prepare", native: { state: "idle" } });
    expect(await runtime.prepare()).toMatchObject({ state: "ready" });
    const factory = runtime.manager.factory({ channel: channel("stable"), namespace: namespace("prep") }),
      resources = await factory.resources();
    expect(resources.grants.some((grant) => grant.kind === "port")).toBe(false);
    const data = resources.grants.filter((grant) => grant.kind === "data");
    expect(data.length).toBeGreaterThan(0);
    for (const grant of data)
      await expect(readFile(join(grant.value, "exports.sqlite"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(await observeProcesses(root)).toEqual([]);
  } finally {
    await runtime.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  }
});

it("runs real Web and a sidecar-owned Daemon with propagated environment and durable state", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-"));
  const scope = { channel: channel("stable"), namespace: namespace("first") };
  let runtime: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await expect(open({ root, scope, version: "0.6.1", web: root })).rejects.toThrow("separate");
    runtime = await open({ root, scope, version: "0.6.1" });
    const status = await runtime.status();
    expect(status.environment.carrier).toBe("standalone");
    expect(status.daemon.environment).toEqual(status.environment);
    expect(status.daemon.pid).not.toBe(process.pid);
    expect(status.manifest.identity.appid).toBe("io.openmotion.app");
    expect(await (await fetch(status.web)).text()).toContain("./main.js");
    const bootstrap = await (await fetch(`${status.web}/bootstrap.json`)).json();
    expect(bootstrap.environment).toEqual(status.environment);
    const send = (path: string, init?: RequestInit) =>
      fetch(`${bootstrap.daemon}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${bootstrap.token}`, ...init?.headers },
      });
    expect((await fetch(`${bootstrap.daemon}/health`)).status).toBe(401);
    expect((await send("/health")).status).toBe(200);
    expect((await send("/health", { method: "OPTIONS", headers: { origin: status.web } })).status).toBe(204);
    expect(
      (await send("/health", { method: "OPTIONS", headers: { origin: "https://unrelated.example" } })).status,
    ).toBe(403);
    const session = await runtime.execute("session_create", {
      requestId: randomUUID(),
      title: "durable session",
      mode: "motion",
    });
    const directory = runtime.manager.directory(scope);
    expect(directory.instances.filter((i) => i.kind === "process").map((i) => i.service)).toEqual(["daemon"]);
    const services = ["daemon", "gateway", "standalone", "web"];
    if (nativeTools()) services.push("renderer");
    expect(directory.instances.map((i) => i.service).sort()).toEqual(services.sort());
    const registry = await runtime.manager.factory(scope).resources();
    expect(registry.grants.filter((g) => g.kind === "port")).toHaveLength(2);
    expect(registry.grants.filter((g) => g.kind === "socket")).toHaveLength(2);
    await expect(open({ root, scope, version: "0.6.1" })).rejects.toThrow();
    await runtime.close();
    expect((await readDirectory(root)).instances.every((i) => i.phase === "retired")).toBe(true);
    await expect(fetch(status.web, { signal: AbortSignal.timeout(500) })).rejects.toThrow();
    runtime = await open({ root, scope, version: "0.6.1" });
    expect((await runtime.execute("session_get", { sessionId: session.id })).title).toBe("durable session");
  } finally {
    await runtime?.close();
    await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("keeps factory resources and data isolated across channel and namespace", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-isolation-"));
  try {
    for (const [lane, name, version] of [
      ["stable", "one", "0.6.1"],
      ["stable", "two", "0.6.1"],
      ["beta", "one", "0.6.1-beta.1"],
    ]) {
      const runtime = await open({
        root,
        scope: { channel: channel(lane ?? ""), namespace: namespace(name ?? "") },
        version,
      });
      try {
        expect((await runtime.execute("workspace_state", {})).sessions).toEqual([]);
        await runtime.execute("session_create", { requestId: randomUUID(), title: "isolated", mode: "motion" });
      } finally {
        await runtime.close();
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("executes an archived standalone closure outside the repository and preserves data across cold restart", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "standalone-closure-")),
    installed = join(temporary, "installed"),
    root = join(temporary, "data"),
    repo = fileURLToPath(new URL("../../../", import.meta.url));
  const built = JSON.parse(await readFile(join(repo, "carriers/standalone/dist/runtime/runtime.json"), "utf8"));
  const result = await pack({
    source: join(repo, "carriers/standalone/dist/runtime"),
    output: join(temporary, "standalone.bundle"),
    carrier: "standalone",
    channel: built.channel,
    version: built.version,
  });
  await materialize(await readFile(result.path), installed);
  let current: ReturnType<typeof spawn> | undefined;
  let passed = false;
  const start = async () => {
    const child = spawn(
      process.execPath,
      [join(installed, "main.mjs"), "--root", root, "--channel", built.channel, "--namespace", "closed"],
      {
        cwd: temporary,
        env: { PATH: process.env.PATH, NODE_PATH: "" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    current = child;
    let stdout = "",
      stderr = "";
    child.stderr?.on("data", (part) => {
      stderr = (stderr + part).slice(-4096);
    });
    child.stdout?.on("data", (part) => {
      stdout += part;
    });
    await expect
      .poll(
        () => {
          if (child.exitCode !== null) throw Error(`closed standalone exited: ${stderr}`);
          return stdout.includes("\n");
        },
        { timeout: 15000 },
      )
      .toBe(true);
    return JSON.parse(stdout.trim().split("\n")[0]!) as {
      web: string;
      manifest: { identity: { version: string } };
      environment: { carrier: string };
    };
  };
  const stop = async () => {
    if (!current) return;
    const child = current;
    current = undefined;
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      expect((await exited)[0]).toBe(0);
    }
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  };
  try {
    const initial = await start();
    expect(initial.environment.carrier).toBe("standalone");
    expect(initial.manifest.identity.version).toBe(built.version);
    expect(await (await fetch(initial.web)).text()).toContain("./main.js");
    const boot = await (await fetch(`${initial.web}/bootstrap.json`)).json();
    const response = await fetch(`${boot.daemon}/api/session_create`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${boot.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ requestId: randomUUID(), title: "Closed app", mode: "motion" }),
    });
    expect(response.status).toBe(200);
    const session = await response.json();
    await stop();
    const reopened = await start(),
      restored = await (await fetch(`${reopened.web}/bootstrap.json`)).json();
    const read = await fetch(`${restored.daemon}/api/session_get`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${restored.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sessionId: session.id }),
    });
    expect((await read.json()).title).toBe("Closed app");
    await stop();
    const evidence = join(repo, ".artifacts/standalone-closure", randomUUID());
    await mkdir(evidence, { recursive: true });
    await writeFile(
      join(evidence, "result.json"),
      JSON.stringify({
        artifact: result.sha256,
        version: initial.manifest.identity.version,
        source: "independent archived closure",
        coldReopen: true,
        closed: true,
        processes: [],
      }),
    );
    passed = true;
  } finally {
    await stop();
    if (passed) await rm(temporary, { recursive: true, force: true });
    else process.stderr.write(`retained standalone closure: ${temporary}\n`);
  }
}, 40000);
