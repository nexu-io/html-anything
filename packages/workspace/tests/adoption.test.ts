import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { identifyResource, initialFiles, type ResourceSourceIntent, Workspace } from "@";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
it("atomically imports an immutable candidate and replays original receipt before external lookup after edits/cold open", () => {
  const root = mkdtempSync(join(tmpdir(), "resource-source-"));
  let workspace = new Workspace(root);
  try {
    const session = workspace.execute("session_create", {
      requestId: randomUUID(),
      title: "Candidate",
      mode: "motion",
    });
    const artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "PNG",
      files: initialFiles(),
    });
    const owner = { sessionId: session.id, artifactId: artifact.id },
      before = workspace.execute("project_read", owner);
    const intent: ResourceSourceIntent = {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: before.revision,
      path: "assets/generated.png",
      name: "Generated PNG",
      source: { id: randomUUID(), contentHash: identifyResource("assets/generated.png", "PNG", png).digest },
    };
    expect(workspace.resourceSourceReceipt(intent)).toBeUndefined();
    const imported = workspace.importResourceSource(intent, png);
    expect(imported.resources).toHaveLength(1);
    expect(imported.history.version).toBe(before.history.version + 1);
    const edited = workspace.execute("project_save", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: imported.revision,
      files: [...imported.files, { path: "description.txt", content: "Later edit" }],
    });
    workspace.close();
    workspace = new Workspace(root);
    const replay = workspace.resourceSourceReceipt({
      source: { contentHash: intent.source.contentHash, id: intent.source.id },
      name: intent.name,
      path: intent.path,
      expectedRevision: intent.expectedRevision,
      artifactId: intent.artifactId,
      sessionId: intent.sessionId,
      requestId: intent.requestId,
    });
    expect(replay).toEqual(imported);
    // A lost-response retry supplies no candidate bytes at all; receipt precedes byte validation.
    expect(workspace.importResourceSource(intent, new Uint8Array())).toEqual(imported);
    expect(workspace.execute("project_read", owner)).toEqual(edited);
    for (const changed of [
      { name: "Changed" },
      { sessionId: randomUUID() },
      { artifactId: randomUUID() },
      { path: "assets/other.png" },
      { expectedRevision: edited.revision },
      { source: { ...intent.source, contentHash: `sha256:${"0".repeat(64)}` } },
      { source: { ...intent.source, id: randomUUID() } },
    ]) {
      expect(() => workspace.resourceSourceReceipt({ ...intent, ...changed })).toThrowError(
        expect.objectContaining({ code: "idempotency" }),
      );
    }
    expect(() =>
      workspace.execute("resource_remove", {
        ...owner,
        requestId: intent.requestId,
        expectedRevision: edited.revision,
        path: intent.path,
      }),
    ).toThrowError(expect.objectContaining({ code: "idempotency" }));
    expect(() => workspace.resourceSourceReceipt({ ...intent, name: "" })).toThrowError(
      expect.objectContaining({ code: "invalid" }),
    );
  } finally {
    workspace.close();
  }
});
it("rolls back candidate bytes/history/receipt when immutable source digest is false", () => {
  const workspace = new Workspace(mkdtempSync(join(tmpdir(), "resource-source-invalid-")));
  try {
    const session = workspace.execute("session_create", {
      requestId: randomUUID(),
      title: "Candidate",
      mode: "motion",
    });
    const artifact = workspace.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "PNG",
      files: initialFiles(),
    });
    const owner = { sessionId: session.id, artifactId: artifact.id },
      before = workspace.execute("project_read", owner);
    const input: ResourceSourceIntent = {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: before.revision,
      path: "assets/generated.png",
      name: "PNG",
      source: { id: randomUUID(), contentHash: `sha256:${"0".repeat(64)}` },
    };
    expect(() => workspace.importResourceSource(input, png)).toThrowError(expect.objectContaining({ code: "invalid" }));
    expect(workspace.resourceSourceReceipt(input)).toBeUndefined();
    expect(workspace.execute("project_read", owner)).toEqual(before);
    const correct = {
      ...input,
      source: { ...input.source, contentHash: identifyResource(input.path, input.name, png).digest },
    };
    expect(workspace.importResourceSource(correct, png).resources).toHaveLength(1);
  } finally {
    workspace.close();
  }
});
