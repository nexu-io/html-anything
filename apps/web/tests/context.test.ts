import { inspectContext } from "@open-motion/motion/project";
import type { Project } from "@open-motion/workspace/contract";
import { expect, it, vi } from "vitest";
import { Client } from "@";
import { CompositionContext } from "@/lib/components/studio/context.js";
import { applyClip } from "@/lib/components/studio/transactions.js";
import { Editor } from "@/lib/editor.js";

async function fixture() {
  const client = new Client("http://127.0.0.1:4100", "fixture"),
    editor = new Editor(client);
  editor.project = {
    id: "project",
    sessionId: "session",
    artifactId: "artifact",
    revision: "one",
    history: { version: 1, canUndo: false, canRedo: false },
    resources: [],
    files: [
      {
        path: "index.html",
        content:
          '<main data-composition-id="main" data-duration="10"><div data-hf-id="hf-a" data-composition-id="card" data-composition-src="card.html" data-start="1" data-duration="3"></div><div data-hf-id="hf-b" data-composition-id="card" data-composition-src="card.html" data-start="5" data-duration="3"></div></main>',
      },
      {
        path: "card.html",
        content: '<main data-composition-id="card" data-duration="3"><p data-hf-id="hf-title">Shared</p></main>',
      },
    ],
  } as Project;
  editor.draft = editor.project.files[0]?.content ?? "";
  const context = new CompositionContext(document, editor, () => {});
  const update = async (instance: string | null) =>
    context.update(await inspectContext({ files: editor.sources, instance }));
  await update("hf-a");
  return { client, editor, context, update };
}
it("rejects a late source transform after moving to another instance of the same file", async () => {
  const { editor, context, update } = await fixture(),
    before = editor.sources,
    binding = context.capture();
  context.change("hf-b", 2);
  await update("hf-b");
  expect(() => context.apply(binding, "wrong instance")).toThrow("过期");
  expect(editor.sources).toEqual(before);
});
it("rejects in-flight writes after another source file or revision changes", async () => {
  const { editor, context } = await fixture(),
    binding = context.capture();
  editor.edit("changed root");
  expect(() => context.apply(binding, "overwrite")).toThrow("事务已过期");
  expect(editor.source("card.html")).toBe(binding.source);
  if (!editor.project) throw Error("missing fixture");
  editor.project = { ...editor.project, revision: "two" };
  expect(() => context.apply(binding, "overwrite")).toThrow("上下文已过期");
});
it("keeps instance selection DOM/value stable through ordinary control refreshes", async () => {
  const { context, update } = await fixture();
  await update(null);
  context.render(false);
  const select = context.element.querySelector("select");
  if (!select) throw Error("missing selector");
  select.value = "hf-b";
  context.render(true);
  context.render(false);
  expect(context.element.querySelector("select")).toBe(select);
  expect(select.value).toBe("hf-b");
});
it("restores the parent global playhead while exposing a distinct local clock", async () => {
  const { context, update } = await fixture();
  await update(null);
  context.change("hf-b", 2.5);
  await update("hf-b");
  expect(context.takeSeek()).toBe(5);
  expect(context.globalTime(0.5)).toBe(5.5);
  expect(context.localTime(5.5)).toBe(0.5);
  context.change(null, 6);
  await update(null);
  expect(context.takeSeek()).toBe(2.5);
  expect(() => context.globalTime(-1)).toThrow("时间窗");
});
it("does not apply an async result after navigation while a transform is suspended", async () => {
  const { context, editor, update } = await fixture();
  vi.spyOn(editor, "save").mockResolvedValue();
  let finish: ((value: { html: string }) => void) | undefined;
  const flight = context.transform(
    () =>
      new Promise<{ html: string }>((done) => {
        finish = done;
      }),
  );
  await expect.poll(() => !!finish).toBe(true);
  context.change("hf-b", 2);
  await update("hf-b");
  finish?.({ html: "late result" });
  await expect(flight).rejects.toThrow("过期");
  expect(editor.source("card.html")).not.toContain("late result");
});

it("rejects a host transform whose returned owning file differs from the captured parent", async () => {
  const { client, editor, context, update } = await fixture();
  await update(null);
  const model = await inspectContext({ files: editor.sources, instance: null }),
    clip = model.clips.find((clip) => clip.id === "hf-a"),
    before = editor.sources;
  if (!clip) throw Error("missing host");
  vi.spyOn(client, "retimeHost").mockResolvedValue({ file: "card.html", html: "wrong parent" });
  await expect(applyClip(context, client, context.capture(), clip, { start: 2 })).rejects.toThrow("父文件身份");
  expect(editor.sources).toEqual(before);
});
it("accepts an exact decimal boundary after ancestor window intersection without allowing a real overrun", async () => {
  const { context, editor } = await fixture();
  const model = await inspectContext({ files: editor.sources, instance: "hf-a" });
  context.update({ ...model, context: { ...model.context, duration: 2.8 - 2, offset: 2 } });
  expect(context.globalTime(0.8)).toBeCloseTo(2.8, 8);
  expect(() => context.globalTime(0.81)).toThrow("时间窗");
});
