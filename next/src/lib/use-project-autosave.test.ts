// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSnapshot } from "./projects/contracts";
import { useStore, type Task } from "./store";

vi.mock("./projects/client", () => ({
  patchServerProject: vi.fn(),
}));
vi.mock("./history/db", () => ({
  deleteTaskRuns: vi.fn(async () => undefined),
  putRun: vi.fn(async () => null),
}));

import { deleteTaskRuns, putRun } from "./history/db";
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
  getCanUnregister: () => boolean | undefined;
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
  let canUnregister: boolean | undefined;
  let retrySave = () => {};

  function Harness() {
    const result = useProjectAutosave({ projectId, taskId, enabled });
    saveState = result.state;
    canUnregister = result.canUnregister;
    retrySave = result.retry;
    return null;
  }

  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () => root.render(createElement(Harness)));
  return {
    root,
    getState: () => saveState,
    getCanUnregister: () => canUnregister,
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
  vi.mocked(deleteTaskRuns).mockClear();
  vi.mocked(putRun).mockClear();
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

  it("keeps the loaded format for server regeneration while local auto-detection still changes format", () => {
    const taskId = useStore.getState().loadServerProject(readySnapshot());

    useStore.getState().setContent('{"kind":"server edit"}');
    useStore.getState().setFormat("json");

    expect(
      useStore.getState().tasks.find((task) => task.id === taskId),
    ).toMatchObject({
      content: '{"kind":"server edit"}',
      format: "markdown",
    });

    useStore.getState().setActiveTask("local-task");
    useStore.getState().setContent('{"kind":"local edit"}');
    useStore.getState().setFormat("json");

    expect(useStore.getState().tasks[0]).toMatchObject({
      content: '{"kind":"local edit"}',
      format: "json",
    });
  });

  it("loads a sample into the active server project without changing its identity", () => {
    const taskId = useStore.getState().loadServerProject(readySnapshot());
    const taskCount = useStore.getState().tasks.length;

    const returnedId = useStore.getState().loadSample({
      id: "sample-dashboard",
      name: "Sample name must not replace the project name",
      content: "sample content",
      format: "json",
      templateId: "dashboard",
      html: "<!doctype html><html><body>sample</body></html>",
    });

    const state = useStore.getState();
    expect(returnedId).toBe(taskId);
    expect(state.activeTaskId).toBe(taskId);
    expect(state.tasks).toHaveLength(taskCount);
    expect(state.tasks.find((task) => task.id === taskId)).toMatchObject({
      id: taskId,
      serverProjectId: PROJECT_ID,
      name: "Demo",
      content: "sample content",
      format: "markdown",
      templateId: "dashboard",
      html: "<!doctype html><html><body>sample</body></html>",
      baseContent: "sample content",
      baseHtml: "<!doctype html><html><body>sample</body></html>",
      sampleId: "sample-dashboard",
      status: "done",
    });
  });

  it("keeps creating a new task when a local active task has content", () => {
    const returnedId = useStore.getState().loadSample({
      id: "sample-dashboard",
      name: "Dashboard sample",
      content: "sample content",
      format: "markdown",
      templateId: "dashboard",
      html: "<!doctype html><html><body>sample</body></html>",
    });

    const state = useStore.getState();
    expect(returnedId).not.toBe("local-task");
    expect(state.activeTaskId).toBe(returnedId);
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0]).toEqual(localTask());
    expect(state.tasks[1]).toMatchObject({
      id: returnedId,
      serverProjectId: undefined,
      name: "Dashboard sample",
      format: "markdown",
      sampleId: "sample-dashboard",
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

  it("keeps a persisted local task when deleting the last local task", () => {
    useStore.getState().loadServerProject(readySnapshot());
    useStore.getState().setActiveTask("local-task");

    useStore.getState().deleteTask("local-task");

    const state = useStore.getState();
    const localTasks = state.tasks.filter((task) => !task.serverProjectId);
    const persisted = JSON.parse(
      localStorage.getItem("html-everything-store")!,
    );
    expect(localTasks).toHaveLength(1);
    expect(state.activeTaskId).toBe(localTasks[0].id);
    expect(persisted.state.tasks).toHaveLength(1);
    expect(persisted.state.tasks[0].serverProjectId).toBeUndefined();
    expect(persisted.state.activeTaskId).toBe(persisted.state.tasks[0].id);
  });

  it("does not archive a server project task in IndexedDB history", () => {
    const taskId = useStore.getState().loadServerProject(readySnapshot());

    useStore.getState().commitBaseFor(taskId);

    expect(putRun).not.toHaveBeenCalled();
    expect(useStore.getState().tasks.find((task) => task.id === taskId)).toMatchObject({
      baseContent: "# Demo",
      baseHtml: "<!doctype html><html><body>ready</body></html>",
    });
  });

  it("best-effort deletes existing server project history when removing its task", () => {
    const taskId = useStore.getState().loadServerProject(readySnapshot());

    useStore.getState().removeServerProject(PROJECT_ID);

    expect(deleteTaskRuns).toHaveBeenCalledOnce();
    expect(deleteTaskRuns).toHaveBeenCalledWith(taskId);
  });

  it("continues to archive and delete local task history", () => {
    useStore.getState().commitBaseFor("local-task");

    expect(putRun).toHaveBeenCalledOnce();
    expect(putRun).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "local-task",
        html: "<html>local</html>",
        content: "local content",
      }),
    );

    useStore.getState().deleteTask("local-task");
    expect(deleteTaskRuns).toHaveBeenCalledOnce();
    expect(deleteTaskRuns).toHaveBeenCalledWith("local-task");
  });
});

describe("useProjectAutosave", () => {
  it("skips the hydrated project baseline", async () => {
    const { harness } = await loadAndRender();

    expect(harness.getCanUnregister()).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(patchServerProject).not.toHaveBeenCalled();
    expect(harness.getState()).toBe("idle");
    expect(harness.getCanUnregister()).toBe(true);
    await act(async () => harness.root.unmount());
  });

  it("becomes unsafe and reports saving in the same render as an edit", async () => {
    const { harness } = await loadAndRender();

    act(() => useStore.getState().setContent("pending edit"));

    expect(harness.getState()).toBe("saving");
    expect(harness.getCanUnregister()).toBe(false);
    expect(patchServerProject).not.toHaveBeenCalled();
    await act(async () => harness.root.unmount());
  });

  it("becomes safe after reverting to the durable baseline without a patch", async () => {
    const { harness } = await loadAndRender();
    const baseline = readySnapshot().content;

    act(() => useStore.getState().setContent("temporary edit"));
    expect(harness.getCanUnregister()).toBe(false);

    act(() => useStore.getState().setContent(baseline));

    expect(harness.getState()).toBe("saved");
    expect(harness.getCanUnregister()).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(patchServerProject).not.toHaveBeenCalled();
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
    expect(harness.getState()).toBe("saving");
    expect(harness.getCanUnregister()).toBe(false);

    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(patchServerProject).toHaveBeenCalledWith(PROJECT_ID, {
      content: "changed",
      html: "<!doctype html><html><body>changed</body></html>",
      templateId: "article-magazine",
    });
    expect(harness.getState()).toBe("saved");
    expect(harness.getCanUnregister()).toBe(true);
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
    expect(harness.getState()).toBe("saving");
    expect(harness.getCanUnregister()).toBe(false);
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
    expect(harness.getCanUnregister()).toBe(true);
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
    expect(harness.getCanUnregister()).toBe(false);

    act(() => useStore.getState().setContent("newer edit"));
    expect(harness.getCanUnregister()).toBe(false);
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    await act(async () => resolveFirst?.(readySnapshot()));

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "newer edit",
    });
    expect(harness.getState()).toBe("saved");
    expect(harness.getCanUnregister()).toBe(true);
    await act(async () => harness.root.unmount());
  });

  it("debounces from the latest edit while an earlier save is running", async () => {
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
    act(() => useStore.getState().setContent("aged queued edit"));
    await act(async () => vi.advanceTimersByTimeAsync(750));
    act(() => useStore.getState().setContent("brand new edit"));
    await act(async () => vi.advanceTimersByTimeAsync(10));

    await act(async () => resolveFirst?.(readySnapshot()));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    await act(async () => vi.advanceTimersByTimeAsync(739));
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "brand new edit",
    });
    await act(async () => harness.root.unmount());
  });

  it("saves a debounced reversion after the edited value is in flight", async () => {
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
    const baseline = readySnapshot().content;

    act(() => useStore.getState().setContent("edit in flight"));
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    act(() => useStore.getState().setContent(baseline));
    await act(async () => vi.advanceTimersByTimeAsync(100));
    await act(async () => resolveFirst?.(readySnapshot()));

    expect(harness.getState()).toBe("saving");
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(649));
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: baseline,
    });
    expect(harness.getState()).toBe("saved");
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(patchServerProject).toHaveBeenCalledTimes(2);
    await act(async () => harness.root.unmount());
  });

  it("saves a new project edit once after the previous project request finishes", async () => {
    const otherProjectId = "ZbCdEfGhIjKlMnOpQrStUg";
    let resolveFirst: ((snapshot: ProjectSnapshot) => void) | undefined;
    vi.mocked(patchServerProject)
      .mockImplementationOnce(
        () =>
          new Promise<ProjectSnapshot>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(readySnapshot());
    const firstTaskId = useStore
      .getState()
      .loadServerProject(readySnapshot());
    const otherSnapshot = {
      ...readySnapshot(),
      project: {
        ...readySnapshot().project,
        projectId: otherProjectId,
        slug: "other",
        name: "Other",
      },
    };
    const otherTaskId = useStore
      .getState()
      .loadServerProject(otherSnapshot);
    let current = { projectId: PROJECT_ID, taskId: firstTaskId };
    function Harness() {
      useProjectAutosave({ ...current, enabled: true });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    await act(async () => root.render(createElement(Harness)));

    act(() => {
      useStore.getState().setActiveTask(firstTaskId);
      useStore.getState().setContent("first project edit");
    });
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    current = { projectId: otherProjectId, taskId: otherTaskId };
    await act(async () => root.render(createElement(Harness)));
    act(() => {
      useStore.getState().setActiveTask(otherTaskId);
      useStore.getState().setContent("other project edit");
    });
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(otherProjectId, {
      content: "other project edit",
    });

    await act(async () => resolveFirst?.(readySnapshot()));

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(patchServerProject).toHaveBeenCalledTimes(2);
    await act(async () => root.unmount());
  });

  it("retains failed edits and retries with the latest browser values", async () => {
    vi.mocked(patchServerProject)
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(readySnapshot());
    const { taskId, harness } = await loadAndRender();

    act(() => useStore.getState().setContent("first unsaved edit"));
    await act(async () => vi.advanceTimersByTimeAsync(750));

    expect(harness.getState()).toBe("failed");
    expect(harness.getCanUnregister()).toBe(false);
    expect(
      useStore.getState().tasks.find((task) => task.id === taskId)?.content,
    ).toBe("first unsaved edit");
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(harness.getState()).toBe("failed");
    expect(harness.getCanUnregister()).toBe(false);

    act(() => {
      useStore.getState().setContent("latest unsaved edit");
      useStore.getState().setSelectedTemplate("article-magazine");
    });
    await act(async () => vi.advanceTimersByTimeAsync(1_000));

    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(harness.getState()).toBe("failed");
    expect(harness.getCanUnregister()).toBe(false);

    act(() => harness.retry());
    await act(async () => {});

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "latest unsaved edit",
      templateId: "article-magazine",
    });
    expect(harness.getState()).toBe("saved");
    expect(harness.getCanUnregister()).toBe(true);
    expect(
      useStore.getState().tasks.find((task) => task.id === taskId)?.content,
    ).toBe("latest unsaved edit");
    await act(async () => harness.root.unmount());
  });

  it("does not run a newer edit timer after the in-flight save fails", async () => {
    let rejectFirst: ((error: Error) => void) | undefined;
    vi.mocked(patchServerProject)
      .mockImplementationOnce(
        () =>
          new Promise<ProjectSnapshot>((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce(readySnapshot());
    const { harness } = await loadAndRender();

    act(() => useStore.getState().setContent("edit B"));
    await act(async () => vi.advanceTimersByTimeAsync(750));
    expect(patchServerProject).toHaveBeenCalledTimes(1);

    act(() => useStore.getState().setContent("edit C"));
    await act(async () => rejectFirst?.(new Error("save failed")));
    expect(harness.getState()).toBe("failed");
    expect(harness.getCanUnregister()).toBe(false);

    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(patchServerProject).toHaveBeenCalledTimes(1);
    expect(harness.getState()).toBe("failed");
    expect(harness.getCanUnregister()).toBe(false);

    act(() => harness.retry());
    await act(async () => {});

    expect(patchServerProject).toHaveBeenCalledTimes(2);
    expect(patchServerProject).toHaveBeenLastCalledWith(PROJECT_ID, {
      content: "edit C",
    });
    expect(harness.getState()).toBe("saved");
    expect(harness.getCanUnregister()).toBe(true);
    await act(async () => harness.root.unmount());
  });
});
