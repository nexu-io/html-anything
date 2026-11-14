import { forwardRef } from "react";
import type { IconProps } from "@phosphor-icons/react";

/** Horseshoe magnet for snapping; shared by all Studio snap controls. */
export const MagnetIcon = forwardRef<SVGSVGElement, IconProps>(function MagnetIcon(
  { size = 16, weight: _weight, alt, mirrored, style, children, ...props }, ref,
) {
  return <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden={alt ? undefined : true} aria-label={alt} {...props}
    style={mirrored ? { ...style, transform: `${style?.transform ?? ""} scaleX(-1)` } : style}>
    {alt && <title>{alt}</title>}
    <g transform="rotate(45 12 12)">
      <path d="M6 3h4v9a2 2 0 0 0 4 0V3h4v9a6 6 0 0 1-12 0V3Z" />
      <path d="M6 7h4m4 0h4" />
    </g>
    {children}
  </svg>;
});
