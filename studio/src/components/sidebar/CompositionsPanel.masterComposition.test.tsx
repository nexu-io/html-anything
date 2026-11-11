// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../../player/store/playerStore";
import { StudioHostContext } from "../../motion/StudioHost";
import { usePreviewIframeStore } from "../../player/store/previewIframeStore";
import { CompositionsPanel } from "./CompositionsPanel";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
(
  window as unknown as { happyDOM: { settings: { disableIframePageLoading: boolean } } }
).happyDOM.settings.disableIframePageLoading = true;

const preview = vi.hoisted(() => ({ compositionStack: [{ id: "master" }] }));
vi.mock("../nle/NLEContext", () => ({ useNLEContext: () => preview }));

let root: Root | null = null;

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  preview.compositionStack = [{ id: "master" }];
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
  usePreviewIframeStore.getState().setIframe(null);
});

describe("CompositionsPanel root badge source", () => {
  it("derives the root badge from the filtered compositions list, not the raw file tree", () => {
    // The project's raw file tree can hold a non-composition index.html (a vendored
    // preset); the badge must source from the server's filtered `compositions` list.
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root?.render(
        <CompositionsPanel
          projectId="demo"
          compositions={["hero.html"]}
          onSelect={vi.fn()}
        />,
      );
    });
    const cards = host.querySelectorAll<HTMLElement>('[draggable="true"]');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.textContent).toContain("Root");
  });
});


it("marks only the live preview target when switching between clips and the full video", () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const onSelect = vi.fn();
  const render = () => act(() => root?.render(<CompositionsPanel projectId="demo"
    compositions={["index.html", "compositions/first.html", "compositions/second.html"]}
    onSelect={onSelect} />));
  const selectedLabel = () => {
    const selected = host.querySelectorAll('[aria-current="true"]');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.getAttribute("aria-pressed")).toBe("true");
    return selected[0]?.getAttribute("aria-label");
  };
  preview.compositionStack = [{ id: "master" }, { id: "compositions/first.html" }];
  render();
  expect(selectedLabel()).toBe("Open composition first");
  const second = host.querySelector<HTMLElement>('[aria-label="Open composition second"]');
  act(() => second?.click());
  expect(onSelect).toHaveBeenCalledWith("compositions/second.html");
  // A click alone cannot change the indicator before the live preview changes.
  expect(selectedLabel()).toBe("Open composition first");
  preview.compositionStack = [{ id: "master" }, { id: "compositions/second.html" }];
  render();
  expect(selectedLabel()).toBe("Open composition second");
  preview.compositionStack = [{ id: "master" }];
  render();
  expect(selectedLabel()).toBe("Open composition index");
});

it("hides the empty root and restores its card when authored content arrives", async () => {
  const iframe = document.createElement("iframe");
  Object.defineProperty(iframe, "contentDocument", { value: new DOMParser().parseFromString('<body><div data-composition-id="main"></div></body>', "text/html") });
  usePreviewIframeStore.getState().setIframe(iframe);
  usePlayerStore.setState({ timelineReady: true, timelineProjectId: "demo", elements: [] });
  const host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  await act(async () => root?.render(<StudioHostContext.Provider value={{ mvpEditor: true }}>
    <CompositionsPanel projectId="demo" compositions={["index.html"]} onSelect={vi.fn()} />
  </StudioHostContext.Provider>));
  expect(host.textContent).toContain("No clips yet");
  expect(host.querySelector('[draggable="true"]')).toBeNull();
  await act(async () => { iframe.contentDocument!.querySelector("div")!.textContent = "Static title"; });
  expect(host.textContent).not.toContain("No clips yet");
  expect(host.querySelector('[aria-label="Open composition index"]')).not.toBeNull();
});

it("keeps other compositions available when the root is empty", async () => {
  const iframe = document.createElement("iframe");
  Object.defineProperty(iframe, "contentDocument", { value: new DOMParser().parseFromString('<body><div data-composition-id="main"></div></body>', "text/html") });
  usePreviewIframeStore.getState().setIframe(iframe);
  usePlayerStore.setState({ timelineReady: true, timelineProjectId: "demo", elements: [] });
  const host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  await act(async () => root?.render(<StudioHostContext.Provider value={{ mvpEditor: true }}>
    <CompositionsPanel projectId="demo" compositions={["index.html", "scene.html"]} onSelect={vi.fn()} />
  </StudioHostContext.Provider>));
  expect(host.querySelector('[aria-label="Open composition index"]')).toBeNull();
  expect(host.querySelector('[aria-label="Open composition scene"]')).not.toBeNull();
});
