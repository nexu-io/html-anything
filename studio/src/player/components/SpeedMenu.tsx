import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useState, memo } from "react";
import { trackStudioEvent } from "../../utils/studioTelemetry";
import { Tooltip } from "../../components/ui";
import { Menu, MenuRadioGroup, MenuRadioItem } from "../../components/ui/Menu";

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2] as const;

interface SpeedMenuProps {
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  disabled: boolean;
}

export const SpeedMenu = memo(function SpeedMenu({
  playbackRate,
  setPlaybackRate,
  disabled,
}: SpeedMenuProps) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const [open, setOpen] = useState(false);
  return (
    <Tooltip label={t("Playback speed")}>
      <div className="shrink-0">
        <Menu
          open={open}
          onOpenChange={setOpen}
          side="top"
          align="end"
          container={typeof document !== "undefined" ? document.fullscreenElement as HTMLElement ?? undefined : undefined}
          aria-label={t("Playback speed options")}
          className="motion-speed-menu min-w-[80px] overflow-hidden border-0 p-0"
          trigger={
            <button
              type="button"
              disabled={disabled}
              aria-label={t("Playback speed")}
              className={`h-7 rounded-md font-mono tabular-nums text-neutral-500 transition-colors hover:text-neutral-200 disabled:opacity-30 ${mvp ? "w-10 text-[12px]" : "w-8 text-[10px]"}`}
            >
              {playbackRate}x
            </button>
          }
        >
          <MenuRadioGroup
            value={playbackRate}
            onValueChange={(value) => {
              const rate = Number(value);
              trackStudioEvent("playback", { action: "speed_change", rate });
              setPlaybackRate(rate);
              setOpen(false);
            }}
          >
            {SPEED_OPTIONS.map((rate) => (
              <MenuRadioItem
                key={rate}
                value={rate}
                className={`gap-3 rounded-none px-3 py-1.5 font-mono text-[11px] tabular-nums ${rate === playbackRate ? "bg-hover font-semibold" : ""}`}
              >
                {rate}x
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </Menu>
      </div>
    </Tooltip>
  );
});
