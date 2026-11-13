// fallow-ignore-file dead-code
/**
 * Shared playhead visual used by TimelineCanvas (real playhead) and
 * TimelineEditorNotice (animated illustration).
 *
 * The vertical line + glow span the full track height; the grab-handle HEAD is
 * `position: sticky; top: 0` so it pins to the top of the (vertically) scrolling
 * track area — the ruler is sticky too, so the head stays visible and grabbable
 * no matter how far the tracks are scrolled. The solid head points down to the line.
 */
import { TimelinePlayheadMark } from "../../../../packages/design-system/react/TimelinePlayheadMark";
import { PLAYHEAD_HEAD_W } from "./timelineLayout";

/** Widest part of the playhead, centred on its line. */
export const PLAYHEAD_GLOW_W = 13;

interface PlayheadIndicatorProps {
  /** CSS color, defaults to the HF accent variable */
  color?: string;
  /** Glow shadow color, defaults to translucent accent */
  glowColor?: string;
  /** Whether the playhead is being actively scrubbed. */
  scrubbing?: boolean;
  /**
   * When false, the head chip is absolutely positioned instead of using the
   * sticky pin — used by the static illustration where there is no scroll area.
   */
  stickyHead?: boolean;
}

export function PlayheadIndicator({
  color = "var(--timeline-accent)",
  glowColor = "var(--timeline-playhead-glow)",
  scrubbing = false,
  stickyHead = true,
}: PlayheadIndicatorProps) {
  // Keep the existing wrapper width and time-origin math. The wider marker is
  // centered inside the same glow envelope, with its tip meeting the line.
  const HEAD_W = PLAYHEAD_HEAD_W;
  const HEAD_H = 15;
  const HEAD_INSET = 2;
  const HEAD_TOTAL_H = HEAD_INSET + HEAD_H;

  return (
    <>
      {/* Glow — spans full height, centered on the line. */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0"
        style={{
          left: "50%",
          width: PLAYHEAD_GLOW_W,
          transform: "translateX(-50%)",
          background: `radial-gradient(closest-side, ${glowColor}, transparent)`,
        }}
      />
      {/* Vertical line begins at the marker tip. */}
      <div
        className="absolute bottom-0"
        style={{
          left: "50%",
          top: HEAD_TOTAL_H,
          width: 1,
          marginLeft: -0.5,
          background: color,
          boxShadow: `0 0 6px ${glowColor}`,
        }}
      />
      {/* Head chip — sticky so it pins to the ruler while tracks scroll.
          Centering logic: wrapper width = HEAD_W (chip forces it). The line sits
          at wrapper.left + HEAD_W/2 (left:"50%" of wrapper). The sticky element's
          natural flow position is wrapper.left; so placing it there with no
          horizontal translate puts its LEFT edge at wrapper.left and its CENTER
          at wrapper.left + HEAD_W/2 — exactly on the line. */}
      <div
        data-timeline-playhead-head=""
        className={stickyHead ? "sticky" : "absolute"}
        style={{
          left: 0,
          top: 0,
          width: HEAD_W,
          height: HEAD_TOTAL_H,
          // The line scrolls behind the pinned head. Mask it above the lower
          // tip so scrolling never paints the line above the marker.
          background: stickyHead ? "var(--timeline-shell-bg)" : undefined,
        }}
      >
        <TimelinePlayheadMark
          data-scrubbing={scrubbing || undefined}
          width={PLAYHEAD_GLOW_W}
          height={HEAD_H}
          style={{ position: "absolute", top: HEAD_INSET, left: (HEAD_W - PLAYHEAD_GLOW_W) / 2, color }}
        />
      </div>
    </>
  );
}
