import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { schemas } from "@open-motion/daemon/contract";
import type { Status } from "@open-motion/standalone";
import {
  type Artifact,
  initialFiles,
  type Output,
  type Project,
  resourceLimit,
  type SessionDetail,
} from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

it("runs a relocated closed plugin through actual SDK stdio, real health and clean EOF", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-stdio-"));
  const plugin = join(root, "plugin");
  await cp(resolve("dist"), plugin, { recursive: true });
  for (const name of ["LICENSE", "NOTICE"]) {
    const original = await readFile(new URL(`../../../${name}`, import.meta.url), "utf8"),
      bundled = await readFile(join(plugin, name), "utf8");
    expect(await readFile(join(plugin, "web", name), "utf8")).toBe(original);
    if (name === "LICENSE") expect(bundled).toBe(original);
    else {
      expect(bundled.startsWith(original)).toBe(true);
      expect(bundled).toContain("Bundled dependency: @hyperframes/engine@0.9.7");
      expect(bundled).toContain("Bundled dependency: @modelcontextprotocol/server@2.4.0 (Apache-2.0)");
    }
  }
  const built = JSON.parse(await readFile(join(plugin, "runtime.json"), "utf8"));
  const data = join(root, "data");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(plugin, "main.mjs")],
    cwd: plugin,
    env: { OPEN_MOTION_ROOT: data, OPEN_MOTION_CHANNEL: built.channel, OPEN_MOTION_NAMESPACE: "stdio" },
    stderr: "pipe",
  });
  const client = new Client({ name: "open-motion-verifier", version: "1.0.0" });
  let passed = false;
  try {
    await client.connect(transport);
    expect(client.getServerVersion()).toEqual({ name: "open-motion", version: built.version });
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
    expect(client.getInstructions()).toContain("open-motion://guidance");
    const resources = await client.listResources();
    const pluginManifest = JSON.parse(await readFile(join(plugin, ".codex-plugin", "plugin.json"), "utf8"));
    expect(pluginManifest.skills).toBe("./skills/");
    const guideManifest = JSON.parse(await readFile(join(plugin, "skills", "manifest.json"), "utf8")) as {
      skills: { name: string }[];
      documents: { documentId: string; path: string; contentHash: string; localContentHash: string }[];
    };
    expect(guideManifest.skills.map((entry) => entry.name)).toEqual([
      "motion-production",
      "motion-director",
      "motion-template-to-video",
      "motion-recreate",
      "motion-video-to-template",
    ]);
    expect(guideManifest.documents).toHaveLength(25);
    expect(resources.resources).toHaveLength(25);
    expect(resources.resources.map((entry) => entry.name)).toEqual(
      expect.arrayContaining([
        "production",
        "native",
        "templates",
        "verification",
        "director",
        "template",
        "recreate",
        "videotemplate",
      ]),
    );
    for (const entry of resources.resources) {
      const document = await client.readResource({ uri: entry.uri });
      const text = document.contents[0]!;
      if (!("text" in text)) throw Error("guidance was not text");
      const http = await fetch(`${bootstrap.daemon}/guidance/${entry.name}`, {
        headers: { authorization: `Bearer ${bootstrap.token}` },
      });
      const canonical = JSON.parse(text.text) as { documentId: string; contentHash: string; content: string };
      expect(await http.json()).toEqual(canonical);
      const local = guideManifest.documents.find((item) => item.documentId === canonical.documentId)!;
      const localContent = await readFile(join(plugin, "skills", local.path), "utf8");
      expect(`sha256:${createHash("sha256").update(localContent).digest("hex")}`).toBe(local.localContentHash);
      expect(local.contentHash).toBe(canonical.contentHash);
      const body = localContent.replace(/^---\n[\s\S]*?\n---\n\n/, "");
      const restored = body.replace(/\]\(([^)]+)\)/g, (match, reference: string) => {
        if (/^[a-z]+:/.test(reference)) return match;
        const target = posix.normalize(posix.join(posix.dirname(local.path), reference));
        const document = guideManifest.documents.find((candidate) => candidate.path === target);
        expect(document).toBeDefined();
        return `](${document!.documentId})`;
      });
      expect(restored).toBe(canonical.content);
    }
    const catalog = (await client.callTool({ name: "template_list", arguments: {} })).structuredContent as {
      templates: { id: string; contentHash: string; title: string }[];
    };
    expect(catalog.templates).toHaveLength(3);
    for (const template of catalog.templates) {
      const selected = await client.callTool({
        name: "template_read",
        arguments: { id: template.id, contentHash: template.contentHash },
      });
      expect(selected.isError).not.toBe(true);
      expect(JSON.stringify(selected.structuredContent).length).toBeGreaterThan(65536);
      const input = {
        id: template.id,
        contentHash: template.contentHash,
        sessionId: session.id,
        title: template.title,
        requestId: randomUUID(),
      };
      const created = await client.callTool({ name: "template_create", arguments: input });
      expect(created.isError).not.toBe(true);
      expect((await client.callTool({ name: "template_create", arguments: input })).structuredContent).toEqual(
        created.structuredContent,
      );
    }
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
    const processes = await observeProcesses(data);
    expect(processes).toEqual([]);
    const evidence = join(
      fileURLToPath(new URL("../../../", import.meta.url)),
      ".artifacts",
      "guidance-acceptance",
      randomUUID(),
    );
    await mkdir(evidence, { recursive: true });
    await writeFile(
      join(evidence, "result.json"),
      JSON.stringify(
        {
          skills: guideManifest.skills.map((entry) => entry.name),
          documents: guideManifest.documents,
          bodiesIdenticalAfterLocalLinkResolution: true,
          transports: ["authenticated HTTP", "stock SDK stdio MCP", "relocated local files"],
          sourceOperationAndMaximumMediaRoundtrip: true,
          manager: directory.manager.phase,
          processes,
          instances: directory.instances.map((instance) => ({ service: instance.service, phase: instance.phase })),
        },
        null,
        2,
      ),
    );
    passed = true;
  } finally {
    await client.close();
    if (passed) await rm(root, { recursive: true, force: true });
    else process.stderr.write(`retained stdio evidence: ${root}\n`);
  }
}, 30000);

it("drains a real runtime when stdin ends before any initialize request", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-early-eof-"));
  const built = JSON.parse(await readFile(resolve("dist/runtime.json"), "utf8"));
  const child = spawn(process.execPath, [resolve("dist/main.mjs")], {
    env: { ...process.env, OPEN_MOTION_ROOT: root, OPEN_MOTION_CHANNEL: built.channel, OPEN_MOTION_NAMESPACE: "early" },
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
