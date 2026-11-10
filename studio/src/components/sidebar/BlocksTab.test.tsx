// @vitest-environment happy-dom

import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanupMounted, mountHost } from "../ui/mountHost.testHelpers";
import { BlocksTab, type BlockPreviewInfo } from "./BlocksTab";

vi.mock("../../contexts/StudioContext", () => ({ useStudioShellContext: () => ({}) }));
vi.mock("../../hooks/useBlockCatalog", () => ({
  useBlockCatalog: () => ({
    loading: false,
    search: "",
    filteredBlocks: [{
      name: "carousel",
      title: "Carousel",
      description: "A scene",
      type: "hyperframes:block",
      category: "scenes",
      preview: { video: "/scene.mp4", poster: "/scene.jpg" },
    }],
  }),
}));

afterEach(() => {
  cleanupMounted();
  vi.useRealTimers();
});

it("falls back from a failed hover video to its poster, then restores the composition", () => {
  vi.useFakeTimers();
  const onPreview = vi.fn<(preview: BlockPreviewInfo | null) => void>();
  const host = mountHost(<BlocksTab onPreviewBlock={onPreview} />);
  act(() => host.querySelector("[draggable]")!.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
  act(() => vi.advanceTimersByTime(300));

  const preview = () => onPreview.mock.lastCall?.[0];
  expect(preview()?.videoUrl).toBe("/scene.mp4");
  act(() => preview()?.onVideoError?.("/scene.mp4"));
  expect(preview()?.videoUrl).toBeUndefined();
  expect(preview()?.posterUrl).toBe("/scene.jpg");
  expect(host.querySelector('img[alt="Carousel"]')).toBeTruthy();

  act(() => host.querySelector('img[alt="Carousel"]')!.dispatchEvent(new Event("error")));
  expect(preview()).toBeNull();
  expect(host.textContent).toContain("Preview unavailable");
});
