import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { Library, type Resource } from "@odsuite/blob";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import type { Job } from "@open-motion/render/contract";
import { nativeTools } from "@open-motion/render/tools";
import { expect, it } from "vitest";

it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "renders and downloads through a relocated Node-only MCP carrier with verified native cache seeds",
  async () => {
    const manifestPath = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
      manifest = JSON.parse(await readFile(manifestPath, "utf8")),
      temporary = await mkdtemp(join(tmpdir(), "codex-export-")),
      plugin = join(temporary, "installed"),
      root = join(temporary, "data"),
      evidence = fileURLToPath(new URL(`../../../.artifacts/codex-export/${randomUUID()}/`, import.meta.url)),
      scope = { channel: channel("stable"), namespace: namespace("exports") };
    await mkdir(evidence, { recursive: true });
    await cp(resolve("dist"), plugin, { recursive: true });
    const manager = await serve(managerEndpoint(root), { root }),
      factory = manager.factory(scope);
    let library!: Library;
    await factory.expose({
      identity: { service: "seed", generation: digest("native seed") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({ factory, context });
        },
        stop: () => library.close(),
      },
    });
    try {
      const declared = nativeTools();
      expect(declared).toBeDefined();
      const resources = Object.values(manifest).map((r) => (r as { resource: Resource }).resource);
      await library.retain("prepared", "native-fixture", resources);
      for (const name of ["browser", "ffmpeg", "ffprobe"] as const) {
        const seed = manifest[name] as { path: string; resource: Resource };
        expect(seed.resource).toEqual(declared![name].resource);
        await library.prefetch(seed.resource, async () => createReadStream(resolve(dirname(manifestPath), seed.path)));
      }
    } finally {
      await manager.close();
    }
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [join(plugin, "main.mjs")],
      cwd: temporary,
      env: { OPEN_MOTION_ROOT: root, OPEN_MOTION_CHANNEL: "stable", OPEN_MOTION_NAMESPACE: "exports", NODE_PATH: "" },
      stderr: "pipe",
    });
    const client = new Client({ name: "native-export-verifier", version: "1.0.0" });
    const call = async <K extends Operation>(name: K, args: Input<K>): Promise<Output<K>> => {
      const result = await client.callTool({ name, arguments: args });
      if (result.isError) throw Error(JSON.stringify(result.content));
      return result.structuredContent as unknown as Output<K>;
    };
    let errors = "";
    try {
      transport.stderr?.on("data", (b) => {
        errors += b;
      });
      await client.connect(transport);
      const session = await call("session_create", { requestId: randomUUID(), title: "MCP film", mode: "motion" }),
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
        input = { ...owner, requestId: randomUUID(), revision: project.revision, fps: { num: 12, den: 1 } },
        created = await call("export_create", input);
      expect(await call("export_create", input)).toEqual(created);
      await expect
        .poll(async () => (await call("export_read", { ...owner, id: created.id })).state, { timeout: 60000 })
        .toBe("succeeded");
      const job = (await call("export_read", { ...owner, id: created.id })) as unknown as Job,
        linked = await client.callTool({ name: "export_download", arguments: { ...owner, id: created.id } });
      expect(linked.isError).not.toBe(true);
      expect(linked.content.some((c) => c.type === "resource_link")).toBe(true);
      const info = linked.structuredContent as { url: string; digest: string },
        response = await fetch(info.url),
        bytes = Buffer.from(await response.arrayBuffer());
      expect(response.status).toBe(200);
      expect(bytes.subarray(4, 8).toString()).toBe("ftyp");
      expect(`sha256:${createHash("sha256").update(bytes).digest("hex")}`).toBe(info.digest);
      expect(job.result?.verification.frames).toBe(12);
      expect(JSON.stringify(job)).not.toContain(root);
      await writeFile(join(evidence, "mcp-film.mp4"), bytes);
      await writeFile(join(evidence, "result.json"), JSON.stringify({ temporary, plugin, root, job }, null, 2));
      expect(errors).not.toContain("unresolved");
    } finally {
      await client.close();
      await transport.close();
    }
    await expect.poll(async () => (await readDirectory(root)).manager.phase, { timeout: 15000 }).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  },
  120000,
);
