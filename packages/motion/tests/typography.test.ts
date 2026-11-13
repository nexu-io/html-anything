import { expect, it } from "vitest";
import { Motion, patchInput } from "@";

const html =
  '<main data-hf-id="root" data-composition-id="main" data-duration="2" style="direction:rtl;text-align:end"><p data-hf-id="title" data-start="0" data-duration="2" style="white-space:pre-wrap;font-weight:600;font-style:italic;letter-spacing:2px;line-height:1.4">Original</p><img data-hf-id="image" src="assets/photo.png"><div data-hf-id="group"><span data-hf-id="child">Child</span></div></main>';
it("edits multiline text, logical alignment and underline without rewriting other authored typography", async () => {
  const model = await Motion.open(html);
  try {
    const changed = model.patch("title", {
      text: "First <line>\nSecond & line",
      appearance: { align: "start", decoration: "underline" },
    });
    expect(changed).toContain("First &lt;line&gt;<br>Second &amp; line");
    expect(model.clips.find((c) => c.id === "title")).toMatchObject({
      text: "First <line>\nSecond & line",
      appearance: { align: "start", decoration: "underline" },
    });
    for (const value of [
      "font-weight: 600",
      "font-style: italic",
      "letter-spacing: 2px",
      "line-height: 1.4",
      "white-space: pre-wrap",
    ])
      expect(changed).toContain(value);
    const reset = model.patch("title", { appearance: { align: null, decoration: null } });
    const reopened = await Motion.open(reset);
    try {
      expect(reopened.clips.find((c) => c.id === "title")?.appearance).not.toHaveProperty("align");
      expect(reopened.clips.find((c) => c.id === "title")?.appearance).not.toHaveProperty("decoration");
      expect(reopened.clips.find((c) => c.id === "root")?.appearance.align).toBe("end");
      expect(reset).not.toContain("text-decoration-line");
      expect(reset).toContain("First &lt;line&gt;<br>Second &amp; line");
    } finally {
      reopened.dispose();
    }
  } finally {
    model.dispose();
  }
});
it("rejects invalid, media, composition and non-leaf text styling before any source mutation", async () => {
  expect(patchInput.safeParse({ html, id: "title", appearance: { align: "justify" } }).success).toBe(false);
  expect(patchInput.safeParse({ html, id: "title", appearance: { decoration: "underline url(x)" } }).success).toBe(
    false,
  );
  const model = await Motion.open(html);
  try {
    const before = model.clips;
    for (const id of ["image", "root", "group"])
      expect(() =>
        model.patch(id, { text: "Rejected", appearance: { align: "center", decoration: "underline" } }),
      ).toThrow();
    expect(model.clips).toEqual(before);
  } finally {
    model.dispose();
  }
});
it("clears only the edited decoration longhand and preserves unknown source expressions and shorthand", async () => {
  const model = await Motion.open(
    html.replace(
      "white-space:pre-wrap",
      "text-align:var(--align);text-decoration:underline wavy red;white-space:pre-wrap",
    ),
  );
  try {
    model.patch("title", { appearance: { decoration: "none" } });
    const changed = model.patch("title", { appearance: { decoration: null } });
    expect(changed).toContain("text-align: var(--align)");
    expect(changed).toContain("text-decoration: underline wavy red");
    expect(changed).not.toContain("text-decoration-line");
  } finally {
    model.dispose();
  }
});
