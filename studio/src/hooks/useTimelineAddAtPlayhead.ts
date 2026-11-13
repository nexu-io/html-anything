import { useCallback } from "react";
import type { TimelineDropPlacement } from "../player/components/timelineCallbacks";
import { useMvpEditor } from "../motion/StudioHost";
import { usePlayerStore } from "../player";
import { useStableHandlers } from "./useStableHandlers";

type AddAtPlacement = (path: string, placement: TimelineDropPlacement, duration?: number, reportFailure?: boolean) => unknown;

export function useTimelineAddAtPlayhead(
  addAsset: AddAtPlacement,
  addComposition: AddAtPlacement,
  projectId: string | null,
) {
  const mvp = useMvpEditor();
  const placement = () => ({ start: usePlayerStore.getState().currentTime, track: 0 });
  return useStableHandlers(
    {
      addAssetAtPlayhead: useCallback(async (path: string) => {
        try {
          await addAsset(path, { ...placement(), ...(mvp ? { newTrack: "top" as const } : {}) }, undefined, true);
          return true;
        } catch {
          // The drop handler reports the error; preview buttons also retain a retry state.
          return false;
        }
      }, [addAsset, mvp]),
      addCompositionAtPlayhead: useCallback(
        (path: string) => addComposition(path, placement()),
        [addComposition],
      ),
    },
    projectId,
  );
}
