// @vitest-environment happy-dom

import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanupMounted, mountHost } from "../ui/mountHost.testHelpers";
import { BlocksTab, type BlockPreviewInfo } from "./BlocksTab";

const catalog = vi.hoisted(() => ({ preview: undefined as { video?: string; poster?: string } | undefined }));
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
      preview: catalog.preview,
    }],
  }),
}));

beforeEach(() => {
  catalog.preview = { video: "/scene.mp4", poster: "/scene.jpg" };
});

afterEach(() => {
  cleanupMounted();
  vi.useRealTimers();
});

it("falls back from a failed hover video to its poster, then restores the composition", () => {
  vi.useFakeTimers();
  const onPreview = vi.fn<(preview: BlockPreviewInfo | null) => void>();
  const host = mountHost(<BlocksTab onPreviewBlock={onPreview} />);
  expect(host.querySelector('[data-testid="catalog-cover-placeholder"]')).toBeNull();
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
  expect(host.querySelector('[data-testid="catalog-cover-placeholder"] .motion-composition-placeholder-mark')).toBeTruthy();
  expect(host.textContent).not.toContain("Preview unavailable");
});

it.each([undefined, {}])("uses the existing OD placeholder when preview metadata is absent (%s)", (preview) => {
  catalog.preview = preview;
  const host = mountHost(<BlocksTab />);
  const placeholder = host.querySelector('[data-testid="catalog-cover-placeholder"]');
  expect(placeholder?.classList.contains("motion-composition-placeholder")).toBe(true);
  expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
  expect(placeholder?.querySelector(".motion-composition-placeholder-mark")).toBeTruthy();
  expect(host.querySelector("img, video")).toBeNull();
  expect(host.querySelector('[draggable="true"]')?.textContent).toContain("Carousel");
  expect(host.textContent).not.toContain("Preview unavailable");
});

it.each(["poster", "video"] as const)("uses the OD placeholder when the only %s fails", (kind) => {
  catalog.preview = { [kind]: kind === "poster" ? "/scene.jpg" : "/scene.mp4" };
  const host = mountHost(<BlocksTab />);
  expect(host.querySelector('[data-testid="catalog-cover-placeholder"]')).toBeNull();
  act(() => host.querySelector(kind === "poster" ? "img" : "video")!.dispatchEvent(new Event("error")));
  expect(host.querySelector('[data-testid="catalog-cover-placeholder"] .motion-composition-placeholder-mark')).toBeTruthy();
  expect(host.querySelector("img, video")).toBeNull();
  expect(host.textContent).not.toContain("Preview unavailable");
});
