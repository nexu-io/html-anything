// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { StudioHostContext } from "../motion/StudioHost";
import { usePlayerStore } from "../player";
import { useTimelineAddAtPlayhead } from "./useTimelineAddAtPlayhead";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => usePlayerStore.getState().reset());

it("captures the composition playhead on click and reports a failed save", async () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  const add = vi.fn().mockResolvedValue(undefined);
  let actions!: ReturnType<typeof useTimelineAddAtPlayhead>;
  function Harness() { actions = useTimelineAddAtPlayhead(add, vi.fn(), "p1"); return null; }
  try {
    act(() => root.render(<StudioHostContext.Provider value={{ mvpEditor: true }}><Harness /></StudioHostContext.Provider>));
    usePlayerStore.setState({ currentTime: 3.5 });
    expect(await actions.addAssetAtPlayhead("assets/clip.mp4")).toBe(true);
    expect(add).toHaveBeenLastCalledWith("assets/clip.mp4", { start: 3.5, track: 0, newTrack: "top" }, undefined, true);
    usePlayerStore.setState({ currentTime: 7 });
    add.mockRejectedValueOnce(new Error("Save failed"));
    expect(await actions.addAssetAtPlayhead("assets/music.mp3")).toBe(false);
    expect(add.mock.lastCall?.[1].start).toBe(7);
  } finally { act(() => root.unmount()); }
});
