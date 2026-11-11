import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Fault, type Input, initialFiles, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { Client, Editor, type Transport } from "@";

it("retains exact file mutation intent after a lost commit and preserves history on reopen", async () => {
  const root = mkdtempSync(join(tmpdir(), "source-files-")),
    db = new Workspace(root);
  const saves: Input<"project_save">[] = [];
  let lose = false;
  const transport: Transport = async (url, init) => {
    const op = String(url).split("/api/")[1] as Operation,
      input = JSON.parse(String(init?.body));
    if (op === "project_save") saves.push(input);
    let result: unknown;
    try {
      result = db.execute(op, input);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: { code: error instanceof Fault ? error.code : "integrity", message: String(error) } }),
        { status: 409 },
      );
    }
    if (op === "project_save" && lose) {
      lose = false;
      throw Error("lost commit response");
    }
    return new Response(JSON.stringify(result));
  };
  const client = new Client("http://127.0.0.1:4100", "fixture", transport),
    editor = new Editor(client);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Files", mode: "motion" }),
      artifact = db.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Source",
        files: initialFiles(),
      });
    await editor.load();
    await editor.openArtifact(artifact);
    editor.edit(editor.draft + "\n<!-- saved before file operation -->");
    await expect(editor.changeSource({ kind: "create", path: "../bad.html" })).rejects.toThrow();
    expect(editor.dirty).toBe(true);
    expect(saves).toHaveLength(0);
    await editor.changeSource({ kind: "create", path: "scenes/card.html" });
    editor.editFile("scenes/card.html", "<main>card source</main>");
    await editor.save();
    const before = editor.project!;
    lose = true;
    await expect(
      editor.changeSource({ kind: "rename", path: "scenes/card.html", target: "scenes/renamed.html" }),
    ).rejects.toThrow("lost commit");
    expect(editor.project).toBe(before);
    expect(editor.unconfirmed).toBe(true);
    await editor.changeSource({ kind: "rename", path: "scenes/card.html", target: "scenes/renamed.html" });
    expect(saves.at(-1)).toEqual(saves.at(-2));
    expect(editor.unconfirmed).toBe(false);
    expect(editor.source("scenes/renamed.html")).toBe("<main>card source</main>");
    await editor.changeSource({ kind: "duplicate", path: "scenes/renamed.html", target: "copy.html" });
    await editor.changeSource({ kind: "remove", path: "copy.html" });
    await editor.history("project_undo");
    expect(editor.project?.files.some((f) => f.path === "copy.html")).toBe(true);
    await editor.history("project_redo");
    expect(editor.project?.files.some((f) => f.path === "copy.html")).toBe(false);
    const other = new Editor(client);
    await other.load();
    expect(other.project).toEqual(editor.project);
    const authoritative = db.execute("project_read", { sessionId: session.id, artifactId: artifact.id });
    db.execute("project_save", {
      requestId: randomUUID(),
      sessionId: session.id,
      artifactId: artifact.id,
      expectedRevision: authoritative.revision,
      files: [...authoritative.files, { path: "remote.js", content: "remote" }],
    });
    await expect(editor.changeSource({ kind: "remove", path: "scenes/renamed.html" })).rejects.toThrow();
    expect(editor.project?.files.some((f) => f.path === "scenes/renamed.html")).toBe(true);
    expect(editor.unconfirmed).toBe(false);
    expect(
      db
        .execute("project_read", { sessionId: session.id, artifactId: artifact.id })
        .files.some((f) => f.path === "remote.js"),
    ).toBe(true);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
