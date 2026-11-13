import { RemixIcon } from "../icons/RemixIcons";
import { useI18n } from "../i18n/I18n";
import { Fragment, memo, useContext, useEffect, useRef, useState, type MouseEvent } from "react";
import { Camera } from "../icons/SystemIcons";
import { useStudioShellContext } from "../contexts/StudioContext";
import { usePanelLayoutContext } from "../contexts/PanelLayoutContext";
import { trackStudioEvent } from "../utils/studioTelemetry";
import { Button, buttonBase, buttonSizes, buttonVariants, cn, Tooltip } from "./ui";
import { ExportDialog } from "./renders/ExportDialog";
import { Dock } from "./dock/Dock";
import { InspectorIcon } from "./icons/InspectorIcon";
import { OpenInDesktopButton } from "./OpenInDesktopButton";
import { HyperframesLogo } from "./ui/HyperframesLogo";
import { ShowThemeToggle, ThemeToggle } from "./ThemeToggle";
import { useStudioHost } from "../motion/StudioHost";

interface StudioHeaderProps {
  captureFrameHref: string;
  captureFrameFilename: string;
  handleCaptureFrameClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  refreshCaptureFrameTime: () => void;
  capturing?: boolean;
  inspectorButtonActive: boolean;
  inspectorPanelActive: boolean;
  onExport?: () => void;
}

/**
 * Does the header's Inspector button open the panel, or close it?
 *
 * The dock has no separate "railed by window width" state (it shrinks panels,
 * never auto-hides the group), so `rightCollapsed` here is already the state
 * that decides whether the panel is actually showing.
 */
export function shouldOpenInspector(
  rightCollapsed: boolean,
  inspectorPanelActive: boolean,
): boolean {
  return rightCollapsed || !inspectorPanelActive;
}

// fallow-ignore-next-line complexity
export const StudioHeader = memo(function StudioHeader({
  captureFrameHref,
  captureFrameFilename,
  handleCaptureFrameClick,
  refreshCaptureFrameTime,
  capturing,
  inspectorButtonActive,
  inspectorPanelActive,
  onExport,
}: StudioHeaderProps) {
  const { t } = useI18n();
  const host = useStudioHost();
  const [exportOpen, setExportOpen] = useState(false);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);
  const HeaderFrame = host?.HeaderFrame ?? Fragment;
  const showThemeToggle = useContext(ShowThemeToggle);
  const { projectId, renderQueue } = useStudioShellContext();
  const { rightCollapsed, setRightCollapsed, setRightPanelTab } = usePanelLayoutContext();
  const isRendering = renderQueue.isRendering;
  const ffmpegMissing = renderQueue.ffmpegMissing;
  useEffect(() => setExportOpen(false), [projectId]);

  return (
    <HeaderFrame>
    <div className={cn("flex items-center justify-between h-10 px-3 bg-surface shrink-0", !host?.mvpEditor && "border-b border-border-strong", host && "motion-studio-header", host?.mvpEditor && "motion-studio-header-centered")}>
      {/* Left: logo + project name */}
      <div className="flex items-center gap-3">
        {host?.brand ?? <HyperframesLogo />}
        {host?.mvpEditor && host.headerActions}
        {!host?.mvpEditor && <><span className="text-text-5 select-none" aria-hidden="true">
          |
        </span>
        <span className="text-step-11 font-medium text-text-1">{host?.projectLabel ?? projectId}</span></>}
      </div>
      {host?.mvpEditor && <div className="motion-header-project">{host.projectLabel ?? projectId}</div>}
      {/* Right: toolbar buttons */}
      <div className="flex items-center gap-3">
        {!host?.mvpEditor && host?.headerActions}
        {host?.mvpEditor && host.communityAction}
        {host?.historyActions}
        {host?.previewAction}
        {!host?.mvpEditor && <div className="flex h-ctl items-center divide-x divide-border-strong overflow-hidden rounded-md border border-border-strong bg-bg-2">
          <Tooltip label={capturing ? t("Capturing frame…") : t("Capture current frame")} side="bottom">
            {/* A real download link, so it wears Button's recipe rather than being
              one: `download` on an <a> is what saves the frame, and no <button>
              can do that. `enabled:` never matches a link, so the ghost
              variant's hover look is repeated unprefixed here. */}
            <a
              href={captureFrameHref}
              download={captureFrameFilename}
              onClick={(e) => {
                if (capturing) {
                  e.preventDefault();
                  return;
                }
                trackStudioEvent("toolbar_action", { action: "capture_frame" });
                handleCaptureFrameClick(e);
              }}
              onFocus={refreshCaptureFrameTime}
              onPointerDown={refreshCaptureFrameTime}
              aria-disabled={capturing || undefined}
              className={cn(
                buttonBase,
                buttonVariants.ghost,
                buttonSizes.md,
                "h-full rounded-none max-[1000px]:px-2",
                capturing
                  ? "text-text-4 cursor-default"
                  : "hover:bg-hover hover:text-text-0 active:scale-[0.98]",
              )}
              aria-label={capturing ? t("Capturing frame") : t("Capture current frame")}
            >
              {capturing ? (
                <RemixIcon name="loader-4-line" size={14} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Camera size={14} />
              )}
              <span className="max-[1000px]:hidden">{capturing ? t("Capturing…") : t("Capture")}</span>
            </a>
          </Tooltip>
          <Tooltip label={t("Inspector")} side="bottom">
            <Button
              variant="ghost"
              aria-label={t("Inspector")}
              aria-pressed={inspectorButtonActive}
              className={cn(
                "h-full rounded-none",
                inspectorButtonActive &&
                  "bg-on text-accent-ink enabled:hover:bg-on-hover enabled:hover:text-accent-ink",
              )}
              icon={<InspectorIcon size={16} />}
              onClick={() => {
                if (shouldOpenInspector(rightCollapsed, inspectorPanelActive)) {
                  trackStudioEvent("panel_toggle", { panel: "inspector", collapsed: false });
                  setRightPanelTab("design");
                  setRightCollapsed(false);
                  return;
                }
                trackStudioEvent("panel_toggle", { panel: "inspector", collapsed: true });
                // Keep the current selection when collapsing the Inspector — closing
                // the panel shouldn't deselect the element.
                setRightCollapsed(true);
              }}
            >
              {t("Inspector")}</Button>
          </Tooltip>
        </div>}
        {showThemeToggle && host?.themeToggle !== false && <ThemeToggle />}
        {host?.languageMenu}
        {host?.windowMenu ?? <Dock.WindowMenu />}
        {host?.desktopLink !== false && <OpenInDesktopButton />}
        {!host?.mvpEditor && host?.communityAction}
        <Tooltip
          disabled={host?.mvpEditor}
          label={
            host?.mvpEditor ? t("Export") : ffmpegMissing
              ? renderQueue.ffmpeg?.runtime ? t("Video components are not ready. Check preparation status.") : t("FFmpeg is not installed. Opens the Renders panel with the install command.")
              : isRendering
                ? t("A render is already in progress")
                : t("Render and export this composition")
          }
          side="bottom"
        >
          <Button
            variant="primary"
            data-testid="header-export"
            ref={exportTriggerRef}
            aria-haspopup={host?.mvpEditor ? "dialog" : undefined}
            disabled={!host?.mvpEditor && isRendering}
            onClick={() => {
              if (host?.mvpEditor) { setExportOpen(true); return; }
              if (isRendering) return;
              setRightPanelTab("renders");
              setRightCollapsed(false);
              // Without an encoder this render cannot finish, so the click
              // delivers the user to the prompt that fixes it instead of
              // queueing a job that exists only to fail. Disabling the button
              // would leave them staring at a dead control with no route to
              // the explanation.
              if (ffmpegMissing) return;
              onExport?.();
            }}
          >
            {isRendering ? t("Rendering…") : t("Export")}
          </Button>
        </Tooltip>
      </div>
    </div>
    {host?.mvpEditor && <ExportDialog open={exportOpen} onOpenChange={setExportOpen} triggerRef={exportTriggerRef} />}
    </HeaderFrame>
  );
});
