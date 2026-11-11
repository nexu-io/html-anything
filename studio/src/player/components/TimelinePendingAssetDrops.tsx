import { useI18n } from "../../i18n/I18n";
import { RemixIcon, X } from "../../icons/RemixIcons";
import { usePlayerStore } from "../store/playerStore";
import { dismissPendingAssetDrop } from "../store/pendingAssetDrops";
import { CLIP_Y, TRACK_H } from "./timelineLayout";
import { getTimelineAssetKind } from "../../utils/timelineAssetDrop";

export function TimelinePendingAssetDrops({
  contentOrigin, pixelsPerSecond, trackOrder, rowTop,
}: {
  contentOrigin: number;
  pixelsPerSecond: number;
  trackOrder: readonly number[];
  rowTop: (index: number) => number;
}) {
  const { t } = useI18n();
  const drops = usePlayerStore((state) => state.pendingAssetDrops);
  const elements = usePlayerStore((state) => state.elements);
  const timelineReady = usePlayerStore((state) => state.timelineReady);
  return drops.map((drop) => {
    if (timelineReady && drop.element && elements.some((element) => (element.key ?? element.id) === drop.element!.key)) return null;
    const placement = drop.placement;
    const index = trackOrder.indexOf(drop.element?.track ?? placement.track);
    const row = placement.insertRow ?? (index < 0 ? trackOrder.length : index);
    const start = drop.element?.start ?? placement.start;
    const name = drop.assetPath.split("/").pop() ?? drop.assetPath;
    const audio = getTimelineAssetKind(drop.assetPath) === "audio";
    const width = Math.max(drop.failed ? 140 : 48, (drop.duration ?? 5) * pixelsPerSecond);
    const compact = !drop.failed && width < 96;
    const message = t(drop.failed === "preview" ? "Preview failed to load" : drop.failed ? "Failed to add media" : "Adding…");
    return (
      <div
        key={drop.id}
        data-testid="timeline-pending-asset"
        data-drop-id={drop.id}
        role={drop.failed ? "alert" : "status"}
        aria-busy={!drop.failed}
        aria-label={`${name}: ${message}`}
        title={`${name}: ${message}`}
        className={`timeline-clip absolute flex items-center gap-1.5 overflow-hidden px-2 text-[11px] ${audio ? "is-audio" : ""} ${compact ? "justify-center" : ""}`}
        style={{
          top: rowTop(row) + CLIP_Y,
          left: contentOrigin + start * pixelsPerSecond,
          width,
          height: TRACK_H - CLIP_Y * 2,
          borderRadius: audio ? "var(--timeline-clip-audio-radius)" : "var(--timeline-clip-radius)",
          background: audio ? "var(--timeline-clip-audio-bg)" : "var(--timeline-clip-bg)",
          color: audio ? "var(--timeline-clip-chip-text)" : "var(--timeline-text-primary)",
          borderColor: drop.failed ? "var(--color-red-400)" : audio ? "var(--timeline-clip-audio-border)" : "var(--timeline-clip-border)",
          zIndex: 40,
          pointerEvents: drop.failed ? "auto" : "none",
        }}
      >
        {!drop.failed && <RemixIcon name="loader-4-line" size={14} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />}
        {!compact && <span className="min-w-0 truncate">{drop.failed ? `${message} · ${name}` : name}</span>}
        {!drop.failed && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-20 motion-safe:animate-pulse" />}
        {drop.failed && <button
          type="button"
          className="ml-auto shrink-0 rounded p-1 focus-visible:outline focus-visible:outline-2"
          aria-label={t("Dismiss error")}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); dismissPendingAssetDrop(drop.id); }}
        ><X size={12} /></button>}
      </div>
    );
  });
}
