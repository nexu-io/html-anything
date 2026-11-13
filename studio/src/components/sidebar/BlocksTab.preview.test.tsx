// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { BlocksTab } from "./BlocksTab";
import { StudioHostContext } from "../../motion/StudioHost";
import { useAssetPreviewStore } from "../../utils/assetPreviewStore";

vi.mock("../../contexts/StudioContext", () => ({ useStudioShellContext: () => ({ activeCompPath: "index.html" }) }));
vi.mock("../../hooks/useBlockCatalog", () => ({ useBlockCatalog: () => ({
  loading: false, search: "", setSearch: vi.fn(), category: null, setCategory: vi.fn(),
  filteredBlocks: [{ name: "caption", title: "Caption", category: "captions", type: "component", description: "", preview: { video: "/caption.mp4" } }],
}) }));
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("keeps hover playback in the card and persists a clicked preview after pointer leave", () => {
  vi.useFakeTimers();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const legacyPreview = vi.fn();
  try {
    act(() => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><BlocksTab onPreviewBlock={legacyPreview} /></StudioHostContext.Provider>));
    const card = host.querySelector<HTMLElement>('[role="button"]')!;
    act(() => { card.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })); vi.advanceTimersByTime(301); });
    expect(card.querySelector("video")?.autoplay).toBe(true);
    expect(legacyPreview).not.toHaveBeenCalled();
    expect(useAssetPreviewStore.getState().catalogPreview).toBeNull();
    act(() => card.click());
    act(() => card.dispatchEvent(new PointerEvent("pointerout", { bubbles: true })));
    expect(useAssetPreviewStore.getState().catalogPreview?.videoUrl).toBe("/caption.mp4");
  } finally {
    act(() => root.unmount());
    host.remove();
    useAssetPreviewStore.getState().clearPreviewAsset();
    vi.useRealTimers();
  }
});

it("offers caption insertion on the card and in its preview without conflating the actions", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let finish!: (value: boolean) => void;
  const add = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
  try {
    act(() => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><BlocksTab onAddBlock={add} /></StudioHostContext.Provider>));
    const card = host.querySelector<HTMLElement>('[role="button"]')!;
    act(() => card.click());
    expect(add).not.toHaveBeenCalled();
    expect(useAssetPreviewStore.getState().catalogPreview?.onAdd).toBeTypeOf("function");
    useAssetPreviewStore.getState().clearPreviewAsset();
    const button = [...host.querySelectorAll("button")].find(b => b.textContent?.includes("Use"))!;
    act(() => { button.click(); button.click(); });
    expect(add).toHaveBeenCalledExactlyOnceWith("caption");
    expect(button.disabled).toBe(true);
    expect(useAssetPreviewStore.getState().catalogPreview).toBeNull();
    await act(async () => finish(false));
    expect(button.textContent).toContain("Failed");
  } finally {
    act(() => root.unmount());
    host.remove();
    useAssetPreviewStore.getState().clearPreviewAsset();
  }
});
