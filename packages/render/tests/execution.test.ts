import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Library, type Resource } from "@odsuite/blob";
import { channel, digest, namespace } from "@odsuite/protocol";
import { type Context, managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { freeze, render, type Tools } from "@";

function wav() {
  const samples = 24000,
    bytes = Buffer.alloc(44 + samples * 2);
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
  bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    bytes.writeInt16LE(Math.round(Math.sin((i * 2 * Math.PI * 440) / 8000) * 10000), 44 + i * 2);
  return bytes.toString("base64");
}
const document = (audio = false, duration = 1) =>
  `<html><body><main data-composition-id="main" data-width="160" data-height="90" data-duration="${duration}"><svg width="160" height="90"><rect id="square" width="40" height="40" fill="red"/></svg>${audio ? '<audio data-hf-id="sound" src="assets/tone.wav" data-start="0" data-duration="1" data-media-start="0.2" data-playback-rate="2" data-volume="0.5"></audio>' : ""}</main><script>window.__timelines={main:gsap.timeline({paused:true}).to('#square',{attr:{x:100},duration:${duration},ease:'none'})};</script></body></html>`;

// Explicit preverified source assets are supplied by the local acceptance runner, never PATH discovery or a download hook.
it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "renders, decodes, reopens and cancels a real sidecar-owned native execution",
  async () => {
    const manifestPath = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
      manifest = JSON.parse(await readFile(manifestPath, "utf8")),
      root = await realpath(await mkdtemp(join(tmpdir(), "motion-render-accept-"))),
      manager = await serve(managerEndpoint(root), { root }),
      factory = manager.factory({ channel: channel("dev"), namespace: namespace("render") });
    expect(Object.keys(manifest).sort()).toEqual(["browser", "ffmpeg", "ffprobe"]);
    const tool = (name: string) => {
      const spec = manifest[name] as { path: string; executable: string; resource: Resource },
        path = resolve(dirname(manifestPath), spec.path);
      return { resource: spec.resource, executable: spec.executable, load: async () => createReadStream(path) };
    };
    const tools: Tools = { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") };
    let context!: Context, library!: Library, workspace!: Workspace;
    const host = await factory.expose({
      identity: { service: "acceptance", generation: digest("render acceptance") },
      handlers: {},
      lifecycle: {
        initialize: async (ctx) => {
          context = ctx;
          library = await Library.open({ factory, context: ctx, retentionMs: 0 });
          workspace = new Workspace(ctx.roots.data);
        },
        stop: async () => {},
      },
    });
    const results: unknown[] = [];
    try {
      const session = workspace.execute("session_create", { requestId: randomUUID(), title: "Render", mode: "motion" }),
        artifact = workspace.execute("artifact_create", {
          requestId: randomUUID(),
          sessionId: session.id,
          title: "Film",
          files: [{ path: "index.html", content: document() }],
        }),
        owner = { sessionId: session.id, artifactId: artifact.id };
      let current = workspace.execute("project_read", owner);
      const snapshot = freeze(workspace, { ...owner, expectedRevision: current.revision, fps: { num: 12, den: 1 } }),
        first = render({ factory, context, library, tools, input: snapshot });
      current = workspace.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        files: [{ path: "index.html", content: document(true) }],
      });
      const silent = await first;
      expect(silent.verification).toMatchObject({ frames: 12, audio: false });
      expect(silent.revision).toBe(snapshot.project.revision);
      expect(workspace.execute("project_snapshot", { ...owner, revision: silent.revision })).toEqual(snapshot.project);
      expect(workspace.execute("project_read", owner).revision).toBe(current.revision);
      results.push({ kind: "silent", ...silent });
      current = workspace.execute("resource_import", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        path: "assets/tone.wav",
        name: "Tone",
        data: wav(),
      });
      const sound = await render({
        factory,
        context,
        library,
        tools,
        input: freeze(workspace, { ...owner, expectedRevision: current.revision, fps: { num: 12, den: 1 } }),
      });
      expect(sound.verification).toMatchObject({ frames: 12, audio: true });
      expect(JSON.parse(await readFile(sound.path.replace(/\.mp4$/, ".json"), "utf8"))).toEqual(sound);
      results.push({ kind: "audio", ...sound });
      const controller = new AbortController(),
        pending = render({
          factory,
          context,
          library,
          tools,
          input: freeze(workspace, { ...owner, expectedRevision: current.revision, fps: { num: 60, den: 1 } }),
          signal: controller.signal,
        });
      const rejected = expect(pending).rejects.toThrow(/aborted|acceptance cancellation/);
      await expect
        .poll(
          async () => {
            const grant = (await factory.resources()).grants.find((g) => g.kind === "staging" && g.name === "render");
            if (!grant) return false;
            try {
              return JSON.parse(await readFile(join(grant.value, "result.json"), "utf8")).phase === "capturing";
            } catch {
              return false;
            }
          },
          { timeout: 30000 },
        )
        .toBe(true);
      const occupied = Object.values((await library.status()).entries).flatMap((e) => e.uses),
        instance = (await factory.directory()).instances.find((i) => i.service === "render" && i.phase === "ready");
      const tree = (await observeProcesses(root)).find((p) => p.incarnation === instance?.incarnation);
      expect(tree?.processes.length).toBeGreaterThan(1);
      expect(occupied).toHaveLength(3);
      expect(occupied.every((u) => u.owner.incarnation === instance?.incarnation)).toBe(true);
      expect(await library.collect()).toEqual([]);
      results.push({
        kind: "running",
        pid: instance?.pid,
        uses: occupied.length,
        processCount: tree?.processes.length,
        incarnation: instance?.incarnation,
      });
      controller.abort(Error("acceptance cancellation"));
      await rejected;
      expect(
        (await factory.directory()).instances.filter((i) => i.service === "render").every((i) => i.phase === "retired"),
      ).toBe(true);
      expect(Object.values((await library.status()).entries).flatMap((e) => e.uses)).toEqual([]);
      const retry = await render({
        factory,
        context,
        library,
        tools,
        input: freeze(workspace, { ...owner, expectedRevision: current.revision, fps: { num: 12, den: 1 } }),
      });
      results.push({ kind: "retry", ...retry });
      const bad = freeze(workspace, { ...owner, expectedRevision: current.revision, fps: { num: 12, den: 1 } });
      bad.spec.width = 162;
      await expect(render({ factory, context, library, tools, input: bad })).rejects.toThrow(
        "differs from fixed source",
      );
      expect(await library.collect()).toHaveLength(3);
      expect((await stat(sound.path)).size).toBe(sound.verification.bytes);
      expect((await factory.resources()).grants.filter((g) => g.kind === "staging" && g.name === "render")).toEqual([]);
      results.push({ kind: "collected", resources: 3, exportRetained: true, sourceRevision: current.revision });
    } finally {
      workspace.close();
      await library.close();
      await host.close();
      await manager.close();
    }
    const directory = await readDirectory(root);
    expect(directory.manager.phase).toBe("closed");
    if (process.env.OPEN_MOTION_RENDER_EVIDENCE)
      await writeFile(
        process.env.OPEN_MOTION_RENDER_EVIDENCE,
        JSON.stringify(
          {
            root,
            results,
            closed: directory.manager.phase,
            active: directory.instances.filter((i: { phase: string }) => i.phase !== "retired").length,
          },
          null,
          2,
        ),
      );
  },
  180000,
);
