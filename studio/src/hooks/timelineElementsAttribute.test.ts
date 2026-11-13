// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { configurable: true, value: true });
import type { TimelineElement } from "../player";
import { usePlayerStore } from "../player/store/playerStore";
import { saveProjectFilesWithHistory } from "../utils/studioFileHistory";

const saved = vi.hoisted(() => ({ inputs: [] as Array<Record<string, unknown>> }));
vi.mock("../utils/studioFileHistory", () => ({
  saveProjectFilesWithHistory: vi.fn(async (input: Record<string, unknown>) => {
    saved.inputs.push(input);
    return [];
  }),
}));

import { useSetElementsAttribute } from "./timelineElementsAttribute";

const clip = (id: string, sourceFile?: string): TimelineElement => ({
  id,
  domId: id,
  tag: "audio",
  start: 0,
  duration: 1,
  track: 0,
  sourceFile,
});

afterEach(() => {
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
  vi.restoreAllMocks();
});

describe("useSetElementsAttribute", () => {
  it.each([false, true])("syncs saved track mute and unmute with monitor mute=%s", async (audioMuted) => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const doc = iframe.contentDocument!;
    doc.body.innerHTML = '<audio id="a" data-volume="0.5"></audio><video id="b"></video>';
    const audio = doc.getElementById("a")!;
    const video = doc.getElementById("b")!;
    const elements = [clip("a"), { ...clip("b"), tag: "video" }];
    usePlayerStore.setState({ audioMuted, elements });
    const pushedAttributes: boolean[][] = [];
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage").mockImplementation(() => {
      pushedAttributes.push([audio.hasAttribute("muted"), video.hasAttribute("muted")]);
    });
    let write: ReturnType<typeof useSetElementsAttribute> | null = null;
    function Probe() {
      write = useSetElementsAttribute({
        projectIdRef: { current: "p1" },
        activeCompPath: "index.html",
        showToast: vi.fn(),
        writeProjectFile: vi.fn(async () => {}),
        recordEdit: vi.fn(async () => {}),
        previewIframeRef: { current: iframe },
        pendingTimelineEditPathRef: { current: new Set<string>() },
      });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe)));
    await act(async () => {
      await write?.(elements.map(element => ({ element, value: "true" })), "muted", "Mute audio");
    });
    expect(usePlayerStore.getState().elements.every(element => element.muted)).toBe(true);
    await act(async () => {
      await write?.(elements.map(element => ({ element, value: null })), "muted", "Unmute audio");
    });
    expect(usePlayerStore.getState().elements.every(element => !element.muted)).toBe(true);
    expect(pushedAttributes).toEqual([[true, true], [false, false]]);
    expect(postMessage).toHaveBeenCalledTimes(2);
    for (const [message] of postMessage.mock.calls) {
      expect(message).toMatchObject({ action: "set-muted", muted: audioMuted });
    }
    expect(audio.getAttribute("data-volume")).toBe("0.5");
    expect(usePlayerStore.getState().audioMuted).toBe(audioMuted);
    act(() => root.unmount());
  });

  it("leaves live media unchanged when the mute save fails", async () => {
    vi.mocked(saveProjectFilesWithHistory).mockRejectedValueOnce(new Error("Save failed"));
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    iframe.contentDocument!.body.innerHTML = '<audio id="a"></audio>';
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    const showToast = vi.fn();
    let write: ReturnType<typeof useSetElementsAttribute> | null = null;
    function Probe() {
      write = useSetElementsAttribute({
        projectIdRef: { current: "p1" },
        activeCompPath: "index.html",
        showToast,
        writeProjectFile: vi.fn(async () => {}),
        recordEdit: vi.fn(async () => {}),
        previewIframeRef: { current: iframe },
        pendingTimelineEditPathRef: { current: new Set<string>() },
      });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe)));
    await write?.([{ element: clip("a"), value: "true" }], "muted", "Mute audio");
    expect(iframe.contentDocument!.getElementById("a")!.hasAttribute("muted")).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Save failed", "error");
    act(() => root.unmount());
  });

  it("writes every clip's attribute in one history entry, one builder per file", async () => {
    saved.inputs.length = 0;
    const showToast = vi.fn();
    let write: ReturnType<typeof useSetElementsAttribute> | null = null;
    function Probe() {
      write = useSetElementsAttribute({
        projectIdRef: { current: "p1" },
        activeCompPath: "index.html",
        showToast,
        writeProjectFile: vi.fn(async () => {}),
        recordEdit: vi.fn(async () => {}),
        previewIframeRef: { current: null },
        pendingTimelineEditPathRef: { current: new Set<string>() },
      });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe)));
    await write?.(
      [
        { element: clip("a"), value: "0.5" },
        { element: clip("b"), value: "2" },
        { element: clip("c", "scene.html"), value: "1.5" },
      ],
      "data-volume",
      "Audio Gain",
    );
    expect(showToast).not.toHaveBeenCalled();
    expect(saved.inputs).toHaveLength(1);
    const input = saved.inputs[0];
    expect(input?.["label"]).toBe("Audio Gain");
    const files = input?.["files"];
    if (typeof files !== "object" || files === null) throw new Error("no files");
    expect(Object.keys(files).sort()).toEqual(["index.html", "scene.html"]);
    const build = Reflect.get(files, "index.html");
    const html = '<audio id="a" data-volume="1"></audio><audio id="b"></audio>';
    const out = typeof build === "function" ? String(build(html)) : "";
    expect(out).toContain('id="a" data-volume="0.5"');
    expect(out).toMatch(/id="b"[^>]*data-volume="2"/);
    await write?.([{ element: clip("a"), value: "true" }], "muted", "Mute audio");
    const muteFiles = saved.inputs.at(-1)?.["files"] as Record<string, (source: string) => string>;
    const mutedHtml = muteFiles['index.html']!(html);
    expect(mutedHtml).toMatch(/<audio[^>]*\smuted(?:="")?/);
    expect(mutedHtml).not.toContain('data-muted');
    expect(mutedHtml).toContain('data-volume="1"');
    await write?.([{ element: clip("a"), value: null }], "muted", "Unmute audio");
    const unmuteFiles = saved.inputs.at(-1)?.["files"] as Record<string, (source: string) => string>;
    expect(unmuteFiles['index.html']!(mutedHtml)).not.toContain('muted');
    act(() => root.unmount());
  });

  it("refuses while recording, like the single-clip write", async () => {
    saved.inputs.length = 0;
    const showToast = vi.fn();
    let write: ReturnType<typeof useSetElementsAttribute> | null = null;
    function Probe() {
      write = useSetElementsAttribute({
        projectIdRef: { current: "p1" },
        activeCompPath: "index.html",
        showToast,
        writeProjectFile: vi.fn(async () => {}),
        recordEdit: vi.fn(async () => {}),
        previewIframeRef: { current: null },
        pendingTimelineEditPathRef: { current: new Set<string>() },
        isRecordingRef: { current: true },
      });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe)));
    await write?.([{ element: clip("a"), value: "0.5" }], "data-volume", "Audio Gain");
    act(() => root.unmount());
    expect(saved.inputs).toHaveLength(0);
    expect(showToast).toHaveBeenCalledWith("Cannot edit timeline while recording", "error");
  });
});
