import { RemixIcon } from "../../icons/RemixIcons";
import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useTrackDesignInput } from "../../contexts/DesignPanelInputContext";
import { keyHint, useStudioKeys } from "../../player/components/studioShortcuts";
import { clickMethod, trackStudioClick } from "../../motion/editorTracking";
import { useStudioShellContextOptional } from "../../contexts/StudioContext";

export function PropertyPanelFlatFooter({
  onAskAgent,
  recordingState,
  recordingDuration,
  onToggleRecording,
}: {
  onAskAgent?: () => void;
  recordingState?: "idle" | "recording" | "preview";
  recordingDuration?: number;
  onToggleRecording?: () => void;
}) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const projectId = useStudioShellContextOptional()?.projectId;
  const track = useTrackDesignInput();
  const recording = recordingState === "recording";
  const recordKey = keyHint("record", useStudioKeys());
  const recordTitle = recording
    ? t("Stop recording {value0}s", { value0: (recordingDuration ?? 0).toFixed(1) })
    : t("Record gesture ({recordKey})", { recordKey: recordKey });

  if (mvp) return null;

  return (
    // No border-t here: every possible element immediately above this footer
    // in the new fixed-headers + scrollable-open-section layout (a collapsed
    // FlatGroupHeader, or the open group's scrollable body wrapper) already
    // draws its own border-b in normal document flow — nothing here is
    // `position: sticky` anymore, so there's no rounding seam to seal (see
    // p11-scrollable-open-section-report.md).
    <div className="flex items-center justify-between bg-panel-bg px-4 py-[11px]">
      <button
        type="button"
        data-flat-footer-ask="true"
        onClick={(event) => {
          track("button", "Ask agent");
          trackStudioClick("properties", "ask_agent_element", projectId, clickMethod(event));
          onAskAgent?.();
        }}
        disabled={!onAskAgent}
        className="flex items-center gap-[7px] text-[11px] font-medium text-panel-text-2 disabled:cursor-not-allowed"
      >
        <RemixIcon name="sparkling-line" size={14} className="text-accent-ink" />
        {t("Ask agent about this element")}</button>
      {!mvp && onToggleRecording && (
        <button
          type="button"
          data-flat-footer-record="true"
          aria-label={recordTitle}
          title={recordTitle}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            track("button", "Gesture recording");
            onToggleRecording();
          }}
          className={recording ? "text-danger-ink animate-pulse" : "text-danger-ink"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            {recording ? (
              <rect x="2" y="2" width="10" height="10" rx="1.5" />
            ) : (
              <circle cx="7" cy="7" r="6" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
