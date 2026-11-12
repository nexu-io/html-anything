// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBlockHandlers, type UseBlockHandlersResult } from "./useBlockHandlers";
import { useTimelineAssetDropOps } from "./useTimelineAssetDropOps";
import { Timeline } from "../player/components/Timeline";
import { usePlayerStore } from "../player/store/playerStore";
import { installTimelineMountEnv } from "../player/components/timelineMountTestEnv";
import { getTimelineRowTop, TRACK_H } from "../player/components/timelineLayout";
import { TIMELINE_BLOCK_MIME } from "../utils/timelineAssetDrop";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
installTimelineMountEnv();
const roots: Root[] = [];
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  usePlayerStore.getState().reset();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function mountEditor() {
  const source = '<main data-composition-id="main" data-duration="30"></main>';
  const files = new Map([["index.html", source], ["other.html", source]]);
  const installs: Array<ReturnType<typeof deferred<Response>>> = [];
  const showToast = vi.fn(() => 1);
  const reloadPreview = vi.fn();
  const recordEdit = vi.fn(async () => {});
  const projectIdRef = { current: "project" };
  const block = { name: "sparkle", title: "Sparkle", type: "hyperframes:block", duration: 8, files: [] };
  const installed = () => Response.json({ written: ["compositions/sparkle.html"], block });
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (!url.endsWith("/registry/install")) throw new Error(`Unexpected request: ${url}`);
    const request = deferred<Response>();
    installs.push(request);
    return request.promise;
  }));
  let handlers!: UseBlockHandlersResult;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  usePlayerStore.setState({ timelineReady: true, duration: 30 });
  function Editor({ path }: { path: string | null }) {
    const timelineElements = usePlayerStore((state) => state.elements);
    const ctx = {
      activeCompPath: path, timelineElements, showToast, dismissToast: vi.fn(),
      readProjectFile: async (path: string) => files.get(path) ?? "",
      writeProjectFile: async (path: string, content: string) => { files.set(path, content); },
      recordEdit, reloadPreview, refreshFileTree: async () => {},
    };
    useTimelineAssetDropOps({ ...ctx, projectIdRef, uploadProjectFiles: async () => [] });
    handlers = useBlockHandlers({ projectId: "project", blockCtxDeps: ctx,
      previewIframeRef: { current: null }, setRightCollapsed: vi.fn(), setRightPanelTab: vi.fn() });
    return <Timeline onBlockDrop={handlers.handleTimelineBlockDrop} />;
  }
  act(() => root.render(<Editor path={null} />));
  return {
    host, files, installs, installed, showToast, reloadPreview, recordEdit,
    drop: (start = 0) => handlers.handleTimelineBlockDrop("sparkle", { start, track: 0 }),
    previewDrop: () => handlers.handlePreviewBlockDrop("sparkle", { left: 100, top: 120 }),
    add: () => handlers.handleAddBlock("sparkle"),
    overlay: () => handlers.handleAddMediaOverlay("sparkle", { start: 3, track: 1, duration: 4 }),
    switchComposition: () => act(() => root.render(<Editor path="other.html" />)),
    unmount: () => act(() => root.unmount()),
    placeholders: () => host.querySelectorAll('[data-testid="timeline-pending-asset"]'),
  };
}

describe("catalog block drop feedback", () => {
  it.each(["previewDrop", "add", "overlay"] as const)("uses the same pending clip for the %s entry instead of a progress toast", async entry => {
    const view = mountEditor();
    act(() => { view[entry](); });
    expect(view.placeholders()).toHaveLength(1);
    await act(async () => {});
    expect(view.installs).toHaveLength(1);
    expect(view.showToast).not.toHaveBeenCalled();
    await act(async () => view.installs[0].resolve(view.installed()));
    const element = usePlayerStore.getState().pendingAssetDrops[0].element!;
    expect(element.key).toBe("index.html#sparkle");
    expect(view.placeholders()).toHaveLength(1);
    act(() => usePlayerStore.setState({ elements: [element], timelineReady: true }));
    expect(view.placeholders()).toHaveLength(0);
  });

  it("keeps the actual block drag's placeholder after mouse release until the inserted clip is usable", async () => {
    const view = mountEditor();
    const target = view.host.querySelector(".h-full.border-t")!;
    const transfer = { types: [TIMELINE_BLOCK_MIME], files: [], getData: () => '{"name":"sparkle"}' };
    for (const type of ["dragover", "drop", "dragend"]) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        clientX: { value: 400 }, clientY: { value: getTimelineRowTop(0) + TRACK_H / 2 },
        dataTransfer: { value: transfer },
      });
      act(() => target.dispatchEvent(event));
    }
    expect(view.placeholders()).toHaveLength(1);
    await act(async () => {});
    expect(view.installs).toHaveLength(1);
    expect(view.showToast).not.toHaveBeenCalled();
    await act(async () => { view.installs[0].resolve(view.installed()); });
    expect(view.reloadPreview).toHaveBeenCalledOnce();
    expect(view.placeholders()).toHaveLength(1);
    const clip = usePlayerStore.getState().pendingAssetDrops[0].element!;
    expect(clip.duration).toBe(8);
    expect(view.files.get("index.html")).toContain('id="sparkle"');
    act(() => usePlayerStore.setState({ elements: [clip], timelineReady: false }));
    expect(view.placeholders()).toHaveLength(1);
    act(() => usePlayerStore.getState().setTimelineReady(true));
    expect(view.placeholders()).toHaveLength(0);
    expect(usePlayerStore.getState().pendingAssetDrops).toEqual([]);
  });

  it("accepts repeated drops immediately and serializes their installs instead of rejecting them", async () => {
    const view = mountEditor();
    let first!: Promise<void>, second!: Promise<void>;
    act(() => { first = view.drop(); second = view.drop(8); });
    expect(view.placeholders()).toHaveLength(2);
    await act(async () => {});
    expect(view.installs).toHaveLength(1);
    await act(async () => { view.installs[0].resolve(view.installed()); await first; });
    expect(view.installs).toHaveLength(2);
    expect(view.placeholders()).toHaveLength(2);
    await act(async () => { view.installs[1].resolve(view.installed()); await second; });
    expect(view.files.get("index.html")).toContain('id="sparkle_2"');
    expect(view.recordEdit).toHaveBeenCalledTimes(2);
    expect(view.showToast).not.toHaveBeenCalled();
  });

  it("ends loading at the drop placement when registry installation fails", async () => {
    const view = mountEditor();
    let task!: Promise<void>;
    await act(async () => { task = view.drop(); });
    await act(async () => { view.installs[0].resolve(Response.json({ error: "Catalog unavailable" }, { status: 503 })); await task; });
    const failed = view.placeholders()[0];
    expect(failed.getAttribute("role")).toBe("alert");
    expect(failed.getAttribute("aria-busy")).toBe("false");
    expect(view.files.get("index.html")).not.toContain("sparkle");
    expect(view.reloadPreview).not.toHaveBeenCalled();
  });

  it("does not start an old queued install after the composition changes", async () => {
    const view = mountEditor();
    let first!: Promise<void>, second!: Promise<void>;
    await act(async () => { first = view.drop(); second = view.drop(8); });
    view.switchComposition();
    await act(async () => { view.installs[0].resolve(view.installed()); await Promise.all([first, second]); });
    expect(view.installs).toHaveLength(1);
    expect(view.placeholders()).toHaveLength(0);
    expect(view.files.get("other.html")).not.toContain("sparkle");
    expect(usePlayerStore.getState().selectedElementId).toBeNull();
  });

  it("does not start queued installs or reveal an old selection after the editor unmounts", async () => {
    const view = mountEditor();
    let first!: Promise<void>, second!: Promise<void>;
    await act(async () => { first = view.drop(); second = view.drop(8); });
    view.unmount();
    await act(async () => { view.installs[0].resolve(view.installed()); await Promise.all([first, second]); });
    expect(view.installs).toHaveLength(1);
    expect(usePlayerStore.getState().selectedElementId).toBeNull();
  });
});
