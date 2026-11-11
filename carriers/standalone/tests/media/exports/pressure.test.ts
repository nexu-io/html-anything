import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";
import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import type { Tools } from "@open-motion/render";
import type { Job } from "@open-motion/render/contract";
import { expect, it } from "vitest";
import { open } from "@";

const mib = 1024 ** 2;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
const hash = (bytes: Uint8Array) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function wave(bytes: number, seed: number) {
  const data = Buffer.alloc(bytes);
  data.write("RIFF");
  data.writeUInt32LE(bytes - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(2, 22);
  data.writeUInt32LE(48000, 24);
  data.writeUInt32LE(192000, 28);
  data.writeUInt16LE(4, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(bytes - 44, 40);
  const block = Buffer.alloc(48000 * 4);
  for (let i = 0; i < 48000; i++) {
    const value = Math.round(Math.sin((2 * Math.PI * (220 + seed * 11) * i) / 48000) * 4096);
    block.writeInt16LE(value, i * 4);
    block.writeInt16LE(value, i * 4 + 2);
  }
  for (let offset = 44; offset < bytes; offset += block.length)
    block.copy(data, offset, 0, Math.min(block.length, bytes - offset));
  return data;
}
const source =
  '<html><body><main data-composition-id="main" data-width="160" data-height="90" data-duration="8"><img id="poster" data-hf-id="poster" src="assets/poster.png" width="32" height="24" data-start="0" data-duration="8"/><audio id="sound" data-hf-id="sound" src="assets/tone0.wav" data-start="0" data-duration="8" data-media-start="0.2" data-playback-rate="1" data-volume="0.25"></audio></main><script>window.__timelines={main:gsap.timeline({paused:true}).to("#poster",{x:100,duration:8,ease:"none"})};</script></body></html>';
async function tools(): Promise<Tools> {
  const path = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
    manifest = JSON.parse(await readFile(path, "utf8"));
  const tool = (name: string) => {
    const entry = manifest[name] as { path: string; executable: string; resource: Tools["browser"]["resource"] };
    return {
      resource: entry.resource,
      executable: entry.executable,
      load: async () => createReadStream(resolve(dirname(path), entry.path)),
    };
  };
  return { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") };
}
async function exercise(native: boolean) {
  const evidence = fileURLToPath(new URL(`../../../../../.artifacts/media-pressure/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("pressure") },
    report: Record<string, unknown> = {
      native: native ? "requested" : "unqualified without explicit native seed manifest",
    };
  await mkdir(evidence, { recursive: true });
  let runtime: Awaited<ReturnType<typeof open>> | undefined,
    driver: Awaited<ReturnType<typeof browser>> | undefined,
    client: Client | undefined,
    held: Client | undefined;
  try {
    runtime = await open({ root, scope, version: "0.6.1-dev.1", ...(native ? { tools: await tools() } : {}) });
    const web = (await runtime.status()).web,
      bootstrap = await (await fetch(new URL("bootstrap.json", web))).json();
    let drop = native;
    const requests: string[] = [];
    client = new Client(bootstrap.daemon, bootstrap.token, async (url, init) => {
      const response = await fetch(url, init);
      if (String(url).endsWith("/export_create")) {
        requests.push(JSON.parse(String(init?.body)).requestId);
        if (drop) {
          drop = false;
          await response.arrayBuffer();
          throw Error("lost accepted export response");
        }
      }
      return response;
    });
    held = new Client(bootstrap.daemon, bootstrap.token);
    const session = await client.execute("session_create", {
        requestId: randomUUID(),
        title: "Near-bound media",
        mode: "motion",
      }),
      artifact = await client.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Shared immutable consumers",
        files: [{ path: "index.html", content: source }],
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      imported = performance.now();
    let current = await client.execute("project_read", owner);
    const lengths = [...Array.from({ length: 10 }, () => 6 * mib), Math.floor((4 * mib - png.length) / 4) * 4];
    for (const [index, length] of lengths.entries()) {
      current = await client.execute("resource_import", {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: current.revision,
        path: `assets/tone${index}.wav`,
        name: `Tone ${index}`,
        data: wave(length, index).toString("base64"),
      });
    }
    current = await client.execute("resource_import", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: current.revision,
      path: "assets/poster.png",
      name: "Poster",
      data: png.toString("base64"),
    });
    report.importMilliseconds = performance.now() - imported;
    const original = current,
      total = current.resources.reduce((n, resource) => n + resource.bytes, 0);
    expect(total).toBeGreaterThan(64 * mib - 4);
    expect(total).toBeLessThanOrEqual(64 * mib);
    expect(current.resources).toHaveLength(12);
    expect(new Set(current.resources.map((r) => r.digest)).size).toBe(12);
    await expect(
      client.execute("resource_import", {
        requestId: randomUUID(),
        ...owner,
        expectedRevision: current.revision,
        path: "assets/overflow.wav",
        name: "Overflow",
        data: wave(192044, 20).toString("base64"),
      }),
    ).rejects.toThrow();
    expect(await client.execute("project_read", owner)).toEqual(current);
    const read = await client.execute("resource_read", {
      ...owner,
      revision: original.revision,
      path: "assets/tone0.wav",
    });
    expect(Buffer.from(read.data, "base64").length).toBe(6 * mib);
    expect(hash(Buffer.from(read.data, "base64"))).toBe(read.resource.digest);
    await client.execute("artifact_open", {
      ...owner,
      requestId: randomUUID(),
      expectedSelection: 0,
      expectedCurrent: null,
    });
    driver = await browser({ evidence, viewport: { width: 1440, height: 1000 } });
    await driver.page.goto(web);
    await driver.page.getByLabel("预览状态", { exact: true }).filter({ hasText: "预览就绪" }).waitFor();
    const preview = await client.preview(original),
      survivor = await held.preview(original),
      page = await driver.page.context().newPage();
    await page.goto(preview.url);
    await expect
      .poll(() => page.locator("#poster").evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBe(32);
    const resourceUrl = (url: string, path: string) => new URL(path, url).href;
    const soundUrl = resourceUrl(survivor.url, "assets/tone0.wav"),
      imageUrl = resourceUrl(survivor.url, "assets/poster.png");
    const range = await fetch(soundUrl, { headers: { range: "bytes=1024-66559" } });
    expect(range.status).toBe(206);
    expect(range.headers.get("content-range")).toBe(`bytes 1024-66559/${6 * mib}`);
    expect(Buffer.from(await range.arrayBuffer())).toEqual(Buffer.from(read.data, "base64").subarray(1024, 66560));
    await page.screenshot({ path: join(evidence, "held-preview.png") });
    const factory = runtime.manager.factory(scope),
      intent = { ...owner, requestId: randomUUID(), revision: original.revision, fps: { num: 30, den: 1 } };
    const cache = async () => {
      const grant = (await factory.resources()).grants.find((g) => g.kind === "data" && g.name === "blob");
      if (!grant) throw Error("renderer library grant missing");
      return JSON.parse(await readFile(join(grant.value, "library.json"), "utf8")) as {
        entries: Record<
          string,
          { uses: { owner: { incarnation: string } }[]; resource: { artifact: { slot: string } } }
        >;
      };
    };
    const capturing = async (id: string) => {
      await expect
        .poll(async () => (await client!.execute("export_read", { ...owner, id })).state, { timeout: 60000 })
        .toBe("capturing");
      const state = await cache();
      const uses = Object.values(state.entries).flatMap((entry) => entry.uses),
        instance = (await factory.directory()).instances.find(
          (entry) => entry.service === "render" && entry.phase === "ready",
        ),
        tree = (await observeProcesses(root)).find((entry) => entry.incarnation === instance?.incarnation);
      expect(uses).toHaveLength(3);
      expect(instance).toBeDefined();
      expect(uses.every((use) => use.owner.incarnation === instance?.incarnation)).toBe(true);
      expect(tree?.processes.length).toBeGreaterThan(1);
      report.nativeProcessCount = tree?.processes.length;
      expect(
        Object.values(state.entries)
          .map((e) => e.resource.artifact.slot)
          .sort(),
      ).toEqual(["browser", "ffmpeg", "ffprobe"]);
      const grant = (await factory.resources()).grants.find((g) => g.kind === "staging" && g.name === "render");
      expect(grant).toBeDefined();
      expect((await stat(join(grant!.value, "view/assets/tone0.wav"))).size).toBe(6 * mib);
      expect(hash(await readFile(join(grant!.value, "view/assets/tone0.wav")))).toBe(read.resource.digest);
    };
    let first: Job | undefined;
    if (native) {
      await expect(client.execute("export_create", intent)).rejects.toThrow("lost accepted export response");
      first = (await client.execute("export_list", owner)).jobs[0];
      expect(first).toBeDefined();
      await capturing(first!.id);
      report.liveConsumers = {
        viewRevision: preview.revision,
        exportRevision: first!.revision,
        toolUses: 3,
        resources: total,
      };
    }
    for (const path of ["assets/poster.png", "assets/tone0.wav"])
      current = await client.execute("resource_remove", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        path,
      });
    current = await client.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: current.revision,
      files: [
        {
          path: "index.html",
          content:
            '<main data-composition-id="main" data-width="160" data-height="90" data-duration="1"><p>NEW CURRENT SOURCE</p></main><script>window.__timelines={main:gsap.timeline({paused:true}).to({},{duration:1})};</script>',
        },
      ],
    });
    expect(hash(Buffer.from(await (await fetch(imageUrl)).arrayBuffer()))).toBe(hash(png));
    await expect(
      client.execute("resource_read", { ...owner, revision: current.revision, path: "assets/poster.png" }),
    ).rejects.toThrow();
    await client.closePreview(preview.id);
    await page.close();
    expect((await fetch(preview.url)).status).toBe(404);
    expect((await fetch(soundUrl, { headers: { range: "bytes=0-43" } })).status).toBe(206);
    if (native && first) {
      await expect
        .poll(async () => (await client!.execute("export_read", { ...owner, id: first!.id })).state, { timeout: 90000 })
        .toBe("succeeded");
      const completed = await client.execute("export_read", { ...owner, id: first.id });
      expect(completed.revision).toBe(original.revision);
      expect(completed.result?.spec).toEqual({
        width: 160,
        height: 90,
        duration: 8,
        frames: 240,
        fps: { num: 30, den: 1 },
        audio: "required",
      });
      expect(completed.result?.verification).toMatchObject({ frames: 240, audio: true });
      const ticket = await client.execute("export_download", { ...owner, id: first.id }),
        film = Buffer.from(await (await fetch(ticket.url)).arrayBuffer());
      expect(hash(film)).toBe(completed.result?.verification.digest);
      await writeFile(join(evidence, "frozen.mp4"), film);
      expect((await client.execute("export_create", intent)).id).toBe(first.id);
      expect(requests).toEqual([intent.requestId, intent.requestId]);
      expect((await client.execute("export_list", owner)).jobs).toHaveLength(1);
      const second = await client.execute("export_create", {
        ...intent,
        requestId: randomUUID(),
        fps: { num: 240, den: 1 },
      });
      await capturing(second.id);
      const running = await client.execute("export_read", { ...owner, id: second.id });
      await client.execute("export_cancel", {
        ...owner,
        id: second.id,
        requestId: randomUUID(),
        expectedVersion: running.version,
      });
      await expect
        .poll(async () => (await client!.execute("export_read", { ...owner, id: second.id })).state, { timeout: 30000 })
        .toBe("cancelled");
      expect(
        (await factory.directory()).instances.filter((i) => i.service === "render").every((i) => i.phase === "retired"),
      ).toBe(true);
      expect(Object.values((await cache()).entries).flatMap((e) => e.uses)).toEqual([]);
      expect((await factory.resources()).grants.filter((g) => g.kind === "staging" && g.name === "render")).toEqual([]);
      expect(hash(Buffer.from(await (await fetch(imageUrl)).arrayBuffer()))).toBe(hash(png));
      report.completed = completed;
      report.cancelled = second.id;
    }
    await held.closePreview(survivor.id);
    expect((await fetch(imageUrl)).status).toBe(404);
    expect(
      (await client.execute("resource_read", { ...owner, revision: original.revision, path: "assets/tone0.wav" })).data,
    ).toBe(read.data);
    report.totalResourceBytes = total;
    report.resourceCount = original.resources.length;
    report.owner = owner;
    report.frozenRevision = original.revision;
    report.currentRevision = current.revision;
    report.processMemory = process.memoryUsage();
    await driver.capture("media-pressure");
    expect(driver.errors).toEqual([]);
    await client.closePreviews();
    await held.closePreviews();
    await driver.close();
    driver = undefined;
    await runtime.close();
    runtime = undefined;
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    runtime = await open({ root, scope, version: "0.6.1-dev.1", ...(native ? { tools: await tools() } : {}) });
    expect(await runtime.execute("project_read", owner)).toEqual(current);
    expect(
      (await runtime.execute("resource_read", { ...owner, revision: original.revision, path: "assets/tone0.wav" }))
        .data,
    ).toBe(read.data);
    if (first)
      expect((await runtime.execute("export_read", { ...owner, id: first.id })).result?.verification.digest).toBe(
        (report.completed as Job).result?.verification.digest,
      );
  } catch (error) {
    report.failure = String(error);
    await driver?.capture("failure").catch(() => {});
    throw error;
  } finally {
    await client?.closePreviews().catch(() => {});
    await held?.closePreviews().catch(() => {});
    await driver?.close();
    await runtime?.close();
    report.closed = (await readDirectory(root)).manager.phase;
    report.processes = await observeProcesses(root);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  expect(report.closed).toBe("closed");
  expect(report.processes).toEqual([]);
}
it(
  "preserves near-64MiB immutable media across actual HTTP previews, current removal, view revocation and restart",
  () => exercise(false),
  90000,
);
it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "isolates near-64MiB preview/export consumers through real capture, lost receipts, cancellation and restart",
  () => exercise(true),
  240000,
);
