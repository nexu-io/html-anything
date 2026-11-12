import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { entryFragment, parseEntry } from "@open-motion/daemon/contract";
import { Fault, type Input, initialFiles, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it, vi } from "vitest";
import { Client, Editor, mount, type Transport } from "@";

it("enters only the exact owned revision/history, preserves drafts and confirms a lost entry without rewinding selection", async () => {
  const root = mkdtempSync(join(tmpdir(), "project-entry-")),
    db = new Workspace(root);
  let lost = false;
  const entries: Input<"artifact_enter">[] = [];
  const transport: Transport = async (url, init) => {
    const op = String(url).split("/api/")[1] as Operation,
      input = JSON.parse(String(init?.body));
    if (op === "artifact_enter") entries.push(input);
    let result: unknown;
    try {
      result = db.execute(op, input);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: { code: error instanceof Fault ? error.code : "integrity", message: String(error) } }),
        { status: 409 },
      );
    }
    if (op === "artifact_enter" && lost) {
      lost = false;
      throw Error("lost entry response");
    }
    return new Response(JSON.stringify(result));
  };
  const client = new Client("http://127.0.0.1:4100", "fixture", transport);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Entry", mode: "motion" });
    const create = (title: string) =>
      db.execute("artifact_create", { requestId: randomUUID(), sessionId: session.id, title, files: initialFiles() });
    const intended = create("Intended"),
      newest = create("Newest");
    const owner = { sessionId: session.id, artifactId: intended.id },
      other = { sessionId: session.id, artifactId: newest.id };
    const project = db.execute("project_read", owner);
    const input = { ...owner, expectedRevision: project.revision, expectedHistory: project.history.version };
    const target = db.execute("project_entry", input),
      fragment = entryFragment(target);
    expect(parseEntry(fragment)).toEqual(target);
    expect(db.execute("workspace_state", {}).selection.revision).toBe(0);
    const editor = new Editor(client);
    lost = true;
    await expect(editor.load(fragment)).rejects.toThrow("lost entry");
    expect(editor.initialized).toBe(false);
    expect(editor.project).toBeNull();
    expect(editor.unconfirmed).toBe(true);
    await expect(editor.load()).rejects.toThrow("pending entry");
    await editor.load(fragment);
    expect(entries[0]).toEqual(entries[1]);
    expect(editor.project?.artifactId).toBe(intended.id);
    expect(editor.unconfirmed).toBe(false);
    expect(db.execute("workspace_state", {}).selection.revision).toBe(1);
    const draft = editor.draft + "\n<!-- retained local draft -->";
    editor.edit(draft);
    await expect(editor.load(fragment)).rejects.toThrow("保存");
    expect(editor.draft).toBe(draft);
    const saved = db.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: [...project.files, { path: "notes.txt", content: "later" }],
    });
    const restored = db.execute("project_undo", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: saved.revision,
      expectedHistory: saved.history.version,
    });
    expect(restored.revision).toBe(target.revision);
    expect(restored.history.version).not.toBe(target.historyVersion);
    const before = db.execute("workspace_state", {}).selection;
    expect(() => db.execute("project_entry", input)).toThrow("history version");
    await expect(new Editor(client).load(fragment)).rejects.toThrow("history version");
    expect(db.execute("workspace_state", {}).selection).toEqual(before);
    const fresh = entryFragment(db.execute("project_entry", { ...input, expectedHistory: restored.history.version }));
    const another = new Editor(client);
    lost = true;
    await expect(another.load(fresh)).rejects.toThrow("lost entry");
    const selected = db.execute("workspace_state", {}).selection;
    db.execute("artifact_open", {
      ...other,
      requestId: randomUUID(),
      expectedSelection: selected.revision,
      expectedCurrent: { artifactId: intended.id, revision: restored.revision },
    });
    await expect(another.load(fresh)).rejects.toThrow("selection changed");
    expect(another.project).toBeNull();
    expect(db.execute("workspace_state", {}).selection.artifactId).toBe(newest.id);
    const count = entries.length;
    for (const malformed of [
      "#project=bad",
      "#wrong=1",
      fragment + "&other=1",
      entryFragment({ ...target, sessionId: randomUUID() }),
    ])
      await expect(new Editor(client).load(malformed)).rejects.toThrow();
    expect(db.execute("workspace_state", {}).selection.artifactId).toBe(newest.id);
    expect(entries.length).toBe(count + 1); // Only the structurally valid wrong-owner entry reached the server.
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("handles same-page links after the original unknown entry settles and preserves dirty content", async () => {
  const root = mkdtempSync(join(tmpdir(), "entry-navigation-")),
    db = new Workspace(root),
    original = location.href;
  let lose = true;
  const requests: Input<"artifact_enter">[] = [];
  const transport: Transport = async (url, init) => {
    if (String(url).endsWith("/preview/close")) return new Response("{}");
    const op = String(url).split("/api/")[1] as Operation,
      input = JSON.parse(String(init?.body));
    let result: unknown;
    try {
      result = db.execute(op, input);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: { code: error instanceof Fault ? error.code : "invalid", message: String(error) } }),
        { status: 409 },
      );
    }
    if (op === "artifact_enter") {
      requests.push(input);
      if (lose) {
        lose = false;
        throw Error("lost entry response");
      }
    }
    return new Response(JSON.stringify(result));
  };
  const session = db.execute("session_create", { requestId: randomUUID(), title: "Navigation", mode: "motion" });
  const make = (title: string) => {
    const artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title,
      files: initialFiles(),
    });
    const project = db.execute("project_read", { sessionId: session.id, artifactId: artifact.id });
    return {
      artifact,
      fragment: entryFragment({
        sessionId: session.id,
        artifactId: artifact.id,
        revision: project.revision,
        historyVersion: project.history.version,
      }),
    };
  };
  const one = make("One"),
    two = make("Two"),
    view = mount(document.body, { daemon: "http://127.0.0.1:4100", token: "fixture", entry: "" }, transport);
  const navigate = (fragment: string) => {
    history.replaceState({}, "", fragment);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  try {
    await vi.waitFor(() => expect(view.editor.initialized).toBe(true));
    navigate(one.fragment);
    await vi.waitFor(() => expect(view.editor.unconfirmed).toBe(true));
    navigate(two.fragment);
    expect(requests).toHaveLength(1);
    const retry = [...document.querySelectorAll("button")].find((button) => button.textContent === "重试");
    expect(retry).toBeDefined();
    retry?.click();
    await vi.waitFor(() => expect(view.editor.project?.artifactId).toBe(two.artifact.id));
    expect(requests).toHaveLength(3);
    expect(requests[0]).toEqual(requests[1]);
    expect(requests[2]?.artifactId).toBe(two.artifact.id);
    view.editor.edit(view.editor.draft + "\n<!-- local draft -->");
    navigate(one.fragment);
    await vi.waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).toContain("保存"));
    expect(view.editor.project?.artifactId).toBe(two.artifact.id);
    expect(view.editor.draft).toContain("local draft");
    expect(requests).toHaveLength(3);
    await view.dispose();
    navigate(one.fragment);
    expect(requests).toHaveLength(3);
  } finally {
    await view.dispose();
    history.replaceState({}, "", original);
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
