// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../player";
import { addBlockToProject } from "./blockInstaller";

afterEach(() => {
  vi.unstubAllGlobals();
  usePlayerStore.getState().reset();
});

describe("addBlockToProject", () => {
  it("uses an explicit selected-media duration and track for a Registry overlay block", async () => {
    const componentPath = "compositions/camcorder-hud.html";
    const targetPath = "compositions/scene.html";
    const files = new Map([
      [
        componentPath,
        `<body><div data-composition-id="camcorder-hud"><div class="hud"></div></div></body>`,
      ],
      [
        targetPath,
        `<main data-composition-id="scene" data-duration="10" data-width="1920" data-height="1080"></main>`,
      ],
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          written: [componentPath],
          block: {
            name: "camcorder-hud",
            title: "Camcorder HUD",
            description: "HUD",
            type: "hyperframes:block",
            files: [],
            dimensions: { width: 1920, height: 1080 },
            duration: 4,
          },
        }),
      }),
    );
    const writeProjectFile = vi.fn(async (path: string, content: string) => {
      files.set(path, content);
    });

    const result = await addBlockToProject({
      projectId: "project",
      blockName: "camcorder-hud",
      activeCompPath: targetPath,
      placement: { start: 2.5, duration: 4.25, track: 3 },
      timelineElements: [],
      readProjectFile: async (path) => files.get(path) ?? "",
      writeProjectFile,
      recordEdit: vi.fn().mockResolvedValue(undefined),
      refreshFileTree: vi.fn().mockResolvedValue(undefined),
      reloadPreview: vi.fn(),
      showToast: vi.fn(),
    });

    expect(result?.block.name).toBe("camcorder-hud");
    const source = files.get(targetPath);
    expect(source).toContain('data-composition-src="compositions/camcorder-hud.html"');
    expect(source).toContain('data-start="2.5"');
    expect(source).toContain('data-duration="4.25"');
    expect(source).toContain('data-track-index="3"');
    // hostKey addresses the new element the same way the timeline selects
    // clips (sourceFile#domId), so the caller can select and reveal it.
    expect(result?.hostKey).toBe("compositions/scene.html#camcorder-hud");
    expect(source).toContain('id="camcorder-hud"');
  });
});

it("saves catalog insertion and displaced tracks as one reversible history entry", async () => {
  const componentPath = "compositions/caption.html";
  const before = '<main data-composition-id="main" data-duration="10" data-width="1920" data-height="1080"><div id="existing" data-hf-id="hf-existing" data-track-index="0" data-start="0" data-duration="10" style="z-index: 50"></div></main>';
  const files = new Map([["index.html", before], [componentPath, "<div></div>"]]);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ written: [componentPath], block: { name: "caption", title: "Caption", type: "hyperframes:component", duration: 4 } }) }));
  const recordEdit = vi.fn().mockResolvedValue(undefined);
  const options = {
    projectId: "p1", blockName: "caption", activeCompPath: null,
    placement: { start: 3.5, newTrack: "top" as const },
    timelineElements: [{ id: "existing", domId: "existing", hfId: "hf-existing", tag: "div", start: 0, duration: 10, track: 0 }],
    readProjectFile: async path => files.get(path) ?? "",
    writeProjectFile: async (path, content) => { files.set(path, content); },
    recordEdit, refreshFileTree: async () => {}, reloadPreview: () => {}, showToast: vi.fn(),
  };
  const result = await addBlockToProject(options);
  expect(result?.element).toMatchObject({ start: 3.5, track: 0, zIndex: 51 });
  expect(files.get("index.html")).toContain('data-hf-id="hf-existing" data-track-index="1"');
  expect(recordEdit).toHaveBeenCalledOnce();
  expect(recordEdit.mock.calls[0][0].files["index.html"]).toEqual({ before, after: files.get("index.html") });
  // Existing main-document clips omit sourceFile, while pending saved hosts include it.
  usePlayerStore.setState({ pendingAssetDrops: [{ id: "first", assetPath: "caption", placement: { start: 3.5, track: 0 }, element: result!.element }] });
  const second = await addBlockToProject(options);
  expect(second?.element).toMatchObject({ start: 3.5, track: 0, zIndex: 52 });
  expect(files.get("index.html")).toContain('data-hf-id="hf-existing" data-track-index="2"');
  expect(files.get("index.html")).toMatch(/id="caption"[\s\S]*?data-track-index="1"/);
});
