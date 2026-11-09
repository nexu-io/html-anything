import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { readDirectory } from "@odsuite/sidecar";
import type { Status } from "@open-motion/standalone";
import {
  type Artifact,
  initialFiles,
  type Output,
  type Project,
  resourceLimit,
  type SessionDetail,
  schemas,
} from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

it("runs a relocated closed plugin through actual SDK stdio, real health and clean EOF", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-stdio-"));
  const plugin = join(root, "plugin");
  await cp(resolve("dist"), plugin, { recursive: true });
  for (const name of ["LICENSE", "NOTICE"]) {
    expect(await readFile(join(plugin, name), "utf8")).toBe(
      await readFile(new URL(`../../../${name}`, import.meta.url), "utf8"),
    );
    expect(await readFile(join(plugin, "web", name), "utf8")).toBe(await readFile(join(plugin, name), "utf8"));
  }
  const data = join(root, "data");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(plugin, "main.mjs")],
    cwd: plugin,
    env: { OPEN_MOTION_ROOT: data, OPEN_MOTION_CHANNEL: "stable", OPEN_MOTION_NAMESPACE: "stdio" },
    stderr: "pipe",
  });
  const client = new Client({ name: "open-motion-verifier", version: "1.0.0" });
  let passed = false;
  try {
    await client.connect(transport);
    const product = JSON.parse(await readFile(new URL("../../../package.json", import.meta.url), "utf8"));
    expect(client.getServerVersion()).toEqual({ name: "open-motion", version: product.version });
    expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual([
      "runtime_status",
      ...Object.keys(schemas),
    ]);
    const result = await client.callTool({ name: "runtime_status", arguments: {} });
    expect(result.isError).not.toBe(true);
    const status = result.structuredContent as unknown as Status;
    expect(status.environment.carrier).toBe("codexplugin");
    expect(status.daemon.environment).toEqual(status.environment);
    const bootstrap = await (await fetch(`${status.web}/bootstrap.json`)).json();
    expect(bootstrap.environment).toEqual(status.environment);
    await expect(client.callTool({ name: "unimplemented_edit", arguments: {} })).rejects.toThrow("not found");
    expect(JSON.stringify(result)).not.toContain('"token"');
    const command = { requestId: randomUUID(), title: "actual stdio session", mode: "motion" };
    const session = (await client.callTool({ name: "session_create", arguments: command }))
      .structuredContent as unknown as SessionDetail;
    expect((await client.callTool({ name: "session_create", arguments: command })).structuredContent).toEqual(session);
    const artifact = (
      await client.callTool({
        name: "artifact_create",
        arguments: { requestId: randomUUID(), sessionId: session.id, title: "native", files: initialFiles() },
      })
    ).structuredContent as unknown as Artifact;
    const project = (
      await client.callTool({ name: "project_read", arguments: { sessionId: session.id, artifactId: artifact.id } })
    ).structuredContent as unknown as Project;
    const saved = (
      await client.callTool({
        name: "project_save",
        arguments: {
          requestId: randomUUID(),
          sessionId: session.id,
          artifactId: artifact.id,
          expectedRevision: project.revision,
          files: [{ path: "index.html", content: "actual native source" }],
        },
      })
    ).structuredContent as unknown as Project;
    expect(saved.revision).not.toBe(project.revision);
    const stale = await client.callTool({
      name: "project_save",
      arguments: {
        requestId: randomUUID(),
        sessionId: session.id,
        artifactId: artifact.id,
        expectedRevision: project.revision,
        files: initialFiles(),
      },
    });
    expect(stale.isError).toBe(true);
    expect(stale.structuredContent).toMatchObject({ error: { code: "conflict" } });
    const fromHttp = await fetch(`${bootstrap.daemon}/api/project_read`, {
      method: "POST",
      headers: { authorization: `Bearer ${bootstrap.token}`, "content-type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, artifactId: artifact.id }),
    });
    expect(await fromHttp.json()).toEqual(saved);
    const owner = { sessionId: session.id, artifactId: artifact.id };
    const bytes = Buffer.alloc(resourceLimit);
    bytes.write("RIFF");
    bytes.writeUInt32LE(bytes.length - 8, 4);
    bytes.write("WAVEfmt ", 8);
    bytes.writeUInt32LE(16, 16);
    bytes.writeUInt16LE(1, 20);
    bytes.writeUInt16LE(1, 22);
    bytes.writeUInt32LE(8000, 24);
    bytes.writeUInt32LE(16000, 28);
    bytes.writeUInt16LE(2, 32);
    bytes.writeUInt16LE(16, 34);
    bytes.write("data", 36);
    bytes.writeUInt32LE(bytes.length - 44, 40);
    const encoded = bytes.toString("base64"),
      resourceCommand = {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: saved.revision,
        path: "assets/maximum.wav",
        name: "Maximum PCM",
        data: encoded,
      },
      importedResult = await client.callTool({ name: "resource_import", arguments: resourceCommand });
    expect(importedResult.isError).not.toBe(true);
    const imported = importedResult.structuredContent as unknown as Project;
    expect(imported.resources[0]).toMatchObject({ bytes: resourceLimit, type: "audio/wav" });
    expect((await client.callTool({ name: "resource_import", arguments: resourceCommand })).structuredContent).toEqual(
      imported,
    );
    const readResult = await client.callTool({
      name: "resource_read",
      arguments: { ...owner, revision: imported.revision, path: "assets/maximum.wav" },
    });
    expect(readResult.isError).not.toBe(true);
    const resourceRead = readResult.structuredContent as unknown as Output<"resource_read">;
    expect(resourceRead.data === encoded).toBe(true);
    expect(JSON.stringify(readResult.content).length).toBeLessThan(1024);
    const httpBytes = await fetch(`${bootstrap.daemon}/api/resource_read`, {
      method: "POST",
      headers: { authorization: `Bearer ${bootstrap.token}`, "content-type": "application/json" },
      body: JSON.stringify({ ...owner, revision: imported.revision, path: "assets/maximum.wav" }),
    });
    expect((await httpBytes.json()).data === encoded).toBe(true);
    await client.close();
    const directory = await readDirectory(data);
    expect(directory.manager.phase).toBe("closed");
    expect(directory.instances.every((i) => i.phase === "retired")).toBe(true);
    passed = true;
  } finally {
    await client.close();
    if (passed) await rm(root, { recursive: true, force: true });
    else process.stderr.write(`retained stdio evidence: ${root}\n`);
  }
}, 30000);

it("drains a real runtime when stdin ends before any initialize request", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-early-eof-"));
  const child = spawn(process.execPath, [resolve("dist/main.mjs")], {
    env: { ...process.env, OPEN_MOTION_ROOT: root, OPEN_MOTION_CHANNEL: "stable", OPEN_MOTION_NAMESPACE: "early" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  const exited = once(child, "exit");
  child.stdin.end();
  let passed = false;
  try {
    const [code] = await exited;
    expect(code).toBe(0);
    expect(output).toBe("");
    const directory = await readDirectory(root);
    expect(directory.manager.phase).toBe("closed");
    expect(directory.instances.every((item) => item.phase === "retired")).toBe(true);
    passed = true;
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    if (passed) await rm(root, { recursive: true, force: true });
    else process.stderr.write(`retained early EOF evidence: ${root}\n`);
  }
}, 15000);
