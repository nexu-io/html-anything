// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSnapshot } from "./projects/contracts";
import { useStore, type Task } from "./store";

vi.mock("./projects/client", () => ({
  patchServerProject: vi.fn(),
}));

import { patchServerProject } from "./projects/client";
import {
  useProjectAutosave,
  type SaveState,
} from "./use-project-autosave";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function readySnapshot(
  overrides: Partial<ProjectSnapshot> = {},
): ProjectSnapshot {
  return {
    project: {
      schemaVersion: 1,
      projectId: PROJECT_ID,
      slug: "demo",
      name: "Demo",
      instruction: "Build a demo.",
      templateId: "landing-page",
      format: "markdown",
      agent: "codex",
      sources: [],
      status: "ready",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    },
    content: "# Demo",
    html: "<!doctype html><html><body>ready</body></html>",
    url: `https://host.ts.net/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/demo",
    ...overrides,
  };
}

function localTask(id = "local-task"): Task {
  return {
    id,
    name: "Local",
    content: "local content",
    format: "text",
    templateId: "article-magazine",
    html: "<html>local</html>",
    status: "done",
    log: [],
    stats: { outputBytes: 0, deltaCount: 0 },
    createdAt: 1,
    updatedAt: 1,
  };
}

type HarnessResult = {
  root: Root;
  getState: () => SaveState | undefined;
  retry: () => void;
};

async function renderAutosave({
  projectId = PROJECT_ID,
  taskId,
  enabled = true,
}: {
  projectId?: string;
  taskId: string;
  enabled?: boolean;
}): Promise<HarnessResult> {
  let saveState: SaveState | undefined;
  let retrySave = () => {};

  function Harness() {
    const result = useProjectAutosave({ projectId, taskId, enabled });
    saveState = result.state;
    retrySave = result.retry;
    return null;
  }

  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => root.render(createElement(Harness)));
  return {
    root,
    getState: () => saveState,
    retry: () => retrySave(),
  };
}

async function loadAndRender(): Promise<{
  taskId: string;
  harness: HarnessResult;
}> {
  const taskId = useStore.getState().loadServerProject(readySnapshot());
  return { taskId, harness: await renderAutosave({ taskId }) };
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.mocked(patchServerProject).mockReset();
  localStorage.clear();
  useStore.setState({ tasks: [localTask()], activeTaskId: "local-task" });
});

afterEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("transient server project tasks", () => {
  it("never persists a server project task", () => {
    const id = useStore.getState().loadServerProject(readySnapshot());
    const persisted = JSON.parse(
      localStorage.getItem("html-everything-store")!,
    );

    expect(
      useStore.getState().tasks.find((task) => task.id === id)?.serverProjectId,
    ).toBe(PROJECT_ID);
    expect(
      persisted.state.tasks.every(
        (task: { serverProjectId?: string }) => !task.serverProjectId,
      ),
    ).toBe(true);
    expect(persisted.state.tasks.map((task: Task) => task.id)).toEqual([
      "local-task",
    ]);
    expect(persisted.state.activeTaskId).toBe("local-task");
  });

  it("replaces only the transient task for the same project", () => {
    const firstId = useStore.getState().loadServerProject(readySnapshot());
    const changed = readySnapshot({
      content: "changed on server",
      html: "<!doctype html><html><body>changed</body></html>",
    });
    const secondId = useStore.getState().loadServerProject(changed);

    expect(secondId).toBe(firstId);
    expect(useStore.getState().tasks).toHaveLength(2);
    expect(useStore.getState().tasks[0]).toEqual(localTask());
    expect(useStore.getState().tasks[1]).toMatchObject({
      id: firstId,
      serverProjectId: PROJECT_ID,
      status: "done",
      content: changed.content,
      html: changed.html,
      baseContent: changed.content,
      baseHtml: changed.html,
    });
  });

  it("removes only the requested server task and keeps a local task selected", () => {
    const firstId = useStore.getState().loadServerProject(readySnapshot());
    const otherId = "ZbCdEfGhIjKlMnOpQrStUg";
    useStore.getState().loadServerProject({
      ...readySnapshot(),
      project: { ...readySnapshot().project, projectId: otherId },
    });

    useStore.getState().removeServerProject(PROJECT_ID);

    expect(useStore.getState().tasks.map((task) => task.id)).toEqual([
      "local-task",
      expect.not.stringMatching(firstId),
    ]);
    expect(useStore.getState().tasks[1].serverProjectId).toBe(otherId);
    expect(useStore.getState().activeTaskId).toBe("local-task");
  });

  it("creates a fresh local task when removing the only task", () => {
    const serverTask = {
      ...localTask("server-task"),
      serverProjectId: PROJECT_ID,
    };
    useStore.setState({ tasks: [serverTask], activeTaskId: serverTask.id });

    useStore.getState().removeServerProject(PROJECT_ID);

    expect(useStore.getState().tasks).toHaveLength(1);
    expect(useStore.getState().tasks[0].serverProjectId).toBeUndefined();
    expect(useStore.getState().activeTaskId).toBe(
      useStore.getState().tasks[0].id,
    );
  });
});

describe("useProjectAutosave", () => {
  it("skips the hydrated project baseline", async () => {
    const { harness } = await loadAndRender();

    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(patchServerProject).not.toHaveBeenCalled();
    expect(harness.getState()).toBe("idle");
    await act(async () => harness.root.unmount());
  });

  it("debounces one coalesced patch and exposes saved", async () => {
    vi.mocked(patchServerProject).mockResolvedValue(readySnapshot());
    const { taskId, harness } = await loadAndRender();

    act(() => {
      useStore.getState().setContent("changed");
      useStore.getState().setHtmlFor(
        taskId,
        "<!doctype html><html><body>changed</body></html>",
      );
      useStore.getState().setSelectedTemplate("article-magazine");
    });
    await act(async () => vi.advanceTimersByTimeAsync(749));
    expect(patchServerProject).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(patchServerProject).toHaveBeenCalledWith(PROJECT_ID, {
      content: "changed",
      html: "<!doctype html><html><body>changed</body></html>",
      templateId: "article-magazine",
    });
    expect(harness.getState()).toBe("saved");
    await act(async () => harness.root.unmount());
  });

  it("does not patch while conversion is running", async () => {
    vi.mocked(patchServerProject).mockResolvedValue(readySnapshot());
    const { taskId, harness } = await loadAndRender();

    act(() => {
      useStore.getState().setStatusFor(taskId, "running");
      useStore.getState().setContent("generated content");
      useStore.getState().setHtmlFor(
        taskId,
        "<!doctype html><html><body>streaming</body></html>",
      );
    });
    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(patchServerProject).not.toHaveBeenCalled();

    act(() => useStore.getState().setStatusFor(taskId, "done"));
    await act(async () => vi.advanceTimersByTimeAsync(749));
    expect(patchServerProject).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(patchServerProject).toHaveBeenCalledWith(PROJECT_ID, {
      content: "generated content",
      html: "<!doctype html><html><body>streaming</body></html>",
    });
    await act(async () => harness.root.unmount());
  });

  it("saves the latest edit after a slower save finishes", async () => {
    let resolveFirst: ((snapshot: ProjectSnapshot) => void) | undefined;
    vi.mocked(patchServerProject)
      .mockImplementationOnce(
        () =>
          new Promise<ProjectSnapshot>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(readySnapshot());
    const { harness } = await loadAndRender();

    act(() => useStore.getState().setContent("first edit"));
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(harness.getState()).toBe("saving");

    act(() => useStore.getState().setContent("newer edit"));
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    await act(async () => resolveFirst?.(readySnapshot()));

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "newer edit",
    });
    expect(harness.getState()).toBe("saved");
    await act(async () => harness.root.unmount());
  });

  it("retains failed edits and retries with the latest browser values", async () => {
    vi.mocked(patchServerProject)
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(readySnapshot());
    const { taskId, harness } = await loadAndRender();

    act(() => useStore.getState().setContent("first unsaved edit"));
    await act(async () => vi.advanceTimersByTimeAsync(750));

    expect(harness.getState()).toBe("failed");
    expect(
      useStore.getState().tasks.find((task) => task.id === taskId)?.content,
    ).toBe("first unsaved edit");

    act(() => {
      useStore.getState().setContent("latest unsaved edit");
      useStore.getState().setSelectedTemplate("article-magazine");
    });
    await act(async () => {});
    act(() => harness.retry());
    await act(async () => {});

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "latest unsaved edit",
      templateId: "article-magazine",
    });
    expect(harness.getState()).toBe("saved");
    expect(
      useStore.getState().tasks.find((task) => task.id === taskId)?.content,
    ).toBe("latest unsaved edit");
    await act(async () => harness.root.unmount());
  });
});
