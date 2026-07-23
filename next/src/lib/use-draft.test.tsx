// @vitest-environment happy-dom

import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDraft } from "./use-draft";
import { useStore, type Task } from "./store";

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

let container: HTMLDivElement;
let root: Root;

function task(id: string, content: string): Task {
  return {
    id,
    name: id,
    content,
    format: "text",
    templateId: "article-magazine",
    html: "",
    status: "idle",
    log: [],
    stats: { outputBytes: 0, deltaCount: 0 },
    createdAt: 1,
    updatedAt: 1,
  };
}

function DraftHarness({ start = false }: { start?: boolean }) {
  const draft = useDraft();
  useEffect(() => {
    if (start) void draft.run({ instruction: "Continue" });
  }, [draft.run, start]);
  return createElement("button", {
    "data-status": draft.status,
    onClick: () => void draft.run({ instruction: "Continue" }),
  });
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  useStore.setState({
    tasks: [task("draft-task", "Draft"), task("other-task", "Other")],
    activeTaskId: "draft-task",
    selectedAgent: "codex",
  });
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("useDraft lifecycle", () => {
  it("aborts an active request when its editor unmounts", async () => {
    let aborted = false;
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true;
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true },
          );
        });
      }),
    );

    await act(async () => {
      root.render(createElement(DraftHarness, { start: true }));
      await Promise.resolve();
    });
    await act(async () => root.unmount());

    expect(aborted).toBe(true);
  });

  it("streams into the captured task after the active task changes", async () => {
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            streamController = controller;
          },
        });
        return new Response(stream, { status: 200 });
      }),
    );

    await act(async () => {
      root.render(createElement(DraftHarness));
    });
    const button = container.querySelector("button")!;
    await act(async () => {
      button.click();
      await Promise.resolve();
      useStore.getState().setActiveTask("other-task");
      streamController.enqueue(
        new TextEncoder().encode(
          'event: delta\ndata: {"text":" streamed"}\n\n',
        ),
      );
      streamController.close();
      await Promise.resolve();
      await Promise.resolve();
    });

    const tasks = useStore.getState().tasks;
    expect(tasks.find((candidate) => candidate.id === "draft-task")?.content)
      .toBe("Draft\n\n streamed");
    expect(tasks.find((candidate) => candidate.id === "other-task")?.content)
      .toBe("Other");
  });
});
