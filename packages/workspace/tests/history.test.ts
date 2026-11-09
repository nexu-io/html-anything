import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";
import { initialFiles, Workspace } from "@";

it("persists cursor history across cold open, fences ABA moves and truncates redo only on a real branch", () => {
  const root = mkdtempSync(join(tmpdir(), "studio-history-"));
  let db = new Workspace(root);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "History", mode: "motion" });
    const artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "A",
      files: initialFiles(),
    });
    const owner = { sessionId: session.id, artifactId: artifact.id };
    const read = () => db.execute("project_read", owner);
    const save = (content: string) =>
      db.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: read().revision,
        files: [{ path: "index.html", content }],
      });
    const a = read(),
      b = save("B"),
      c = save("C");
    const undo = {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: c.revision,
      expectedHistory: c.history.version,
    };
    const moved = db.execute("project_undo", undo);
    expect(moved.revision).toBe(b.revision);
    expect(db.execute("project_undo", undo)).toEqual(moved);
    expect(read().revision).toBe(b.revision);
    db.close();
    db = new Workspace(root);
    expect(read()).toEqual(moved);
    const redo = db.execute("project_redo", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: moved.revision,
      expectedHistory: moved.history.version,
    });
    expect(redo.revision).toBe(c.revision);
    const again = db.execute("project_undo", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: redo.revision,
      expectedHistory: redo.history.version,
    });
    expect(again.revision).toBe(b.revision);
    expect(() =>
      db.execute("project_redo", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: moved.revision,
        expectedHistory: moved.history.version,
      }),
    ).toThrow("history changed");
    const raw = new DatabaseSync(join(root, "workspace.sqlite"));
    raw.exec("CREATE TRIGGER fail_history BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT,'history failure');END");
    try {
      expect(() => save("D")).toThrow("history failure");
      expect(read()).toEqual(again);
    } finally {
      raw.exec("DROP TRIGGER fail_history");
      raw.close();
    }
    const branch = save("D");
    expect(branch.history.canRedo).toBe(false);
    expect(() =>
      db.execute("project_redo", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: branch.revision,
        expectedHistory: branch.history.version,
      }),
    ).toThrow("nothing to redo");
    expect(save("D").history).toEqual(branch.history);
    const foreign = db.execute("session_create", { requestId: randomUUID(), title: "foreign", mode: "motion" });
    expect(() => db.execute("project_undo", { ...undo, requestId: randomUUID(), sessionId: foreign.id })).toThrow(
      "belong",
    );
    expect(a.history.canUndo).toBe(false);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it.each([1, 2])("rejects old experimental database schema %s without rewriting or deleting its contents", (version) => {
  const root = mkdtempSync(join(tmpdir(), "studio-schema-")),
    file = join(root, "workspace.sqlite");
  const raw = new DatabaseSync(file);
  raw.exec(`PRAGMA user_version=${version}`);
  raw.close();
  const digest = () => createHash("sha256").update(readFileSync(file)).digest("hex");
  const before = digest();
  try {
    expect(() => new Workspace(root)).toThrow("unsupported");
    expect(digest()).toBe(before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
