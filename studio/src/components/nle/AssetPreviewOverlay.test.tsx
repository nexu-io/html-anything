// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../../player/store/playerStore";
import { useAssetPreviewStore } from "../../utils/assetPreviewStore";
import { AssetPreviewOverlay } from "./AssetPreviewOverlay";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;

afterEach(() => {
  if (root) {
    act(() => root?.unmount());
    root = null;
  }
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
  // reset() does not cover the out-of-loop seek request; clear it explicitly
  // so a pending-seek test can't leak into the next one.
  usePlayerStore.getState().clearSeekRequest();
  useAssetPreviewStore.getState().clearPreviewAsset();
});

function mountOverlay(): void {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root?.render(<AssetPreviewOverlay />);
  });
}

describe("AssetPreviewOverlay playback dismissal", () => {
  it("dismisses immediately when opened while playback is ALREADY running", () => {
    // The RAF playback loop bypasses the store, so no post-open store change
    // will arrive — the dismiss check must be level-triggered, not edge-triggered.
    usePlayerStore.setState({ isPlaying: true });
    mountOverlay();

    act(() => {
      useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp3", "p1");
    });

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("dismisses immediately when opened while a seek is ALREADY in flight", () => {
    // A pending out-of-loop seek (requestedSeekTime set, not yet consumed) may
    // produce no further store change before currentTime settles — the on-open
    // check must evaluate the full shared dismiss predicate, not just isPlaying.
    usePlayerStore.setState({ isPlaying: false, requestedSeekTime: 3.2 });
    mountOverlay();

    act(() => {
      useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp3", "p1");
    });

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("stays open when the playhead is idle", () => {
    mountOverlay();

    act(() => {
      useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp3", "p1");
    });

    expect(useAssetPreviewStore.getState().previewAsset).toBe("assets/clip.mp3");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("still dismisses when playback starts AFTER the preview opened", () => {
    mountOverlay();

    act(() => {
      useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp3", "p1");
    });
    expect(useAssetPreviewStore.getState().previewAsset).toBe("assets/clip.mp3");

    act(() => {
      usePlayerStore.setState({ isPlaying: true });
    });

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
  });

  it("still dismisses when the playhead is scrubbed after opening", () => {
    usePlayerStore.setState({ currentTime: 2 });
    mountOverlay();

    act(() => {
      useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp3", "p1");
    });

    act(() => {
      usePlayerStore.setState({ currentTime: 4.5 });
    });

    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
  });
});


describe("modal shared media preview", () => {
  it("pauses the composition, replaces sources, and returns without moving its playhead", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    usePlayerStore.setState({ currentTime: 2, isPlaying: true });
    const pause = vi.fn(() => usePlayerStore.getState().setIsPlaying(false));
    act(() => root!.render(<AssetPreviewOverlay modal onOpen={pause} />));
    act(() => useAssetPreviewStore.getState().setCatalogPreview({ title: "Caption", videoUrl: "/caption.mp4" }));
    expect(pause).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="dialog"] video')?.getAttribute("src")).toBe("/caption.mp4");
    expect(document.querySelector('[role="dialog"] video')?.hasAttribute("controls")).toBe(false);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => useAssetPreviewStore.getState().setPreviewAsset("assets/photo.png", "p1"));
    expect(document.querySelector('[role="dialog"] video')).toBeNull();
    expect(document.querySelector('[role="dialog"] img')?.getAttribute("alt")).toBe("photo.png");
    act(() => document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close preview"]')!.click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(usePlayerStore.getState().currentTime).toBe(2);
  });
});

describe("explicit preview insertion", () => {
  function mountModal() {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root!.render(<AssetPreviewOverlay modal />));
  }
  const addButton = () => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
    .find(button => /Add to timeline|Adding/.test(button.textContent ?? ""))!;

  it("waits for the save, prevents duplicate requests, and keeps failures open for retry", async () => {
    mountModal();
    let finish!: (value: boolean) => void;
    const add = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
    act(() => useAssetPreviewStore.getState().setPreviewAsset("assets/clip.mp4", "p1", add));
    expect(add).not.toHaveBeenCalled();
    act(() => { addButton().click(); addButton().click(); });
    expect(add).toHaveBeenCalledOnce();
    expect(addButton().disabled).toBe(true);
    await act(async () => finish(false));
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Failed to add media");
    expect(useAssetPreviewStore.getState().previewAsset).toBe("assets/clip.mp4");
    act(() => addButton().click());
    await act(async () => finish(true));
    expect(useAssetPreviewStore.getState().previewAsset).toBeNull();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("does not close a replacement preview when an older insertion finishes", async () => {
    mountModal();
    let finish!: (value: boolean) => void;
    act(() => useAssetPreviewStore.getState().setCatalogPreview({ title: "Caption", videoUrl: "/caption.mp4", onAdd: () => new Promise<boolean>(resolve => { finish = resolve; }) }));
    act(() => addButton().click());
    act(() => useAssetPreviewStore.getState().setPreviewAsset("assets/photo.png", "p2"));
    await act(async () => finish(true));
    expect(useAssetPreviewStore.getState().previewProjectId).toBe("p2");
    expect(document.querySelector('[role="dialog"] img')?.getAttribute("alt")).toBe("photo.png");
  });
});
