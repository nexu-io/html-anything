import { useMemo } from "react";
import { useMvpEditor } from "../../motion/StudioHost";
import type { GsapAnimation } from "@hyperframes/core/gsap-parser";
import type { TimelineElement } from "../store/playerStore";
import { GUTTER, LABEL_COL_W, TRACKS_LEFT_PAD } from "./timelineLayout";
import { timelineNeedsLabelColumn } from "./timelineViewModel";

export function useTimelineLabelColumn(
  animationsByElement: ReadonlyMap<string, readonly GsapAnimation[]>,
  elements: readonly TimelineElement[],
) {
  const mvp = useMvpEditor();
  const labelMode = useMemo(
    () => mvp || timelineNeedsLabelColumn(animationsByElement, elements),
    [mvp, animationsByElement, elements],
  );
  // The label column provides pre-t=0 space; otherwise keep TRACKS_LEFT_PAD after the gutter.
  const contentOrigin = labelMode ? LABEL_COL_W + GUTTER : GUTTER + TRACKS_LEFT_PAD;
  return { labelMode, contentOrigin };
}
