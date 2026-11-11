import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { initialFiles, mergeSources, Workspace } from "@";

it("observes committed metadata across connection reopen, messages, selection and content ABA without source bodies", () => {
  const root = mkdtempSync(join(tmpdir(), "workspace-observe-"));
  let db = new Workspace(root);
  try {
    const empty = db.execute("workspace_observe", {});
    expect(empty.project).toBeNull();
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Observed", mode: "motion" }),
      artifact = db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Film",
        files: initialFiles(),
      });
    db.execute("artifact_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      artifactId: artifact.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const first = db.execute("workspace_observe", {});
    expect(first.project?.historyVersion).toBe(0);
    expect(JSON.stringify(first)).not.toContain('"files"');
    expect(db.execute("workspace_observe", {})).toEqual(first);
    db.close();
    db = new Workspace(root);
    expect(db.execute("workspace_observe", {})).toEqual(first);
    const owner = { sessionId: session.id, artifactId: artifact.id },
      before = db.execute("project_read", owner),
      changed = db.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: before.revision,
        files: before.files.map((f) => ({ ...f, content: f.content + "\n" })),
      });
    db.execute("project_undo", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: changed.revision,
      expectedHistory: changed.history.version,
    });
    const undone = db.execute("workspace_observe", {});
    expect(undone.project?.revision).toBe(first.project?.revision);
    expect(undone.project?.historyVersion).toBe(2);
    expect(undone.token).not.toBe(first.token);
    db.execute("message_append", {
      requestId: randomUUID(),
      sessionId: session.id,
      role: "assistant",
      content: "Actual caller message",
    });
    expect(db.execute("workspace_observe", {}).token).not.toBe(undone.token);
    const other = new Workspace(root);
    try {
      expect(other.execute("workspace_observe", {})).toEqual(db.execute("workspace_observe", {}));
    } finally {
      other.close();
    }
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
it("merges independent source edits and explicitly resolves same-file edit/delete conflicts", () => {
  const base = initialFiles(),
    local = base.map((f) => (f.path === "index.html" ? { ...f, content: f.content + "LOCAL" } : f)),
    remote = [...base, { path: "remote.js", content: "REMOTE" }];
  const merged = mergeSources(base, local, remote);
  expect(merged.conflicts).toEqual([]);
  expect(merged.files.find((f) => f.path === "index.html")?.content).toContain("LOCAL");
  expect(merged.files).toContainEqual({ path: "remote.js", content: "REMOTE" });
  expect(base).toEqual(initialFiles());
  const both = remote.map((f) => (f.path === "index.html" ? { ...f, content: f.content + "OTHER" } : f));
  expect(mergeSources(base, local, both).conflicts.map((f) => f.path)).toEqual(["index.html"]);
  expect(mergeSources(base, local, both, { "index.html": "remote" }).files).toEqual(
    both.sort((a, b) => a.path.localeCompare(b.path)),
  );
  const original = [...base, { path: "card.html", content: "before" }],
    edited = original.map((f) => (f.path === "card.html" ? { ...f, content: "local" } : f));
  expect(mergeSources(original, edited, base).conflicts).toMatchObject([
    { path: "card.html", local: "local", remote: undefined },
  ]);
  expect(mergeSources(original, edited, base, { "card.html": "local" }).files).toContainEqual({
    path: "card.html",
    content: "local",
  });
  expect(mergeSources(original, edited, base, { "card.html": "remote" }).files).toEqual(
    [...base].sort((a, b) => a.path.localeCompare(b.path)),
  );
  expect(() =>
    mergeSources(base, [...base, { path: "x.js", content: "" }], [...base, { path: "x.js/child.js", content: "" }]),
  ).toThrow("overlap");
});
