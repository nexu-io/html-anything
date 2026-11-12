import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { initialFiles, Workspace } from "@";

afterEach(() => vi.restoreAllMocks());
it("pages exact project metadata across sessions with stable equal-time ordering and Unicode search without selection/source reads", () => {
  const root = mkdtempSync(join(tmpdir(), "projects-page-")),
    db = new Workspace(root);
  vi.spyOn(Date, "now").mockReturnValue(1700000000000);
  try {
    const artifacts = Array.from({ length: 13 }, (_, index) => {
      const session = db.execute("session_create", {
        requestId: randomUUID(),
        title: `Session ${index}`,
        mode: "motion",
        instruction: "Preserve actual instructions",
      });
      return db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: index < 6 ? `ПРОЕКТ ${index}` : `Film ${index}`,
        files: initialFiles(),
      });
    });
    const before = db.execute("workspace_state", {}),
      first = db.execute("project_list", {});
    expect(first.projects).toHaveLength(5);
    expect(first.projects[0] && Object.keys(first.projects[0]).sort()).toEqual([
      "createdAt",
      "id",
      "kind",
      "projectId",
      "sessionId",
      "title",
    ]);
    const seen = [...first.projects];
    let cursor = first.nextCursor;
    while (cursor) {
      const page = db.execute("project_list", { cursor });
      expect(page.projects.length).toBeLessThanOrEqual(5);
      seen.push(...page.projects);
      cursor = page.nextCursor;
    }
    expect(seen.map((item) => item.id)).toEqual(
      artifacts
        .map((item) => item.id)
        .sort()
        .reverse(),
    );
    expect(new Set(seen.map((item) => item.id)).size).toBe(13);
    const search = db.execute("project_list", { query: "проект" });
    expect(search.projects).toHaveLength(5);
    expect(search.nextCursor).not.toBeNull();
    expect(db.execute("project_list", { query: "проект", cursor: search.nextCursor! }).projects).toHaveLength(1);
    expect(() => db.execute("project_list", { query: "Film", cursor: search.nextCursor! })).toThrow("another query");
    expect(db.execute("project_list", { query: "no such project" })).toEqual({ projects: [], nextCursor: null });
    expect(() => db.execute("project_list", { query: "x".repeat(121) })).toThrow("schema");
    expect(db.execute("workspace_state", {})).toEqual(before);
    expect(db.execute("session_get", { sessionId: artifacts[0]!.sessionId }).messages[0]?.content).toBe(
      "Preserve actual instructions",
    );
    db.close();
    const reopened = new Workspace(root);
    try {
      expect(reopened.execute("project_list", {})).toEqual(first);
    } finally {
      reopened.close();
    }
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
