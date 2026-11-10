import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initialFiles, Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { freeze } from "@";

it("keeps fixed input and reopened source independent of subsequent edits and validates ownership", () => {
  const root = mkdtempSync(join(tmpdir(), "motion-render-snapshot-")),
    workspace = new Workspace(root);
  try {
    const session = workspace.execute("session_create", { requestId: randomUUID(), mode: "motion", title: "Render" }),
      other = workspace.execute("session_create", { requestId: randomUUID(), mode: "motion", title: "Other" }),
      artifact = workspace.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Film",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = workspace.execute("project_read", owner),
      input = { ...owner, revision: project.revision, fps: { num: 30000, den: 1001 } },
      snapshot = freeze(workspace, input);
    expect(snapshot.spec).toMatchObject({ width: 1920, height: 1080, duration: 5, frames: 150, audio: "silent" });
    const saved = workspace.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: [{ path: "index.html", content: "changed source" }],
    });
    expect(saved.revision).not.toBe(snapshot.project.revision);
    expect(snapshot.project.files).toEqual(project.files);
    const restored = workspace.execute("project_snapshot", { ...owner, revision: snapshot.project.revision });
    expect(restored).toEqual(snapshot.project);
    expect(workspace.execute("project_read", owner)).toEqual(saved);
    expect(freeze(workspace, input)).toEqual(snapshot);
    expect(() =>
      workspace.execute("project_snapshot", { ...owner, sessionId: other.id, revision: project.revision }),
    ).toThrow("belong");
    expect(() => workspace.execute("project_snapshot", { ...owner, revision: `sha256:${"0".repeat(64)}` })).toThrow(
      "missing",
    );
    workspace.close();
    const reopened = new Workspace(root);
    try {
      expect(reopened.execute("project_snapshot", { ...owner, revision: snapshot.project.revision })).toEqual(
        snapshot.project,
      );
    } finally {
      reopened.close();
    }
  } finally {
    workspace.close();
    rmSync(root, { recursive: true, force: true });
  }
});
