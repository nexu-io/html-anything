// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditPopover } from "./EditModal";
import { usePlayerStore, type TimelineElement } from "../store/playerStore";
import { copyTextToClipboard } from "../../utils/clipboard";

vi.mock("../../utils/clipboard", () => ({ copyTextToClipboard: vi.fn(async () => true) }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  usePlayerStore.getState().reset();
  sessionStorage.clear();
});

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
  usePlayerStore.getState().reset();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("EditPopover", () => {
  // The timeline panel's dockview overlay is transformed, which makes it the containing
  // block for position: fixed. Rendered inside it, the popover's viewport coordinates are
  // resolved against the panel, so a Shift+drag low on the page puts it out of view.
  it("renders on document.body, outside a transformed panel", () => {
    const panel = document.createElement("div");
    panel.style.transform = "translateZ(0)";
    document.body.appendChild(panel);
    const root = createRoot(panel);
    act(() =>
      root.render(
        <EditPopover rangeStart={1} rangeEnd={2} anchorX={400} anchorY={900} onClose={() => {}} />,
      ),
    );

    const textarea = document.querySelector("textarea");
    expect(textarea).not.toBeNull();
    expect(panel.contains(textarea)).toBe(false);

    act(() => root.unmount());
  });

  it("places the clip prompt outside the playback controls and keeps it inside the viewport", () => {
    const transport = document.createElement("div");
    transport.setAttribute("data-preview-transport", "");
    vi.spyOn(transport, "getBoundingClientRect").mockReturnValue(new DOMRect(200, 300, 400, 40));
    const host = document.createElement("div");
    document.body.append(transport, host);
    const height = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(200);
    const root = createRoot(host);
    const close = vi.fn();
    try {
      act(() => root.render(
        <EditPopover rangeStart={1} rangeEnd={2} anchorX={400} anchorY={450} onClose={close} />,
      ));
      const surface = document.querySelector("textarea")!.closest<HTMLElement>('[style*="position: fixed"]')!;
      const top = Number.parseFloat(surface.style.top);
      expect(top >= 340 || top + 200 <= 300).toBe(true);
      expect(top + Math.min(200, Number.parseFloat(surface.style.maxHeight))).toBeLessThan(window.innerHeight);
      act(() => {
        vi.advanceTimersByTime(100);
        transport.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(close).not.toHaveBeenCalled();
    } finally {
      act(() => root.unmount());
      height.mockRestore();
    }
  });
});

const overlappingClips: TimelineElement[] = [
  { id: "background", key: "main:background", tag: "div", start: 0, duration: 6, track: 0 },
  { id: "title", key: "scene-a:title", tag: "h1", start: 0, duration: 6, track: 1 },
  { id: "title", key: "scene-b:title", tag: "h2", start: 0, duration: 6, track: 2 },
  { id: "later", key: "main:later", tag: "p", start: 6, duration: 3, track: 3 },
];

it.each([
  { name: "single clip, including duplicate DOM ids", selectedElementKey: "scene-a:title", expected: ["#title (h1)"], excluded: ["#background", "#title (h2)", "#later"] },
  { name: "explicit time range", selectedElementKey: undefined, expected: ["#background", "#title (h1)", "#title (h2)"], excluded: ["#later"] },
  { name: "missing selected clip without falling back to the range", selectedElementKey: "deleted:title", expected: ["(none)"], excluded: ["#background", "#title", "#later"] },
])("copies only the intended targets for $name", async ({ selectedElementKey, expected, excluded }) => {
  usePlayerStore.setState({ elements: overlappingClips });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() => root.render(<EditPopover rangeStart={0} rangeEnd={6} anchorX={400} anchorY={500}
      selectedElementKey={selectedElementKey} initialPrompt="Make the selected title red" onClose={() => {}} />));
    const copy = Array.from(document.querySelectorAll("button")).find(b => b.textContent?.includes("Copy to Agent"))!;
    await act(async () => copy.click());
    const text = vi.mocked(copyTextToClipboard).mock.calls[0][0];
    for (const target of expected) expect(text).toContain(target);
    for (const target of excluded) expect(text).not.toContain(target);
    expect(text).toContain("Modify only the elements listed above");
    expect(text).toContain("Make the selected title red");
    if (selectedElementKey === "scene-a:title") {
      expect(document.body.textContent).toContain("1 element");
      expect(document.body.textContent).not.toContain("#background");
    }
  } finally {
    act(() => root.unmount());
  }
});
