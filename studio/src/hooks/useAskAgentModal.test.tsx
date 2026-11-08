// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DomEditSelection } from "../components/editor/domEditing";
import { useAskAgentModal } from "./useAskAgentModal";

const copy = vi.hoisted(() => vi.fn(async (_text: string) => true));
vi.mock("../utils/clipboard", () => ({
  copyTextToClipboard: copy,
}));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
beforeEach(() => {
  copy.mockReset().mockResolvedValue(true);
});
afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("useAskAgentModal", () => {
  it("sends the live element without the preview's lazy loading or look-ahead mark, keeping authored loading", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const element = document.createElement("div");
    element.setAttribute("data-hf-upcoming", "");
    element.innerHTML =
      '<img src="plate.png" loading="lazy" data-hf-preview-lazy><img src="own.png" loading="eager">';
    const selection: DomEditSelection = {
      element,
      label: "Plate",
      tagName: "div",
      sourceFile: "index.html",
      compositionPath: "index.html",
      isCompositionHost: false,
      isInsideLockedComposition: false,
      selector: "div",
      selectorIndex: 0,
      boundingBox: { x: 0, y: 0, width: 10, height: 10 },
      textContent: "",
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
    };
    let hook: ReturnType<typeof useAskAgentModal> | null = null;
    function Harness() {
      hook = useAskAgentModal({
        projectId: "demo",
        activeCompPath: "index.html",
        projectDir: "/demo",
        projectIdRef: { current: "demo" },
        showToast: () => {},
        domEditSelectionRef: { current: selection },
        domEditSelection: selection,
      });
      return null;
    }
    const host = document.body.appendChild(document.createElement("div"));
    root = createRoot(host);
    await act(async () => root.render(<Harness />));

    await act(async () => hook!.handleAgentModalSubmit("Make it bigger"));

    const prompt = copy.mock.calls[0]![0];
    expect(prompt).toContain('<img src="plate.png"><img src="own.png" loading="eager">');
    expect(prompt).toContain("Project ID: demo");
    expect(prompt).not.toContain("data-hf-preview-lazy");
    expect(prompt).not.toContain("data-hf-upcoming");
  });

  it("keeps the modal open on copy failure and reports success only after retry", async () => {
    const { hook, showToast } = await mount();
    act(() => hook().handleAskAgent());
    copy.mockResolvedValueOnce(false);
    await act(async () => hook().handleAgentModalSubmit("Change the title"));
    expect(hook().agentModalOpen).toBe(true);
    expect(showToast).toHaveBeenLastCalledWith("Could not copy prompt to clipboard.", "error");
    expect(hook().copiedAgentPrompt).toBe(false);
    await act(async () => hook().handleAgentModalSubmit("Change the title"));
    expect(hook().agentModalOpen).toBe(false);
    expect(showToast).toHaveBeenLastCalledWith(expect.stringContaining("Paste them into Codex"), "info");
  });

  it("closes when the target changes and ignores old source responses", async () => {
    let respond!: (response: Response) => void;
    const view = await mount();
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { respond = resolve; })));
    act(() => view.hook().handleAskAgent());
    await view.change({ ...view.selection, id: "new-title", element: document.createElement("h1") });
    expect(view.hook().agentModalOpen).toBe(false);
    await act(async () => respond(new Response(JSON.stringify({ content: '<h1 id="title">STALE SOURCE</h1>' }))));
    await act(async () => view.hook().handleAgentModalSubmit("Change the new title"));
    expect(copy.mock.calls[0]![0]).toContain("DOM id: new-title");
    expect(copy.mock.calls[0]![0]).not.toContain("STALE SOURCE");
  });

  it("does not copy blank instructions or a target belonging to a previous project", async () => {
    const view = await mount();
    await act(async () => view.hook().handleAgentModalSubmit("  "));
    view.projectIdRef.current = "other";
    await act(async () => view.hook().handleAgentModalSubmit("Change the title"));
    expect(copy).not.toHaveBeenCalled();
    expect(view.showToast).toHaveBeenCalledWith("The project changed. Select the element again.", "error");
  });
});

async function mount() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const element = document.createElement("h1");
  element.id = "title";
  let selection: DomEditSelection = {
    element, id: "title", label: "Title", tagName: "h1", sourceFile: "index.html", compositionPath: "index.html",
    boundingBox: { x: 0, y: 0, width: 100, height: 20 }, textContent: "Title", isCompositionHost: false,
    isInsideLockedComposition: false, dataAttributes: {}, inlineStyles: {}, computedStyles: {}, textFields: [],
    capabilities: { canSelect: true, canEditStyles: true, canCrop: false, canMove: true, canResize: true, canApplyManualOffset: false, canApplyManualSize: false, canApplyManualRotation: false },
  };
  const projectIdRef = { current: "demo" as string | null };
  const domEditSelectionRef = { current: selection as DomEditSelection | null };
  const showToast = vi.fn();
  let hook!: ReturnType<typeof useAskAgentModal>;
  function Harness() {
    hook = useAskAgentModal({ projectId: "demo", activeCompPath: "index.html", projectDir: "/demo", projectIdRef, showToast, domEditSelectionRef, domEditSelection: selection });
    return null;
  }
  root = createRoot(document.body.appendChild(document.createElement("div")));
  await act(async () => root.render(<Harness />));
  return {
    hook: () => hook, showToast, projectIdRef, selection,
    async change(next: DomEditSelection) {
      selection = next;
      domEditSelectionRef.current = next;
      await act(async () => root.render(<Harness />));
    },
  };
}
