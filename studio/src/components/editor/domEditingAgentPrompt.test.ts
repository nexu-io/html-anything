// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import type { HyperframePickerElementInfo } from "@hyperframes/core";
import {
  buildAgentContextPreview,
  buildElementAgentPrompt,
  buildPickerAgentContextPreview,
  buildPickerAgentPrompt,
} from "./domEditingAgentPrompt";
import type { DomEditSelection } from "./domEditingTypes";

function makeSelection(overrides: Partial<DomEditSelection> = {}): DomEditSelection {
  return {
    element: document.createElement("div"),
    label: "Headline",
    tagName: "div",
    sourceFile: "hero.html",
    compositionPath: "hero.html",
    isCompositionHost: false,
    isInsideLockedComposition: false,
    id: "headline-1",
    selector: "#headline-1",
    selectorIndex: 0,
    boundingBox: { x: 10, y: 20, width: 300, height: 40 },
    textContent: "Hello world",
    dataAttributes: {},
    inlineStyles: {},
    computedStyles: {},
    textFields: [],
    capabilities: {
      canSelect: true,
      canEditStyles: true,
      canCrop: false,
      canMove: true,
      canResize: true,
      canApplyManualOffset: false,
      canApplyManualSize: false,
      canApplyManualRotation: false,
    },
    ...overrides,
  };
}

const PICKER_SELECTION: HyperframePickerElementInfo = {
  id: "headline-1",
  tagName: "div",
  selector: "#headline-1",
  label: "Headline",
  boundingBox: { x: 10, y: 20, width: 300, height: 40 },
  textContent: "Hello world",
  src: null,
  dataAttributes: {},
};

describe("buildElementAgentPrompt", () => {
  it("identifies the exact project and duplicate target without widening to timeline edits", () => {
    const prompt = buildElementAgentPrompt({
      projectId: "project-2",
      selection: makeSelection({ id: undefined, hfId: "card-2", selector: ".card", selectorIndex: 1, sourceFile: "cards.html" }),
      sourceFilePath: "/project-2/cards.html",
      currentTime: 2,
      userInstruction: "Move this card later",
    });
    expect(prompt).toContain('motion_get_project({"projectId":"project-2"})');
    expect(prompt).toContain("current revision and version with motion_edit_project");
    expect(prompt).toContain("Source file: /project-2/cards.html");
    expect(prompt).toContain("HyperFrames id: card-2");
    expect(prompt).toContain("Selector: .card\nSelector index: 1");
    expect(prompt).toContain("selector index is zero-based");
    expect(prompt).toContain("repeated composition instances");
    expect(prompt).toContain("ask the user before proceeding");
    expect(prompt).not.toContain("unless the request is a timeline edit");
    expect(prompt).not.toContain("hyperframes-cli");
  });

  it("produces the documented v1 schema", () => {
    const prompt = buildElementAgentPrompt({
      selection: makeSelection(),
      currentTime: 1.5,
      userInstruction: "Make this bigger",
    });
    expect(prompt).toBe(
      [
        "## HyperFrames element edit request v1",
        "Schema version: 1",
        "",
        "Make this bigger",
        "",
        "Composition: hero.html",
        "Playback time: 00:01",
        "Source file: hero.html",
        "DOM id: headline-1",
        "Selector: #headline-1",
        "Selector index: 0",
        "Tag: <div>",
        "Label: Headline",
        "Bounds: x=10, y=20, width=300, height=40",
        "Text: Hello world",
        "",
        "Guardrails:",
        "- Change only the selected element and its descendants, as requested. Preserve all other elements and compositions.",
        "- Do not modify other elements' data-* attributes or positioning. Preserve their content, styles, media and animations.",
        "- Preserve timing and layout outside the target. Change the target's timing only when explicitly requested.",
        "- Scope CSS and GSAP changes to this target. Do not change shared rules, variables or media files in ways that affect other elements or repeated composition instances.",
        "- Re-read the current source and verify the target before editing; selector index is zero-based within the source file. If the target is missing, ambiguous or requires changes outside this scope, ask the user before proceeding.",
        "- Review the diff and preview after editing; report any changes outside the requested scope instead of claiming that only this element changed.",
      ].join("\n"),
    );
  });

  it("includes text fields, inline styles, computed styles and a target snippet when present", () => {
    const prompt = buildElementAgentPrompt({
      selection: makeSelection({
        inlineStyles: { color: "red" },
        computedStyles: { "font-size": "16px" },
        textFields: [
          {
            key: "title",
            label: "Title",
            value: "Hello",
            tagName: "h1",
            attributes: [],
            inlineStyles: {},
            computedStyles: {},
            source: "self",
          },
        ],
      }),
      currentTime: 0,
      tagSnippet: "<div id='headline-1'>Hello world</div>",
      selectionContext: "Nested inside the hero card",
    });
    expect(prompt).toContain("Selection context:\nNested inside the hero card");
    expect(prompt).toContain('Text fields:\n- key=title; tag=<h1>; source=self; text="Hello"');
    expect(prompt).toContain("Inline styles:\ncolor: red");
    expect(prompt).toContain("Computed styles (browser-resolved):\nfont-size: 16px");
    expect(prompt).toContain("Target HTML:\n<div id='headline-1'>Hello world</div>");
  });
});

describe("buildAgentContextPreview", () => {
  it("summarizes composition, source, selector, tag and text", () => {
    expect(buildAgentContextPreview(makeSelection(), "hero.html")).toBe(
      [
        "Composition: hero.html",
        "Source: hero.html",
        "Selector: #headline-1  Tag: <div>",
        "Text: Hello world",
      ].join("\n"),
    );
  });
});

describe("buildPickerAgentPrompt", () => {
  it("produces a plain comment prompt when nothing is selected", () => {
    const prompt = buildPickerAgentPrompt({ selection: null, userInstruction: "Add a border" });
    expect(prompt).toBe(
      ["## HyperFrames element edit request v1", "Schema version: 1", "", "Add a border"].join(
        "\n",
      ),
    );
  });

  it("produces identical shared-field text to buildElementAgentPrompt for equivalent input", () => {
    const domPrompt = buildElementAgentPrompt({
      selection: makeSelection({ compositionPath: "", sourceFile: "" }),
      currentTime: 0,
    });
    const pickerPrompt = buildPickerAgentPrompt({ selection: PICKER_SELECTION });

    const sharedFields = [
      "DOM id: headline-1",
      "Selector: #headline-1",
      "Tag: <div>",
      "Bounds: x=10, y=20, width=300, height=40",
      "Text: Hello world",
    ];
    for (const line of sharedFields) {
      expect(domPrompt).toContain(line);
      expect(pickerPrompt).toContain(line);
    }
    // Both end on the identical guardrails block, byte for byte.
    const guardrails = [
      "Guardrails:",
      "- Change only the selected element and its descendants, as requested. Preserve all other elements and compositions.",
      "- Do not modify other elements' data-* attributes or positioning. Preserve their content, styles, media and animations.",
      "- Preserve timing and layout outside the target. Change the target's timing only when explicitly requested.",
      "- Scope CSS and GSAP changes to this target. Do not change shared rules, variables or media files in ways that affect other elements or repeated composition instances.",
      "- Re-read the current source and verify the target before editing; selector index is zero-based within the source file. If the target is missing, ambiguous or requires changes outside this scope, ask the user before proceeding.",
      "- Review the diff and preview after editing; report any changes outside the requested scope instead of claiming that only this element changed.",
    ].join("\n");
    expect(domPrompt.endsWith(guardrails)).toBe(true);
    expect(pickerPrompt.endsWith(guardrails)).toBe(true);
  });

  it("surfaces the picker's label and media src — a host app has no DOM to read them from otherwise", () => {
    const prompt = buildPickerAgentPrompt({
      selection: { ...PICKER_SELECTION, tagName: "img", src: "assets/hero.png" },
    });
    expect(prompt).toContain("Label: Headline");
    expect(prompt).toContain("Source (media): assets/hero.png");
  });

  it("omits the label and source lines when the picker didn't report them", () => {
    const prompt = buildPickerAgentPrompt({
      selection: { ...PICKER_SELECTION, label: "", src: null },
    });
    expect(prompt).not.toContain("Label:");
    expect(prompt).not.toContain("Source (media):");
  });
});

describe("buildPickerAgentContextPreview", () => {
  it("returns an empty string when nothing is selected", () => {
    expect(buildPickerAgentContextPreview(null)).toBe("");
  });

  it("matches buildAgentContextPreview's selector/tag/text line format", () => {
    expect(buildPickerAgentContextPreview(PICKER_SELECTION)).toBe(
      ["Selector: #headline-1  Tag: <div>", "Text: Hello world"].join("\n"),
    );
  });
});
