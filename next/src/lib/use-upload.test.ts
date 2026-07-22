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

async function renderUpload(projectId?: string): Promise<{
  current: () => ReturnType<typeof useUploadFile>;
  root: Root;
}> {
  let result: ReturnType<typeof useUploadFile> | undefined;

  function Harness() {
    result = useUploadFile(projectId === undefined ? undefined : { projectId });
    return null;
  }

  const root = createRoot(document.createElement("div"));
  roots.push(root);
  await act(async () => root.render(createElement(Harness)));
  return {
    current: () => {
      if (result === undefined) throw new Error("Upload hook did not render.");
      return result;
    },
    root,
  };
}

function activeTask(): Task {
  const state = useStore.getState();
  const active = state.tasks.find((candidate) => candidate.id === state.activeTaskId);
  if (active === undefined) throw new Error("Active test task is missing.");
  return active;
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
  });

  it.each([
    ["SVG", "vector.svg", "image/svg+xml"],
    ["BMP", "bitmap.bmp", "image/bmp"],
  ])("sends dragged %s image candidates to the authoritative server path", async (_label, name, type) => {
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
});
