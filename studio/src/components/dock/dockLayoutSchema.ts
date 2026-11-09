import type { SerializedDockview } from "dockview-react";
import { PANEL_IDS, isPanelId, type PanelId } from "./panelRegistry";

export const DOCK_PANEL_COMPONENT = "panel";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectLeafViews(node: unknown, into: unknown[]): boolean {
  if (!isRecord(node)) return false;
  if (node.type === "leaf") {
    if (!isRecord(node.data) || !Array.isArray(node.data.views)) return false;
    into.push(...node.data.views);
    return true;
  }
  if (node.type === "branch") {
    return Array.isArray(node.data) && node.data.every((child) => collectLeafViews(child, into));
  }
  return false;
}

function hasGridShape(grid: Record<string, unknown>): boolean {
  const oriented = grid.orientation === "HORIZONTAL" || grid.orientation === "VERTICAL";
  return oriented && typeof grid.width === "number" && typeof grid.height === "number";
}

function panelsAreRegistered(
  panels: Record<string, unknown>,
  allowed: readonly PanelId[],
): boolean {
  const ids = Object.keys(panels);
  return (
    ids.length > 0 &&
    ids.every((id) => {
      const state = panels[id];
      return (
        isPanelId(id) &&
        allowed.includes(id) &&
        isRecord(state) &&
        state.id === id &&
        state.contentComponent === DOCK_PANEL_COMPONENT
      );
    })
  );
}

function collectFloatingViews(floating: unknown, into: unknown[]): boolean {
  if (floating === undefined) return true;
  if (!Array.isArray(floating)) return false;
  return floating.every((group) => {
    if (!isRecord(group) || !isRecord(group.data) || !Array.isArray(group.data.views)) return false;
    into.push(...group.data.views);
    return true;
  });
}

/** Parses a stored layout at the trust boundary; null (stale or foreign shape) means use the default preset. */
export function parseDockLayout(
  value: unknown,
  allowed: readonly PanelId[] = PANEL_IDS,
): SerializedDockview | null {
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.panels)) return null;
  const { grid, panels } = value;
  if (!hasGridShape(grid) || !panelsAreRegistered(panels, allowed)) return null;

  const views: unknown[] = [];
  if (!collectLeafViews(grid.root, views)) return null;
  if (!collectFloatingViews(value.floatingGroups, views)) return null;
  const everyViewIsAPanel = views.every((id) => typeof id === "string" && id in panels);
  const everyPanelIsPlaced = Object.keys(panels).every((id) => views.includes(id));
  return everyViewIsAPanel && everyPanelIsPlaced ? (value as unknown as SerializedDockview) : null;
}

/** Remove excluded panels from a validated layout without changing authored files or unrelated preferences. */
export function filterDockLayout(value: unknown, allowed: readonly PanelId[]): SerializedDockview | null {
  const layout = parseDockLayout(value);
  if (!layout) return null;
  if (Object.keys(layout.panels).every(id => allowed.includes(id as PanelId))) return layout;
  const keep = new Set<string>(allowed);
  const groups = new Set<string>();
  const filterGroup = (data: Record<string, unknown>): Record<string, unknown> | null => {
    const views = (data.views as string[]).filter(id => keep.has(id));
    if (!views.length) return null;
    if (typeof data.id === 'string') groups.add(data.id);
    return { ...data, views, ...(typeof data.activeView === 'string' && !keep.has(data.activeView) ? { activeView: views[0] } : {}) };
  };
  const filterNode = (node: unknown): unknown => {
    if (!isRecord(node)) return null;
    if (node.type === 'leaf' && isRecord(node.data)) {
      const data = filterGroup(node.data);
      return data ? { ...node, data } : null;
    }
    if (node.type === 'branch' && Array.isArray(node.data)) {
      const data = node.data.map(filterNode).filter(Boolean);
      return data.length ? { ...node, data } : null;
    }
    return null;
  };
  const root = filterNode(layout.grid.root);
  if (!root) return null;
  const panels = Object.fromEntries(Object.entries(layout.panels).filter(([id]) => keep.has(id)));
  const floatingGroups = layout.floatingGroups?.flatMap(group => {
    const data = filterGroup(group.data as unknown as Record<string, unknown>);
    return data ? [{ ...group, data }] : [];
  });
  return parseDockLayout({ ...layout, activeGroup: layout.activeGroup && groups.has(layout.activeGroup) ? layout.activeGroup : undefined, panels, grid: { ...layout.grid, root }, ...(floatingGroups ? { floatingGroups } : {}) }, allowed);
}
