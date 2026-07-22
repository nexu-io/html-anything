// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSnapshot } from "@/lib/projects/contracts";
import { useStore, type Task } from "@/lib/store";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));
vi.mock("@/lib/projects/client", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/projects/client")
  >();
  return {
    ...actual,
    getServerProject: vi.fn(),
    patchServerProject: vi.fn(),
    unregisterServerProject: vi.fn(),
  };
});
vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return {
    ...actual,
    usePersistHydrated: () => true,
  };
});
vi.mock("@/lib/history/db", () => ({
  deleteTaskRuns: vi.fn(async () => undefined),
  putRun: vi.fn(async () => null),
}));
vi.mock("./editor-workspace", async () => {
  const { createElement } = await import("react");
  return {
    EditorWorkspace: ({
      projectMode,
    }: {
      projectMode?: {
        projectId: string;
        canUnregister: boolean;
        onUnregister: () => void;
      };
    }) =>
      createElement(
        "button",
        {
          type: "button",
          disabled: !projectMode?.canUnregister,
          "data-project-id": projectMode?.projectId,
          onClick: projectMode?.onUnregister,
        },
        `Unregister ${projectMode?.projectId}`,
      ),
  };
});

import {
  getServerProject,
  patchServerProject,
  unregisterServerProject,
} from "@/lib/projects/client";
import { ProjectWorkspace } from "./project-workspace";

const PROJECT_A = "AbCdEfGhIjKlMnOpQrStUg";
const PROJECT_B = "ZbCdEfGhIjKlMnOpQrStUg";
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
const removeServerProject = useStore.getState().removeServerProject;

let container: HTMLDivElement;
let root: Root | undefined;
let removeServerProjectSpy: ReturnType<
  typeof vi.fn<typeof removeServerProject>
>;

function projectSnapshot(projectId: string, name: string): ProjectSnapshot {
  const slug = name.toLowerCase().replaceAll(" ", "-");
  return {
    project: {
      schemaVersion: 1,
      projectId,
      slug,
      name,
      instruction: `Build ${name}.`,
      templateId: "article-magazine",
      format: "markdown",
      agent: "test-agent",
      sources: [],
      status: "ready",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    },
    content: `# ${name}`,
    html: `<!doctype html><html><body><h1>${name}</h1></body></html>`,
    url: `https://html-anything.example.test/projects/${projectId}`,
    artifactDirectory: `artifacts/html-anything/${slug}`,
  };
}

function localTask(): Task {
  return {
    id: "local-task",
    name: "Local task",
    content: "Local content",
    format: "text",
    templateId: "article-magazine",
    html: "<html><body>Local</body></html>",
    status: "done",
    log: [],
    stats: { outputBytes: 0, deltaCount: 0 },
    createdAt: 1,
    updatedAt: 1,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function renderProject(projectId: string) {
  await act(async () => {
    root!.render(createElement(ProjectWorkspace, { projectId }));
    await Promise.resolve();
  });
}

async function startUnregister(projectId: string) {
  const button = container.querySelector<HTMLButtonElement>(
    `[data-project-id="${projectId}"]`,
  );
  expect(button).not.toBeNull();
  await act(async () => {
    button!.click();
  });
  expect(unregisterServerProject).toHaveBeenCalledTimes(1);
  expect(unregisterServerProject).toHaveBeenCalledWith(projectId);
  expect(container.textContent).toContain("Unregistering…");
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  navigation.replace.mockReset();
  vi.mocked(getServerProject).mockReset();
  vi.mocked(patchServerProject).mockReset();
  vi.mocked(unregisterServerProject).mockReset();
  window.confirm = vi.fn(() => true);

  removeServerProjectSpy = vi.fn(removeServerProject);
  useStore.setState({
    tasks: [localTask()],
    activeTaskId: "local-task",
    locale: "en",
    removeServerProject: removeServerProjectSpy,
  });
  vi.mocked(getServerProject).mockImplementation(async (projectId) =>
    projectId === PROJECT_A
      ? projectSnapshot(PROJECT_A, "Project A")
      : projectSnapshot(PROJECT_B, "Project B"),
  );

  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  useStore.setState({
    tasks: [localTask()],
    activeTaskId: "local-task",
    removeServerProject,
  });
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "confirm");
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("ProjectWorkspace unregister lifecycle", () => {
  it("clears the pending screen when the mounted workspace changes projects", async () => {
    const request = deferred<void>();
    vi.mocked(unregisterServerProject).mockReturnValue(request.promise);

    await renderProject(PROJECT_A);
    await startUnregister(PROJECT_A);
    await renderProject(PROJECT_B);

    expect(
      container.querySelector(`[data-project-id="${PROJECT_B}"]`),
    ).not.toBeNull();
    expect(container.textContent).not.toContain("Unregistering…");
    expect(unregisterServerProject).toHaveBeenCalledTimes(1);
    expect(removeServerProjectSpy).toHaveBeenCalledTimes(1);
    expect(removeServerProjectSpy).toHaveBeenCalledWith(PROJECT_A);
  });

  for (const outcome of ["success", "failure"] as const) {
    it(`ignores stale unregister ${outcome} after the mounted workspace changes projects`, async () => {
      const request = deferred<void>();
      vi.mocked(unregisterServerProject).mockReturnValue(request.promise);

      await renderProject(PROJECT_A);
      await startUnregister(PROJECT_A);
      await renderProject(PROJECT_B);

      await act(async () => {
        if (outcome === "success") request.resolve();
        else request.reject(new Error("stale unregister failed"));
        await request.promise.catch(() => undefined);
      });

      expect(navigation.replace).not.toHaveBeenCalled();
      expect(unregisterServerProject).toHaveBeenCalledTimes(1);
      expect(removeServerProjectSpy).toHaveBeenCalledTimes(1);
      expect(removeServerProjectSpy).toHaveBeenCalledWith(PROJECT_A);
      expect(
        useStore
          .getState()
          .tasks.some((task) => task.serverProjectId === PROJECT_B),
      ).toBe(true);
      expect(
        container.querySelector(`[data-project-id="${PROJECT_B}"]`),
      ).not.toBeNull();
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
  }
});
