import { AssetPreviewDialog } from "./AssetPreviewDialog";
import { RemixIcon } from "../../icons/RemixIcons";
import { useI18n } from "../../i18n/I18n";
/**
 * Shared asset/catalog preview in an independent MVP dialog.
 * The composition remains mounted and pauses on entry; seeking its timeline
 * returns to it. Legacy callers retain the floating-card presentation.
 * Previewing never changes project source or adds a timeline clip.
 */
import { useEffect, useCallback } from "react";
import { VIDEO_EXT, IMAGE_EXT } from "../../utils/mediaTypes";
import { useAssetPreviewStore } from "../../utils/assetPreviewStore";
import { usePlayerStore } from "../../player/store/playerStore";
import { shouldDismissAssetPreview } from "../../utils/assetPreviewDismiss";
import { resolveMediaPreviewUrl } from "../../player/components/thumbnailUtils";

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

type AssetKind = "image" | "video" | "audio";

function resolveAssetKind(path: string): AssetKind {
  if (VIDEO_EXT.test(path)) return "video";
  if (IMAGE_EXT.test(path)) return "image";
  return "audio";
}

/** The media element for a previewed asset, chosen by kind. */
function AssetPreviewMedia({
  kind,
  serveUrl,
  name,
}: {
  kind: AssetKind;
  serveUrl: string;
  name: string;
}) {
  if (kind === "image") {
    return (
      <img
        src={serveUrl}
        alt={name}
        className="max-w-full max-h-[40vh] rounded-sm object-contain"
      />
    );
  }
  if (kind === "video") {
    return (
      <video
        src={serveUrl}
        controls
        autoPlay
        muted
        playsInline
        aria-label={name}
        className="max-w-full max-h-[40vh] rounded-sm"
      />
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-4">
      <RemixIcon name="music-2-line" size={40} />
      <audio src={serveUrl} controls className="w-64" />
    </div>
  );
}

export function AssetPreviewOverlay({ modal = false, onOpen }: { modal?: boolean; onOpen?: () => void }) {
  const { t } = useI18n();
  const previewAdd = useAssetPreviewStore((s) => s.previewAdd);
  const previewAsset = useAssetPreviewStore((s) => s.previewAsset);
  const previewProjectId = useAssetPreviewStore((s) => s.previewProjectId);
  const clearPreviewAsset = useAssetPreviewStore((s) => s.clearPreviewAsset);
  const catalogPreview = useAssetPreviewStore((s) => s.catalogPreview);
  const previewKey = previewAsset ?? (modal ? catalogPreview : null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") clearPreviewAsset();
    },
    [clearPreviewAsset],
  );

  useEffect(() => {
    if (!previewKey || modal) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewKey, handleKeyDown, modal]);

  // The canvas refocuses on any playhead activity: starting playback or a
  // seek/scrub away from where the playhead sat when the preview opened
  // dismisses it. openedTime is captured per preview open (previewAsset dep),
  // so a stale render can never dismiss against the wrong reference time.
  useEffect(() => {
    if (!previewKey) return;
    if (modal) onOpen?.();
    const opened = usePlayerStore.getState();
    const openedTime = opened.currentTime;
    // Level-triggered, not edge-triggered: a preview opened while playback is
    // ALREADY running (the RAF loop bypasses the store) or while a seek is
    // already in flight gets no store change to react to, so evaluate the
    // current state once, through the same shared predicate the subscription
    // uses. openedTime is this snapshot's own currentTime, so the
    // time-diverged branch can't false-positive at open — only the
    // isPlaying / requestedSeekTime branches can fire here.
    if (shouldDismissAssetPreview(openedTime, opened)) {
      clearPreviewAsset();
      return;
    }
    return usePlayerStore.subscribe((state) => {
      if (shouldDismissAssetPreview(openedTime, state)) clearPreviewAsset();
    });
  }, [previewKey, clearPreviewAsset, modal, onOpen]);

  if (modal && previewKey) {
    const name = catalogPreview?.title ?? basename(previewAsset!);
    const url = catalogPreview
      ? catalogPreview.videoUrl ?? catalogPreview.posterUrl
      : previewProjectId ? resolveMediaPreviewUrl(previewAsset!, previewProjectId) : undefined;
    const kind = catalogPreview ? (catalogPreview.videoUrl ? "video" : "image") : resolveAssetKind(previewAsset!);
    return url ? <AssetPreviewDialog key={`${previewProjectId}:${url}`} url={url} kind={kind} name={name} onAdd={previewAdd} onClose={() => {
      const current = useAssetPreviewStore.getState();
      if (current.catalogPreview === catalogPreview && current.previewAsset === previewAsset && current.previewProjectId === previewProjectId) clearPreviewAsset();
    }} /> : null;
  }

  if (!previewAsset || !previewProjectId) return null;

  const serveUrl = resolveMediaPreviewUrl(previewAsset, previewProjectId);
  const name = basename(previewAsset);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/20"
      onClick={clearPreviewAsset}
      role="dialog"
      aria-label={t("Preview: {name}", { name: name })}
    >
      {/* Floating preview card — compact, canvas stays visible around it */}
      <div
        className="relative flex flex-col items-center gap-2 max-w-[58%] rounded-lg border border-neutral-800 bg-neutral-950/95 p-2 pt-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-raised hover:bg-press text-text-2 hover:text-text-0 flex items-center justify-center transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            clearPreviewAsset();
          }}
          aria-label={t("Close preview")}
        >
          <RemixIcon name="close-line" size={14} />
        </button>

        <AssetPreviewMedia kind={resolveAssetKind(previewAsset)} serveUrl={serveUrl} name={name} />

        {/* Filename label */}
        <span className="text-[12px] text-neutral-400 truncate max-w-full px-2 text-center">
          {name}
        </span>
      </div>
    </div>
  );
}
