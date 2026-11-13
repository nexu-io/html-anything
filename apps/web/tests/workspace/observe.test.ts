import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Fault, type Input, initialFiles, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it, vi } from "vitest";
import { Client, Editor, type Transport } from "@";
import { observeWorkspace } from "@/lib/observe.js";

async function fixture(
  run: (f: {
    db: Workspace;
    editor: Editor;
    client: Client;
    transport: Transport;
    owner: { sessionId: string; artifactId: string };
    change: (path: string, content: string) => void;
  }) => Promise<void>,
) {
  const root = mkdtempSync(join(tmpdir(), "web-observe-")),
    db = new Workspace(root);
  const transport: Transport = async (url, init) => {
    try {
      return new Response(
        JSON.stringify(
          db.execute(String(url).split("/api/")[1] as Operation, JSON.parse(String(init?.body)) as Input<Operation>),
        ),
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: { code: error instanceof Fault ? error.code : "integrity", message: String(error) } }),
        { status: 409 },
      );
    }
  };
  const client = new Client("http://127.0.0.1:4100", "test", transport),
    editor = new Editor(client);
  const session = db.execute("session_create", { requestId: randomUUID(), title: "Shared", mode: "motion" }),
    artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Project",
      files: [...initialFiles(), { path: "card.html", content: "base" }],
    }),
    owner = { sessionId: session.id, artifactId: artifact.id };
  const change = (path: string, content: string) => {
    const p = db.execute("project_read", owner);
    db.execute("project_save", {
      requestId: randomUUID(),
      ...owner,
      expectedRevision: p.revision,
      files: p.files.map((f) => (f.path === path ? { path, content } : f)),
    });
  };
  try {
    await editor.load();
    await editor.openArtifact(artifact);
    await run({ db, editor, client, transport, owner, change });
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}
it("refreshes clean same-context views, preserves drafts and merges independent files without automatic writes", () =>
  fixture(async ({ db, editor, owner, change }) => {
    change("card.html", "agent");
    expect(await editor.observe()).toBe(true);
    expect(editor.source("card.html")).toBe("agent");
    expect(editor.incoming).toBeUndefined();
    editor.edit(editor.draft + "LOCAL");
    change("card.html", "agent2");
    await editor.observe();
    expect(editor.incoming).toBeDefined();
    expect(editor.draft).toContain("LOCAL");
    expect(editor.source("card.html")).toBe("agent");
    await expect(editor.save()).rejects.toThrow("外部修改");
    editor.reconcile(editor.incoming!.token, {});
    expect(editor.source("card.html")).toBe("agent2");
    expect(editor.dirty).toBe(true);
    expect(db.execute("project_read", owner).files.find((f) => f.path === "index.html")?.content).not.toContain(
      "LOCAL",
    );
    await editor.save();
    expect(db.execute("project_read", owner).files.find((f) => f.path === "index.html")?.content).toContain("LOCAL");
  }));
it("retains local sources through edit/delete conflicts and supports explicit resurrection before saving", () =>
  fixture(async ({ db, editor, owner }) => {
    editor.editFile("card.html", "local card");
    const p = db.execute("project_read", owner);
    db.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: p.revision,
      files: p.files.filter((f) => f.path !== "card.html"),
    });
    await editor.observe();
    expect(() => editor.reconcile(editor.incoming!.token, {})).toThrow("逐个选择");
    editor.reconcile(editor.incoming!.token, { "card.html": "local" });
    expect(editor.sources).toContainEqual({ path: "card.html", content: "local card" });
    expect(db.execute("project_read", owner).files.some((f) => f.path === "card.html")).toBe(false);
    editor.editFile("card.html", "resurrected edit");
    await editor.save();
    expect(db.execute("project_read", owner).files).toContainEqual({ path: "card.html", content: "resurrected edit" });
  }));
it("fences a read racing a commit and never substitutes an observation for an unknown write receipt", () =>
  fixture(async ({ db, editor, transport, owner, change }) => {
    let race = false;
    const raced: Transport = async (url, init) => {
      const response = await transport(url, init);
      if (String(url).endsWith("/project_read") && race) {
        race = false;
        change("card.html", "raced");
      }
      return response;
    };
    const another = new Editor(new Client("http://127.0.0.1:4100", "test", raced));
    await another.load();
    race = true;
    expect(await another.observe()).toBe(false);
    expect(another.source("card.html")).not.toBe("raced");
    await another.observe();
    expect(another.source("card.html")).toBe("raced");
    let lose = true;
    const writes: string[] = [];
    const uncertain: Transport = async (url, init) => {
      const r = await transport(url, init);
      if (String(url).endsWith("/project_save")) {
        writes.push(JSON.parse(String(init?.body)).requestId);
        if (lose) {
          lose = false;
          throw Error("lost response");
        }
      }
      return r;
    };
    const writer = new Editor(new Client("http://127.0.0.1:4100", "test", uncertain));
    await writer.load();
    writer.edit(writer.draft + "kept");
    await expect(writer.save()).rejects.toThrow("lost response");
    expect(await writer.observe()).toBe(false);
    await expect(writer.useExternal()).rejects.toThrow("重试");
    await expect(writer.discard()).rejects.toThrow("重试");
    await writer.save();
    expect(writes[0]).toBe(writes[1]);
    expect(writer.project).toEqual(db.execute("project_read", owner));
  }));
it("keeps the local context and native field draft until an explicit decision", () =>
  fixture(async ({ db, editor, owner, change }) => {
    let native = true;
    editor.drafts = {
      dirty: () => native,
      flush: async () => {
        editor.editFile("card.html", "native draft");
        native = false;
      },
      discard: () => {
        native = false;
      },
    };
    change("index.html", editor.draft + "remote");
    await editor.observe();
    expect(native).toBe(true);
    expect(() => editor.reconcile(editor.incoming!.token, {})).toThrow("准备");
    await editor.prepareExternal();
    editor.reconcile(editor.incoming!.token, {});
    expect(editor.source("card.html")).toBe("native draft");
    const session = db.execute("session_create", { requestId: randomUUID(), title: "Other", mode: "motion" }),
      state = db.execute("workspace_state", {}),
      p = db.execute("project_read", owner);
    db.execute("session_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      expectedSelection: state.selection.revision,
      expectedCurrent: { artifactId: owner.artifactId, revision: p.revision },
    });
    await editor.observe();
    expect(editor.project?.artifactId).toBe(owner.artifactId);
    expect(editor.incoming?.state.selection.sessionId).toBe(session.id);
    await editor.retainContext();
    expect(editor.dirty).toBe(true);
    expect(editor.source("card.html")).toBe("native draft");
    expect(db.execute("workspace_state", {}).selection.artifactId).toBe(owner.artifactId);
  }));
it("aborts a blocked background read and retires the observer before teardown", async () => {
  vi.useFakeTimers();
  let aborted = false,
    generation = 0,
    reads = 0;
  const transport: Transport = async (_url, init) =>
    new Promise((_done, reject) => {
      reads++;
      init?.signal?.addEventListener(
        "abort",
        () => {
          aborted = true;
          reject(Error("aborted"));
        },
        { once: true },
      );
    });
  const editor = new Editor(new Client("http://127.0.0.1:4100", "test", transport));
  editor.initialized = true;
  const changed = vi.fn(),
    observer = observeWorkspace(editor, {
      available: () => true,
      generation: () => generation,
      changed,
      status: () => {},
    });
  try {
    await vi.advanceTimersByTimeAsync(1500);
    generation++;
    await observer.close();
    expect(aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(3000);
    expect(reads).toBe(1);
    expect(changed).not.toHaveBeenCalled();
  } finally {
    await observer.close();
    vi.useRealTimers();
  }
});

it("coalesces manual reconnect with polling, preserves drafts and skips pending write receipts", () =>
  fixture(async ({ editor, db, owner }) => {
    vi.useFakeTimers();
    const before = db.execute("project_read", owner);
    editor.edit(editor.draft + "local reconnect draft");
    let release = () => {},
      blocked = false;
    const statuses: string[] = [],
      read = vi.spyOn(editor, "observe").mockRejectedValueOnce(Error("offline")),
      observer = observeWorkspace(editor, {
        available: () => !blocked,
        generation: () => 0,
        changed: () => {},
        status: (_value, state) => statuses.push(state),
      });
    try {
      await observer.retry();
      expect(statuses.at(-1)).toBe("disconnected");
      blocked = true;
      await observer.retry();
      expect(read).toHaveBeenCalledTimes(1);
      blocked = false;
      const pending = vi.spyOn(editor, "unconfirmed", "get").mockReturnValue(true);
      try {
        await observer.retry();
        expect(read).toHaveBeenCalledTimes(1);
      } finally {
        pending.mockRestore();
      }
      read.mockImplementationOnce(
        () =>
          new Promise<boolean>((done) => {
            release = () => done(false);
          }),
      );
      const first = observer.retry(),
        second = observer.retry();
      expect(first).toBe(second);
      await vi.advanceTimersByTimeAsync(3000);
      expect(read).toHaveBeenCalledTimes(2);
      release();
      await first;
      expect(statuses.at(-1)).toBe("connected");
      const announcements = statuses.length;
      read.mockResolvedValue(false);
      await vi.advanceTimersByTimeAsync(1500);
      expect(statuses).toHaveLength(announcements);
      expect(editor.draft).toContain("local reconnect draft");
      expect(db.execute("project_read", owner)).toEqual(before);
    } finally {
      release();
      await observer.close();
      read.mockRestore();
      vi.useRealTimers();
    }
  }));

it("adopts remote media membership while preserving a local text draft", () =>
  fixture(async ({ db, editor, owner }) => {
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=";
    editor.edit(editor.draft + "local text");
    const original = db.execute("project_read", owner);
    const imported = ingest(db, {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: original.revision,
      path: "assets/remote.png",
      name: "Remote",
      data: png,
    });
    await editor.observe();
    editor.reconcile(editor.incoming!.token, {});
    expect(editor.project?.resources).toEqual(imported.resources);
    await editor.save();
    expect(db.execute("project_read", owner).resources).toEqual(imported.resources);
  }));
it("retries the exact explicit context-return request after its response is lost", () =>
  fixture(async ({ db, transport, owner }) => {
    let lose = true;
    const ids: string[] = [];
    const returning: Transport = async (url, init) => {
      const response = await transport(url, init);
      if (String(url).endsWith("/artifact_open")) {
        ids.push(JSON.parse(String(init?.body)).requestId);
        if (lose) {
          lose = false;
          throw Error("lost return");
        }
      }
      return response;
    };
    const reader = new Editor(new Client("http://127.0.0.1:4100", "test", returning));
    await reader.load();
    reader.edit(reader.draft + "kept");
    const other = db.execute("session_create", { requestId: randomUUID(), title: "Other", mode: "motion" }),
      p = db.execute("project_read", owner),
      state = db.execute("workspace_state", {});
    db.execute("session_open", {
      requestId: randomUUID(),
      sessionId: other.id,
      expectedSelection: state.selection.revision,
      expectedCurrent: { artifactId: owner.artifactId, revision: p.revision },
    });
    await reader.observe();
    await expect(reader.retainContext()).rejects.toThrow("lost return");
    expect(reader.unconfirmed).toBe(true);
    await reader.retainContext();
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
    expect(reader.draft).toContain("kept");
    expect(reader.incoming).toBeUndefined();
  }));

it("does not replace a newer incoming view with an older delayed observation", () =>
  fixture(async ({ transport, change, editor }) => {
    let observations = 0,
      release: () => void = () => {},
      reached: () => void = () => {};
    const gate = new Promise<void>((done) => {
        release = done;
      }),
      waiting = new Promise<void>((done) => {
        reached = done;
      });
    const delayed: Transport = async (url, init) => {
      const response = await transport(url, init);
      if (String(url).endsWith("/workspace_observe") && ++observations === 2) {
        reached();
        await gate;
      }
      return response;
    };
    const reader = new Editor(new Client("http://127.0.0.1:4100", "test", delayed));
    await reader.load();
    reader.edit(reader.draft + "local");
    change("card.html", "first");
    const first = reader.observe();
    await waiting;
    change("card.html", "latest");
    await reader.observe();
    const latest = reader.incoming?.project?.revision;
    release();
    expect(await first).toBe(false);
    expect(reader.incoming?.project?.revision).toBe(latest);
    expect(reader.incoming?.project?.files).toContainEqual({ path: "card.html", content: "latest" });
  }));

it("rejects a transient session title between equal metadata fences", () =>
  fixture(async ({ db, transport, owner }) => {
    let race = false;
    const raced: Transport = async (url, init) => {
      if (!race || !String(url).endsWith("/session_get")) return transport(url, init);
      race = false;
      db.execute("session_rename", { requestId: randomUUID(), sessionId: owner.sessionId, title: "Transient" });
      const response = await transport(url, init);
      db.execute("session_rename", { requestId: randomUUID(), sessionId: owner.sessionId, title: "Shared" });
      return response;
    };
    const reader = new Editor(new Client("http://127.0.0.1:4100", "test", raced));
    await reader.load();
    const head = db.execute("workspace_observe", {});
    race = true;
    expect(await reader.observe()).toBe(false);
    expect(db.execute("workspace_observe", {})).toEqual(head);
    expect(reader.session?.title).toBe("Shared");
    expect(await reader.observe()).toBe(true);
    expect(reader.session?.title).toBe("Shared");
  }));

/** Test fixture construction; production transports accept raw bytes and digest metadata. */
function ingest(
  db: Workspace,
  input: Omit<Parameters<Workspace["importResource"]>[0], "digest" | "bytes"> & { data: string },
) {
  const { data, ...intent } = input,
    bytes = Buffer.from(data, "base64");
  return db.importResource(
    { ...intent, digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, bytes: bytes.length },
    bytes,
  );
}
