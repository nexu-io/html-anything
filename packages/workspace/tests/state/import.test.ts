import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { initialFiles, type SourcePayload, Workspace } from "@";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
function wave(length = 16044) {
  const bytes = Buffer.alloc(length);
  bytes.write("RIFF");
  bytes.writeUInt32LE(length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(8000, 24);
  bytes.writeUInt32LE(16000, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(length - 44, 40);
  return bytes;
}
function payload(): SourcePayload {
  return {
    files: [
      ...initialFiles(),
      { path: "compositions/scene.html", content: "<p>Editable scene</p>" },
      { path: "assets/fonts.css", content: "/* Retained source-owned font declarations */" },
      { path: ".hyperframes/studio-motion.json", content: "{}" },
    ],
    resources: [
      { path: "assets/poster.png", name: "Poster", bytes: png },
      { path: "assets/tone.wav", name: "Tone", bytes: wave() },
      { path: "assets/duplicate.png", name: "Same bytes, another logical path", bytes: png },
    ],
  };
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "motion-source-media-")),
    workspace = new Workspace(root),
    session = workspace.execute("session_create", { requestId: randomUUID(), title: "Import", mode: "motion" }),
    artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Existing",
      files: initialFiles(),
    }),
    owner = { sessionId: session.id, artifactId: artifact.id },
    original = workspace.execute("project_read", owner);
  workspace.execute("artifact_open", {
    ...owner,
    requestId: randomUUID(),
    expectedSelection: 0,
    expectedCurrent: null,
  });
  const state = workspace.execute("workspace_state", {}),
    intent = {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Independent source",
      source: { id: "portable-example", contentHash: `sha256:${"4".repeat(64)}` },
    };
  return { root, workspace, owner, original, state, intent };
}
function inventory(root: string) {
  const sql = new DatabaseSync(join(root, "workspace.sqlite"), { readOnly: true });
  try {
    return Object.fromEntries(
      ["artifacts", "projects", "revisions", "history", "resources", "requests"].map((table) => [
        table,
        Number(sql.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n),
      ]),
    );
  } finally {
    sql.close();
  }
}
it("creates all source/media at one initial revision, deduplicates bytes and preserves selection and other projects", () => {
  const f = fixture(),
    source = payload(),
    before = inventory(f.root);
  try {
    const artifact = f.workspace.createSource(f.intent, source),
      owner = { sessionId: f.intent.sessionId, artifactId: artifact.id },
      project = f.workspace.execute("project_read", owner),
      after = inventory(f.root);
    expect(artifact.projectId).not.toBe(f.original.id);
    expect(project.files).toEqual([...source.files].sort((a, b) => (a.path < b.path ? -1 : 1)));
    expect(project.resources).toHaveLength(3);
    expect(project.history).toEqual({ version: 0, canUndo: false, canRedo: false });
    expect(after).toEqual({
      artifacts: before.artifacts! + 1,
      projects: before.projects! + 1,
      revisions: before.revisions! + 1,
      history: before.history! + 1,
      resources: before.resources! + 2,
      requests: before.requests! + 1,
    });
    for (const resource of source.resources)
      expect(
        f.workspace.execute("resource_read", { ...owner, revision: project.revision, path: resource.path }).data,
      ).toBe(Buffer.from(resource.bytes).toString("base64"));
    expect(f.workspace.execute("project_snapshot", { ...owner, revision: project.revision }).resources).toEqual(
      project.resources,
    );
    expect(f.workspace.execute("project_read", f.owner)).toEqual(f.original);
    expect(f.workspace.execute("workspace_state", {})).toEqual(f.state);
  } finally {
    f.workspace.close();
  }
});
it("confirms the original receipt before unavailable source resolution after edits, removal and cold reopen", () => {
  const f = fixture();
  let workspace = f.workspace;
  try {
    const artifact = workspace.createSource(f.intent, payload()),
      owner = { sessionId: f.intent.sessionId, artifactId: artifact.id },
      original = workspace.execute("project_read", owner),
      removed = workspace.execute("resource_remove", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: original.revision,
        path: "assets/poster.png",
      }),
      edited = workspace.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: removed.revision,
        files: [...removed.files, { path: "later.txt", content: "Preserve current edits" }],
      });
    workspace.close();
    workspace = new Workspace(f.root);
    const before = inventory(f.root);
    expect(workspace.sourceReceipt(f.intent)).toEqual(artifact);
    expect(workspace.createSource(f.intent, { files: [], resources: [] })).toEqual(artifact);
    expect(inventory(f.root)).toEqual(before);
    expect(workspace.execute("project_read", owner)).toEqual(edited);
    expect(
      workspace.execute("resource_read", {
        ...owner,
        revision: original.revision,
        path: "assets/poster.png",
      }).data,
    ).toBe(png.toString("base64"));
    for (const changed of [
      { title: "Other" },
      { sessionId: randomUUID() },
      { source: { ...f.intent.source, contentHash: `sha256:${"5".repeat(64)}` } },
    ])
      expect(() => workspace.createSource({ ...f.intent, ...changed }, payload())).toThrowError(
        expect.objectContaining({ code: "idempotency" }),
      );
    expect(workspace.execute("workspace_state", {})).toEqual(f.state);
  } finally {
    workspace.close();
  }
});
const invalid: { name: string; change: (value: SourcePayload) => void }[] = [
  {
    name: "a corrupt second media payload",
    change: (value) => {
      value.resources[1]!.bytes = Buffer.from("broken");
    },
  },
  {
    name: "a duplicate media path",
    change: (value) => {
      value.resources[1]!.path = value.resources[0]!.path;
      value.resources[1]!.bytes = png;
    },
  },
  {
    name: "too many media entries",
    change: (value) => {
      value.resources = Array.from({ length: 65 }, (_, n) => ({
        path: `assets/image${n}.png`,
        name: "PNG",
        bytes: png,
      }));
    },
  },
  {
    name: "aggregate media beyond 64 MiB",
    change: (value) => {
      const bytes = wave(6 * 1024 ** 2);
      value.resources = Array.from({ length: 11 }, (_, n) => ({ path: `assets/sound${n}.wav`, name: "WAV", bytes }));
    },
  },
  {
    name: "an individual resource beyond 6 MiB",
    change: (value) => {
      value.resources[1]!.bytes = wave(6 * 1024 ** 2 + 2);
    },
  },
  {
    name: "a media path used as a source directory",
    change: (value) => {
      value.files.push({ path: "assets/poster.png/child.html", content: "collision" });
    },
  },
  {
    name: "invalid source after valid media writes",
    change: (value) => {
      value.files.push({ path: "../escaped.html", content: "escape" });
    },
  },
];
it.each(invalid)("rolls back the complete source/media/history/receipt transaction for $name", ({ change }) => {
  const f = fixture(),
    source = payload();
  try {
    const before = inventory(f.root);
    change(source);
    expect(() => f.workspace.createSource(f.intent, source)).toThrowError(expect.objectContaining({ code: "invalid" }));
    expect(inventory(f.root)).toEqual(before);
    expect(f.workspace.sourceReceipt(f.intent)).toBeUndefined();
    expect(f.workspace.execute("project_read", f.owner)).toEqual(f.original);
    expect(f.workspace.execute("workspace_state", {})).toEqual(f.state);
    // Reuse the failed intent: rollback must not leave a receipt or partial artifact.
    const recovered = f.workspace.createSource(f.intent, payload());
    expect(
      f.workspace.execute("project_read", {
        sessionId: f.intent.sessionId,
        artifactId: recovered.id,
      }).resources,
    ).toHaveLength(3);
  } finally {
    f.workspace.close();
  }
});

it("rolls back source, media, artifact and history when the final receipt write fails", () => {
  const f = fixture(),
    sql = new DatabaseSync(join(f.root, "workspace.sqlite"));
  try {
    // This fixture's SQLite trigger faults after all product writes, at receipt persistence.
    sql.exec(
      `CREATE TRIGGER reject_source_receipt BEFORE INSERT ON requests WHEN NEW.id='${f.intent.requestId}' BEGIN SELECT RAISE(ABORT,'fixture receipt failure'); END;`,
    );
    const before = inventory(f.root);
    expect(() => f.workspace.createSource(f.intent, payload())).toThrow("fixture receipt failure");
    expect(inventory(f.root)).toEqual(before);
    expect(f.workspace.sourceReceipt(f.intent)).toBeUndefined();
    expect(f.workspace.execute("project_read", f.owner)).toEqual(f.original);
    expect(f.workspace.execute("workspace_state", {})).toEqual(f.state);
    sql.exec("DROP TRIGGER reject_source_receipt");
    expect(f.workspace.createSource(f.intent, payload()).id).toBeTruthy();
  } finally {
    sql.close();
    f.workspace.close();
  }
});
