import type { Direction, DockviewApi } from "dockview-react";
import { DOCK_PANEL_COMPONENT } from "./dockLayoutSchema";
import { PANEL_DEFINITIONS, PANEL_IDS, isPanelId, type PanelId } from "./panelRegistry";

export const MIN_PREVIEW_W = 360;
const MIN_PREVIEW_H = 200;
const MIN_TIMELINE_H = 100;
const MIN_SIDE_W = 200;
const MIN_SIDE_W_FLOOR = 120;
const DEFAULT_TIMELINE_H = 360;
const DEFAULT_LEFT = ["compositions", "assets", "code", "catalog"] as const;
const DEFAULT_RIGHT = ["design", "layers", "renders", "variables", "motionBlur"] as const;
export const COLLAPSED_SIDE_WIDTH = 48;
const COMPACT_SIDE_WIDTH = 320;
export const DOCK_GAPS = 12;
// Breakpoints derive from usable panel sizes, not an independent viewport guess.
export const COMPACT_DOCK_WIDTH = MIN_PREVIEW_W + 2 * COMPACT_SIDE_WIDTH + DOCK_GAPS;
export const PREVIEW_ONLY_DOCK_WIDTH = MIN_PREVIEW_W + COMPACT_SIDE_WIDTH + COLLAPSED_SIDE_WIDTH + DOCK_GAPS;
export const collapsedSideWidth = (width: number, fixedLayout = false) =>
  fixedLayout && width < PREVIEW_ONLY_DOCK_WIDTH ? 0 : COLLAPSED_SIDE_WIDTH;
export const isSideCollapsed = (group: DockviewApi["groups"][number]) =>
  group.element.classList.contains("hf-dock-side-collapsed");

/** Preferred side widths; when they overflow the preview's floor the right yields first, then the left. */
export function defaultSideWidths(viewportWidth: number) {
  const floor = sideMinimumWidth(viewportWidth);
  const left = Math.max(floor, Math.min(384, Math.max(260, Math.round(viewportWidth * 0.257))));
  const right = Math.max(Math.min(280, floor), Math.min(424, Math.round(viewportWidth * 0.284)));
  const excess = left + right - Math.max(0, viewportWidth - MIN_PREVIEW_W);
  if (excess <= 0) return { left, right };
  const shrunkRight = Math.max(floor, right - excess);
  return { left: Math.max(floor, left - (excess - (right - shrunkRight))), right: shrunkRight };
}

/**
 * Fixed MVP sides keep their readable control width; the controller collapses them
 * when space runs out. Free-layout sides retain the native shrinking policy.
 */
export function sideMinimumWidth(dockWidth: number, fixedLayout = false): number {
  if (fixedLayout) return COMPACT_SIDE_WIDTH;
  const fair = Math.floor((dockWidth - MIN_PREVIEW_W) / 2);
  return Math.min(MIN_SIDE_W, Math.max(MIN_SIDE_W_FLOOR, fair));
}

export function previewMinimumWidth(dockWidth: number, fixedLayout: boolean): number {
  if (!fixedLayout) return MIN_PREVIEW_W;
  return Math.min(MIN_PREVIEW_W, Math.max(0, dockWidth - 2 * collapsedSideWidth(dockWidth, true) - DOCK_GAPS));
}

function holdsPreview(group: DockviewApi["groups"][number]) {
  return group.panels.some((panel) => panel.id === "preview");
}

/** The zone of a group whose every tab is a side panel, else null. */
export function sideZone(group: DockviewApi["groups"][number]): "left" | "right" | null {
  const zones = group.panels.map((panel) =>
    isPanelId(panel.id) ? PANEL_DEFINITIONS[panel.id].zone : "center",
  );
  const first = zones[0];
  const allSide = zones.every((zone) => zone !== "center");
  return allSide && first && first !== "center" ? first : null;
}

/** Idempotent; rewrites every group's minimum, since dockview keeps a constraint once set. */
export function applySideMinimums(api: DockviewApi, dockWidth = window.innerWidth, fixedLayout = false) {
  const minimumWidth = sideMinimumWidth(dockWidth, fixedLayout);
  const compact = fixedLayout && dockWidth < COMPACT_DOCK_WIDTH;
  const cap = defaultSideWidths(dockWidth);
  const railWidth = collapsedSideWidth(dockWidth, fixedLayout);
  for (const group of api.groups) {
    group.element.classList.toggle("hf-dock-side-hidden", railWidth === 0 && !!sideZone(group));
    if (group.element.hasAttribute("data-side-motion")) continue;
    if (isSideCollapsed(group)) {
      group.api.setConstraints({ minimumWidth: railWidth, maximumWidth: railWidth });
      group.api.setSize({ width: railWidth });
      continue;
    }
    if (holdsPreview(group)) {
      group.api.setConstraints({ minimumWidth: previewMinimumWidth(dockWidth, fixedLayout) });
      continue;
    }
    group.api.setConstraints({ minimumWidth, maximumWidth: Number.POSITIVE_INFINITY });
    const zone = sideZone(group);
    const limit = zone === "right" ? cap.right : cap.left;
    if (zone && !compact && minimumWidth < MIN_SIDE_W && group.width > limit) {
      group.api.setSize({ width: limit });
    }
  }
}

function minimumSize(id: PanelId) {
  if (id === "preview") return { minimumWidth: MIN_PREVIEW_W, minimumHeight: MIN_PREVIEW_H };
  if (id === "timeline") return { minimumHeight: MIN_TIMELINE_H };
  return { minimumWidth: MIN_SIDE_W };
}

export function addRegisteredPanel(
  api: DockviewApi,
  id: PanelId,
  position?: { referencePanel?: PanelId; direction: Direction },
) {
  return api.addPanel({
    id,
    component: DOCK_PANEL_COMPONENT,
    title: PANEL_DEFINITIONS[id].title,
    renderer: "always",
    ...minimumSize(id),
    ...(position ? { position } : {}),
  });
}

function addSideColumn(
  api: DockviewApi,
  ids: readonly PanelId[],
  panels: readonly PanelId[],
  direction: "left" | "right",
) {
  const [first, ...rest] = ids.filter((id) => panels.includes(id));
  if (!first) return undefined;
  addRegisteredPanel(api, first, { referencePanel: "preview", direction });
  for (const id of rest)
    addRegisteredPanel(api, id, { referencePanel: first, direction: "within" });
  api.getPanel(first)?.api.setActive();
  return first;
}

/** The default Edit layout: [library | preview | inspector] over a full-width timeline. */
export function buildEditLayout(
  api: DockviewApi,
  viewportWidth: number,
  panels: readonly PanelId[] = PANEL_IDS,
) {
  api.clear();
  const widths = defaultSideWidths(viewportWidth);
  addRegisteredPanel(api, "preview");
  addRegisteredPanel(api, "timeline", { referencePanel: "preview", direction: "below" });
  const left = addSideColumn(api, DEFAULT_LEFT, panels, "left");
  const right = addSideColumn(api, DEFAULT_RIGHT, panels, "right");
  applySideMinimums(api, viewportWidth);
  if (left) api.getPanel(left)?.group.api.setSize({ width: widths.left });
  if (right) api.getPanel(right)?.group.api.setSize({ width: widths.right });
  api.getPanel("timeline")?.group.api.setSize({ height: DEFAULT_TIMELINE_H });
}
