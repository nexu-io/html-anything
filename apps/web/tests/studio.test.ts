import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Motion } from "@open-motion/motion";
import { inspectContext } from "@open-motion/motion/project";
import { Fault, type Input, type Operation, Workspace } from "@open-motion/workspace";
import { expect, it, vi } from "vitest";
import { mount, type Transport } from "@";

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("missing fixture element");
  return value;
}
async function fixture(fail: boolean) {
  const root = mkdtempSync(join(tmpdir(), "studio-fields-")),
    db = new Workspace(root);
  const session = db.execute("session_create", { requestId: randomUUID(), title: "creative", mode: "motion" });
  const files = [
    {
      path: "index.html",
      content:
        '<main data-composition-id="main" data-duration="5"><p data-hf-id="hf-title" data-start="0" data-duration="5">Original</p></main>',
    },
  ];
  const a = db.execute("artifact_create", { requestId: randomUUID(), sessionId: session.id, title: "A", files }),
    b = db.execute("artifact_create", { requestId: randomUUID(), sessionId: session.id, title: "B", files });
  db.execute("artifact_open", {
    requestId: randomUUID(),
    sessionId: session.id,
    artifactId: a.id,
    expectedSelection: 0,
    expectedCurrent: null,
  });
  const transport: Transport = async (url, init) => {
    const input = JSON.parse(String(init?.body));
    try {
      if (String(url).endsWith("/preview/close")) return new Response("{}");
      if (String(url).endsWith("/motion/context")) return new Response(JSON.stringify(await inspectContext(input)));
      if (String(url).includes("/motion/")) {
        const model = await Motion.open(input.html);
        try {
          return new Response(
            JSON.stringify({
              html: String(url).endsWith("/patch") ? model.patch(input.id, input) : input.html,
              clips: model.clips,
            }),
          );
        } finally {
          model.dispose();
        }
      }
      return new Response(
        JSON.stringify(db.execute(String(url).split("/api/")[1] as Operation, input as Input<Operation>)),
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: { code: error instanceof Fault ? error.code : "integrity", message: (error as Error).message },
        }),
        { status: 409 },
      );
    }
  };
  const view = mount(document.body, { daemon: "http://127.0.0.1:4000", token: "fixture" }, transport);
  const editor = view.editor;
  let injection: DatabaseSync | undefined;
  try {
    await vi.waitFor(() =>
      expect(document.querySelector('select[aria-label="图层选择"] option[value="hf-title"]')).not.toBeNull(),
    );
    const select = required(document.querySelector<HTMLSelectElement>('select[aria-label="图层选择"]'));
    select.value = "hf-title";
    select.dispatchEvent(new Event("change"));
    await vi.waitFor(() => {
      expect(document.querySelector("[aria-live]")?.textContent).toBe("就绪");
      expect(document.querySelector<HTMLInputElement>('[aria-label="文本内容"]')?.readOnly).toBe(false);
    });
    const field = required(document.querySelector<HTMLInputElement>('[aria-label="文本内容"]'));
    field.value = "Pending native field";
    field.dispatchEvent(new Event("input"));
    expect(editor.drafts?.dirty()).toBe(true);
    expect(document.querySelector<HTMLTextAreaElement>('textarea[aria-label="index.html"]')?.readOnly).toBe(true);
    if (fail) {
      injection = new DatabaseSync(join(root, "workspace.sqlite"));
      injection.exec(
        "CREATE TRIGGER fail_native_save BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT,'storage failure');END",
      );
    }
    required(
      document.querySelector<HTMLButtonElement>(`[role="tablist"][aria-label="产物"] [role="tab"][data-tab="${b.id}"]`),
    ).click();
    if (fail) {
      await vi.waitFor(() => expect(document.querySelector("[aria-live]")?.textContent).toBe("storage failure"));
      expect(db.execute("workspace_state", {}).selection.artifactId).toBe(a.id);
      expect(editor.draft).toContain("Pending native field");
      expect(editor.dirty).toBe(true);
      expect(db.execute("project_read", { sessionId: session.id, artifactId: a.id }).files[0]?.content).toContain(
        "Original",
      );
    } else {
      await vi.waitFor(() => expect(editor.project?.artifactId).toBe(b.id));
      expect(db.execute("project_read", { sessionId: session.id, artifactId: a.id }).files[0]?.content).toContain(
        "Pending native field",
      );
    }
  } finally {
    await view.dispose();
    injection?.close();
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}
it("drains real native SDK fields into the shared save before a project switch", () => fixture(false));
it("keeps transformed native draft and original selection when the actual transaction aborts", () => fixture(true));
