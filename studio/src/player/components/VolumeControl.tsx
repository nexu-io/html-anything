import { useMvpEditor } from "../../motion/StudioHost";
import { RemixIcon } from "../../icons/RemixIcons";
import { useI18n } from "../../i18n/I18n";
import { memo, useState, type CSSProperties } from "react";
import { Popover } from "@base-ui/react/popover";
import { trackStudioEvent } from "../../utils/studioTelemetry";

interface VolumeControlProps {
  audioMuted: boolean;
  audioVolume: number;
  disabled: boolean;
  setAudioMuted: (muted: boolean) => void;
  setAudioVolume: (volume: number) => void;
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  const mvp = useMvpEditor();
  const silent = muted || volume === 0;
  return (
    <RemixIcon name={silent ? "volume-mute-line" : mvp || volume >= 0.5 ? "volume-up-line" : "volume-down-line"} size={16} />
  );
}

export const VolumeControl = memo(function VolumeControl({
  audioMuted,
  audioVolume,
  disabled,
  setAudioMuted,
  setAudioVolume,
}: VolumeControlProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Show effective output while retaining the saved level for unmute.
  const percentage = audioMuted ? 0 : Math.round(audioVolume * 100);
  const silent = audioMuted || audioVolume === 0;
  const muteLabel = t(silent ? "Unmute audio" : "Mute audio");

  return <Popover.Root open={open} onOpenChange={(next, details) => {
    // Clicking toggles mute; hover and keyboard focus expose the volume slider.
    if (details.reason === "trigger-press") { details.cancel(); return; }
    setOpen(next);
  }}>
    <Popover.Trigger openOnHover delay={150} closeDelay={250}
      onFocus={() => setOpen(true)}
      onClick={() => {
        trackStudioEvent("playback", { action: "mute_toggle", muted: !silent });
        if (silent && audioVolume === 0) setAudioVolume(1);
        setAudioMuted(!silent);
      }}
      data-studio-control="mute" disabled={disabled} aria-label={muteLabel} aria-pressed={silent}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        silent ? "text-accent-ink" : "text-neutral-500 hover:text-neutral-200"
      }`}>
      <VolumeIcon muted={audioMuted} volume={audioVolume} />
    </Popover.Trigger>
    <Popover.Portal container={typeof document !== "undefined" ? document.fullscreenElement as HTMLElement ?? undefined : undefined}>
      <Popover.Positioner side="top" align="center" sideOffset={6} collisionPadding={8} className="z-150">
        <Popover.Popup initialFocus={false} finalFocus={false} aria-label={t("Preview volume")}
          className="hf-floating-motion flex flex-col items-center gap-2 rounded-lg bg-surface p-3 text-text-1 shadow-menu outline-none">
          <span className="font-mono text-[11px] tabular-nums">{percentage}%</span>
          <input type="range" min="0" max="100" step="1" value={percentage} disabled={disabled}
            aria-label={t("Preview volume")} aria-orientation="vertical" aria-valuetext={`${percentage}%`}
            className="hf-volume-vertical-range" style={{ "--volume-progress": `${percentage}%` } as CSSProperties}
            onChange={event => {
              const volume = Number(event.currentTarget.value) / 100;
              setAudioVolume(volume);
              if (audioMuted && volume > 0) setAudioMuted(false);
            }} />
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>;
});
