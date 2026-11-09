import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { initialFiles, Workspace } from "@";

const png =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=";
function wave() {
  const rate = 8000,
    samples = rate * 2,
    bytes = Buffer.alloc(44 + samples * 2);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    bytes.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8192), 44 + i * 2);
  return bytes.toString("base64");
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "motion-media-")),
    workspace = new Workspace(root),
    session = workspace.execute("session_create", { requestId: randomUUID(), title: "Media", mode: "motion" }),
    artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Native media",
      files: initialFiles(),
    }),
    owner = { sessionId: session.id, artifactId: artifact.id };
  return {
    root,
    workspace,
    owner,
    finish: () => {
      workspace.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
it("commits typed binary manifests into source revisions and preserves bytes/history across cold open", () => {
  const f = fixture();
  let cold: Workspace | undefined;
  try {
    const before = f.workspace.execute("project_read", f.owner),
      request = {
        requestId: randomUUID(),
        ...f.owner,
        expectedRevision: before.revision,
        path: "assets/red.png",
        name: "Red image",
        data: png,
      },
      imported = f.workspace.execute("resource_import", request);
    expect(imported.revision).not.toBe(before.revision);
    expect(imported.files).toEqual(before.files);
    expect(imported.resources[0]).toMatchObject({ type: "image/png", width: 32, height: 24, path: "assets/red.png" });
    const audio = f.workspace.execute("resource_import", {
      requestId: randomUUID(),
      ...f.owner,
      expectedRevision: imported.revision,
      path: "assets/tone.wav",
      name: "Tone",
      data: wave(),
    });
    expect(audio.resources.find((r) => r.type === "audio/wav")).toMatchObject({
      duration: 2,
      channels: 1,
      sampleRate: 8000,
    });
    expect(f.workspace.execute("resource_import", request)).toEqual(imported);
    expect(f.workspace.execute("project_read", f.owner)).toEqual(audio);
    expect(
      f.workspace.execute("resource_read", { ...f.owner, revision: audio.revision, path: "assets/red.png" }).data,
    ).toBe(png);
    const changed = f.workspace.execute("project_save", {
      requestId: randomUUID(),
      ...f.owner,
      expectedRevision: audio.revision,
      files: [{ path: "index.html", content: "changed source" }],
    });
    expect(changed.resources).toEqual(audio.resources);
    const removed = f.workspace.execute("resource_remove", {
      requestId: randomUUID(),
      ...f.owner,
      expectedRevision: changed.revision,
      path: "assets/red.png",
    });
    expect(removed.resources).toHaveLength(1);
    expect(() =>
      f.workspace.execute("resource_read", { ...f.owner, revision: removed.revision, path: "assets/red.png" }),
    ).toThrow("does not belong");
    expect(
      f.workspace.execute("resource_read", { ...f.owner, revision: imported.revision, path: "assets/red.png" }).data,
    ).toBe(png);
    const restored = f.workspace.execute("project_undo", {
      requestId: randomUUID(),
      ...f.owner,
      expectedRevision: removed.revision,
      expectedHistory: removed.history.version,
    });
    expect(restored.revision).toBe(changed.revision);
    f.workspace.close();
    cold = new Workspace(f.root);
    expect(cold.execute("project_read", f.owner)).toEqual(restored);
    expect(
      cold.execute("resource_read", { ...f.owner, revision: restored.revision, path: "assets/tone.wav" }).data,
    ).toBe(wave());
    const redone = cold.execute("project_redo", {
      requestId: randomUUID(),
      ...f.owner,
      expectedRevision: restored.revision,
      expectedHistory: restored.history.version,
    });
    expect(redone.revision).toBe(removed.revision);
  } finally {
    cold?.close();
    f.finish();
  }
});
it("rejects foreign ownership, stale writes, reused receipts, duplicate paths and unauthorized historical reads", () => {
  const f = fixture();
  try {
    const initial = f.workspace.execute("project_read", f.owner),
      request = {
        requestId: randomUUID(),
        ...f.owner,
        expectedRevision: initial.revision,
        path: "assets/red.png",
        name: "Red",
        data: png,
      },
      imported = f.workspace.execute("resource_import", request),
      foreign = f.workspace.execute("session_create", { requestId: randomUUID(), title: "Foreign", mode: "motion" });
    expect(() => f.workspace.execute("resource_import", { ...request, requestId: randomUUID() })).toThrow(
      "revision changed",
    );
    expect(() => f.workspace.execute("resource_import", { ...request, name: "Different" })).toThrow("already used");
    expect(() =>
      f.workspace.execute("resource_import", {
        ...request,
        requestId: randomUUID(),
        expectedRevision: imported.revision,
      }),
    ).toThrow("already exists");
    expect(() =>
      f.workspace.execute("resource_read", {
        ...f.owner,
        sessionId: foreign.id,
        revision: imported.revision,
        path: request.path,
      }),
    ).toThrow("belong");
    expect(() =>
      f.workspace.execute("resource_read", { ...f.owner, revision: initial.revision, path: request.path }),
    ).toThrow("does not belong");
    expect(f.workspace.execute("project_read", f.owner)).toEqual(imported);
  } finally {
    f.finish();
  }
});
it("rejects malformed, mislabeled, oversized or noncanonical bytes atomically", () => {
  const f = fixture();
  try {
    const before = f.workspace.execute("project_read", f.owner),
      corrupt = Buffer.from(png, "base64");
    corrupt[45] = (corrupt[45] ?? 0) ^ 1;
    const cases = [
      { path: "../red.png", data: png },
      { path: "assets/red.png", data: wave() },
      { path: "assets/red.wav", data: png },
      { path: "assets/red.png", data: corrupt.toString("base64") },
      { path: "assets/red.png", data: `${png}\n` },
      { path: "assets/red.png", data: Buffer.alloc(6 * 1024 * 1024 + 1).toString("base64") },
      { path: "assets/red.wav", data: Buffer.from("RIFF").toString("base64") },
    ];
    for (const entry of cases)
      expect(() =>
        f.workspace.execute("resource_import", {
          requestId: randomUUID(),
          ...f.owner,
          expectedRevision: before.revision,
          name: "Invalid",
          ...entry,
        }),
      ).toThrow();
    expect(f.workspace.execute("project_read", f.owner)).toEqual(before);
    const raw = new DatabaseSync(join(f.root, "workspace.sqlite"));
    expect(raw.prepare("SELECT count(*) AS n FROM resources").get()?.n).toBe(0);
    raw.close();
  } finally {
    f.finish();
  }
});
it("detects corruption of persistent bytes instead of serving a different payload under an accepted digest", () => {
  const f = fixture();
  try {
    const before = f.workspace.execute("project_read", f.owner),
      imported = f.workspace.execute("resource_import", {
        requestId: randomUUID(),
        ...f.owner,
        expectedRevision: before.revision,
        path: "assets/red.png",
        name: "Red",
        data: png,
      });
    const raw = new DatabaseSync(join(f.root, "workspace.sqlite"));
    raw.prepare("UPDATE resources SET bytes=?").run(Buffer.from("corrupt"));
    raw.close();
    expect(() =>
      f.workspace.execute("resource_read", { ...f.owner, revision: imported.revision, path: "assets/red.png" }),
    ).toThrow("corrupt");
  } finally {
    f.finish();
  }
});
it("deduplicates persistent bytes without granting reads to another artifact and enforces the manifest count atomically", () => {
  const f = fixture();
  try {
    let current = f.workspace.execute("project_read", f.owner);
    for (let i = 0; i < 64; i++)
      current = f.workspace.execute("resource_import", {
        requestId: randomUUID(),
        ...f.owner,
        expectedRevision: current.revision,
        path: `assets/red-${i}.png`,
        name: "Red",
        data: png,
      });
    expect(() =>
      f.workspace.execute("resource_import", {
        requestId: randomUUID(),
        ...f.owner,
        expectedRevision: current.revision,
        path: "assets/overflow.png",
        name: "Overflow",
        data: png,
      }),
    ).toThrow("64");
    expect(f.workspace.execute("project_read", f.owner)).toEqual(current);
    const raw = new DatabaseSync(join(f.root, "workspace.sqlite"));
    expect(raw.prepare("SELECT count(*) AS n FROM resources").get()?.n).toBe(1);
    raw.close();
    const other = f.workspace.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: f.owner.sessionId,
        title: "Other artifact",
        files: initialFiles(),
      }),
      owner = { sessionId: f.owner.sessionId, artifactId: other.id },
      empty = f.workspace.execute("project_read", owner);
    expect(() =>
      f.workspace.execute("resource_read", { ...owner, revision: empty.revision, path: "assets/red-0.png" }),
    ).toThrow("does not belong");
  } finally {
    f.finish();
  }
});
