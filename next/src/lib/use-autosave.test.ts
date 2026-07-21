// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "./store";
import { useStore } from "./store";

vi.mock("./drafts", () => ({
  snapshotDraft: vi.fn(),
}));

import { snapshotDraft } from "./drafts";
import { useAutosave } from "./use-autosave";

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function localTask(): Task {
  return {
    id: "local-task",
    name: "Local",
    content: "initial content",
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

async function renderAutosave(enabled?: boolean): Promise<{
  root: Root;
  rerender: (nextEnabled?: boolean) => Promise<void>;
}> {
  function Harness({ active }: { active?: boolean }) {
    useAutosave(active);
    return null;
  }

  const root = createRoot(document.createElement("div"));
  await act(async () => root.render(createElement(Harness, { active: enabled })));
  return {
    root,
    rerender: async (nextEnabled) => {
      await act(async () =>
        root.render(createElement(Harness, { active: nextEnabled })),
      );
    },
  };
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.mocked(snapshotDraft).mockReset();
  localStorage.clear();
  useStore.setState({ tasks: [localTask()], activeTaskId: "local-task" });
});

afterEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("useAutosave", () => {
  it("keeps local draft autosave enabled by default", async () => {
    const harness = await renderAutosave();

    act(() => useStore.getState().setContent("changed locally"));
    await act(async () => vi.advanceTimersByTimeAsync(600));

    expect(snapshotDraft).toHaveBeenCalledWith(
      "changed locally",
      "text",
      undefined,
    );
    await act(async () => harness.root.unmount());
  });

  it("cancels a pending local draft snapshot when disabled", async () => {
    const harness = await renderAutosave(true);

    act(() => useStore.getState().setContent("server project edit"));
    await harness.rerender(false);
    await act(async () => vi.advanceTimersByTimeAsync(600));

    expect(snapshotDraft).not.toHaveBeenCalled();
    await act(async () => harness.root.unmount());
  });
});
