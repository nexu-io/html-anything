import type { TimelineElement } from "./timelineElement";
import type { TimelineDropPlacement } from "../components/timelineCallbacks";
import { usePlayerStore } from "./playerStore";
import { generateId } from "../../utils/generateId";
import { getTimelineAssetKind } from "../../utils/timelineAssetDrop";
import { resolveNearestFreeStart } from "../components/timelineCollision";

export interface PendingAssetDrop {
  id: string;
  assetPath: string;
  placement: TimelineDropPlacement;
  duration?: number;
  element?: TimelineElement;
  failed?: "add" | "preview";
}

export function beginPendingAssetDrop(
  assetPath: string,
  placement: TimelineDropPlacement,
  duration?: number,
): string {
  const id = generateId();
  usePlayerStore.setState((state) => {
    const kind = getTimelineAssetKind(assetPath);
    // Show feedback at the drop time; the save resolves collisions once metadata is known.
    const busy = state.pendingAssetDrops.filter((drop) =>
      (!drop.failed || drop.element) && drop.placement.insertRow === placement.insertRow,
    ).map((drop) => drop.element ?? {
      id: drop.id, tag: getTimelineAssetKind(drop.assetPath) ?? "div",
      ...drop.placement, duration: drop.duration ?? 5,
    }).filter((element) => (element.tag === "audio") === (kind === "audio"));
    const start = resolveNearestFreeStart(busy, placement.track, placement.start, duration ?? 5, null);
    return { pendingAssetDrops: [...state.pendingAssetDrops, {
      id, assetPath, placement: { ...placement, start }, duration,
    }] };
  });
  return id;
}

export function updatePendingAssetDrop(id: string, patch: Partial<PendingAssetDrop>): void {
  usePlayerStore.setState((state) => ({
    pendingAssetDrops: state.pendingAssetDrops.map((drop) => drop.id === id ? { ...drop, ...patch } : drop),
  }));
}

export function isPendingAssetDropActive(id: string): boolean {
  return usePlayerStore.getState().pendingAssetDrops.some((drop) => drop.id === id);
}

export function finishPendingAssetDrop(id: string, element?: TimelineElement): void {
  updatePendingAssetDrop(id, element ? {
    element, duration: element.duration,
    placement: { start: element.start, track: element.track },
  } : { failed: "add" });
}

export function dismissPendingAssetDrop(id: string): void {
  usePlayerStore.setState((state) => ({
    pendingAssetDrops: state.pendingAssetDrops.filter((drop) => drop.id !== id),
  }));
}

export function failPendingAssetPreviews(): void {
  usePlayerStore.setState((state) => ({
    pendingAssetDrops: state.pendingAssetDrops.map((drop) =>
      drop.element && !drop.failed ? { ...drop, failed: "preview" } : drop),
  }));
}
