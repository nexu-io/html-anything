import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { initialFiles, Workspace } from "@";

function fixture(run: (db: Workspace, root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "workspace-domain-"));
  const db = new Workspace(root);
  try {
    run(db, root);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}
const session = (db: Workspace) =>
  db.execute("session_create", { requestId: randomUUID(), title: "会话", mode: "motion", instruction: "真实需求" });
const artifact = (db: Workspace, sessionId: string) =>
  db.execute("artifact_create", { requestId: randomUUID(), sessionId, title: "工程", files: initialFiles() });
it("keeps empty sessions and caller-supplied messages separate from native artifacts", () =>
  fixture((db, root) => {
    const input = { requestId: randomUUID(), title: "空会话", mode: "motion" as const, instruction: "先讨论" };
    const created = db.execute("session_create", input);
    expect(created.artifacts).toEqual([]);
    expect(created.messages.map((m) => m.role)).toEqual(["user"]);
    expect(db.execute("session_create", input)).toEqual(created);
    expect(db.execute("workspace_state", {}).sessions).toHaveLength(1);
    const message = {
      requestId: randomUUID(),
      sessionId: created.id,
      role: "assistant" as const,
      content: "调用方的真实回复",
    };
    expect(db.execute("message_append", message)).toEqual(db.execute("message_append", message));
    expect(() => db.execute("message_append", { ...message, role: "user" })).toThrow("already used");
    const second = new Workspace(root);
    try {
      expect(second.execute("session_get", { sessionId: created.id }).messages).toHaveLength(2);
    } finally {
      second.close();
    }
  }));
it("atomically creates distinct immutable artifact/project identities and survives cold open", () =>
  fixture((db, root) => {
    const created = session(db),
      first = artifact(db, created.id),
      second = artifact(db, created.id);
    expect(new Set([created.id, first.id, first.projectId, second.id, second.projectId]).size).toBe(5);
    expect(db.execute("session_get", { sessionId: created.id }).artifacts).toHaveLength(2);
    const project = db.execute("project_read", { sessionId: created.id, artifactId: first.id });
    const replacement = project.files.map((f) =>
      f.path === "index.html" ? { ...f, content: "<html><body>saved</body></html>" } : f,
    );
    const command = {
      requestId: randomUUID(),
      sessionId: created.id,
      artifactId: first.id,
      expectedRevision: project.revision,
      files: replacement,
    };
    const saved = db.execute("project_save", command);
    expect(saved.revision).not.toBe(project.revision);
    expect(db.execute("project_save", command)).toEqual(saved);
    expect(() => db.execute("project_save", { ...command, requestId: randomUUID() })).toThrow("revision changed");
    expect(db.execute("project_read", { sessionId: created.id, artifactId: second.id }).files).toEqual(project.files);
    db.close();
    const cold = new Workspace(root);
    try {
      expect(cold.execute("project_read", { sessionId: created.id, artifactId: first.id })).toEqual(saved);
    } finally {
      cold.close();
    }
  }));
it("rejects foreign artifacts and failed creation without changing session or selection", () =>
  fixture((db) => {
    const first = session(db),
      second = session(db),
      owned = artifact(db, first.id);
    const state = db.execute("workspace_state", {});
    for (const operation of ["project_read", "artifact_open"] as const) {
      const input = {
        sessionId: second.id,
        artifactId: owned.id,
        requestId: randomUUID(),
        expectedSelection: 0,
        expectedCurrent: null,
      };
      expect(() =>
        operation === "project_read"
          ? db.execute(operation, { sessionId: input.sessionId, artifactId: input.artifactId })
          : db.execute(operation, input),
      ).toThrow("belong");
    }
    expect(() =>
      db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: second.id,
        title: "失败",
        files: [{ path: "../escape", content: "x" }],
      }),
    ).toThrow();
    expect(db.execute("session_get", { sessionId: second.id }).artifacts).toEqual([]);
    expect(db.execute("session_get", { sessionId: second.id }).messages[0]?.content).toBe("真实需求");
    expect(db.execute("workspace_state", {})).toEqual(state);
  }));
it("fences stale saves and context changes, and never switches after a failed save", () =>
  fixture((db) => {
    const one = session(db),
      two = session(db),
      a = artifact(db, one.id),
      b = artifact(db, two.id);
    const selected = db.execute("artifact_open", {
      requestId: randomUUID(),
      sessionId: one.id,
      artifactId: a.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const original = db.execute("project_read", { sessionId: one.id, artifactId: a.id });
    const next = db.execute("project_save", {
      requestId: randomUUID(),
      sessionId: one.id,
      artifactId: a.id,
      expectedRevision: original.revision,
      files: [{ path: "index.html", content: "new source" }],
    });
    const open = {
      requestId: randomUUID(),
      sessionId: two.id,
      artifactId: b.id,
      expectedSelection: selected.revision,
      expectedCurrent: { artifactId: a.id, revision: original.revision },
    };
    expect(() => db.execute("artifact_open", open)).toThrow("latest revision");
    expect(db.execute("workspace_state", {}).selection).toEqual(selected);
    expect(() =>
      db.execute("project_save", {
        requestId: randomUUID(),
        sessionId: one.id,
        artifactId: a.id,
        expectedRevision: original.revision,
        files: initialFiles(),
      }),
    ).toThrow("revision changed");
    const switched = db.execute("artifact_open", {
      ...open,
      expectedCurrent: { artifactId: a.id, revision: next.revision },
    });
    expect(switched.artifactId).toBe(b.id);
    expect(() =>
      db.execute("session_open", {
        requestId: randomUUID(),
        sessionId: one.id,
        expectedSelection: 0,
        expectedCurrent: null,
      }),
    ).toThrow("selection changed");
  }));

it("keeps session titles separate and restores the last artifact across empty sessions", () =>
  fixture((db, root) => {
    const one = session(db),
      empty = session(db),
      first = artifact(db, one.id),
      second = artifact(db, one.id);
    const firstSelection = db.execute("artifact_open", {
      requestId: randomUUID(),
      sessionId: one.id,
      artifactId: second.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const current = db.execute("project_read", { sessionId: one.id, artifactId: second.id });
    const emptySelection = db.execute("session_open", {
      requestId: randomUUID(),
      sessionId: empty.id,
      expectedSelection: firstSelection.revision,
      expectedCurrent: { artifactId: second.id, revision: current.revision },
    });
    expect(emptySelection.artifactId).toBeNull();
    const reopened = db.execute("session_open", {
      requestId: randomUUID(),
      sessionId: one.id,
      expectedSelection: emptySelection.revision,
      expectedCurrent: null,
    });
    expect(reopened.artifactId).toBe(second.id);
    const renamed = db.execute("session_rename", { requestId: randomUUID(), sessionId: one.id, title: "会话的新标题" });
    expect(renamed.title).toBe("会话的新标题");
    expect(renamed.artifacts[0]?.title).toBe(first.title);
    expect(db.execute("project_read", { sessionId: one.id, artifactId: second.id }).revision).toBe(current.revision);
    db.close();
    const cold = new Workspace(root);
    try {
      expect(cold.execute("workspace_state", {}).selection).toEqual(reopened);
    } finally {
      cold.close();
    }
  }));
