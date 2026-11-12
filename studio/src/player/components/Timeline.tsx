import { useI18n } from "../../i18n/I18n";
import { memo } from "react";
import { useMvpEditor } from "../../motion/StudioHost";
import { TimelineMediaBar } from '../../motion/TimelineMediaBar';
import type { TimelineProps } from "./TimelineTypes";
import { TimelineProvider, useTimelineContext } from "./TimelineProvider";
import {
  TimelineEmptyStatePart,
  TimelineEditPopover,
  TimelineClipMenu,
  TimelineFrame,
  TimelineGapMenu,
  TimelineKeyframeMenu,
  TimelineLanes,
  TimelineOverlays,
  TimelinePlayhead,
  TimelineRazorGuide,
  TimelineRuler,
  TimelineShortcutHint,
} from "./TimelineParts";

export * from "./TimelineProvider";
export {
  shouldAutoScrollTimeline,
  getTimelineScrollLeftForZoomTransition,
  getTimelineScrollLeftForZoomAnchor,
  getTimelinePlaybackFollowScrollLeft,
  getTimelinePlayheadLeft,
  getTimelineCanvasHeight,
  shouldShowTimelineShortcutHint,
  resolveTimelineAssetDrop,
  getDefaultDroppedTrack,
} from "./timelineLayout";
export { formatTimelineTickLabel, generateTicks } from "./timelineRulerGeometry";
export {
  getTimelineScrollTopForGeometryChange,
  getTimelineVisibleTimeRange,
} from "./timelineViewportGeometry";

function TimelineView() {
  const { t } = useI18n();
  const { state, meta } = useTimelineContext();
  const { timelineReady, elements } = state;
  if (!timelineReady || elements.length === 0) {
    return <TimelineEmptyStatePart />;
  }
  return (
    <div {...meta.containerProps} aria-label={t(meta.containerProps["aria-label"])}>
      <div {...meta.viewportProps}>
        <TimelineFrame />
        <TimelineRazorGuide />
      </div>
      <TimelineOverlays />
    </div>
  );
}

const TimelineComposed = memo(function TimelineComposed(props: TimelineProps = {}) {
  const mvp = useMvpEditor();
  return (
    <TimelineProvider {...props} showAudioEffects={mvp ? false : props.showAudioEffects} showKeyframes={mvp ? false : props.showKeyframes}>
      <TimelineView />
      <TimelineMediaBar />
    </TimelineProvider>
  );
});

export const Timeline = Object.assign(TimelineComposed, {
  Provider: TimelineProvider,
  Frame: TimelineFrame,
  Ruler: TimelineRuler,
  Lanes: TimelineLanes,
  Playhead: TimelinePlayhead,
  RazorGuide: TimelineRazorGuide,
  ShortcutHint: TimelineShortcutHint,
  EditPopover: TimelineEditPopover,
  ClipMenu: TimelineClipMenu,
  KeyframeMenu: TimelineKeyframeMenu,
  GapMenu: TimelineGapMenu,
  EmptyState: TimelineEmptyStatePart,
  Overlays: TimelineOverlays,
});
