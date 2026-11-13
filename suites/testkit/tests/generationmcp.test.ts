import { randomUUID } from "node:crypto";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import { initialFiles } from "@open-motion/workspace/contract";
import { PNG } from "pngjs";
import { expect, it } from "vitest";

// Public OS/network/persistence readiness has a finite budget above the provider polling period.
const poll = <T>(read: () => T | Promise<T>, options = { timeout: 10000 }) => expect.poll(read, options);

it("keeps a verified generated PNG durable across stock SDK adoption, receipt replay and unconfigured cold restart", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/generation-mcp/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "product"),
    fixtureRoot = join(evidence, "fixture"),
    plugin = join(evidence, "plugin"),
    scope = { channel: channel("dev"), namespace: namespace("generation-mcp") },
    report: Record<string, unknown> = { proof: "loopback provider protocol/lifecycle; no actual model execution" };
  await mkdir(evidence, { recursive: true });
  const fixture = await serve(managerEndpoint(fixtureRoot), { root: fixtureRoot });
  const image = new PNG({ width: 256, height: 128 });
  let seed = 17;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    for (let color = 0; color < 3; color++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      image.data[offset + color] = seed >>> 24;
    }
    image.data[offset + 3] = 255;
  }
  const png = PNG.sync.write(image),
    identity = digest(png);
  expect(png.length).toBeGreaterThan(65536);
  let origin = "",
    online = true,
    submits = 0,
    reads = 0;
  const intents: unknown[] = [],
    errors: unknown[] = [];
  let client: Client | undefined, transport: StdioClientTransport | undefined, failure: unknown;
  const remote = createServer(async (request, response) => {
    if (!online) {
      response.writeHead(503);
      response.end();
      return;
    }
    if (request.url === "/submit" && request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      intents.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      submits++;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ remoteId: "fixture-png" }));
    } else if (request.url === "/read/fixture-png") {
      reads++;
      response.setHeader("content-type", "image/png");
      response.end(png);
    } else if (request.url === "/cancel/fixture-png") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ confirmed: true }));
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  const connect = async (configured: boolean) => {
    const script = `import {connect} from ${JSON.stringify(fileURLToPath(new URL("index.mjs", `file://${plugin}/`)))};
      const origin=${JSON.stringify(origin)};
      const json=async(path,signal,init={})=>{const response=await fetch(origin+path,{...init,signal});if(!response.ok)throw Error('fixture unavailable');return response.json();};
      const gateway={id:'fixture',version:'1',models:[{id:'png',label:'Loopback PNG'}],
        submit:(input,signal)=>json('/submit',signal,{method:'POST',body:JSON.stringify(input)}),
        read:async(id,signal)=>{const response=await fetch(origin+'/read/'+id,{signal});if(!response.ok)throw Error('fixture unavailable');return response.headers.get('content-type')==='image/png'?{state:'succeeded',bytes:new Uint8Array(await response.arrayBuffer())}:response.json();},
        cancel:(id,signal)=>json('/cancel/'+id,signal)};
      await connect({...${JSON.stringify({ root, scope, version: "0.6.1-dev.1" })},${configured ? "gateway" : ""}});`;
    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--input-type=module", "-e", script],
      cwd: plugin,
      stderr: "pipe",
    });
    let stderr = "";
    transport.stderr?.on("data", (bytes) => {
      stderr = (stderr + bytes).slice(-16000);
    });
    client = new Client({ name: "generation-acceptance", version: "1.0.0" });
    try {
      await client.connect(transport);
    } catch (error) {
      await writeFile(join(evidence, "private-child-stderr.log"), stderr, { mode: 0o600 });
      throw error;
    }
  };
  const call = async <N extends Operation>(name: N, args: Input<N>): Promise<Output<N>> => {
    const result = await client!.callTool({ name, arguments: args });
    expect(result.isError, JSON.stringify(result.structuredContent)).not.toBe(true);
    return result.structuredContent as unknown as Output<N>;
  };
  const close = async () => {
    await client?.close();
    client = undefined;
    await transport?.close();
    transport = undefined;
    await poll(async () => (await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  };
  try {
    await fixture.expose({
      identity: { ...scope, service: "provider", generation: digest("fixture") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "provider" }),
            port = await context.allocate({ kind: "port", name: "provider", scheme: "http" });
          await new Promise<void>((done) => remote.listen(socket.value, done));
          await context.forward(port.value, socket.value);
          origin = port.value;
        },
        stop: () => new Promise<void>((done, reject) => remote.close((error) => (error ? reject(error) : done()))),
      },
    });
    await cp(fileURLToPath(new URL("../../../carriers/codexplugin/dist/runtime/", import.meta.url)), plugin, {
      recursive: true,
    });
    await connect(true);
    expect(await call("generation_status", {})).toMatchObject({
      configured: true,
      providers: [{ id: "fixture", version: "1" }],
    });
    const session = await call("session_create", { requestId: randomUUID(), title: "SDK generation", mode: "motion" }),
      artifact = await call("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Original",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      original = await call("project_read", owner),
      selected = await call("workspace_state", {}),
      intent = {
        ...owner,
        requestId: randomUUID(),
        revision: original.revision,
        providerId: "fixture",
        providerVersion: "1",
        modelId: "png",
        prompt: "界🙂 PNG candidate with an exact durable identity",
      },
      created = await call("generation_create", intent),
      job = { ...owner, id: created.id };
    expect(await call("generation_create", intent)).toEqual(created);
    await poll(() => submits).toBe(1);
    expect(intents).toEqual([intent]);
    await poll(async () => (await call("generation_read", job)).state).toBe("succeeded");
    expect(await call("project_read", owner)).toEqual(original);
    expect(await call("workspace_state", {})).toEqual(selected);
    const raw = await client!.callTool({ name: "generation_result", arguments: job });
    expect(raw.isError).not.toBe(true);
    const result = raw.structuredContent as unknown as Output<"generation_result">;
    expect(result.candidate).toMatchObject({
      jobId: created.id,
      contentHash: identity,
      bytes: png.length,
      width: 256,
      height: 128,
      type: "image/png",
    });
    expect(Buffer.from(result.data, "base64")).toEqual(png);
    expect(JSON.stringify(raw.content)).not.toContain(result.data);
    expect(raw.content).toEqual([{ type: "text", text: JSON.stringify({ candidate: result.candidate }) }]);
    const adopt = {
        ...job,
        requestId: randomUUID(),
        expectedRevision: original.revision,
        path: "assets/generated.png",
        name: "SDK generated PNG",
        contentHash: identity,
      },
      adopted = await call("generation_adopt", adopt);
    expect(await call("generation_adopt", adopt)).toEqual(adopted);
    expect(adopted.files).toEqual(original.files);
    expect(adopted.resources).toHaveLength(1);
    const mediaRead = await call("resource_read", { ...owner, revision: adopted.revision, path: adopt.path });
    expect(Buffer.from(await (await fetch(mediaRead.url)).arrayBuffer()).toString("base64")).toBe(result.data);
    await call("resource_release", { id: mediaRead.id });
    const edited = await call("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: adopted.revision,
      files: adopted.files.map((file) => ({
        ...file,
        content: file.path === "index.html" ? `${file.content}\n<!-- manual accepted edit -->` : file.content,
      })),
    });
    expect(await call("generation_adopt", adopt)).toEqual(adopted);
    expect(await call("project_read", owner)).toEqual(edited);
    const stale = await client!.callTool({
      name: "generation_adopt",
      arguments: { ...adopt, requestId: randomUUID(), path: "assets/stale.png" },
    });
    expect(stale.isError).toBe(true);
    const other = await call("session_create", { requestId: randomUUID(), title: "Other owner", mode: "motion" }),
      wrong = await client!.callTool({ name: "generation_result", arguments: { ...job, sessionId: other.id } });
    expect(wrong.isError).toBe(true);
    expect(await call("project_read", owner)).toEqual(edited);
    await close();
    online = false;
    const before = { submits, reads };
    await connect(false);
    expect(await call("generation_status", {})).toMatchObject({ configured: false, providers: [] });
    expect(await call("generation_result", job)).toEqual(result);
    expect((await call("generation_list", owner)).jobs[0]?.id).toBe(created.id);
    expect(await call("generation_adopt", adopt)).toEqual(adopted);
    expect(await call("generation_create", intent)).toEqual(created);
    expect(await call("project_read", owner)).toEqual(edited);
    expect({ submits, reads }).toEqual(before);
    report.acceptance = {
      transport: "relocated stock SDK stdio",
      pngBytes: png.length,
      digest: identity,
      job: created.id,
      submits,
      reads,
      candidateOnceInStructuredContent: true,
      unchangedUntilAdopt: true,
      durableOfflineReplay: true,
      finalRevision: edited.revision,
    };
  } catch (error) {
    failure = error;
  } finally {
    for (const finish of [close, () => fixture.close()]) {
      try {
        await finish();
      } catch (error) {
        errors.push(error);
      }
    }
    for (const [name, path] of [
      ["product", root],
      ["fixture", fixtureRoot],
    ] as const) {
      try {
        report[name] = { phase: (await readDirectory(path)).manager.phase, processes: await observeProcesses(path) };
      } catch (error) {
        report[name] = { observation: "unknown" };
        errors.push(error);
      }
    }
    if (failure) report.failure = String(failure);
    if (errors.length) report.cleanupErrors = errors.map(String);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failure || errors.length)
    throw new AggregateError(
      [...(failure ? [failure] : []), ...errors],
      "Generation MCP acceptance failed; evidence retained",
    );
  expect(report.product).toEqual({ phase: "closed", processes: [] });
  expect(report.fixture).toEqual({ phase: "closed", processes: [] });
}, 60000);
