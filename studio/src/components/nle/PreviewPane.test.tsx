// @vitest-environment happy-dom

import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PreviewPane } from "./PreviewPane";
import { StudioHostContext } from "../../motion/StudioHost";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../editor/PreviewGuides", () => ({ PreviewGuides: () => <i data-testid="guides" /> }));
vi.mock("../../player", () => ({ PlayerControls: () => null }));
vi.mock("./NLEPreview", () => ({ NLEPreview: () => null }));
vi.mock("./CompositionBreadcrumb", () => ({ CompositionBreadcrumb: () => <nav data-testid="breadcrumb" /> }));
vi.mock("./AssetPreviewOverlay", () => ({ AssetPreviewOverlay: () => null }));
vi.mock("./usePreviewBlockDrop", () => ({
  usePreviewBlockDrop: () => ({
    isDragOver: false,
    handleDragEnter: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
  }),
}));
vi.mock("./NLEContext", () => ({
  useNLEContext: () => ({
    projectId: "p",
    iframeRef: { current: null },
    togglePlay: vi.fn(),
    seek: vi.fn(),
    onIframeLoad: vi.fn(),
    compositionStack: [{ id: "master", previewUrl: undefined }, { id: "first.html", previewUrl: "/first.html" }],
    handleNavigateComposition: vi.fn(),
    setCompositionLoading: vi.fn(),
    timelineDisabled: false,
    hasLoadedOnceRef: { current: false },
    previewCompositionSize: null,
    setPreviewCompositionSize: vi.fn(),
  }),
}));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("PreviewPane", () => {
  it("draws the guides in the pane itself, not through the previewOverlay slot", () => {
    const host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host).render(<PreviewPane />));
    expect(host.querySelector('[data-testid="guides"]')).not.toBeNull();
  });
});

it("omits duplicate preview navigation only in the MVP", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<PreviewPane />));
  expect(host.querySelector('[data-testid="breadcrumb"]')).not.toBeNull();
  act(() => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><PreviewPane /></StudioHostContext.Provider>));
  expect(host.querySelector('[data-testid="breadcrumb"]')).toBeNull();
  expect(host.querySelector('[data-testid="guides"]')).not.toBeNull();
  act(() => root.unmount());
});
