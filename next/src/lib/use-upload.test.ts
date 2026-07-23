// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseFile } from "@/lib/parsers/file";
import { uploadProjectAsset } from "@/lib/projects/client";
import { useStore, type Task } from "@/lib/store";
import { useUploadFile } from "@/lib/use-upload";
import type { ProjectAsset } from "@/lib/projects/contracts";

vi.mock("@/lib/parsers/file", () => ({ parseFile: vi.fn() }));
vi.mock("@/lib/projects/client", () => ({ uploadProjectAsset: vi.fn() }));

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const roots: Root[] = [];
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function deferred<T>(): {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    name: "Task",
    content: "",
    format: "text",
    templateId: "landing-page",
    html: "",
    status: "idle",
    log: [],
    stats: { outputBytes: 0, deltaCount: 0 },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function asset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
  return {
    path: "assets/hero.png",
    filename: "hero.png",
    originalName: "Hero.PNG",
    bytes: 3,
    mediaType: "image/png",
    ...overrides,
  };
}

async function renderUpload(
  projectId?: string,
  onProjectUploadRunningChange?: (
    projectId: string,
    running: boolean,
  ) => void,
): Promise<{
  current: () => ReturnType<typeof useUploadFile>;
  root: Root;
  rerender: (nextProjectId?: string) => Promise<void>;
}> {
  let result: ReturnType<typeof useUploadFile> | undefined;

  function Harness({ activeProjectId }: { activeProjectId?: string }) {
    result = useUploadFile(
      activeProjectId === undefined
        ? undefined
        : {
            projectId: activeProjectId,
            onProjectUploadRunningChange,
          },
    );
    return null;
  }

  const root = createRoot(document.createElement("div"));
  roots.push(root);
  await act(async () =>
    root.render(createElement(Harness, { activeProjectId: projectId })),
  );
  return {
    current: () => {
      if (result === undefined) throw new Error("Upload hook did not render.");
      return result;
    },
    root,
    rerender: async (nextProjectId?: string) => {
      await act(async () =>
        root.render(
          createElement(Harness, { activeProjectId: nextProjectId }),
        ),
      );
    },
  };
}

function activeTask(): Task {
  const state = useStore.getState();
  const active = state.tasks.find((candidate) => candidate.id === state.activeTaskId);
  if (active === undefined) throw new Error("Active test task is missing.");
  return active;
}

function attachActiveTaskToProject(projectId: string): void {
  useStore.setState((state) => ({
    tasks: state.tasks.map((candidate) =>
      candidate.id === state.activeTaskId
        ? { ...candidate, serverProjectId: projectId }
        : candidate,
    ),
  }));
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(parseFile).mockReset();
  vi.mocked(uploadProjectAsset).mockReset();
  localStorage.clear();
  useStore.setState({
    tasks: [task()],
    activeTaskId: "task-1",
    locale: "en",
  });
});

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await act(async () => root.unmount());
  }
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
});

describe("useUploadFile", () => {
  it("keeps local image data URLs in the browser asset map", async () => {
    vi.mocked(parseFile).mockResolvedValue({
      filename: "Hero.PNG",
      format: "image",
      text: "inline fallback",
      dataUrl: "data:image/png;base64,AQID",
    });
    const file = new File([Uint8Array.of(1, 2, 3)], "Hero.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload();

    await act(async () => hook.current().ingest([file]));

    expect(uploadProjectAsset).not.toHaveBeenCalled();
    expect(parseFile).toHaveBeenCalledWith(file);
    expect(activeTask().content).toMatch(/^!\[Hero\.PNG\]\(asset:a_[^)]+\)$/u);
    expect(Object.values(activeTask().assets ?? {})).toEqual([
      "data:image/png;base64,AQID",
    ]);
    expect(activeTask().format).toBe("image");
  });

  it("uploads a project image once and appends an escaped portable reference", async () => {
    attachActiveTaskToProject(PROJECT_ID);
    const originalName = String.raw`Hero \[final].PNG`;
    const file = new File([Uint8Array.of(1, 2, 3)], originalName, {
      type: "image/png",
    });
    const uploaded = asset({
      originalName,
      path: "assets/hero-final.png",
      filename: "hero-final.png",
    });
    vi.mocked(uploadProjectAsset).mockResolvedValue(uploaded);
    const hook = await renderUpload(PROJECT_ID);

    await act(async () => hook.current().ingest([file]));

    expect(uploadProjectAsset).toHaveBeenCalledTimes(1);
    expect(uploadProjectAsset).toHaveBeenCalledWith(PROJECT_ID, file);
    expect(parseFile).not.toHaveBeenCalled();
    expect(activeTask().content).toBe(
      String.raw`![Hero \\\[final\].PNG](assets/hero-final.png)`,
    );
    expect(activeTask().assets).toBeUndefined();
    expect(activeTask().format).toBe("text");
  });

  it("uploads duplicate project images sequentially and appends each server path", async () => {
    attachActiveTaskToProject(PROJECT_ID);
    const first = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    const second = new File([Uint8Array.of(2)], "Hero.PNG", {
      type: "image/png",
    });
    let inFlight = 0;
    let maximumInFlight = 0;
    vi.mocked(uploadProjectAsset).mockImplementation(async (_id, file) => {
      inFlight += 1;
      maximumInFlight = Math.max(maximumInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      const ordinal = vi.mocked(uploadProjectAsset).mock.calls.length;
      return asset({
        originalName: file.name,
        filename: ordinal === 1 ? "hero.png" : "hero-2.png",
        path: ordinal === 1 ? "assets/hero.png" : "assets/hero-2.png",
        bytes: file.size,
      });
    });
    const hook = await renderUpload(PROJECT_ID);

    await act(async () => hook.current().ingest([first, second]));

    expect(uploadProjectAsset).toHaveBeenCalledTimes(2);
    expect(maximumInFlight).toBe(1);
    expect(activeTask().content).toBe(
      "![Hero.PNG](assets/hero.png)\n\n![Hero.PNG](assets/hero-2.png)",
    );
  });

  it("keeps project state unchanged and surfaces a bounded upload failure", async () => {
    const baseline = task({
      content: "Existing content",
      format: "markdown",
      html: "<!doctype html><html><body>saved</body></html>",
      assets: { existing: "data:image/png;base64,AA==" },
      serverProjectId: PROJECT_ID,
    });
    useStore.setState({ tasks: [baseline], activeTaskId: baseline.id });
    vi.mocked(uploadProjectAsset).mockRejectedValue(
      new Error("/private/workspace token=server-secret"),
    );
    const file = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload(PROJECT_ID);

    await act(async () => hook.current().ingest([file]));

    const current = activeTask();
    expect(current.content).toBe(baseline.content);
    expect(current.format).toBe(baseline.format);
    expect(current.html).toBe(baseline.html);
    expect(current.assets).toEqual(baseline.assets);
    expect(hook.current().uploading).toBe(false);
    expect(hook.current().error).toBe("Image upload failed. Try again.");
    expect(hook.current().error).not.toContain("private/workspace");
    expect(hook.current().error).not.toContain("server-secret");
  });

  it("parses project text files while sending only image candidates to the server", async () => {
    attachActiveTaskToProject(PROJECT_ID);
    const textFile = new File(["notes"], "notes.txt", { type: "text/plain" });
    const imageFile = new File([Uint8Array.of(1, 2)], "Hero.PNG", {
      type: "image/png",
    });
    vi.mocked(parseFile).mockResolvedValue({
      filename: "notes.txt",
      format: "txt",
      text: "Parsed notes",
    });
    vi.mocked(uploadProjectAsset).mockResolvedValue(
      asset({ originalName: "Hero.PNG", bytes: imageFile.size }),
    );
    const hook = await renderUpload(PROJECT_ID);

    await act(async () => hook.current().ingest([textFile, imageFile]));

    expect(parseFile).toHaveBeenCalledTimes(1);
    expect(parseFile).toHaveBeenCalledWith(textFile);
    expect(uploadProjectAsset).toHaveBeenCalledTimes(1);
    expect(uploadProjectAsset).toHaveBeenCalledWith(PROJECT_ID, imageFile);
    expect(activeTask().content).toBe(
      "Parsed notes\n\n![Hero.PNG](assets/hero.png)",
    );
    expect(activeTask().format).toBe("text");
  });

  it.each([
    ["SVG", "vector.svg", "image/svg+xml"],
    ["BMP", "bitmap.bmp", "image/bmp"],
  ])("sends dragged %s image candidates to the authoritative server path", async (_label, name, type) => {
    attachActiveTaskToProject(PROJECT_ID);
    const file = new File(["unsupported"], name, { type });
    vi.mocked(uploadProjectAsset).mockRejectedValue(
      new Error("Unsupported project image"),
    );
    const hook = await renderUpload(PROJECT_ID);

    await act(async () => hook.current().ingest([file]));

    expect(uploadProjectAsset).toHaveBeenCalledWith(PROJECT_ID, file);
    expect(parseFile).not.toHaveBeenCalled();
    expect(activeTask().content).toBe("");
    expect(hook.current().error).toBe("Image upload failed. Try again.");
  });

  it("exposes uploading state until the project image request settles", async () => {
    attachActiveTaskToProject(PROJECT_ID);
    const file = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    let resolveUpload: ((value: ProjectAsset) => void) | undefined;
    vi.mocked(uploadProjectAsset).mockImplementation(
      () => new Promise((resolve) => {
        resolveUpload = resolve;
      }),
    );
    const hook = await renderUpload(PROJECT_ID);
    let ingestPromise: Promise<void> | undefined;

    act(() => {
      ingestPromise = hook.current().ingest([file]);
    });
    await act(async () => Promise.resolve());

    expect(hook.current().uploading).toBe(true);
    expect(hook.current().error).toBeNull();

    await act(async () => {
      resolveUpload?.(asset({ originalName: file.name, bytes: file.size }));
      await ingestPromise;
    });

    expect(hook.current().uploading).toBe(false);
  });

  it("keeps project upload activity guarded after the editor unmounts", async () => {
    attachActiveTaskToProject(PROJECT_ID);
    const upload = deferred<ProjectAsset>();
    vi.mocked(uploadProjectAsset).mockReturnValue(upload.promise);
    const activity: Array<[string, boolean]> = [];
    const hook = await renderUpload(PROJECT_ID, (projectId, running) => {
      activity.push([projectId, running]);
    });
    const file = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    let ingestion!: Promise<void>;

    act(() => {
      ingestion = hook.current().ingest([file]);
    });
    await act(async () => Promise.resolve());
    expect(activity).toEqual([[PROJECT_ID, true]]);

    await act(async () => hook.root.render(null));
    expect(activity).toEqual([[PROJECT_ID, true]]);

    upload.resolve(asset({ originalName: file.name, bytes: file.size }));
    await act(async () => ingestion);
    expect(activity).toEqual([
      [PROJECT_ID, true],
      [PROJECT_ID, false],
    ]);
  });

  it("discards a completed project upload after navigation without changing another project's autosave inputs", async () => {
    const firstProject = task({
      id: "project-a-task",
      serverProjectId: PROJECT_ID,
      content: "Project A",
      html: "<html>A</html>",
      templateId: "project-a-template",
    });
    const secondProjectId = "BcDeFgHiJkLmNoPqRsTuVw";
    const secondProject = task({
      id: "project-b-task",
      serverProjectId: secondProjectId,
      content: "Project B",
      html: "<html>B</html>",
      templateId: "project-b-template",
      log: [{ kind: "info", text: "existing", ts: 2 }],
    });
    useStore.setState({
      tasks: [firstProject, secondProject],
      activeTaskId: firstProject.id,
    });
    const upload = deferred<ProjectAsset>();
    vi.mocked(uploadProjectAsset).mockReturnValue(upload.promise);
    const file = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload(PROJECT_ID);
    let ingestion!: Promise<void>;

    act(() => {
      ingestion = hook.current().ingest([file]);
    });
    await act(async () => Promise.resolve());
    act(() => {
      useStore.setState({
        tasks: [firstProject, secondProject],
        activeTaskId: secondProject.id,
      });
    });
    upload.resolve(asset({ originalName: file.name }));
    await act(async () => ingestion);

    const state = useStore.getState();
    expect(state.tasks).toEqual([firstProject, secondProject]);
    expect(state.activeTaskId).toBe(secondProject.id);
    expect(hook.current().error).toBeNull();
  });

  it("discards parsed local image state after its originating task is removed", async () => {
    const removed = task({ id: "removed-task", content: "Removed" });
    const survivor = task({
      id: "survivor-task",
      content: "Survivor",
      html: "<html>survivor</html>",
      templateId: "survivor-template",
      assets: { existing: "data:image/png;base64,AA==" },
      log: [{ kind: "info", text: "existing", ts: 2 }],
    });
    useStore.setState({ tasks: [removed, survivor], activeTaskId: removed.id });
    const parsed = deferred<Awaited<ReturnType<typeof parseFile>>>();
    vi.mocked(parseFile).mockReturnValue(parsed.promise);
    const file = new File([Uint8Array.of(1)], "Local.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload();
    let ingestion!: Promise<void>;

    act(() => {
      ingestion = hook.current().ingest([file]);
    });
    await act(async () => Promise.resolve());
    act(() => {
      useStore.setState({ tasks: [survivor], activeTaskId: survivor.id });
    });
    parsed.resolve({
      filename: file.name,
      format: "image",
      text: "fallback",
      dataUrl: "data:image/png;base64,AQ==",
    });
    await act(async () => ingestion);

    expect(useStore.getState().tasks).toEqual([survivor]);
    expect(hook.current().error).toBeNull();
  });

  it("does not publish an old request's error after the hook project is replaced", async () => {
    const oldProject = task({
      id: "old-project-task",
      serverProjectId: PROJECT_ID,
    });
    const newProjectId = "BcDeFgHiJkLmNoPqRsTuVw";
    const newProject = task({
      id: "new-project-task",
      serverProjectId: newProjectId,
    });
    useStore.setState({ tasks: [oldProject, newProject], activeTaskId: oldProject.id });
    const upload = deferred<ProjectAsset>();
    vi.mocked(uploadProjectAsset).mockReturnValue(upload.promise);
    const file = new File([Uint8Array.of(1)], "Hero.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload(PROJECT_ID);
    const staleIngest = hook.current().ingest;
    let ingestion!: Promise<void>;

    act(() => {
      ingestion = hook.current().ingest([file]);
    });
    await act(async () => Promise.resolve());
    await hook.rerender(newProjectId);
    let staleIngestion!: Promise<void>;
    act(() => {
      staleIngestion = staleIngest([file]);
    });
    await act(async () => Promise.resolve());

    expect(uploadProjectAsset).toHaveBeenCalledTimes(1);
    expect(hook.current().uploading).toBe(false);

    act(() => {
      useStore.setState({
        tasks: [oldProject, newProject],
        activeTaskId: newProject.id,
      });
    });
    upload.reject(new Error("old request failed"));
    await act(async () => Promise.all([ingestion, staleIngestion]));

    expect(useStore.getState().tasks).toEqual([oldProject, newProject]);
    expect(hook.current().error).toBeNull();
    expect(hook.current().uploading).toBe(false);
  });

  it("serializes overlapping ingest calls and remains uploading until the queue drains", async () => {
    useStore.setState({
      tasks: [task({ serverProjectId: PROJECT_ID })],
      activeTaskId: "task-1",
    });
    const firstUpload = deferred<ProjectAsset>();
    const secondUpload = deferred<ProjectAsset>();
    vi.mocked(uploadProjectAsset)
      .mockReturnValueOnce(firstUpload.promise)
      .mockReturnValueOnce(secondUpload.promise);
    const first = new File([Uint8Array.of(1)], "First.PNG", {
      type: "image/png",
    });
    const second = new File([Uint8Array.of(2)], "Second.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload(PROJECT_ID);
    let firstIngestion!: Promise<void>;
    let secondIngestion!: Promise<void>;

    act(() => {
      firstIngestion = hook.current().ingest([first]);
      secondIngestion = hook.current().ingest([second]);
    });
    await act(async () => Promise.resolve());

    expect(uploadProjectAsset).toHaveBeenCalledTimes(1);
    expect(uploadProjectAsset).toHaveBeenNthCalledWith(1, PROJECT_ID, first);
    expect(hook.current().uploading).toBe(true);

    firstUpload.resolve(
      asset({
        originalName: first.name,
        filename: "first.png",
        path: "assets/first.png",
      }),
    );
    await act(async () => {
      await firstIngestion;
      await Promise.resolve();
    });

    expect(uploadProjectAsset).toHaveBeenCalledTimes(2);
    expect(uploadProjectAsset).toHaveBeenNthCalledWith(2, PROJECT_ID, second);
    expect(activeTask().content).toBe("![First.PNG](assets/first.png)");
    expect(hook.current().uploading).toBe(true);

    secondUpload.resolve(
      asset({
        originalName: second.name,
        filename: "second.png",
        path: "assets/second.png",
      }),
    );
    await act(async () => secondIngestion);

    expect(activeTask().content).toBe(
      "![First.PNG](assets/first.png)\n\n![Second.PNG](assets/second.png)",
    );
    expect(hook.current().uploading).toBe(false);
  });

  it("starts a replacement project's queue while the obsolete project request is unresolved", async () => {
    const oldProject = task({
      id: "old-project-task",
      serverProjectId: PROJECT_ID,
      content: "Old project",
    });
    const newProjectId = "BcDeFgHiJkLmNoPqRsTuVw";
    const newProject = task({
      id: "new-project-task",
      serverProjectId: newProjectId,
      content: "New project",
    });
    useStore.setState({ tasks: [oldProject, newProject], activeTaskId: oldProject.id });
    const oldUpload = deferred<ProjectAsset>();
    const newUpload = deferred<ProjectAsset>();
    vi.mocked(uploadProjectAsset).mockImplementation((projectId) =>
      projectId === PROJECT_ID ? oldUpload.promise : newUpload.promise,
    );
    const oldFile = new File([Uint8Array.of(1)], "Old.PNG", {
      type: "image/png",
    });
    const newFile = new File([Uint8Array.of(2)], "New.PNG", {
      type: "image/png",
    });
    const hook = await renderUpload(PROJECT_ID);
    let oldIngestion!: Promise<void>;

    act(() => {
      oldIngestion = hook.current().ingest([oldFile]);
    });
    await act(async () => Promise.resolve());
    expect(uploadProjectAsset).toHaveBeenCalledWith(PROJECT_ID, oldFile);

    act(() => {
      useStore.setState({
        tasks: [oldProject, newProject],
        activeTaskId: newProject.id,
      });
    });
    await hook.rerender(newProjectId);
    let newIngestion!: Promise<void>;
    act(() => {
      newIngestion = hook.current().ingest([newFile]);
    });
    await act(async () => Promise.resolve());

    expect(uploadProjectAsset).toHaveBeenCalledTimes(2);
    expect(uploadProjectAsset).toHaveBeenNthCalledWith(2, newProjectId, newFile);
    expect(hook.current().uploading).toBe(true);

    newUpload.resolve(
      asset({
        originalName: newFile.name,
        filename: "new.png",
        path: "assets/new.png",
      }),
    );
    await act(async () => newIngestion);

    expect(activeTask().content).toBe(
      "New project\n\n![New.PNG](assets/new.png)",
    );
    expect(hook.current().uploading).toBe(false);

    oldUpload.resolve(
      asset({
        originalName: oldFile.name,
        filename: "old.png",
        path: "assets/old.png",
      }),
    );
    await act(async () => oldIngestion);
    expect(useStore.getState().tasks).toEqual([
      oldProject,
      expect.objectContaining({
        id: newProject.id,
        content: "New project\n\n![New.PNG](assets/new.png)",
      }),
    ]);
  });

  it("starts a new local task queue while the obsolete parse is unresolved", async () => {
    const oldTask = task({ id: "old-local-task", content: "Old local" });
    const newTask = task({ id: "new-local-task", content: "New local" });
    useStore.setState({ tasks: [oldTask, newTask], activeTaskId: oldTask.id });
    const oldParse = deferred<Awaited<ReturnType<typeof parseFile>>>();
    const newParse = deferred<Awaited<ReturnType<typeof parseFile>>>();
    vi.mocked(parseFile).mockImplementation((file) =>
      file.name === "old.txt" ? oldParse.promise : newParse.promise,
    );
    const oldFile = new File(["old"], "old.txt", { type: "text/plain" });
    const newFile = new File(["new"], "new.txt", { type: "text/plain" });
    const hook = await renderUpload();
    let oldIngestion!: Promise<void>;

    act(() => {
      oldIngestion = hook.current().ingest([oldFile]);
    });
    await act(async () => Promise.resolve());
    expect(parseFile).toHaveBeenCalledWith(oldFile);

    act(() => {
      useStore.setState({ tasks: [oldTask, newTask], activeTaskId: newTask.id });
    });
    await act(async () => Promise.resolve());
    expect(hook.current().uploading).toBe(false);

    let newIngestion!: Promise<void>;
    act(() => {
      newIngestion = hook.current().ingest([newFile]);
    });
    await act(async () => Promise.resolve());

    expect(parseFile).toHaveBeenCalledTimes(2);
    expect(parseFile).toHaveBeenNthCalledWith(2, newFile);
    expect(hook.current().uploading).toBe(true);

    newParse.resolve({
      filename: newFile.name,
      format: "txt",
      text: "Parsed new local",
    });
    await act(async () => newIngestion);

    expect(activeTask().content).toBe("New local\n\nParsed new local");
    expect(hook.current().uploading).toBe(false);

    oldParse.resolve({
      filename: oldFile.name,
      format: "txt",
      text: "Parsed old local",
    });
    await act(async () => oldIngestion);
    expect(useStore.getState().tasks).toEqual([
      oldTask,
      expect.objectContaining({
        id: newTask.id,
        content: "New local\n\nParsed new local",
      }),
    ]);
  });
});
