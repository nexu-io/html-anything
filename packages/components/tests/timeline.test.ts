import { expect, it, vi } from "vitest";
import { timeTracks } from "@";

it("pauses stale timeline gestures while preserving keyboard focus for the next confirmed projection", () => {
  const commit = vi.fn(),
    select = vi.fn();
  const axis = timeTracks(document, {
    duration: 5,
    tracks: [{ id: "title", label: "Title", start: 1, duration: 3, selected: true }],
    disabled: false,
    select,
    seek: vi.fn(),
    commit,
  });
  document.body.replaceChildren(axis.element);
  const track = axis.element.querySelector<SVGElement>("[data-clip-id]");
  if (!track) throw new Error("timeline track is missing");
  track.focus();
  expect(document.activeElement).toBe(track);
  axis.disable(true);
  track.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  track.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(commit).not.toHaveBeenCalled();
  expect(select).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(track);
  expect(track.getAttribute("aria-disabled")).toBe("true");
  axis.resize(840);
  expect(axis.element.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 840 100");
  expect(document.activeElement).toBe(track);
  axis.disable(false);
  track.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(commit).toHaveBeenCalledExactlyOnceWith("title", 1.1, 3);
});

it("seeks a keyframe with keyboard while rejecting gestures on an invalidated projection", () => {
  const seek = vi.fn();
  const axis = timeTracks(document, {
    duration: 5,
    tracks: [
      {
        id: "a",
        label: "A",
        start: 0,
        duration: 3,
        selected: true,
        lanes: [{ id: "x", label: "X", keys: [{ id: "frame", focus: "frame", time: 1.5, label: "x 50%" }] }],
      },
    ],
    disabled: false,
    seek,
    select: vi.fn(),
    commit: vi.fn(),
  });
  document.body.replaceChildren(axis.element);
  const frame = axis.element.querySelector<SVGElement>('[data-keyframe-id="frame"]');
  if (!frame) throw new Error("missing keyframe");
  frame.focus();
  frame.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(seek).toHaveBeenLastCalledWith(1.5);
  axis.disable(true);
  expect(frame.getAttribute("aria-disabled")).toBe("true");
  frame.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(seek).toHaveBeenCalledTimes(1);
});

it("bounds key retiming and clip edits to confirmed neighbor and composition ranges", () => {
  const retime = vi.fn(),
    commit = vi.fn();
  const axis = timeTracks(document, {
    duration: 5,
    tracks: [
      {
        id: "clip",
        label: "Clip",
        start: 0,
        duration: 5,
        selected: true,
        lanes: [
          {
            id: "x",
            label: "X",
            keys: [{ id: "key", focus: "key", time: 1.5, label: "key", range: { start: 1.45, end: 1.55 } }],
          },
        ],
      },
    ],
    disabled: false,
    select: vi.fn(),
    seek: vi.fn(),
    retime,
    commit,
  });
  document.body.replaceChildren(axis.element);
  const key = axis.element.querySelector('[data-keyframe-id="key"]'),
    clip = axis.element.querySelector('[data-clip-id="clip"]');
  if (!key || !clip) throw Error("missing projection");
  key.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
  expect(retime).toHaveBeenLastCalledWith("key", 1.55);
  key.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  expect(retime).toHaveBeenLastCalledWith("key", 1.45);
  axis.disable(true);
  key.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(retime).toHaveBeenCalledTimes(2);
  axis.disable(false);
  clip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(commit).toHaveBeenLastCalledWith("clip", 0, 5);
  clip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }));
  expect(commit).toHaveBeenLastCalledWith("clip", 0, 5);
});

it("clamps fractional clip limits after keyboard snapping", () => {
  const commit = vi.fn(),
    axis = timeTracks(document, {
      duration: 5,
      tracks: [{ id: "fractional", label: "Fractional", start: 0.02, duration: 4.94, selected: true }],
      disabled: false,
      select: vi.fn(),
      seek: vi.fn(),
      commit,
    });
  const track = axis.element.querySelector("[data-clip-id]");
  if (!track) throw Error("missing track");
  track.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(commit.mock.lastCall?.[1]).toBeCloseTo(0.06, 8);
  expect(commit.mock.lastCall?.[2]).toBe(4.94);
});

it("keeps readonly hosts selectable and bounds editable windows to a sub-tenth child source", () => {
  const commit = vi.fn(),
    select = vi.fn();
  const axis = timeTracks(document, {
    duration: 5,
    tracks: [
      { id: "dynamic", label: "Dynamic host", start: 0, duration: 2, selected: false, readonly: true },
      { id: "short", label: "Short host", start: 1, duration: 0.04, maximum: 0.05, selected: false },
    ],
    disabled: false,
    select,
    seek: vi.fn(),
    commit,
  });
  const dynamic = axis.element.querySelector('[data-clip-id="dynamic"]'),
    short = axis.element.querySelector('[data-clip-id="short"]');
  if (!dynamic || !short) throw Error("missing host tracks");
  dynamic.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(commit).not.toHaveBeenCalled();
  dynamic.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  expect(select).toHaveBeenCalledExactlyOnceWith("dynamic");
  short.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", altKey: true, bubbles: true }));
  expect(commit).toHaveBeenLastCalledWith("short", 1, 0.05);
});

it("keeps a declared start-edge end fixed, bounds its span and refuses blocked or ungranted edits", () => {
  const commit = vi.fn(),
    axis = timeTracks(document, {
      duration: 8,
      tracks: [
        { id: "image", label: "Image", start: 3, duration: 2, minimumStart: 0, selected: true },
        { id: "audio", label: "Audio", start: 3, duration: 2, selected: false },
      ],
      disabled: false,
      select: vi.fn(),
      seek: vi.fn(),
      commit,
    });
  document.body.replaceChildren(axis.element);
  const start = axis.element.querySelector<SVGElement>("[data-start-edge]");
  if (!start) throw Error("missing start edge");
  expect(axis.element.querySelector('[data-clip-id="audio"] [data-start-edge]')).toBeNull();
  start.focus();
  start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true }));
  expect(commit).toHaveBeenLastCalledWith("image", 2, 3);
  start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
  expect(commit).toHaveBeenLastCalledWith("image", 4, 1);
  axis.disable(true);
  start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  expect(commit).toHaveBeenCalledTimes(2);
  expect(start.getAttribute("tabindex")).toBe("-1");
  expect(document.activeElement).toBe(start);
  axis.disable(false);
  expect(start.getAttribute("tabindex")).toBe("0");
  const tiny = timeTracks(document, {
    duration: 8,
    tracks: [{ id: "short", label: "Short", start: 4.95, duration: 0.05, minimumStart: 0, selected: true }],
    disabled: false,
    select: vi.fn(),
    seek: vi.fn(),
    commit,
  });
  tiny.element
    .querySelector("[data-start-edge]")
    ?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
  expect(commit).toHaveBeenCalledTimes(2);
});
