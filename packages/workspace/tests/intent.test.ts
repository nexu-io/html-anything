import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { initialFiles, Workspace } from "@";

it("replays immutable source intent before resolution and atomically owns artifact/history/receipt", async () => {
  const root = join(fileURLToPath(new URL("../../../.artifacts/", import.meta.url)), "source-intent", randomUUID());
  await mkdir(root, { recursive: true });
  let workspace = new Workspace(root);
  try {
    const session = workspace.execute("session_create", { requestId: randomUUID(), title: "Source", mode: "motion" });
    const input = {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Original",
      source: { id: "prism-example", contentHash: `sha256:${"1".repeat(64)}` },
    };
    expect(workspace.sourceReceipt(input)).toBeUndefined();
    const artifact = workspace.createSource(input, { files: initialFiles(), resources: [] }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      original = workspace.execute("project_read", owner);
    const saved = workspace.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: original.revision,
      files: original.files.map((file) => ({
        ...file,
        content: file.path === "index.html" ? file.content.replace("<title>", "<title>Edited ") : file.content,
      })),
    });
    workspace.close();
    workspace = new Workspace(root);
    expect(
      workspace.sourceReceipt({
        source: input.source,
        title: input.title,
        sessionId: input.sessionId,
        requestId: input.requestId,
      }),
    ).toEqual(artifact);
    expect(workspace.createSource(input, { files: [], resources: [] })).toEqual(artifact);
    expect(workspace.execute("project_read", owner).revision).toBe(saved.revision);
    for (const change of [
      { title: "Other" },
      { sessionId: randomUUID() },
      { source: { ...input.source, contentHash: `sha256:${"2".repeat(64)}` } },
    ])
      expect(() => workspace.sourceReceipt({ ...input, ...change })).toThrow("requestId");
    expect(() => workspace.sourceReceipt({ ...input, title: "" })).toThrow("invalid");
    const failed = { ...input, requestId: randomUUID() };
    expect(() => workspace.createSource(failed, { files: [], resources: [] })).toThrow();
    expect(workspace.sourceReceipt(failed)).toBeUndefined();
    expect(workspace.execute("workspace_state", {}).selection.artifactId).toBeNull();
    expect((await readFile(join(root, "workspace.sqlite"))).length).toBeGreaterThan(0);
  } finally {
    workspace.close();
  }
});
