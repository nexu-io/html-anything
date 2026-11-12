// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useTimelineAssetDropOps } from "./useTimelineAssetDropOps";
import { usePlayerStore } from "../player/store/playerStore";
import { Timeline } from "../player/components/Timeline";
import { installTimelineMountEnv } from "../player/components/timelineMountTestEnv";
import { TIMELINE_COMPOSITION_MIME } from "../utils/timelineCompositionDrop";
import { getTimelineRowTop, TRACK_H } from "../player/components/timelineLayout";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
installTimelineMountEnv();
const roots: Root[] = [];
afterEach(() => {
  act(() => roots.splice(0).forEach(root => root.unmount()));
  usePlayerStore.getState().reset();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function mountEditor() {
  const requests: Array<{ resolve: (response: Response) => void }> = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.includes("/file-mutations/insert-composition/")) {
      return new Promise<Response>(resolve => requests.push({ resolve }));
    }
    return Response.json({ content: "before", version: "v1" });
  }));
  const showToast = vi.fn();
  const reloadPreview = vi.fn();
  const recordEdit = vi.fn(async () => {});
  const writeProjectFile = vi.fn(async () => {});
  const projectIdRef = { current: "project" };
  let drop!: ReturnType<typeof useTimelineAssetDropOps>["handleTimelineCompositionDrop"];
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  usePlayerStore.setState({ timelineReady: true, duration: 30 });
  function Editor({ path }: { path: string | null }) {
    const timelineElements = usePlayerStore(state => state.elements);
    const handlers = useTimelineAssetDropOps({
      projectIdRef, activeCompPath: path, timelineElements,
      writeProjectFile, recordEdit, reloadPreview, showToast,
      uploadProjectFiles: async () => [],
    });
    drop = handlers.handleTimelineCompositionDrop;
    return <Timeline onCompositionDrop={drop} />;
  }
  act(() => root.render(<Editor path={null} />));
  const finish = (index: number, status = 200) => requests[index].resolve(Response.json(status === 200 ? {
    path: "index.html", hostId: `first_${index + 2}`, track: index + 2, duration: 3,
    before: "before", after: "after", version: `v${index + 2}`,
  } : { error: "Cannot insert composition" }, { status }));
  return {
    host, requests, finish, showToast, reloadPreview, recordEdit,
    drop: (start = 0) => drop("compositions/first.html", { start, track: 0 }),
    switchComposition: () => act(() => root.render(<Editor path="other.html" />)),
    placeholders: () => host.querySelectorAll('[data-testid="timeline-pending-asset"]'),
  };
}

it("keeps a composition-list drop visible after dragend until its actual native clip is ready", async () => {
  const view = mountEditor();
  const target = view.host.querySelector(".h-full.border-t")!;
  const transfer = { types: [TIMELINE_COMPOSITION_MIME], files: [], getData: () => '{"sourcePath":"compositions/first.html"}' };
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
  expect(view.requests).toHaveLength(1);
  expect(view.showToast).not.toHaveBeenCalled();
  await act(async () => view.finish(0));
  expect(view.placeholders()).toHaveLength(1);
  const clip = usePlayerStore.getState().pendingAssetDrops[0].element!;
  expect(clip).toMatchObject({ key: "index.html#first_2", duration: 3, track: 2 });
  act(() => usePlayerStore.setState({ elements: [clip], timelineReady: false }));
  expect(view.placeholders()).toHaveLength(1);
  act(() => usePlayerStore.getState().setTimelineReady(true));
  expect(view.placeholders()).toHaveLength(0);
  expect(view.showToast).not.toHaveBeenCalled();
});

it("shows each repeated drop immediately while native writes queue independently", async () => {
  const view = mountEditor();
  act(() => usePlayerStore.setState({ elements: [
    { id: "control", tag: "div", start: 0, duration: 30, track: 0 },
  ] }));
  let first!: Promise<void>, second!: Promise<void>;
  await act(async () => { first = view.drop(); second = view.drop(8); });
  expect(view.placeholders()).toHaveLength(2);
  expect(usePlayerStore.getState().pendingAssetDrops.map(drop => drop.placement.start)).toEqual([0, 8]);
  expect(view.requests).toHaveLength(1);
  await act(async () => { view.finish(0); await first; });
  expect(view.requests).toHaveLength(2);
  expect(view.placeholders()).toHaveLength(2);
  await act(async () => { view.finish(1); await second; });
  expect(view.recordEdit).toHaveBeenCalledTimes(2);
  expect(usePlayerStore.getState().pendingAssetDrops.map(drop => drop.element?.key))
    .toEqual(["index.html#first_2", "index.html#first_3"]);
});

it("leaves a dismissible error at a failed composition's placement", async () => {
  const view = mountEditor();
  let task!: Promise<void>;
  await act(async () => { task = view.drop(); });
  await act(async () => { view.finish(0, 400); await task; });
  expect(view.placeholders()[0].getAttribute("role")).toBe("alert");
  expect(view.placeholders()[0].getAttribute("aria-busy")).toBe("false");
  expect(view.reloadPreview).not.toHaveBeenCalled();
  act(() => (view.placeholders()[0].querySelector("button") as HTMLButtonElement).click());
  expect(view.placeholders()).toHaveLength(0);
});

it("finishes an in-flight save but cancels queued inserts and old selection on composition switch", async () => {
  const view = mountEditor();
  let first!: Promise<void>, second!: Promise<void>;
  await act(async () => { first = view.drop(); second = view.drop(8); });
  view.switchComposition();
  await act(async () => { view.finish(0); await Promise.all([first, second]); });
  expect(view.requests).toHaveLength(1);
  expect(view.recordEdit).toHaveBeenCalledOnce();
  expect(view.reloadPreview).not.toHaveBeenCalled();
  expect(view.placeholders()).toHaveLength(0);
  expect(usePlayerStore.getState().selectedElementId).toBeNull();
});
