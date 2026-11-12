import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { browser } from "@odsuite/automation";
import { Library, type Resource } from "@odsuite/blob";
import { open } from "@odsuite/installer";
import { inspect, npm } from "@odsuite/pack";
import { channel, digest, namespace } from "@odsuite/protocol";
import { bundle, resolve as release, releaseChannel } from "@odsuite/release";
import { connectRoot, managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import { nativeTools } from "@open-motion/render/tools";
import type { Status } from "@open-motion/standalone";
import { expect, it } from "vitest";
import { hash } from "@/contract.js";

const run = promisify(execFile);
async function fixture() {
  const evidence = resolve("../../.artifacts/installed-journey", randomUUID()),
    root = await realpath(await mkdtemp(join(tmpdir(), "openmotion-journey-")));
  await mkdir(evidence, { recursive: true });
  const files: Record<string, string | Uint8Array> = {},
    carriers: Record<string, unknown> = {};
  let version = "",
    lane = "";
  for (const carrier of ["standalone", "codexplugin"]) {
    const bytes = await bundle(resolve(`../../carriers/${carrier}/dist/runtime`)),
      identity = inspect(bytes);
    if (version && identity.version !== version) throw Error("carrier version mismatch");
    version = identity.version;
    lane = identity.channel;
    files[`payload/${carrier}.bundle`] = bytes;
    carriers[carrier] = { file: `${carrier}.bundle`, bytes: bytes.length, sha256: hash(bytes) };
  }
  const product = { appid: "io.openmotion.app", name: "open-motion", scheme: "open-motion" };
  files["payload/manifest.json"] = Buffer.from(
    JSON.stringify({
      schemaVersion: 1,
      product,
      release: release({}, { version, channel: releaseChannel(lane) }, product),
      namespace: "journey",
      carriers,
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
  const home = join(root, "installation"),
    data = join(root, "data", lane, "journey"),
    scope = { channel: channel(lane), namespace: namespace("journey") };
  const command = async (args: string[]) => {
    const result = await run(
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
        "--home",
        home,
        "--data",
        join(root, "data"),
        "--channel",
        lane,
        "--namespace",
        "journey",
      ],
      { cwd: root, timeout: 60000, maxBuffer: 1024 ** 2, env: { ...process.env, npm_config_update_notifier: "false" } },
    );
    const response = JSON.parse(result.stdout);
    if (!response.ok) throw Error(result.stdout);
    return response.result;
  };
  await writeFile(
    join(evidence, "fixture.json"),
    JSON.stringify({ root, home, data, scope, version, archive }, null, 2),
  );
  return { root, evidence, archive, home, data, scope, version, command };
}

async function seedNative(f: Awaited<ReturnType<typeof fixture>>, manifest: string) {
  const seeds = JSON.parse(await readFile(manifest, "utf8")),
    tools = nativeTools();
  if (!tools) throw Error("native journey requires a qualified platform");
  const manager = await serve(managerEndpoint(f.data), { root: f.data }),
    factory = manager.factory(f.scope);
  let library: Library | undefined;
  try {
    await factory.expose({
      identity: { service: "seed", generation: digest("installed-journey-native") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({ factory, context });
        },
        stop: async () => library?.close(),
      },
    });
    if (!library) throw Error("native fixture unavailable");
    for (const name of ["browser", "ffmpeg", "ffprobe"] as const) {
      const seed = seeds[name] as { path: string; resource: Resource };
      expect(seed.resource).toEqual(tools[name].resource);
      await library.prefetch(seed.resource, async () => createReadStream(resolve(dirname(manifest), seed.path)));
    }
  } finally {
    await manager.close();
  }
  expect((await f.command(["prepare"])).state).toBe("ready");
}

it("continues installed MCP projects in the actual Web, retains history and reopens through both carriers after cold restart", async () => {
  const f = await fixture(),
    installed = await f.command(["setup", "--carrier", "standalone"]),
    receipt = installed.receipts.codexplugin;
  const attach = async () => {
    const client = new Client({ name: "installed-journey", version: "1.0.0" }),
      transport = new StdioClientTransport({
        command: process.execPath,
        args: [join(receipt.path, "main.mjs")],
        env: {
          OPEN_MOTION_ROOT: f.data,
          OPEN_MOTION_CHANNEL: f.scope.channel,
          OPEN_MOTION_NAMESPACE: f.scope.namespace,
          OPEN_MOTION_INSTALLATION_HOME: f.home,
          OPEN_MOTION_INSTALLATION_PRODUCT: "io.openmotion.app",
          OPEN_MOTION_INSTALLATION_REQUEST: receipt.requestId,
          NODE_PATH: "",
        },
        stderr: "pipe",
      });
    await client.connect(transport);
    return {
      handoff: async (project: Output<"project_read">) => {
        const result = await client.callTool({
          name: "project_entry",
          arguments: {
            sessionId: project.sessionId,
            artifactId: project.artifactId,
            expectedRevision: project.revision,
            expectedHistory: project.history.version,
          },
        });
        if (result.isError) throw Error(JSON.stringify(result.content));
        const handoff = result.structuredContent as { url: string; display: string; target: { artifactId: string } };
        expect(handoff.display).toBe("unverified");
        expect(handoff.target.artifactId).toBe(project.artifactId);
        return handoff;
      },
      close: async () => {
        try {
          await client.close();
        } finally {
          await transport.close();
        }
      },
      call: async <K extends Operation>(name: K, args: Input<K>): Promise<Output<K>> => {
        const result = await client.callTool({ name, arguments: args });
        if (result.isError) throw Error(JSON.stringify(result.content));
        return result.structuredContent as unknown as Output<K>;
      },
    };
  };
  let driver: Awaited<ReturnType<typeof browser>> | undefined,
    mcp: Awaited<ReturnType<typeof attach>> | undefined,
    failure: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    const nativeManifest = process.env.OPEN_MOTION_NATIVE_MANIFEST;
    if (nativeManifest) await seedNative(f, resolve(nativeManifest));
    const started: { runtime: Status } = await f.command(["start"]),
      manager = (await connectRoot(f.data, f.scope)).manager;
    mcp = await attach();
    const session = await mcp.call("session_create", {
        requestId: randomUUID(),
        title: "Installed journey",
        mode: "motion",
      }),
      artifact = await mcp.call("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Shared film",
        files: [
          {
            path: "index.html",
            content:
              '<html><body><main data-composition-id="main" data-width="160" data-height="90" data-duration="1"><svg width="160" height="90"><rect id="square" width="40" height="40" fill="blue"/></svg></main><script>window.__timelines={main:gsap.timeline({paused:true}).to("#square",{attr:{x:100},duration:1})};</script></body></html>',
          },
        ],
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      initial = await mcp.call("project_read", owner),
      state = await mcp.call("workspace_state", {}),
      newest = await mcp.call("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Newer unrelated project",
        files: initial.files,
      });
    await mcp.call("artifact_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      artifactId: newest.id,
      expectedSelection: state.selection.revision,
      expectedCurrent: null,
    });
    const handoff = await mcp.handoff(initial);
    expect((await mcp.call("workspace_state", {})).selection.artifactId).toBe(newest.id);
    driver = await browser({ evidence: f.evidence, viewport: { width: 1440, height: 1000 } });
    const page = driver.page;
    const ready = () =>
      page
        .locator("[aria-live]")
        .filter({ hasText: /^就绪$/ })
        .waitFor();
    const click = async (name: string) => {
      await page.getByRole("button", { name, exact: true }).click();
      await ready();
    };
    const preview = async () => {
      await page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
      await page.getByLabel("定位秒", { exact: true }).fill("0.5");
      await click("定位");
      await expect
        .poll(() =>
          page
            .frameLocator("iframe:not([hidden])")
            .locator("body")
            .evaluate(() => Reflect.get(window, "__timelines").main.time()),
        )
        .toBeCloseTo(0.5, 2);
    };
    expect(new URL(handoff.url).origin).toBe(new URL(started.runtime.web).origin);
    await page.goto(handoff.url);
    await ready();
    await preview();
    await expect
      .poll(() => page.locator("[data-artifact-id]").first().getAttribute("data-artifact-id"))
      .toBe(artifact.id);
    await driver.capture("installed-original");
    await click("源码");
    const source = page.getByRole("textbox", { name: "index.html", exact: true }),
      edited = initial.files[0]!.content + "\n<!-- edited in installed Web -->";
    await source.fill(edited);
    await click("保存");
    const saved = await mcp.call("project_read", owner);
    expect(saved.files[0]?.content).toBe(edited);
    expect(saved.revision).not.toBe(initial.revision);
    await click("撤销");
    expect((await mcp.call("project_read", owner)).files).toEqual(initial.files);
    await click("重做");
    const redone = await mcp.call("project_read", owner);
    expect(redone.files).toEqual(saved.files);
    await expect(
      mcp.call("project_save", {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: initial.revision,
        files: initial.files,
      }),
    ).rejects.toThrow();
    const continued = await mcp.call("project_save", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: redone.revision,
      files: [{ path: "index.html", content: edited + "\n<!-- MCP continuation -->" }],
    });
    await page.reload();
    await page.locator("[aria-live]").filter({ hasText: "entry target revision or history version changed" }).waitFor();
    expect(await page.locator("[data-artifact-id]").first().getAttribute("data-artifact-id")).toBe("");
    await page.goto((await mcp.handoff(continued)).url);
    await ready();
    await click("源码");
    expect(await source.inputValue()).toContain("MCP continuation");
    expect((await mcp.call("project_snapshot", { ...owner, revision: initial.revision })).files).toEqual(initial.files);
    expect((await connectRoot(f.data, f.scope)).manager.incarnation).toBe(manager.incarnation);
    let film: Output<"export_read"> | undefined, filmDigest: string | undefined;
    if (nativeManifest) {
      await page.getByLabel("影片导出", { exact: true }).locator("summary").click();
      await click("导出 MP4（30fps）");
      await expect
        .poll(async () => (await mcp!.call("export_list", owner)).jobs[0]?.state, { timeout: 90000 })
        .toBe("succeeded");
      film = (await mcp.call("export_list", owner)).jobs[0]!;
      expect(film.revision).toBe(continued.revision);
      expect(film.result?.verification.frames).toBe(30);
      const info = await mcp.call("export_download", { ...owner, id: film.id }),
        response = await fetch(info.url),
        bytes = Buffer.from(await response.arrayBuffer());
      expect(response.status).toBe(200);
      expect(`sha256:${hash(bytes)}`).toBe(info.digest);
      filmDigest = info.digest;
      await writeFile(join(f.evidence, "film.mp4"), bytes);
    }
    await mcp.close();
    mcp = undefined;
    expect((await f.command(["status"])).state).toBe("running");
    await page.goto("about:blank");
    // A pending durable update must reject restart before touching the live owner.
    const options = { home: f.home, product: "io.openmotion.app", scope: f.scope },
      requestId = randomUUID();
    let installation = await open(options);
    try {
      await installation.transitions.begin({ requestId, intent: { operator: "restart-test" }, data: null });
    } finally {
      await installation.close();
    }
    await expect(f.command(["restart"])).rejects.toMatchObject({
      stdout: expect.stringContaining("unfinished installation transition"),
    });
    expect((await connectRoot(f.data, f.scope)).manager.incarnation).toBe(manager.incarnation);
    installation = await open(options);
    try {
      await installation.transitions.advance({ requestId, expectedRevision: 0, data: null, complete: true });
    } finally {
      await installation.close();
    }
    expect(await f.command(["restart"])).toMatchObject({ state: "running", root: f.data });
    const replacement = (await connectRoot(f.data, f.scope)).manager;
    expect(replacement.incarnation).not.toBe(manager.incarnation);
    mcp = await attach();
    expect(await mcp.call("project_read", owner)).toEqual(continued);
    if (film) expect(await mcp.call("export_read", { ...owner, id: film.id })).toEqual(film);
    await mcp.close();
    mcp = undefined;
    await f.command(["stop"]);
    expect((await readDirectory(f.data)).manager.phase).toBe("closed");
    expect(await observeProcesses(f.data)).toEqual([]);
    const restarted: { runtime: Status } = await f.command(["start"]);
    expect((await connectRoot(f.data, f.scope)).manager.incarnation).not.toBe(replacement.incarnation);
    mcp = await attach();
    expect(await mcp.call("project_read", owner)).toEqual(continued);
    expect((await mcp.call("session_get", { sessionId: session.id })).artifacts.map((a) => a.id)).toContain(
      artifact.id,
    );
    const restoredHandoff = await mcp.handoff(continued);
    expect(new URL(restoredHandoff.url).origin).toBe(new URL(restarted.runtime.web).origin);
    await page.goto(restoredHandoff.url);
    await ready();
    await preview();
    await driver.capture("installed-restored");
    if (film) {
      expect(await mcp.call("export_read", { ...owner, id: film.id })).toEqual(film);
      const info = await mcp.call("export_download", { ...owner, id: film.id }),
        response = await fetch(info.url);
      expect(`sha256:${hash(Buffer.from(await response.arrayBuffer()))}`).toBe(filmDigest);
    }
    expect(driver.errors).toEqual([]);
    await writeFile(
      join(f.evidence, "continuity.json"),
      JSON.stringify(
        {
          version: f.version,
          owner,
          initial: initial.revision,
          saved: saved.revision,
          continued: continued.revision,
          history: continued.history,
          entry: {
            exactTarget: true,
            newerProjectNotSubstituted: newest.id,
            display: handoff.display,
            staleReloadRefused: true,
            coldRestart: true,
          },
          native: film
            ? { job: film.id, digest: filmDigest, frames: film.result?.verification.frames }
            : "not-qualified",
          archive: f.archive,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await driver?.capture("installed-failure").catch(() => undefined);
    failure = error;
  } finally {
    const disconnected = await Promise.allSettled([driver?.close(), mcp?.close()]);
    const stopped = await Promise.allSettled([f.command(["stop"])]);
    cleanupErrors.push(
      ...[...disconnected, ...stopped].flatMap((result) => (result.status === "rejected" ? [result.reason] : [])),
    );
  }
  if (failure || cleanupErrors.length)
    throw new AggregateError([...(failure ? [failure] : []), ...cleanupErrors], "installed journey or drain failed");
  const s = await open({ home: f.home, product: "io.openmotion.app", scope: f.scope });
  try {
    expect((await s.uses()).every((u) => u.state === "retired")).toBe(true);
  } finally {
    await s.close();
  }
  expect(await observeProcesses(f.data)).toEqual([]);
  const authority = join(f.home, "authority", "io.openmotion.app");
  expect((await readDirectory(authority)).manager.phase).toBe("closed");
  expect(await observeProcesses(authority)).toEqual([]);
}, 180000);
