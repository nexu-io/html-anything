import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import type { Artifact, Project, SessionDetail } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

it("routes large native source through actual pnpm exec development attachments without widening sidecar frames", async () => {
  const repo = fileURLToPath(new URL("../../../", import.meta.url)),
    namespace = `templates${randomUUID().replaceAll("-", "").slice(0, 8)}`,
    args = ["--carrier=codexplugin", "--channel=dev", `--namespace=${namespace}`],
    command = async (operation: string) =>
      JSON.parse(
        (
          await promisify(execFile)(
            "pnpm",
            ["exec", "odsuite", "dev", operation, ...args, ...(operation === "start" ? ["--watch=false"] : [])],
            { cwd: repo, timeout: 200000, maxBuffer: 1024 ** 2 },
          )
        ).stdout,
      ),
    attach = async () => {
      const transport = new StdioClientTransport({
        command: "pnpm",
        args: ["exec", "odsuite", "dev", "connect", ...args],
        cwd: repo,
        stderr: "pipe",
      });
      const client = new Client({ name: "template-attachment", version: "1.0.0" });
      await client.connect(transport);
      return {
        client,
        transport,
        close: async () => {
          await client.close();
          await transport.close();
        },
      };
    };
  const evidence = join(repo, ".artifacts", "template-attachment", namespace);
  await mkdir(evidence, { recursive: true });
  const report: Record<string, unknown> = { namespace };
  let connection: Awaited<ReturnType<typeof attach>> | undefined, root: string | undefined;
  try {
    const started = await command("start");
    expect(started.result.state).toBe("running");
    root = started.result.root;
    connection = await attach();
    const call = async (name: string, input: Record<string, unknown>) => {
      const result = await connection!.client.callTool({ name, arguments: input });
      if (result.isError) throw Error(JSON.stringify(result.content));
      return result.structuredContent;
    };
    const session = (await call("session_create", {
        requestId: randomUUID(),
        title: "Large template",
        mode: "motion",
      })) as unknown as SessionDetail,
      catalog = (await call("template_list", {})) as { templates: { id: string; contentHash: string }[] },
      selected = { id: catalog.templates[0]!.id, contentHash: catalog.templates[0]!.contentHash };
    const native = await call("template_read", selected);
    expect(JSON.stringify(native).length).toBeGreaterThan(65536);
    const request = { ...selected, requestId: randomUUID(), sessionId: session.id, title: "Shared template" },
      artifact = (await call("template_create", request)) as unknown as Artifact,
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = (await call("project_read", owner)) as unknown as Project;
    const changed = project.files.map((file) => ({
      ...file,
      content: file.path === "index.html" ? file.content.replace("<title>", "<title>Attachment edit ") : file.content,
    }));
    const saved = (await call("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: changed,
    })) as unknown as Project;
    expect(saved.revision).not.toBe(project.revision);
    report.project = {
      artifactId: artifact.id,
      revision: saved.revision,
      sourceBytes: JSON.stringify(saved.files).length,
      template: selected,
    };
    await connection.close();
    connection = undefined;
    expect((await command("status")).result.state).toBe("running");
    connection = await attach();
    expect(await call("project_read", owner)).toEqual(saved);
    expect(await call("template_create", request)).toEqual(artifact);
    report.reconnected = true;
  } finally {
    await connection?.close();
    if (root) {
      expect((await command("stop")).result.state).toBe("stopped");
      expect((await readDirectory(root)).manager.phase).toBe("closed");
      expect(await observeProcesses(root)).toEqual([]);
      report.closed = (await readDirectory(root)).manager.phase;
      report.processes = await observeProcesses(root);
      await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
    }
  }
}, 240000);
