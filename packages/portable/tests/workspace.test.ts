import { randomUUID } from "node:crypto";
import { constants, createReadStream, createWriteStream, readFileSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { initialFiles, type SourcePayload, Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { prepare, read } from "@";

it("moves a real granted ZIP across namespaces, imports one complete independent revision and replays cold receipts", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "motion-portable-"))),
    evidence = fileURLToPath(new URL(`../../../.artifacts/portable-roundtrip/${randomUUID()}/`, import.meta.url)),
    scope = { channel: channel("dev"), namespace: namespace("receiver") },
    report: Record<string, unknown> = { root };
  await mkdir(evidence, { recursive: true });
  let manager = await serve(managerEndpoint(root), { root }),
    source: Workspace | undefined,
    target: Workspace | undefined;
  const generation = digest("portable source-media integration fixture"),
    sourceFactory = manager.factory({ channel: channel("dev"), namespace: namespace("source") });
  let sourceOut = "",
    targetOut = "";
  try {
    const sourceOwner = await sourceFactory.expose({
      identity: { service: "source", generation },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          source = new Workspace(context.roots.data);
          sourceOut = (await sourceFactory.grant({ kind: "data", name: "archiveout", scope: "factory" })).value;
        },
        stop: async () => {
          source?.close();
        },
      },
    });
    const hostTarget = () =>
      manager.factory(scope).expose({
        identity: { service: "receiver", generation },
        handlers: {},
        lifecycle: {
          initialize: async (context) => {
            target = new Workspace(context.roots.data);
            targetOut = (await manager.factory(scope).grant({ kind: "data", name: "archivein", scope: "factory" }))
              .value;
          },
          stop: async () => {
            target?.close();
          },
        },
      });
    await hostTarget();
    if (!source || !target) throw Error("workspace owners missing");
    const sender: Workspace = source,
      receiver: Workspace = target,
      session = sender.execute("session_create", { requestId: randomUUID(), title: "Sender", mode: "motion" }),
      png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
        "base64",
      ),
      original = sender.createSource(
        {
          requestId: randomUUID(),
          sessionId: session.id,
          title: "Native source",
          source: { id: "controlled-example", contentHash: digest("controlled example") },
        },
        {
          files: [
            ...initialFiles(),
            { path: "licenses/source.txt", content: "Preserve explicit provenance." },
            { path: ".hyperframes/studio-motion.json", content: "{}" },
          ],
          resources: [{ path: "assets/poster.png", name: "Named poster", bytes: png }],
        },
      ),
      owner = { sessionId: session.id, artifactId: original.id },
      snapshot = sender.execute("project_snapshot", {
        ...owner,
        revision: sender.execute("project_read", owner).revision,
      }),
      payload: SourcePayload = {
        files: snapshot.files,
        resources: snapshot.resources.map((resource) => ({
          path: resource.path,
          name: resource.name,
          bytes: Buffer.from(
            sender.execute("resource_read", { ...owner, revision: snapshot.revision, path: resource.path }).data,
            "base64",
          ),
        })),
      },
      archive = prepare(payload),
      sourcePath = join(sourceOut, "source.zip"),
      relocated = join(targetOut, "relocated.zip");
    await pipeline(Readable.from(archive.chunks()), createWriteStream(sourcePath, { flags: "wx" }));
    await copyFile(sourcePath, relocated, constants.COPYFILE_EXCL);
    const changed = sender.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: snapshot.revision,
      files: [...snapshot.files, { path: "later.txt", content: "Changed after freeze" }],
    });
    sender.execute("resource_remove", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: changed.revision,
      path: "assets/poster.png",
    });
    await sourceOwner.close();
    expect(() => sender.execute("project_read", owner)).toThrow("closed");
    const destination = receiver.execute("session_create", {
        requestId: randomUUID(),
        title: "Receiver",
        mode: "motion",
      }),
      intent = {
        requestId: randomUUID(),
        sessionId: destination.id,
        title: "Independent imported source",
        source: { id: "portable-project", contentHash: archive.digest },
      },
      decoded = await read(createReadStream(relocated, { highWaterMark: 7 }), archive.digest),
      imported = receiver.createSource(intent, decoded),
      importedOwner = { sessionId: destination.id, artifactId: imported.id },
      current = receiver.execute("project_read", importedOwner);
    expect(imported.id).not.toBe(original.id);
    expect(imported.projectId).not.toBe(original.projectId);
    expect(current.revision).toBe(snapshot.revision);
    expect(current.files).toEqual(snapshot.files);
    expect(current.resources).toEqual(snapshot.resources);
    expect(current.history).toEqual({ version: 0, canUndo: false, canRedo: false });
    expect(receiver.execute("workspace_state", {}).selection.artifactId).toBeNull();
    expect(
      receiver.execute("resource_read", { ...importedOwner, revision: current.revision, path: "assets/poster.png" })
        .data,
    ).toBe(png.toString("base64"));
    expect(receiver.createSource(intent, { files: [], resources: [] })).toEqual(imported);
    await expect(read(createReadStream(relocated), digest("not the selected archive"))).rejects.toMatchObject({
      code: "integrity",
    });
    expect(receiver.execute("session_get", { sessionId: destination.id }).artifacts).toHaveLength(1);
    const later = receiver.execute("project_save", {
        ...importedOwner,
        requestId: randomUUID(),
        expectedRevision: current.revision,
        files: [...current.files, { path: "edited.txt", content: "Retain later receiver edit" }],
      }),
      incarnation = manager.directory().manager.incarnation;
    await manager.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    manager = await serve(managerEndpoint(root), { root });
    await hostTarget();
    const cold = target as Workspace;
    expect(manager.directory().manager.incarnation).not.toBe(incarnation);
    expect(cold.sourceReceipt(intent)).toEqual(imported);
    expect(cold.createSource(intent, { files: [], resources: [] })).toEqual(imported);
    expect(cold.execute("project_read", importedOwner)).toEqual(later);
    expect(
      cold.execute("resource_read", { ...importedOwner, revision: current.revision, path: "assets/poster.png" }).data,
    ).toBe(png.toString("base64"));
    expect(cold.execute("session_get", { sessionId: destination.id }).artifacts).toHaveLength(1);
    report.archive = { digest: archive.digest, bytes: archive.bytes, sourcePath, relocated };
    report.originalRevision = snapshot.revision;
    report.currentRevision = later.revision;
    report.independentArtifact = true;
    report.sourceRetiredBeforeRead = true;
    report.coldReceiptReplay = true;
  } catch (error) {
    report.failure = String(error);
    throw error;
  } finally {
    await manager.close();
    report.phase = (await readDirectory(root)).manager.phase;
    report.workloads = await observeProcesses(root);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  expect(report.phase).toBe("closed");
  expect(report.workloads).toEqual([]);
}, 30000);

it("relocates original font bytes and verified metadata through the existing atomic source receipt", async () => {
  const font = JSON.parse(readFileSync(new URL("../../templates/src/native/fonts.json", import.meta.url), "utf8"))
    .faces[0] as { data: string };
  const root = await mkdtemp(join(tmpdir(), "portable-font-")),
    db = new Workspace(root);
  try {
    const bytes = Buffer.from(font.data, "base64"),
      archive = prepare({
        files: initialFiles(),
        resources: [{ path: "assets/inter.woff2", name: "Original font", bytes }],
      }),
      payload = await read(archive.chunks(), archive.digest),
      session = db.execute("session_create", { requestId: randomUUID(), title: "Imported", mode: "motion" }),
      intent = {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Font",
        source: { id: "font-fixture", contentHash: archive.digest },
      },
      artifact = db.createSource(intent, payload),
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = db.execute("project_read", owner),
      restored = db.execute("resource_read", { ...owner, revision: project.revision, path: "assets/inter.woff2" });
    expect(restored.resource.type).toBe("font/woff2");
    expect(Buffer.from(restored.data, "base64")).toEqual(bytes);
    expect(db.createSource(intent, { files: [], resources: [] })).toEqual(artifact);
    expect(db.execute("project_read", owner)).toEqual(project);
  } finally {
    db.close();
  }
});
