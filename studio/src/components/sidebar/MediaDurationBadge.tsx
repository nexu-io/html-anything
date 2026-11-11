import { formatDuration } from "./assetHelpers";

/** Shared duration treatment for project assets and catalog cards. */
export function MediaDurationBadge({ duration, className = "" }: {
  duration?: number | null;
  className?: string;
}) {
  const label = formatDuration(duration ?? 0);
  if (!label) return null;
  return (
    <span className={`text-[9px] font-medium leading-none px-1.5 py-[3px] rounded-sm bg-neutral-950/80 text-panel-text-2 tabular-nums ${className}`}>
      {label}
    </span>
  );
}
