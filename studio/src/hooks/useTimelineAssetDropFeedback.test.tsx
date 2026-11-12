// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTimelineAssetDropOps } from "./useTimelineAssetDropOps";
import { usePlayerStore } from "../player/store/playerStore";
import { Timeline } from "../player/components/Timeline";
import { installTimelineMountEnv } from "../player/components/timelineMountTestEnv";
import { I18nProvider } from "../i18n/I18n";
import type { TimelineElement } from "../player";
import { failPendingAssetPreviews } from "../player/store/pendingAssetDrops";
import * as studioHelpers from "../utils/studioHelpers";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
installTimelineMountEnv();
const roots: Root[] = [];
afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  usePlayerStore.getState().reset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function mountDropEditor(elements: TimelineElement[] = [], uploadProjectFiles: (files: Iterable<File>) => Promise<string[]> = vi.fn()) {
  let source = '<main data-composition-id="scene" data-duration="30"></main>';
  const write = vi.fn(async (_path: string, content: string) => { source = content; });
  const recordEdit = vi.fn(async () => {});
  const showToast = vi.fn();
  const projectIdRef = { current: "project" };
  usePlayerStore.setState({ elements, timelineReady: true, duration: 30 });
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ content: source })));
  let handlers!: ReturnType<typeof useTimelineAssetDropOps>;
  function Editor({ path }: { path: string }) {
    const timelineElements = usePlayerStore((state) => state.elements);
    handlers = useTimelineAssetDropOps({
      projectIdRef, activeCompPath: path, timelineElements, showToast,
      writeProjectFile: write, recordEdit, reloadPreview: vi.fn(), uploadProjectFiles,
    });
    return <I18nProvider initialLocale="zh-CN"><Timeline onAssetDrop={handlers.handleTimelineAssetDrop} /></I18nProvider>;
  }
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(<Editor path="index.html" />));
  return {
    host, write, recordEdit, showToast,
    drop: (...args: Parameters<typeof handlers.handleTimelineAssetDrop>) => handlers.handleTimelineAssetDrop(...args),
    files: (...args: Parameters<typeof handlers.handleTimelineFileDrop>) => handlers.handleTimelineFileDrop(...args),
    switchComposition: () => act(() => root.render(<Editor path="other.html" />)),
    source: () => source,
    placeholders: () => Array.from(host.querySelectorAll<HTMLElement>('[data-testid="timeline-pending-asset"]')),
  };
}

describe("timeline asset drop feedback", () => {
  it.each(["picture.png", "video.mp4", "sound.mp3"])("keeps identical feedback through saving for %s", async name => {
    vi.spyOn(studioHelpers, "resolveDroppedAssetHasAudio").mockResolvedValue(false);
    const view = mountDropEditor([{ id: "existing", tag: name.endsWith("mp3") ? "audio" : "div", start: 0, duration: 30, track: 0 }]);
    let save!: () => void;
    view.write.mockImplementation(() => new Promise<void>(resolve => { save = resolve; }));
    let task!: Promise<void>;
    await act(async () => { task = view.drop(`assets/${name}`, { start: 2, track: 0 }, 5); });
    expect(view.placeholders()).toHaveLength(1);
    expect(view.placeholders()[0].getAttribute("aria-busy")).toBe("true");
    expect(view.showToast).not.toHaveBeenCalled();
    await act(async () => { save(); await task; });
    const element = usePlayerStore.getState().pendingAssetDrops[0].element!;
    expect(view.placeholders()).toHaveLength(1);
    act(() => usePlayerStore.setState({ elements: [element], timelineReady: true }));
    expect(view.placeholders()).toHaveLength(0);
  });

  it("shows upload feedback immediately, then keeps every accepted file visible through queued saves", async () => {
    let upload!: (paths: string[]) => void;
    const view = mountDropEditor([], () => new Promise(resolve => { upload = resolve; }));
    let task!: Promise<void>;
    act(() => { task = view.files([new File(["x"], "one.png"), new File(["x"], "two.png")], { start: 0, track: 0 }); });
    expect(view.placeholders()).toHaveLength(1);
    expect(view.placeholders()[0].getAttribute("aria-label")).toContain("one.png · two.png");
    expect(view.write).not.toHaveBeenCalled();
    await act(async () => { upload(["one.png", "two.png"]); await task; });
    expect(view.placeholders()).toHaveLength(2);
    const elements = usePlayerStore.getState().pendingAssetDrops.map(drop => drop.element!);
    expect(elements.every(Boolean)).toBe(true);
    expect(new Set(elements.map(element => element.key)).size).toBe(2);
    act(() => usePlayerStore.setState({ elements, timelineReady: true }));
    expect(view.placeholders()).toHaveLength(0);
  });

  it("leaves upload rejection visible and clears pending uploads on composition change", async () => {
    const view = mountDropEditor([], async () => []);
    await act(async () => view.files([new File(["x"], "one.png")]));
    expect(view.placeholders()[0].getAttribute("role")).toBe("alert");
    view.switchComposition();
    expect(view.placeholders()).toHaveLength(0);
    expect(view.write).not.toHaveBeenCalled();
  });

  it("shows each repeated audio drop immediately, shares probing, and replaces each only when its clip appears", async () => {
    const view = mountDropEditor();
    const createElement = document.createElement.bind(document);
    const probes: HTMLAudioElement[] = [];
    vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
      const element = createElement(tag, options);
      if (tag === "audio") probes.push(element as HTMLAudioElement);
      return element;
    });
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = view.drop("assets/music.mp3", { start: 0, track: 0 });
      second = view.drop("assets/music.mp3", { start: 0, track: 0 });
    });
    expect(view.placeholders()).toHaveLength(2);
    expect(new Set(view.placeholders().map((node) => node.style.left)).size).toBe(2);
    expect(view.placeholders().every((node) => node.getAttribute("aria-busy") === "true")).toBe(true);
    expect(probes).toHaveLength(1);
    expect(view.write).not.toHaveBeenCalled();
    Object.defineProperty(probes[0], "duration", { value: 6 });
    await act(async () => {
      probes[0].dispatchEvent(new Event("loadedmetadata"));
      await Promise.all([first, second]);
    });
    expect(view.write).toHaveBeenCalledTimes(2);
    expect(view.recordEdit).toHaveBeenCalledTimes(2);
    expect(view.source().match(/<audio /g)).toHaveLength(2);
    expect(view.placeholders()).toHaveLength(2);
    const inserted = usePlayerStore.getState().pendingAssetDrops.map((drop) => drop.element!);
    expect(inserted.map((element) => element.start)).toEqual([0, 6]);
    expect(new Set(inserted.map((element) => element.key)).size).toBe(2);
    act(() => usePlayerStore.getState().setElements(inserted.slice(0, 1)));
    expect(view.placeholders()).toHaveLength(1);
    act(() => usePlayerStore.setState({ timelineReady: false, elements: inserted }));
    expect(view.placeholders()).toHaveLength(1);
    act(() => usePlayerStore.getState().setTimelineReady(true));
    expect(view.placeholders()).toHaveLength(0);
    expect(usePlayerStore.getState().pendingAssetDrops).toEqual([]);
    expect(view.source()).not.toContain("pending");
  });

  it("keeps feedback through saving on a populated row, then leaves a dismissible failure", async () => {
    const view = mountDropEditor([{ id: "title", tag: "div", start: 0, duration: 10, track: 0 }]);
    let rejectWrite!: (reason: Error) => void;
    view.write.mockImplementation(() => new Promise<void>((_resolve, reject) => { rejectWrite = reject; }));
    let drop!: Promise<void>;
    await act(async () => { drop = view.drop("assets/music.mp3", { start: 12, track: 0 }, 6); });
    expect(view.placeholders()).toHaveLength(1);
    const before = view.placeholders()[0].style.left;
    await act(async () => {
      rejectWrite(new Error("Save unavailable"));
      await drop;
    });
    const failed = view.placeholders()[0];
    expect(failed.style.left).toBe(before);
    expect(failed.getAttribute("role")).toBe("alert");
    expect(failed.getAttribute("aria-busy")).toBe("false");
    expect(failed.textContent).toContain("添加素材失败");
    expect(view.source()).not.toContain("<audio");
    act(() => failed.querySelector<HTMLButtonElement>("button")!.click());
    expect(view.placeholders()).toHaveLength(0);
  });

  it("clears the old composition's loading operation before it can write to the new one", async () => {
    const view = mountDropEditor();
    let drop!: Promise<void>;
    act(() => { drop = view.drop("assets/music.mp3", { start: 0, track: 0 }, 6); });
    expect(view.placeholders()).toHaveLength(1);
    view.switchComposition();
    await act(async () => { await drop; });
    expect(view.placeholders()).toHaveLength(0);
    expect(view.write).not.toHaveBeenCalled();
    expect(view.showToast).not.toHaveBeenCalled();
  });

  it("ends loading on a media read failure without inserting a made-up duration", async () => {
    const view = mountDropEditor();
    const createElement = document.createElement.bind(document);
    let probe!: HTMLAudioElement;
    vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
      const element = createElement(tag, options);
      if (tag === "audio") probe = element as HTMLAudioElement;
      return element;
    });
    let drop!: Promise<void>;
    act(() => { drop = view.drop("assets/broken.mp3", { start: 0, track: 0 }); });
    await act(async () => {
      probe.dispatchEvent(new Event("error"));
      await drop;
    });
    expect(view.placeholders()[0].getAttribute("aria-busy")).toBe("false");
    expect(view.placeholders()[0].textContent).toContain("添加素材失败");
    expect(view.write).not.toHaveBeenCalled();
    expect(probe.getAttribute("src")).toBe("");
  });

  it("ends loading on a preview failure while preserving the already saved clip", async () => {
    const view = mountDropEditor();
    await act(async () => { await view.drop("assets/music.mp3", { start: 0, track: 0 }, 6); });
    act(() => failPendingAssetPreviews());
    expect(view.placeholders()[0].getAttribute("aria-busy")).toBe("false");
    expect(view.placeholders()[0].textContent).toContain("预览加载失败");
    expect(view.source().match(/<audio /g)).toHaveLength(1);
  });
});
