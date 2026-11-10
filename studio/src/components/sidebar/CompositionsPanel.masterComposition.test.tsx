// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../../player/store/playerStore";
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
  usePlayerStore.setState({ thumbnailRevisions: {} });
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
