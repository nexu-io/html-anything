import { expect, it } from "vitest";
import { Motion } from "@";

const source =
  '<!doctype html><html><body><main data-composition-id="main" data-width="640" data-height="360" data-duration="5"><p data-hf-id="hf-title" data-start="1" data-duration="2">Hello</p></main></body></html>';
it("edits real native text and canonical authored timing with the pinned SDK", async () => {
  const model = await Motion.open(source);
  try {
    expect(model.clips.find((c) => c.id === "hf-title")).toMatchObject({ text: "Hello", start: 1, duration: 2 });
    const changed = model.patch("hf-title", { text: "Edited <native>", start: 2, duration: 1 });
    expect(changed).toContain('data-start="2"');
    expect(changed).toContain('data-duration="1"');
    expect(changed).toContain("Edited &lt;native&gt;");
    expect(changed).not.toContain("data-end=");
    const reopened = await Motion.open(changed);
    try {
      expect(reopened.clips.find((c) => c.id === "hf-title")).toMatchObject({
        text: "Edited <native>",
        start: 2,
        duration: 1,
      });
    } finally {
      reopened.dispose();
    }
  } finally {
    model.dispose();
  }
});
it("rejects an invalid edit before changing the native model", async () => {
  const model = await Motion.open(source);
  try {
    expect(() => model.patch("hf-title", { text: "must not apply", duration: -1 })).toThrow("duration");
    expect(model.clips.find((c) => c.id === "hf-title")?.text).toBe("Hello");
    expect(() => model.patch("foreign-id", { text: "wrong" })).toThrow("missing");
  } finally {
    model.dispose();
  }
});
it("derives stable element identities from unchanged unmarked source without persisting it", async () => {
  const a = await Motion.open(source),
    b = await Motion.open(source);
  try {
    expect(a.clips).toEqual(b.clips);
  } finally {
    a.dispose();
    b.dispose();
  }
});

it("adds escaped native text through SDK operations and removes only owned content elements", async () => {
  let model = await Motion.open(source);
  try {
    const changed = model.edit({ html: source, action: "addText", fontSize: 96, text: "New <title>" });
    expect(changed).toContain("New &lt;title&gt;");
    const added = model.clips.find((c) => c.text === "New <title>");
    expect(added?.fontSize).toBe(96);
    expect(() => model.patch("hf-title", { text: "must not apply", fontSize: -1 })).toThrow("fontSize");
    expect(model.clips.find((c) => c.id === "hf-title")?.text).toBe("Hello");
    expect(added).toBeDefined();
    if (!added) throw Error("missing inserted element");
    const id = added.id;
    model.dispose();
    model = await Motion.open(changed);
    expect(model.clips.find((c) => c.id === id)?.text).toBe("New <title>");
    const removed = model.edit({ html: changed, action: "remove", id });
    expect(removed).not.toContain("New &lt;title&gt;");
    const root = model.clips.find((c) => c.composition);
    if (!root) throw Error("missing composition");
    expect(() => model.edit({ html: removed, action: "remove", id: root.id })).toThrow("content element");
  } finally {
    model.dispose();
  }
});

it("projects authored parent identities for tree navigation and retains them after native edits", async () => {
  const model = await Motion.open(source);
  try {
    const root = model.clips.find((c) => c.composition);
    expect(root?.parent).toBeNull();
    expect(model.clips.find((c) => c.id === "hf-title")?.parent).toBe(root?.id);
    model.patch("hf-title", { text: "same hierarchy" });
    expect(model.clips.find((c) => c.id === "hf-title")?.parent).toBe(root?.id);
  } finally {
    model.dispose();
  }
});
