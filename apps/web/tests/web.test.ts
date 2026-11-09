import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Fault, type Input, initialFiles, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it, vi } from "vitest";
import { Client, Editor, mount, type Transport } from "@";

const mounted: { dispose(): Promise<void> }[] = [];
function mountedView(...args: Parameters<typeof mount>) {
  const view = mount(...args);
  mounted.push(view);
  return view;
}
function fixture(run: (db: Workspace, transport: Transport) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), "web-workspace-")),
    db = new Workspace(root);
  const transport: Transport = async (input, init) => {
    try {
      if (String(input).endsWith("/preview/close")) return new Response("{}");
      const operation = String(input).split("/api/")[1] as Operation;
      return new Response(JSON.stringify(db.execute(operation, JSON.parse(String(init?.body)) as Input<Operation>)));
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: { code: error instanceof Fault ? error.code : "integrity", message: (error as Error).message },
        }),
        { status: 409 },
      );
    }
  };
  return run(db, transport).finally(async () => {
    for (const view of mounted.splice(0)) await view.dispose();
    db.close();
    rmSync(root, { recursive: true, force: true });
  });
}
it("requires a loopback origin and sends only explicit capabilities", async () => {
  expect(() => new Client("https://example.com", "token")).toThrow("loopback");
  const transport = vi
    .fn<Transport>()
    .mockResolvedValue(new Response('{"sessions":[],"selection":{"revision":0,"sessionId":null,"artifactId":null}}'));
  await new Client("http://127.0.0.1:4100", "secret", transport).execute("workspace_state", {});
  expect(transport).toHaveBeenCalledWith(
    "http://127.0.0.1:4100/api/workspace_state",
    expect.objectContaining({
      method: "POST",
      credentials: "omit",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
    }),
  );
});
it("renders real sessions/artifacts as business composition and preserves theme/no-style isolation", () =>
  fixture(async (db, transport) => {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "actual session", mode: "motion" });
    const { editor } = mountedView(document.body, { daemon: "http://127.0.0.1:4100", token: "test" }, transport);
    await vi.waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).toBe("就绪"));
    document
      .querySelector<HTMLButtonElement>(`nav[aria-label="会话"] button[data-session-id="${session.id}"]`)
      ?.click();
    await vi.waitFor(() => expect(editor.session?.id).toBe(session.id));
    expect(document.body.getAttribute("data-session-id")).toBe(session.id);
    const theme = Array.from(document.querySelectorAll("button")).find((b) => b.textContent === "切换主题");
    theme?.click();
    expect(document.body.getAttribute("data-om-theme")).toBe("dark");
    expect(document.querySelector("style,[style],link[rel=stylesheet]")).toBeNull();
  }));
it("keeps dirty source and the old context on a save conflict instead of switching", () =>
  fixture(async (db, transport) => {
    const one = db.execute("session_create", { requestId: randomUUID(), title: "one", mode: "motion" });
    const two = db.execute("session_create", { requestId: randomUUID(), title: "two", mode: "motion" });
    const artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: one.id,
      title: "native",
      files: initialFiles(),
    });
    db.execute("artifact_open", {
      requestId: randomUUID(),
      sessionId: one.id,
      artifactId: artifact.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const editor = new Editor(new Client("http://127.0.0.1:4100", "test", transport));
    await editor.load();
    const old = editor.project;
    if (!old) throw new Error("missing project");
    editor.edit("unsaved local source");
    db.execute("project_save", {
      requestId: randomUUID(),
      sessionId: one.id,
      artifactId: artifact.id,
      expectedRevision: old.revision,
      files: [{ path: "index.html", content: "actual agent edit" }],
    });
    await expect(editor.openSession(two.id)).rejects.toThrow("revision changed");
    expect(editor.draft).toBe("unsaved local source");
    expect(editor.dirty).toBe(true);
    expect(editor.project).toEqual(old);
    expect(db.execute("workspace_state", {}).selection.sessionId).toBe(one.id);
  }));
it("retries a committed response loss with the same command key and without duplicate sessions", () =>
  fixture(async (db, transport) => {
    let lose = true;
    const unreliable: Transport = async (input, init) => {
      const response = await transport(input, init);
      if (lose) {
        lose = false;
        throw new Error("lost response");
      }
      return response;
    };
    const editor = new Editor(new Client("http://127.0.0.1:4100", "test", unreliable));
    await expect(editor.createSession("once")).rejects.toThrow("lost response");
    expect(editor.unconfirmed).toBe(true);
    await editor.createSession("once");
    expect(editor.unconfirmed).toBe(false);
    expect(db.execute("workspace_state", {}).sessions).toHaveLength(1);
    expect(editor.state.sessions).toHaveLength(1);
  }));
it("retries only hydration after a committed switch loses its read response", () =>
  fixture(async (db, transport) => {
    const session = db.execute("session_create", { requestId: randomUUID(), title: "selected", mode: "motion" });
    let lose = true;
    let switches = 0;
    const unreliable: Transport = async (input, init) => {
      if (String(input).endsWith("/session_open")) switches++;
      if (String(input).endsWith("/session_get") && lose) {
        lose = false;
        throw new Error("read interrupted");
      }
      return transport(input, init);
    };
    const editor = new Editor(new Client("http://127.0.0.1:4100", "test", unreliable));
    await editor.load();
    await expect(editor.openSession(session.id)).rejects.toThrow("read interrupted");
    expect(editor.state.selection.sessionId).toBeNull();
    expect(editor.needsRefresh).toBe(true);
    expect(db.execute("workspace_state", {}).selection.sessionId).toBe(session.id);
    await editor.retryRefresh();
    expect(editor.session?.id).toBe(session.id);
    expect(editor.unconfirmed).toBe(false);
    expect(switches).toBe(1);
  }));

it("enters newly created objects and retries only a lost selection response without duplicate creation", () =>
  fixture(async (db, transport) => {
    let lose: "session_open" | "artifact_open" | undefined = "session_open";
    const unreliable: Transport = async (input, init) => {
      const response = await transport(input, init);
      if (lose && String(input).endsWith(`/${lose}`)) {
        lose = undefined;
        throw new Error("selection response lost");
      }
      return response;
    };
    const root = document.createElement("div");
    document.body.replaceChildren(root);
    const { editor } = mountedView(root, { daemon: "http://127.0.0.1:4100", token: "test" }, unreliable);
    const click = (label: string) =>
      [...root.querySelectorAll("button")].find((button) => button.textContent === label)?.click();
    const retry = () => [...root.querySelectorAll("button")].find((button) => button.textContent === "重试");
    await vi.waitFor(() => expect(root.querySelector("[aria-live]")?.textContent).toBe("就绪"));
    const title = root.querySelector<HTMLInputElement>('[aria-label="会话标题"]');
    if (!title) throw Error("missing title field");
    title.value = "one creation";
    click("创建会话");
    await vi.waitFor(() => expect(retry()?.disabled).toBe(false));
    expect(db.execute("workspace_state", {}).sessions).toHaveLength(1);
    expect(editor.session).toBeNull();
    click("重试");
    await vi.waitFor(() => expect(editor.session?.title).toBe("one creation"));
    expect(db.execute("workspace_state", {}).sessions).toHaveLength(1);
    const artifact = root.querySelector<HTMLInputElement>('[aria-label="工程标题"]');
    if (!artifact) throw Error("missing artifact field");
    artifact.value = "one artifact";
    lose = "artifact_open";
    click("创建工程");
    await vi.waitFor(() => expect(retry()?.disabled).toBe(false));
    expect(db.execute("session_get", { sessionId: editor.session?.id ?? "" }).artifacts).toHaveLength(1);
    click("重试");
    await vi.waitFor(() => expect(editor.project).not.toBeNull());
    expect(editor.session?.artifacts).toHaveLength(1);
    expect(root.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("one artifact");
  }));

it("holds root ownership while draining an in-flight load and permits remount only after disposal", () =>
  fixture(async (_db, transport) => {
    const root = document.createElement("div");
    document.body.append(root);
    let release: () => void = () => {};
    const gate = new Promise<void>((done) => {
      release = done;
    });
    const slow: Transport = async (input, init) => {
      await gate;
      return transport(input, init);
    };
    const config = { daemon: "http://127.0.0.1:4100", token: "test" };
    const first = mount(root, config, slow);
    const disposing = first.dispose();
    expect(() => mount(root, config, transport)).toThrow("await dispose");
    expect(root.querySelector(".om-shell")).not.toBeNull();
    release();
    await disposing;
    expect(root.childElementCount).toBe(0);
    const second = mountedView(root, config, transport);
    await vi.waitFor(() => expect(root.querySelector("[aria-live]")?.textContent).toBe("就绪"));
    expect(second.editor.state.sessions).toEqual([]);
  }));
