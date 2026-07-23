// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useStore, type Task } from "@/lib/store";
import { ExportMenu } from "./export-menu";

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

let container: HTMLDivElement;
let root: Root;

function deckTask(): Task {
  return {
    id: "deck-task",
    name: "Deck",
    content: "Deck content",
    format: "text",
    templateId: "deck-pitch",
    html:
      "<!doctype html><html><head><title>Deck</title></head><body>" +
      '<section class="slide" data-slide-id="1">Slide</section>' +
      "</body></html>",
    status: "done",
    log: [],
    stats: { outputBytes: 0, deltaCount: 0 },
    createdAt: 1,
    updatedAt: 1,
  };
}

async function renderMenu(projectMode: boolean) {
  await act(async () => {
    root.render(
      createElement(ExportMenu, {
        iframeRef: { current: null },
        projectMode,
      }),
    );
  });
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.includes("Export / Copy"),
  );
  expect(button).toBeDefined();
  await act(async () => button!.click());
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  useStore.setState({
    tasks: [deckTask()],
    activeTaskId: "deck-task",
    locale: "en",
  });
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("ExportMenu project isolation", () => {
  it("hides rendered image and deck exports in project mode", async () => {
    await renderMenu(true);

    expect(container.textContent).not.toContain("Twitter / Weibo (PNG)");
    expect(container.textContent).not.toContain(".png hi-res image");
    expect(container.textContent).not.toContain("PDF · all slides (print)");
    expect(container.textContent).not.toContain("PNG · per-slide (.zip)");
    expect(container.textContent).not.toContain(".pptx · PowerPoint");
    expect(container.textContent).toContain("HTML source");
    expect(container.textContent).toContain("Plain text");
    expect(container.textContent).not.toContain(".html single file");
  });

  it("keeps rendered image and deck exports in local mode", async () => {
    await renderMenu(false);

    expect(container.textContent).toContain("Twitter / Weibo (PNG)");
    expect(container.textContent).toContain(".png hi-res image");
    expect(container.textContent).toContain("PDF · all slides (print)");
    expect(container.textContent).toContain("PNG · per-slide (.zip)");
    expect(container.textContent).toContain(".pptx · PowerPoint");
    expect(container.textContent).toContain(".html single file");
  });
});
