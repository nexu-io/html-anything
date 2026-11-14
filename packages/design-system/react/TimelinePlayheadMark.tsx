import type { SVGProps } from "react";

/** Solid downward marker, centered on the timeline's current-time line. */
export function TimelinePlayheadMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 14 16" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M2 0h10c1.4 0 2 1 1.3 2.2L8 14.6c-.5 1.1-1.5 1.1-2 0L.7 2.2C0 1 .6 0 2 0Z" />
  </svg>;
}
