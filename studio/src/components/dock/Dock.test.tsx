// @vitest-environment happy-dom

import React, { act, type ComponentProps } from "react";
import type { DockviewApi } from "dockview-react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as dockLayout from "./dockLayout";
import { I18nProvider, useI18n } from "../../i18n/I18n";
import { Dock } from "./Dock";
import { StudioHostContext } from "../../motion/StudioHost";
import { parseDockLayout } from "./dockLayoutSchema";
import { useDockLayoutStore } from "./dockLayoutStore";
import { MVP_PANEL_IDS, PANEL_IDS } from "./panelRegistry";
import { readStudioUiPreferences } from "../../utils/studioUiPreferences";
import { applyMotionLayout, MotionPreviewButton } from "../../motion/MotionLayoutControls";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let dockApi: DockviewApi | null = null;
vi.mock("dockview-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("dockview-react")>();
  return {
    ...actual,
    DockviewReact: (props: ComponentProps<typeof actual.DockviewReact>) =>
      React.createElement(actual.DockviewReact, {
        ...props,
        onReady: (event) => {
          dockApi = event.api;
          props.onReady(event);
        },
      }),
  };
});

const liveObservers = new Set<{ callback: () => void; target?: Element }>();
class ResizeObserverStub {
  private readonly entry: { callback: () => void; target?: Element };
  constructor(callback: () => void) {
    this.entry = { callback };
  }
  observe(target: Element) {
    this.entry.target = target;
    liveObservers.add(this.entry);
  }
  unobserve() {}
  disconnect() {
    liveObservers.delete(this.entry);
  }
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;

vi.mock("./dockLayout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./dockLayout")>();
  return {
    ...actual,
    applySideMinimums: vi.fn(actual.applySideMinimums),
    addRegisteredPanel: vi.fn(actual.addRegisteredPanel),
  };
});
const applySideMinimums = vi.mocked(dockLayout.applySideMinimums);
const addRegisteredPanel = vi.mocked(dockLayout.addRegisteredPanel);

let root: Root | null = null;

function mount(
  projectId: string | null,
  titles: Partial<Record<(typeof PANEL_IDS)[number], string>> = {},
  options: Omit<ComponentProps<typeof Dock.Root>, "projectId" | "children"> = {},
) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root?.render(
      <Dock.Root projectId={projectId} {...options}>
        <Dock.WindowMenu />
        <MotionPreviewButton />
        {(options.panels ?? PANEL_IDS).map((id) => (
          <Dock.Panel key={id} id={id} title={titles[id]}>
            <div data-testid={`content-${id}`}>{id}</div>
          </Dock.Panel>
        ))}
      </Dock.Root>,
    );
  });
  return host;
}

/** The persisted views of the group holding `id`, after the debounced write lands. */
function persistedGroupOf(id: string): string | undefined {
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  const grid = JSON.stringify(readStudioUiPreferences(undefined, "p1").dockLayout?.grid);
  const groups = [...grid.matchAll(/"views":\[([^\]]*)\]/g)].map((m) => m[1]);
  return groups.find((views) => views.includes(`"${id}"`));
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

// The default Edit layout tabs [compositions|assets|code|catalog] into one
// group and [design|layers|renders|variables] into another; dockview shows
// only the active tab's content per group. `slideshow` is never part of the
// default build — StudioRightPanels opens it itself when the file is one.
const DEFAULT_OPEN = PANEL_IDS.filter((id) => id !== "slideshow" && id !== "history");
const DEFAULT_VISIBLE = ["preview", "timeline", "compositions", "design"];

describe("Dock on React 19", () => {
  it("mounts the default layout's ten panels, showing only each group's active tab", () => {
    const host = mount("p1");
    for (const id of DEFAULT_VISIBLE) {
      expect(host.querySelector(`[data-testid="content-${id}"]`)).not.toBeNull();
    }
    for (const id of DEFAULT_OPEN.filter((id) => !DEFAULT_VISIBLE.includes(id))) {
      expect(host.querySelector(`[data-testid="content-${id}"]`)).toBeNull();
    }
    expect(host.querySelector('[data-testid="content-slideshow"]')).toBeNull();
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(DEFAULT_OPEN));
  });

  it("persists a layout change per project and reads it back through the schema", () => {
    mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("renders"));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const stored = readStudioUiPreferences(undefined, "p1").dockLayout;
    const expected = DEFAULT_OPEN.filter((id) => id !== "renders");
    expect(Object.keys(stored?.panels ?? {}).sort()).toEqual([...expected].sort());
    expect(readStudioUiPreferences(undefined, "p2").dockLayout).toBeUndefined();
  });

  it("closes a panel and reopens it from the store, becoming its group's visible tab", async () => {
    const host = mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("renders"));
    expect(useDockLayoutStore.getState().openPanels.has("renders")).toBe(false);
    expect(host.querySelector('[data-testid="content-renders"]')).toBeNull();
    // dockview's own panel-active event dispatch resolves on a microtask, one
    // tick after the synchronous store call returns; `act(async ...)` is what
    // actually waits for it instead of asserting against pre-flush DOM.
    await act(async () => {
      useDockLayoutStore.getState().togglePanel("renders");
      await Promise.resolve();
    });
    expect(useDockLayoutStore.getState().openPanels.has("renders")).toBe(true);
    expect(host.querySelector('[data-testid="content-renders"]')).not.toBeNull();
  });

  it("keeps a panel's custom title when it is closed and reopened", async () => {
    const host = mount("p1", { renders: "Renders (2)" });
    expect(host.textContent).toContain("Renders (2)");
    act(() => useDockLayoutStore.getState().closePanel("renders"));
    await act(async () => {
      useDockLayoutStore.getState().togglePanel("renders");
      await Promise.resolve();
    });
    expect(host.textContent).toContain("Renders (2)");
  });

  it("reopens a closed panel as a tab of its zone's group, not a new group", () => {
    mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("compositions"));
    act(() => useDockLayoutStore.getState().togglePanel("compositions"));
    expect(persistedGroupOf("compositions")).toContain('"assets"');
  });

  it("reopens a side panel next to the preview when its whole column was closed", () => {
    mount("p1");
    const { closePanel, togglePanel } = useDockLayoutStore.getState();
    for (const id of ["compositions", "assets", "code", "catalog"] as const)
      act(() => closePanel(id));
    act(() => togglePanel("compositions"));
    expect(useDockLayoutStore.getState().openPanels.has("compositions")).toBe(true);
    expect(useDockLayoutStore.getState().visiblePanels.has("compositions")).toBe(true);
  });

  it("reopens a side panel beside preview when its usual tab neighbour is closed", () => {
    mount("p1");
    const { closePanel, togglePanel } = useDockLayoutStore.getState();
    for (const id of ["compositions", "assets", "code", "catalog"] as const)
      act(() => closePanel(id));
    addRegisteredPanel.mockClear();
    act(() => togglePanel("assets"));
    expect(addRegisteredPanel).toHaveBeenCalledWith(expect.anything(), "assets", { referencePanel: "preview", direction: "left" });
    expect(dockApi!.getPanel("assets")!.group).not.toBe(dockApi!.getPanel("preview")!.group);
  });

  it("reopens the timeline as its own group, never as a tab of the preview", () => {
    mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("timeline"));
    act(() => useDockLayoutStore.getState().togglePanel("timeline"));
    expect(persistedGroupOf("timeline")).not.toContain('"preview"');
  });

  it("reopens preview between the side columns and keeps the timeline below", () => {
    mount("p1");
    function hierarchy(node: ReturnType<DockviewApi["toJSON"]>["grid"]["root"]): unknown {
      return node.type === "leaf" ? node.data.views : node.data.map(hierarchy);
    }
    const before = hierarchy(dockApi!.toJSON().grid.root);
    act(() => useDockLayoutStore.getState().closePanel("preview"));
    act(() => useDockLayoutStore.getState().activatePanel("preview"));
    expect(hierarchy(dockApi!.toJSON().grid.root)).toEqual(before);
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
    act(() => dockApi!.getPanel("preview")!.group.api.maximize());
    act(() => useDockLayoutStore.getState().activatePanel("preview"));
    expect(dockApi!.getPanel("preview")!.group.api.isMaximized()).toBe(true);
  });

  it("recovers a preview closed before reload through the permanent header button", () => {
    mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("preview"));
    act(() => vi.advanceTimersByTime(400));
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";
    const host = mount("p1");
    const button = host.querySelector<HTMLButtonElement>('[aria-label="Open preview"]')!;
    expect(button).not.toBeNull();
    act(() => button.click());
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
    expect(dockApi!.getPanel("preview")!.group).not.toBe(dockApi!.getPanel("timeline")!.group);
    act(() => button.click());
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
  });

  it("restores preview after every panel is closed and can recover a maximized layout", () => {
    const host = mount("p1");
    act(() => { for (const id of [...useDockLayoutStore.getState().openPanels]) useDockLayoutStore.getState().closePanel(id); });
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Open preview"]')!.click());
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
    act(() => useDockLayoutStore.getState().activatePanel("design"));
    act(() => dockApi!.getPanel("design")!.group.api.maximize());
    act(() => useDockLayoutStore.getState().activatePanel("preview"));
    expect(dockApi!.getPanel("design")!.group.api.isMaximized()).toBe(false);
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
  });

  it("applies persistent layout presets and restores the full editor", () => {
    mount("p1");
    act(() => applyMotionLayout("preview"));
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(["preview"]));
    expect(persistedGroupOf("preview")).toBe('"preview"');
    act(() => useDockLayoutStore.getState().activatePanel("assets"));
    expect(dockApi!.getPanel("assets")!.group).not.toBe(dockApi!.getPanel("preview")!.group);
    expect(useDockLayoutStore.getState().visiblePanels.has("preview")).toBe(true);
    act(() => applyMotionLayout("code"));
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(["preview", "timeline", "code"]));
    act(() => applyMotionLayout("edit"));
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(DEFAULT_OPEN));
    act(() => useDockLayoutStore.getState().activatePanel("history"));
    expect(persistedGroupOf("history")).toContain('"design"');
  });

  it("restores the stored layout on the next mount instead of rebuilding the default", () => {
    mount("p1");
    act(() => useDockLayoutStore.getState().closePanel("renders"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => root?.unmount());
    root = null;
    document.body.innerHTML = "";

    mount("p1");
    expect(useDockLayoutStore.getState().openPanels.has("renders")).toBe(false);
  });

  it("falls back to the default layout when the stored one names an unknown panel", () => {
    localStorage.setItem(
      "hf-studio-ui-preferences:p1",
      JSON.stringify({ dockLayout: { grid: {}, panels: { nope: {} } } }),
    );
    const host = mount("p1");
    expect(host.querySelector('[data-testid="content-preview"]')).not.toBeNull();
  });
});

describe("Dock wiring", () => {
  it("re-applies the side minimums when a panel is dragged to another group", () => {
    mount(null);
    applySideMinimums.mockClear();
    const preview = dockApi?.getPanel("preview");
    const design = dockApi?.getPanel("design");
    if (!preview || !design) throw new Error("default layout is missing panels");
    act(() => design.api.moveTo({ group: preview.group }));
    expect(applySideMinimums).toHaveBeenCalled();
  });

  it("makes the sashes keyboard-focusable separators", () => {
    const host = mount(null);
    const sashes = host.querySelectorAll<HTMLElement>('.dv-sash[role="separator"]');
    expect(sashes.length).toBeGreaterThan(0);
    for (const sash of sashes) expect(sash.tabIndex).toBe(0);
  });

  it("re-fits the side columns to the window width when it resizes", () => {
    mount(null);
    const innerWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 560, configurable: true });
    try {
      applySideMinimums.mockClear();
      const dockObservers = [...liveObservers].filter(({ target }) =>
        target?.classList.contains("hf-dock"),
      );
      act(() => dockObservers.forEach(({ callback }) => callback()));
      expect(applySideMinimums).toHaveBeenCalledWith(expect.anything(), 560, false);
    } finally {
      Object.defineProperty(window, "innerWidth", { value: innerWidth, configurable: true });
    }
  });
});

// A host app mounts a subset of Studio's panels under its own storage key and width.
describe("a host's dock", () => {
  const panels = ["preview", "timeline", "assets", "renders"] as const;
  const hostDock = { panels, storageKey: "host-dock" };

  it("builds only its panels, a side column each, and its Window menu lists only them", () => {
    const host = mount("p1", {}, hostDock);
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(panels));
    expect(useDockLayoutStore.getState().visiblePanels).toEqual(new Set(panels));
    expect(dockApi?.getPanel("assets")?.group.id).not.toBe(dockApi?.getPanel("renders")?.group.id);
    const menu = [...host.querySelectorAll("button")].find((b) => b.textContent === "Window");
    act(() => menu?.click());
    const items = [...host.querySelectorAll('[role="menuitemcheckbox"]')].map((i) => i.textContent);
    expect(items).toEqual(["✓Preview", "✓Timeline", "✓Assets", "✓Renders"]);
  });

  it("keeps its layout alone under its own key, never in Studio's preferences", () => {
    mount("p1", {}, hostDock);
    act(() => useDockLayoutStore.getState().closePanel("renders"));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const stored = readStudioUiPreferences(undefined, "p1", "host-dock").dockLayout;
    expect(Object.keys(stored?.panels ?? {}).sort()).toEqual(["assets", "preview", "timeline"]);
    expect(readStudioUiPreferences(undefined, "p1").dockLayout).toBeUndefined();
  });

  it("falls back to its default when a stored layout names a panel it lacks", () => {
    mount("p1");
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const studio = readStudioUiPreferences(undefined, "p1").dockLayout;
    act(() => root?.unmount());
    root = null;
    localStorage.setItem("host-dock:p1", JSON.stringify({ dockLayout: studio }));
    mount("p1", {}, hostDock);
    expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(panels));
  });

  it("reopens a panel beside the preview when the panel it reopens near is not in the dock", () => {
    mount("p1", {}, hostDock);
    act(() => useDockLayoutStore.getState().closePanel("assets"));
    act(() => useDockLayoutStore.getState().togglePanel("assets"));
    expect(useDockLayoutStore.getState().visiblePanels.has("assets")).toBe(true);
  });

  it("sizes its sides against its own width, not the window's", () => {
    mount(null, {}, { ...hostDock, dockWidth: () => 700 });
    applySideMinimums.mockClear();
    const dockObservers = [...liveObservers].filter(({ target }) =>
      target?.classList.contains("hf-dock"),
    );
    act(() => dockObservers.forEach(({ callback }) => callback()));
    expect(applySideMinimums).toHaveBeenCalledWith(expect.anything(), 700, false);
  });
});

describe("parseDockLayout", () => {
  it("rejects shapes that are not a dock layout", () => {
    expect(parseDockLayout(null)).toBeNull();
    expect(parseDockLayout({ grid: {}, panels: {} })).toBeNull();
    expect(
      parseDockLayout({
        grid: {
          width: 1,
          height: 1,
          orientation: "HORIZONTAL",
          root: { type: "leaf", data: { views: ["ghost"] } },
        },
        panels: { ghost: { id: "ghost", contentComponent: "panel" } },
      }),
    ).toBeNull();
  });

  const placed = (views: string[], panelIds: string[]) => ({
    grid: {
      width: 1,
      height: 1,
      orientation: "HORIZONTAL",
      root: { type: "leaf", data: { views } },
    },
    panels: Object.fromEntries(panelIds.map((id) => [id, { id, contentComponent: "panel" }])),
  });

  it("rejects a view that has no panel entry and a panel that no view places", () => {
    expect(parseDockLayout(placed(["preview", "design"], ["preview"]))).toBeNull();
    expect(parseDockLayout(placed(["preview"], ["preview", "design"]))).toBeNull();
    expect(parseDockLayout(placed(["preview", "design"], ["preview", "design"]))).not.toBeNull();
  });
});

function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return <button data-testid="change-language" onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}>Language</button>;
}

it('changes native dock titles live without recreating panels, preview or layout', () => {
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  act(() => root?.render(<I18nProvider initialLocale="en"><Dock.Root projectId="p1">
    <LocaleSwitcher />
    {PANEL_IDS.map(id => <Dock.Panel key={id} id={id}>
      {id === 'preview' ? <iframe title="Project preview" srcDoc="<p>Preview</p>" /> : <div>{id}</div>}
    </Dock.Panel>)}
  </Dock.Root></I18nProvider>));
  const preview = host.querySelector('iframe');
  const api = dockApi!;
  const groupId = api.getPanel('preview')!.group.id;
  act(() => api.getPanel('preview')!.api.setSize({ width: 650 }));
  const grid = JSON.stringify(api.toJSON().grid);
  const switchLanguage = () => act(() => host.querySelector<HTMLButtonElement>('[data-testid="change-language"]')!.click());
  expect(api.getPanel('preview')!.title).toBe('Preview');
  switchLanguage();
  expect(api.getPanel('preview')!.title).toBe('预览');
  expect(api.getPanel('compositions')!.title).toBe('片段');
  expect(api.getPanel('preview')!.group.id).toBe(groupId);
  expect(JSON.stringify(api.toJSON().grid)).toBe(grid);
  expect(host.querySelector('iframe')).toBe(preview);
  act(() => useDockLayoutStore.getState().activatePanel('history'));
  expect(api.getPanel('history')!.title).toBe('版本历史');
  switchLanguage();
  expect(api.getPanel('history')!.title).toBe('Version history');
  expect(api.getPanel('preview')!.title).toBe('Preview');
  expect(host.querySelector('iframe')).toBe(preview);
});

it("adds a missing allowed side panel to an existing MVP layout without resetting divider sizes", () => {
  const options = { fixedLayout: true, storageKey: "motion.mvp.dock.v1" };
  mount("p1", {}, { ...options, panels: MVP_PANEL_IDS.filter(id => id !== "layers") });
  act(() => {
    dockApi!.getPanel("compositions")!.api.setSize({ width: 320 });
    vi.advanceTimersByTime(1000);
  });
  const leftWidth = dockApi!.getPanel("compositions")!.group.width;
  const rightWidth = dockApi!.getPanel("design")!.group.width;
  act(() => root?.unmount());
  root = null;

  const host = mount("p1", {}, { ...options, panels: MVP_PANEL_IDS });
  expect(dockApi!.getPanel("layers")?.group.id).toBe(dockApi!.getPanel("design")!.group.id);
  expect(dockApi!.getPanel("compositions")!.group.width).toBe(leftWidth);
  expect(dockApi!.getPanel("design")!.group.width).toBe(rightWidth);
  act(() => useDockLayoutStore.getState().activatePanel("layers"));
  expect(host.querySelector('[data-testid="content-layers"]')).not.toBeNull();
  expect(dockApi!.getPanel("code")).toBeUndefined();
});

it("keeps the MVP panels fixed, rejects hidden panels, and restores divider sizes", () => {
  mount("p1", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, storageKey: "motion.mvp.dock.v1" });
  const store = useDockLayoutStore.getState();
  expect(store.openPanels).toEqual(new Set(MVP_PANEL_IDS));
  act(() => {
    store.closePanel("preview");
    store.closePanel("assets");
    store.activatePanel("code");
    dockApi!.getPanel("compositions")!.api.setSize({ width: 320 });
    vi.advanceTimersByTime(1000);
  });
  expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(MVP_PANEL_IDS));
  expect(dockApi!.getPanel("timeline")!.group.header.hidden).toBe(true);
  expect(dockApi!.getPanel("preview")!.group.header.hidden).toBe(false);
  const saved = dockApi!.toJSON();
  expect(saved.panels.code).toBeUndefined();
  act(() => root?.unmount());
  root = null;
  mount("p1", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, storageKey: "motion.mvp.dock.v1" });
  expect(dockApi!.toJSON().grid).toEqual(saved.grid);
  expect(dockApi!.getPanel("timeline")!.group.header.hidden).toBe(true);
  expect(useDockLayoutStore.getState().openPanels).toEqual(new Set(MVP_PANEL_IDS));
});


it("keeps version history outside the MVP dock", () => {
  mount("p1", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, storageKey: "motion.mvp.dock.v1" });
  act(() => useDockLayoutStore.getState().activatePanel("history"));
  expect(dockApi!.getPanel("history")).toBeUndefined();
});

it("expands only the MVP preview and restores layout without remounting the player", () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root?.render(
    <I18nProvider initialLocale="en"><StudioHostContext.Provider value={{ mvpEditor: true }}>
      <Dock.Root projectId="p1" panels={MVP_PANEL_IDS} fixedLayout storageKey="motion.mvp.dock.v1">
        {MVP_PANEL_IDS.map(id => <Dock.Panel key={id} id={id}>
          {id === "preview" ? <iframe title="Preview player" /> : <div>{id}</div>}
        </Dock.Panel>)}
      </Dock.Root>
    </StudioHostContext.Provider></I18nProvider>,
  ));
  const api = dockApi!;
  act(() => {
    api.getPanel("compositions")!.api.setSize({ width: 310 });
    api.getPanel("layers")!.api.setActive();
    vi.advanceTimersByTime(1000);
  });
  const grid = api.toJSON().grid;
  const player = host.querySelector("iframe");
  const animation = { cancel: vi.fn(), onfinish: null };
  const animate = vi.fn(() => animation);
  Object.defineProperty(api.getPanel("preview")!.view.content.element, "animate", { value: animate, configurable: true });
  const click = (label: string) => act(() => host.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!
    .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })));
  click("Expand preview");
  expect(animate).toHaveBeenCalledWith(expect.any(Array), { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  expect(api.getPanel("preview")!.group.api.isMaximized()).toBe(true);
  expect(host.querySelector("iframe")).toBe(player);
  expect(document.fullscreenElement).toBeFalsy();
  act(() => vi.advanceTimersByTime(1000));
  expect(readStudioUiPreferences(undefined, "p1", "motion.mvp.dock.v1").dockLayout?.grid).toEqual(grid);
  click("Restore preview");
  expect(api.hasMaximizedGroup()).toBe(false);
  expect(api.toJSON().grid).toEqual(grid);
  expect(host.querySelector("iframe")).toBe(player);
  click("Expand preview");
  const exitComposition = vi.fn();
  window.addEventListener("keydown", exitComposition);
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })));
  window.removeEventListener("keydown", exitComposition);
  expect(exitComposition).not.toHaveBeenCalled();
  expect(api.hasMaximizedGroup()).toBe(false);
  expect(api.toJSON().grid).toEqual(grid);
  expect(host.querySelector("iframe")).toBe(player);
  expect(document.activeElement).toBe(host.querySelector('[aria-label="Expand preview"]'));
  expect(animation.cancel).toHaveBeenCalled();
  const calls = animate.mock.calls.length;
  const reduced = vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
  try {
    click("Expand preview");
    expect(api.hasMaximizedGroup()).toBe(true);
    expect(animate).toHaveBeenCalledTimes(calls);
    click("Restore preview");
    expect(api.toJSON().grid).toEqual(grid);
  } finally {
    reduced.mockRestore();
  }
});

it("collapses both MVP sides into rails, restores their tabs and widths, and preserves the preview", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root?.render(
    <I18nProvider initialLocale="en"><StudioHostContext.Provider value={{ mvpEditor: true }}>
      <Dock.Root projectId="p1" panels={MVP_PANEL_IDS} fixedLayout dockWidth={() => 1400} storageKey="motion.mvp.dock.v1">
        {MVP_PANEL_IDS.map(id => <Dock.Panel key={id} id={id}>
          {id === "preview" ? <iframe title="Preview player" /> : <textarea aria-label={`${id} draft`} defaultValue="Keep draft" />}
        </Dock.Panel>)}
      </Dock.Root>
    </StudioHostContext.Provider></I18nProvider>,
  ));
  const api = dockApi!;
  act(() => {
    api.layout(1400, 800);
    api.getPanel("compositions")!.group.api.setSize({ width: 310 });
    vi.advanceTimersByTime(1000);
  });
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  const preview = api.getPanel("preview")!.group;
  const widths = [left.width, right.width, preview.width];
  const saved = readStudioUiPreferences(undefined, "p1", "motion.mvp.dock.v1").dockLayout;
  const player = host.querySelector("iframe");
  const draft = host.querySelector('[aria-label="compositions draft"]');
  const click = async (label: string) => act(async () => {
    host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click();
    await Promise.resolve();
  });
  await click("Collapse left panel");
  expect(right.width).toBe(widths[1]);
  await click("Collapse right panel");
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  expect(preview.width).toBeGreaterThan(widths[2]!);
  expect(host.querySelectorAll(".hf-dock-side-rail")).toHaveLength(2);
  expect(host.querySelector('[aria-label="compositions draft"]')).toBe(draft);
  expect(draft?.closest('[inert]')).not.toBeNull();
  act(() => {
    dockLayout.applySideMinimums(api, 1000);
    vi.advanceTimersByTime(1000);
  });
  expect(left.width).toBe(48);
  expect(readStudioUiPreferences(undefined, "p1", "motion.mvp.dock.v1").dockLayout).toEqual(saved);
  await click("Expand preview");
  await click("Restore preview");
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  expect(host.querySelector("iframe")).toBe(player);
  await click("Expand left panel");
  expect(left.width).toBe(widths[0]);
  expect(draft?.closest('[inert]')).toBeNull();
  await click("Layers");
  expect(right.width).toBe(widths[1]);
  expect(right.activePanel?.id).toBe("layers");
  expect(host.querySelectorAll(".hf-dock-side-rail")).toHaveLength(0);
  expect(host.querySelector("iframe")).toBe(player);
  await click("Collapse right panel");
  await click("Expand preview");
  await act(async () => useDockLayoutStore.getState().activatePanel("layers"));
  expect(api.hasMaximizedGroup()).toBe(false);
  expect(right.width).toBe(widths[1]);
  expect(right.activePanel?.id).toBe("layers");
});


it("animates side widths, reverses from the current width, and leaves the opposite side and player intact", () => {
  mount("motion", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => 1400 });
  const api = dockApi!;
  act(() => api.layout(1400, 800));
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  const preview = api.getPanel("preview")!.group;
  const initial = { left: left.width, right: right.width, preview: preview.width };
  const controller = useDockLayoutStore.getState().controller!;
  act(() => controller.setGroupCollapsed!("compositions", true, true));
  expect(left.width).toBe(initial.left);
  act(() => vi.advanceTimersByTime(64));
  expect(left.width).toBeGreaterThan(48);
  expect(left.width).toBeLessThan(initial.left);
  expect(right.width).toBe(initial.right);
  expect(preview.width).toBeGreaterThan(initial.preview);
  const halfway = left.width;
  act(() => controller.setGroupCollapsed!("compositions", false, true));
  expect(left.width).toBe(halfway);
  act(() => vi.advanceTimersByTime(240));
  expect(left.width).toBe(initial.left);
  expect(left.element.hasAttribute("data-side-motion")).toBe(false);
  act(() => {
    controller.setGroupCollapsed!("compositions", true, true);
    controller.setGroupCollapsed!("design", true, true);
    vi.advanceTimersByTime(240);
  });
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  act(() => {
    controller.setGroupCollapsed!("compositions", false, true);
    controller.setGroupCollapsed!("design", false, true);
    vi.advanceTimersByTime(240);
  });
  expect(left.width).toBe(initial.left);
  expect(right.width).toBe(initial.right);
});

it("skips side motion when reduced motion is requested", () => {
  const media = vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  } as unknown as MediaQueryList);
  try {
    mount("reduced", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => 1400 });
    act(() => dockApi!.layout(1400, 800));
    const left = dockApi!.getPanel("compositions")!.group;
    act(() => useDockLayoutStore.getState().controller!.setGroupCollapsed!("compositions", true, true));
    expect(left.width).toBe(48);
    expect(left.element.hasAttribute("data-side-motion")).toBe(false);
  } finally {
    media.mockRestore();
  }
});


it("opens the compact MVP with both rails and a 30% timeline, without locking divider resizing", () => {
  mount("compact", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, initialCompactLayout: true, dockWidth: () => 1400 });
  const api = dockApi!;
  act(() => { api.layout(1400, 800); vi.advanceTimersByTime(32); });
  expect(api.getPanel("compositions")!.group.width).toBe(48);
  expect(api.getPanel("design")!.group.width).toBe(48);
  expect(useDockLayoutStore.getState().collapsedZones).toEqual(expect.arrayContaining(["left", "right"]));
  const timeline = api.getPanel("timeline")!.group;
  expect(timeline.height).toBe(240);
  act(() => timeline.api.setSize({ height: 360 }));
  expect(timeline.height).toBe(360);
  act(() => api.layout(1400, 800));
  expect(timeline.height).toBe(360);
  act(() => useDockLayoutStore.getState().controller!.setGroupCollapsed!("design", false));
  expect(api.getPanel("design")!.group.width).toBeGreaterThan(48);
  expect(timeline.height).toBe(360);
});


it("collapses MVP sides when the host narrows, preserves content, and allows explicit reopening", () => {
  let width = 1400;
  const host = mount("responsive", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => width });
  const api = dockApi!;
  act(() => api.layout(width, 800));
  const content = host.querySelector('[data-testid="content-preview"]');
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  act(() => api.getPanel("catalog")!.api.setActive());
  const resize = (nextWidth: number) => act(() => {
    width = nextWidth;
    [...liveObservers].filter(({ target }) => target?.classList.contains("hf-dock"))
      .forEach(({ callback }) => callback());
    api.layout(width, 800);
  });
  resize(800);
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  expect(left.activePanel?.id).toBe("catalog");
  expect(host.querySelector('[data-testid="content-preview"]')).toBe(content);
  act(() => useDockLayoutStore.getState().activatePanel("assets"));
  resize(800); // A height-only resize must not close a manually opened side.
  expect(left.width).toBeGreaterThan(48);
  expect(right.width).toBe(48);
  resize(739);
  expect(left.width).toBe(0);
  resize(1400);
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  resize(320);
  expect(left.width).toBe(0);
  expect(right.width).toBe(0);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(308);
  resize(800);
  expect(left.width).toBe(48);
  expect(right.width).toBe(48);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThan(0);
  expect(host.querySelector('[data-testid="content-preview"]')).toBe(content);
});

it.each([740, 800, 1000])("keeps compact sides exclusive and readable at %ipx across activation and animation reversal", (width) => {
  const host = mount("exclusive", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => width });
  const api = dockApi!;
  act(() => api.layout(width, 800));
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  const content = host.querySelector('[data-testid="content-preview"]');
  const controller = useDockLayoutStore.getState().controller!;
  act(() => controller.setGroupCollapsed!("design", false, true));
  act(() => vi.advanceTimersByTime(240));
  expect(left.width).toBe(48);
  expect(right.width).toBeGreaterThanOrEqual(260);
  act(() => useDockLayoutStore.getState().activatePanel("assets"));
  expect(right.width).toBe(48);
  expect(left.width).toBeGreaterThanOrEqual(260);
  expect(left.activePanel?.id).toBe("assets");
  act(() => {
    controller.setGroupCollapsed!("design", false, true);
    vi.advanceTimersByTime(64);
    controller.setGroupCollapsed!("compositions", false, true);
    vi.advanceTimersByTime(240);
    dockLayout.applySideMinimums(api, width, true);
  });
  expect(right.width).toBe(48);
  expect(left.width).toBeGreaterThanOrEqual(260);
  expect(useDockLayoutStore.getState().collapsedZones).toEqual(["right"]);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(360);
  expect(left.width + right.width + api.getPanel("preview")!.group.width).toBeLessThanOrEqual(width);
  expect(host.querySelector('[data-testid="content-preview"]')).toBe(content);
});


it.each([320, 480, 640, 739])("keeps both sides hidden at %ipx even when explicitly activated", (width) => {
  const host = mount("preview-first", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => width });
  const api = dockApi!;
  act(() => api.layout(width, 800));
  const content = host.querySelector('[data-testid="content-preview"]');
  for (const id of ["design", "assets", "layers", "catalog"] as const) {
    act(() => {
      useDockLayoutStore.getState().controller!.setGroupCollapsed!(id, false, true);
      useDockLayoutStore.getState().activatePanel(id);
      vi.advanceTimersByTime(240);
    });
    expect(api.getPanel(id)!.group.width).toBe(0);
    expect(api.getPanel(id)!.group.element.classList.contains("hf-dock-side-hidden")).toBe(true);
    expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(width - 12);
    expect(useDockLayoutStore.getState().collapsedZones).toEqual(expect.arrayContaining(["left", "right"]));
  }
  expect(host.querySelector('[data-testid="content-preview"]')).toBe(content);
});

it("collapses oversized remembered sides when reopening would crowd the preview on a wide host", () => {
  mount("remembered-width", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => 1200 });
  const api = dockApi!;
  act(() => api.layout(1200, 800));
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  const controller = useDockLayoutStore.getState().controller!;
  act(() => {
    controller.setGroupCollapsed!("design", true);
    left.api.setSize({ width: 650 });
    controller.setGroupCollapsed!("compositions", true);
    controller.setGroupCollapsed!("design", false);
    controller.setGroupCollapsed!("compositions", false);
  });
  expect(right.width).toBe(48);
  expect(left.width).toBeGreaterThanOrEqual(260);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(360);
});


it("finishes an in-flight opening before narrowing into preview-only mode", () => {
  let width = 800;
  mount("resize-motion", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => width });
  const api = dockApi!;
  act(() => {
    api.layout(width, 800);
    useDockLayoutStore.getState().controller!.setGroupCollapsed!("design", false, true);
    vi.advanceTimersByTime(64);
    width = 480;
    [...liveObservers].filter(({ target }) => target?.classList.contains("hf-dock"))
      .forEach(({ callback, target }) => (callback as (entries: unknown[]) => void)([{ target, contentRect: { width, height: 800 } }]));
    api.layout(width, 800);
    vi.advanceTimersByTime(240);
  });
  expect(api.getPanel("design")!.group.width).toBe(0);
  expect(api.getPanel("compositions")!.group.width).toBe(0);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(468);
});


it("retains both sides' 260px minimum through resizing and side-panel animations", () => {
  mount("narrow-library", {}, { panels: MVP_PANEL_IDS, fixedLayout: true, dockWidth: () => 1400 });
  const api = dockApi!;
  act(() => api.layout(1400, 800));
  const left = api.getPanel("compositions")!.group;
  const right = api.getPanel("design")!.group;
  const controller = useDockLayoutStore.getState().controller!;
  act(() => {
    controller.setGroupCollapsed!("compositions", false);
    left.api.setSize({ width: 260 });
  });
  expect(left.width).toBe(260);
  act(() => {
    controller.setGroupCollapsed!("compositions", true, true);
    vi.advanceTimersByTime(240);
    controller.setGroupCollapsed!("compositions", false, true);
    vi.advanceTimersByTime(240);
    controller.setGroupCollapsed!("design", false, true);
    vi.advanceTimersByTime(240);
    dockLayout.applySideMinimums(api, 1400, true);
    left.api.setSize({ width: 220 });
    right.api.setSize({ width: 260 });
  });
  expect(left.width).toBe(260);
  expect(left.minimumWidth).toBe(260);
  expect(right.width).toBe(260);
  expect(right.minimumWidth).toBe(260);
  act(() => {
    controller.setGroupCollapsed!("design", true, true);
    vi.advanceTimersByTime(240);
    controller.setGroupCollapsed!("design", false, true);
    vi.advanceTimersByTime(240);
    right.api.setSize({ width: 220 });
  });
  expect(right.width).toBe(260);
  expect(right.minimumWidth).toBe(260);
  expect(api.getPanel("preview")!.group.width).toBeGreaterThanOrEqual(360);
});
