import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { Library, type Resource } from "@odsuite/blob";
import { open as installation } from "@odsuite/installer";
import { inspect, npm } from "@odsuite/pack";
import { canonical, channel, digest, namespace } from "@odsuite/protocol";
import { bundle, resolve as release, releaseChannel } from "@odsuite/release";
import { connectRoot, managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import type { Job } from "@open-motion/render/contract";
import { nativeTools } from "@open-motion/render/tools";
import type { Methods } from "@open-motion/standalone";
import { expect, it } from "vitest";
import { hash } from "@/contract.js";

const run = promisify(execFile);
async function fixture() {
  const evidence = resolve("../../.artifacts/npx-delivery", randomUUID()),
    root = await realpath(await mkdtemp(join(tmpdir(), "openmotion-npx-")));
  await mkdir(evidence, { recursive: true });
  await mkdir(join(root, "workspace"), { recursive: true });
  await mkdir(join(root, "profile"));
  const files: Record<string, string | Uint8Array> = {},
    descriptors: Record<string, unknown> = {};
  let version = "",
    channel = "";
  for (const carrier of ["standalone", "codexplugin"]) {
    const bytes = await bundle(resolve(`../../carriers/${carrier}/dist/runtime`));
    const identity = inspect(bytes);
    if (version && identity.version !== version) throw Error("carrier versions differ");
    ({ version, channel } = identity);
    files[`payload/${carrier}.bundle`] = bytes;
    await writeFile(join(evidence, `${carrier}.bundle`), bytes);
    descriptors[carrier] = { file: `${carrier}.bundle`, sha256: hash(bytes), bytes: bytes.length };
  }
  const product = { appid: "io.openmotion.app", name: "open-motion", scheme: "open-motion" };
  files["payload/manifest.json"] = Buffer.from(
    JSON.stringify({
      schemaVersion: 1,
      product,
      release: release({}, { version, channel: releaseChannel(channel) }, product),
      namespace: "installation",
      carriers: descriptors,
    }),
  );
  for (const name of ["main.mjs", "codex-worker.mjs", "LICENSE", "NOTICE"])
    files[`dist/${name}`] = resolve("dist", name);
  const archive = await npm({
    name: "@openmotion/app",
    version,
    license: "Apache-2.0",
    bin: { odsuite: "dist/main.mjs" },
    files,
    output: join(evidence, "application.tgz"),
  });
  await writeFile(join(evidence, "fixture.json"), JSON.stringify({ root, archive }, null, 2));
  const common = ["--home", join(root, "installation"), "--data", join(root, "data"), "--namespace", "installation"];
  const invoke = (args: string[], scoped = true) =>
    run(
      "npm",
      [
        "exec",
        "--yes",
        "--ignore-scripts",
        "--cache",
        join(root, "npm-cache"),
        "--package",
        archive.path,
        "--",
        "odsuite",
        ...args,
        ...(scoped ? common : []),
      ],
      { cwd: root, timeout: 60000, maxBuffer: 1024 ** 2, env: { ...process.env, npm_config_update_notifier: "false" } },
    );
  const command = async (args: string[], scoped = true) => JSON.parse((await invoke(args, scoped)).stdout.trim());
  return { root, evidence, version, channel, command, invoke, data: join(root, "data", channel, "installation") };
}

async function uses(own: Awaited<ReturnType<typeof fixture>>) {
  const session = await installation({
    home: join(own.root, "installation"),
    product: "io.openmotion.app",
    scope: { channel: channel(own.channel), namespace: namespace("installation") },
  });
  try {
    return await session.uses();
  } finally {
    await session.close();
  }
}

it("installs a real local npm kit idempotently and controls its stamped standalone runtime", async () => {
  const own = await fixture();
  const first = await own.command(["setup", "--carrier", "standalone"]);
  expect(first.result.version).toBe(own.version);
  expect(Object.keys(first.result.receipts).sort()).toEqual(["codexplugin", "standalone"]);
  await expect(access(own.data)).rejects.toThrow();
  const again = await own.command(["setup", "--carrier", "standalone"]);
  expect(again.result.receipts).toEqual(first.result.receipts);
  expect((await own.command(["status"])).result.state).toBe("uninitialized");
  try {
    expect((await own.command(["start"])).result.state).toBe("running");
    expect((await own.command(["start"])).result.state).toBe("running");
    expect((await own.command(["status"])).result.runtime.manifest.identity.version).toBe(own.version);
    const active = await uses(own);
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ state: "alive", receipt: first.result.receipts.standalone });
    expect(active[0]?.controller.pid).toBe(
      (await connectRoot(own.data, { channel: channel(own.channel), namespace: namespace("installation") })).manager
        .pid,
    );
  } finally {
    await own.command(["stop"]);
  }
  expect((await own.command(["stop"])).result.state).toBe("stopped");
  expect((await readDirectory(own.data)).manager.phase).toBe("closed");
  expect(await observeProcesses(own.data)).toEqual([]);
  expect((await uses(own)).every((use) => use.state === "retired")).toBe(true);
  await writeFile(join(own.evidence, "receipt.json"), JSON.stringify(first, null, 2));
}, 120000);

it("rejects an installed start before contacting the Daemon of a different release", async () => {
  const own = await fixture(),
    scope = { channel: channel(own.channel), namespace: namespace("installation") },
    version = own.channel === "stable" ? "99.0.0" : `99.0.0-${own.channel}.1`,
    running = release({}, { version, channel: scope.channel }),
    manager = await serve(managerEndpoint(own.data), { root: own.data });
  const calls: string[] = [];
  try {
    await manager.factory(scope).expose<Methods>({
      identity: { service: "standalone", generation: digest(version) },
      handlers: {
        runtime_identity: () => {
          calls.push("identity");
          return { manifest: running, carrier: "codexplugin" };
        },
        status: () => {
          calls.push("status");
          throw Error("Unexpected Daemon health probe");
        },
        connection: () => {
          calls.push("connection");
          throw Error("Unexpected Daemon delegation");
        },
      },
      lifecycle: { initialize: async () => {}, stop: async () => {} },
    });
    const original = manager.directory();
    const failure = await own.invoke(["start"]).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: 2 });
    const { stdout } = failure as { stdout: string };
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      error: {
        code: "runtime_release_mismatch",
        requested: { identity: { version: own.version } },
        running,
        owner: { ...scope, carrier: "codexplugin", manager: original.manager.incarnation, pid: original.manager.pid },
      },
    });
    expect(calls).toEqual(["identity"]);
    expect(manager.directory()).toEqual(original);
    await expect(access(join(own.root, "installation"))).rejects.toThrow();
  } finally {
    await manager.close();
    expect((await readDirectory(own.data)).manager.phase).toBe("closed");
    expect(await observeProcesses(own.data)).toEqual([]);
  }
}, 120000);

it("registers an installed MCP transport that survives removal of its npx cache", async () => {
  const own = await fixture(),
    controlled = join(own.root, "codex.mjs"),
    profile = join(own.root, "profile"),
    skills = join(own.root, "workspace/.agents/skills");
  await writeFile(
    controlled,
    `import{readFile,writeFile}from'node:fs/promises';
const args=process.argv.slice(2),file=process.env.CODEX_HOME+'/transport.json';
if(args[1]==='get'){try{console.log(JSON.stringify({enabled:true,transport:JSON.parse(await readFile(file,'utf8'))}))}catch(e){if(e.code!=='ENOENT')throw e;console.error('No MCP server named "open-motion" found');process.exitCode=1}}
else if(args[1]==='add'){const at=args.indexOf('--'),env={};for(let i=3;i<at;i+=2){const p=args[i+1].indexOf('=');env[args[i+1].slice(0,p)]=args[i+1].slice(p+1)}await writeFile(file,JSON.stringify({type:'stdio',command:args[at+1],args:args.slice(at+2),env}))}
`,
  );
  const args = ["setup", "--carrier", "codexplugin", "--profile", profile, "--skills", skills, "--codex", controlled];
  const registered = await own.command(args);
  expect(registered.result.registration.state).toBe("registered");
  expect((await own.command(args)).result).toEqual(registered.result);
  const transport = JSON.parse(await readFile(join(profile, "transport.json"), "utf8"));
  expect(transport.command).toBe(process.execPath);
  expect(transport.args[0]).toBe(join(registered.result.receipts.codexplugin.path, "main.mjs"));
  expect(dirname(transport.args[0])).not.toContain("npm-cache");
  await rename(join(own.root, "npm-cache"), join(own.root, "retained-npm-cache"));
  const client = new Client({ name: "installed-npx-proof", version: "1.0.0" }),
    connection = new StdioClientTransport({ ...transport, stderr: "pipe" });
  try {
    await client.connect(connection);
    expect(await uses(own)).toMatchObject([{ state: "alive", receipt: registered.result.receipts.codexplugin }]);
    expect((await client.listTools()).tools.some((tool) => tool.name === "session_create")).toBe(true);
    const created = await client.callTool({
      name: "session_create",
      arguments: { requestId: randomUUID(), title: "Installed npx kit", mode: "motion" },
    });
    expect(created.isError).not.toBe(true);
    expect(created.structuredContent).toBeDefined();
  } finally {
    await client.close();
    await connection.close();
  }
  expect((await readDirectory(own.data)).manager.phase).toBe("closed");
  expect(await observeProcesses(own.data)).toEqual([]);
  expect((await uses(own)).every((use) => use.state === "retired")).toBe(true);
  await writeFile(join(own.evidence, "receipt.json"), JSON.stringify(registered, null, 2));
}, 120000);

it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "prepares installed native resources without a business queue and exports through an installed MCP attachment",
  async () => {
    const own = await fixture(),
      installed = (await own.command(["setup", "--carrier", "standalone"])).result,
      manifestPath = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST ?? ""),
      seeds = JSON.parse(await readFile(manifestPath, "utf8")),
      tools = nativeTools();
    if (!tools) throw Error("native fixture requires a qualified platform");
    const scope = { channel: channel(own.channel), namespace: namespace("installation") },
      seedManager = await serve(managerEndpoint(own.data), { root: own.data }),
      factory = seedManager.factory(scope);
    let library: Library | undefined;
    await factory.expose({
      identity: { service: "seed", generation: digest("npx-native-fixture") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({ factory, context });
        },
        stop: async () => {
          await library?.close();
        },
      },
    });
    try {
      if (!library) throw Error("seed context unavailable");
      await library.retain(
        "prepared",
        "native-fixture",
        Object.values(tools).map((tool) => tool.resource),
      );
      for (const name of ["browser", "ffmpeg", "ffprobe"] as const) {
        const seed = seeds[name] as { path: string; resource: Resource };
        expect(seed.resource).toEqual(tools[name].resource);
        await library.prefetch(seed.resource, async () => createReadStream(resolve(dirname(manifestPath), seed.path)));
      }
      await library.unretain("prepared", "native-fixture");
    } finally {
      await seedManager.close();
    }
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
      const operation = own.invoke(["prepare"]),
        outcome = operation.then(
          () => ({ success: true }),
          (error: unknown) => ({ success: false, error: String(error) }),
        );
      await expect
        .poll(
          async () => {
            try {
              await connectRoot(own.data, scope);
              return true;
            } catch {
              return false;
            }
          },
          { timeout: 15000 },
        )
        .toBe(true);
      expect(operation.child.kill(signal)).toBe(true);
      expect((await outcome).success).toBe(false);
      await expect
        .poll(
          async () => {
            try {
              return (await readDirectory(own.data)).manager.phase;
            } catch {
              return "held";
            }
          },
          { timeout: 15000 },
        )
        .toBe("closed");
      expect(await observeProcesses(own.data)).toEqual([]);
      await writeFile(join(own.evidence, `${signal}.json`), JSON.stringify(await outcome));
    }
    const prepared = await own.command(["prepare"]);
    expect(prepared.result.state).toBe("ready");
    expect(
      Object.values(prepared.result.components).every((value) => (value as { state: string }).state === "ready"),
    ).toBe(true);
    const preparedDirectory = await readDirectory(own.data);
    expect(preparedDirectory.manager.phase).toBe("closed");
    expect(preparedDirectory.instances.map((value) => value.service).sort()).toEqual(["renderer", "seed"]);
    expect(await observeProcesses(own.data)).toEqual([]);
    const client = new Client({ name: "installed-native-export", version: "1.0.0" }),
      transport = new StdioClientTransport({
        command: process.execPath,
        args: [join(installed.receipts.codexplugin.path, "main.mjs")],
        env: {
          OPEN_MOTION_ROOT: own.data,
          OPEN_MOTION_CHANNEL: own.channel,
          OPEN_MOTION_NAMESPACE: "installation",
          NODE_PATH: "",
        },
        stderr: "pipe",
      });
    const call = async <K extends Operation>(name: K, args: Input<K>): Promise<Output<K>> => {
      const result = await client.callTool({ name, arguments: args });
      if (result.isError) throw Error(JSON.stringify(result.content));
      return result.structuredContent as unknown as Output<K>;
    };
    try {
      expect((await own.command(["start"])).result.state).toBe("running");
      const manager = (await connectRoot(own.data, scope)).manager;
      await client.connect(transport);
      const session = await call("session_create", {
          requestId: randomUUID(),
          title: "Installed film",
          mode: "motion",
        }),
        artifact = await call("artifact_create", {
          requestId: randomUUID(),
          sessionId: session.id,
          title: "Film",
          files: [
            {
              path: "index.html",
              content:
                '<html><body><main data-composition-id="main" data-width="160" data-height="90" data-duration="1"><svg width="160" height="90"><rect id="square" width="40" height="40" fill="blue"/></svg></main><script>window.__timelines={main:gsap.timeline({paused:true}).to("#square",{attr:{x:100},duration:1})};</script></body></html>',
            },
          ],
        }),
        owner = { sessionId: session.id, artifactId: artifact.id },
        project = await call("project_read", owner),
        job = await call("export_create", {
          ...owner,
          requestId: randomUUID(),
          revision: project.revision,
          fps: { num: 12, den: 1 },
        });
      await expect
        .poll(async () => (await call("export_read", { ...owner, id: job.id })).state, { timeout: 60000 })
        .toBe("succeeded");
      const completed = (await call("export_read", { ...owner, id: job.id })) as unknown as Job,
        info = await call("export_download", { ...owner, id: job.id }),
        response = await fetch(info.url),
        bytes = Buffer.from(await response.arrayBuffer());
      expect(response.status).toBe(200);
      expect(bytes.subarray(4, 8).toString()).toBe("ftyp");
      expect(`sha256:${hash(bytes)}`).toBe(info.digest);
      expect(completed.result?.verification.frames).toBe(12);
      await writeFile(join(own.evidence, "film.mp4"), bytes);
      await writeFile(
        join(own.root, "native-evidence.json"),
        JSON.stringify({ archive: "application.tgz", prepared, completed, digest: info.digest }, null, 2),
      );
      await client.close();
      await transport.close();
      expect((await own.command(["status"])).result.state).toBe("running");
      expect((await connectRoot(own.data, scope)).manager.incarnation).toBe(manager.incarnation);
    } finally {
      await client.close();
      await transport.close();
      await own.command(["stop"]);
    }
    expect((await readDirectory(own.data)).manager.phase).toBe("closed");
    expect(await observeProcesses(own.data)).toEqual([]);
  },
  180000,
);

for (const phase of ["intent", "materialized", "installed", "selected"] as const)
  it(`replays installed npm setup after real SIGKILL at ${phase} only following explicit recovery`, async () => {
    const own = await fixture(),
      home = join(own.root, "installation"),
      authority = join(home, "authority", "io.openmotion.app"),
      archive = join(own.evidence, "standalone.bundle"),
      sha256 = hash(await readFile(archive)),
      scope = { channel: channel(own.channel), namespace: namespace("installation") };
    // Bind the diagnostic checkpoint to the exact deterministic public setup intent.
    const h = hash(
        canonical({ product: "io.openmotion.app", scope, data: own.data, carrier: "standalone", sha256 }),
      ).slice(0, 32),
      requestId = `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`,
      input = { home, product: "io.openmotion.app", scope, data: own.data, archive, sha256, requestId, phase },
      installer = pathToFileURL(join(process.cwd(), "../../suites/installer/dist/index.mjs")).href;
    const child = spawn(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import {readFile} from 'node:fs/promises';import {open} from ${JSON.stringify(installer)};
const f=JSON.parse(process.argv[1]);
const session=await open({...f,onCheckpoint:async event=>{if(event.phase===f.phase){console.log('CHECKPOINT');await new Promise(()=>{})}}});
await session.install({data:f.data,requestId:f.requestId,source:{sha256:f.sha256,bytes:await readFile(f.archive)}});
await session.close();`,
        JSON.stringify(input),
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "",
      stderr = "",
      running = false;
    child.stdout.on("data", (bytes) => {
      stdout += bytes;
    });
    child.stderr.on("data", (bytes) => {
      stderr += bytes;
    });
    const exited = new Promise<void>((done, reject) => {
      child.once("error", reject);
      child.once("exit", () => done());
    });
    try {
      await expect
        .poll(
          () => {
            if (child.exitCode !== null || child.signalCode !== null)
              throw Error(`installer exited before checkpoint: ${stderr.slice(-1000)}`);
            return stdout.includes("CHECKPOINT");
          },
          { timeout: 15000 },
        )
        .toBe(true);
      await expect(own.invoke(["setup", "--carrier", "standalone"])).rejects.toThrow();
      await expect(own.invoke(["recover", "inspect", "--root", authority], false)).rejects.toThrow();
      expect((await (await connectRoot(authority, scope)).factory.directory()).manager.phase).toBe("active");
      expect(child.kill("SIGKILL")).toBe(true);
      await exited;
      expect(child.signalCode).toBe("SIGKILL");
      await expect(own.invoke(["setup", "--carrier", "standalone"])).rejects.toThrow();
      const plan = (await own.command(["recover", "inspect", "--root", authority], false)).result;
      expect(plan.phase).toBe("ready");
      await expect(
        own.invoke(["recover", "apply", "--root", authority, "--expected", `sha256:${"0".repeat(64)}`], false),
      ).rejects.toThrow();
      expect((await own.command(["recover", "inspect", "--root", authority], false)).result.fingerprint).toBe(
        plan.fingerprint,
      );
      await own.command(["recover", "apply", "--root", authority, "--expected", plan.fingerprint], false);
      const first = (await own.command(["setup", "--carrier", "standalone"])).result,
        again = (await own.command(["setup", "--carrier", "standalone"])).result;
      expect(first.receipts.standalone.requestId).toBe(requestId);
      expect(first.receipts.standalone.digest).toBe(`sha256:${sha256}`);
      expect(first.receipts.codexplugin.version).toBe(own.version);
      expect(again).toEqual(first);
      const started = await own.command(["start"]);
      running = true;
      expect(started.result.runtime.manifest.identity.version).toBe(own.version);
      expect(started.result.runtime.daemon.ok).toBe(true);
      await own.command(["stop"]);
      running = false;
      expect((await readDirectory(own.data)).manager.phase).toBe("closed");
      expect(await observeProcesses(own.data)).toEqual([]);
      expect((await readDirectory(authority)).manager.phase).toBe("closed");
      expect(await observeProcesses(authority)).toEqual([]);
      await writeFile(join(own.evidence, "recovery.json"), JSON.stringify({ phase, requestId, plan, first }, null, 2));
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await exited;
      if (running) await own.command(["stop"]);
      await writeFile(join(own.evidence, "checkpoint.log"), stdout + stderr);
    }
  }, 120000);
