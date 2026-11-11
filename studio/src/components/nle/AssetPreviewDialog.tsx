import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "../../i18n/I18n";
import { RemixIcon } from "../../icons/RemixIcons";
import { IconButton, Tooltip } from "../ui";
import { VolumeControl } from "../../player/components/VolumeControl";
import { SpeedMenu } from "../../player/components/SpeedMenu";
import { formatTime } from "../../player/lib/time";
import { usePlayerStore } from "../../player/store/playerStore";

/** Independent media playback: never writes the composition's playhead or settings. */
export function AssetPreviewDialog({ url, kind, name, onClose }: {
  url: string; kind: "video" | "audio" | "image"; name: string; onClose: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);
  return <Dialog.Root open={open} onOpenChange={setOpen} onOpenChangeComplete={next => { if (!next) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Backdrop forceRender className="hf-overlay-backdrop fixed inset-0 z-140 bg-media-preview-scrim" />
      <Dialog.Popup aria-label={t("Preview: {name}", { name })} aria-describedby={undefined}
        className="fixed top-1/2 left-1/2 z-150 flex h-[min(600px,85dvh)] w-[min(800px,90vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface text-text-1 shadow-menu outline-none"
        onKeyDown={event => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
          <Dialog.Title className="min-w-0 truncate text-step-14 font-semibold" title={name}>{name}</Dialog.Title>
          <Dialog.Close render={<IconButton className="shrink-0" aria-label={t("Close preview")} icon={<RemixIcon name="close-line" size={16} />} />} />
        </div>
        <DialogMedia key={url} url={url} kind={kind} name={name} />
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

function DialogMedia({ url, kind, name }: { url: string; kind: "video" | "audio" | "image"; name: string }) {
  const { t } = useI18n();
  const media = useRef<HTMLMediaElement | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [volume, setVolume] = useState(() => usePlayerStore.getState().audioVolume);
  const [muted, setMuted] = useState(() => usePlayerStore.getState().audioMuted);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  useEffect(() => {
    if (!media.current) return;
    media.current.volume = volume;
    media.current.muted = muted;
    media.current.playbackRate = rate;
  }, [volume, muted, rate]);
  const toggle = () => {
    if (!media.current) return;
    if (media.current.paused) void media.current.play().catch(() => setPlaying(false));
    else media.current.pause();
  };
  const events = {
    onLoadedMetadata: () => setDuration(Number.isFinite(media.current?.duration) ? media.current!.duration : 0),
    onTimeUpdate: () => setTime(media.current?.currentTime ?? 0),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onError: () => setFailed(true),
  };
  return <>
    <div className="mx-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-[var(--motion-inset)]">
      {failed ? <p role="alert" className="text-step-12 text-text-2">{t("Preview failed to load")}</p>
        : kind === "image" ? <img src={url} alt={name} onError={() => setFailed(true)} className="h-full w-full object-contain" />
        : kind === "video" ? <video ref={node => { media.current = node; }} src={url} autoPlay playsInline muted={muted} loop={loop} disablePictureInPicture aria-label={name} className="h-full w-full object-contain" {...events} />
        : <><RemixIcon name="music-2-line" size={48} /><audio ref={node => { media.current = node; }} src={url} autoPlay muted={muted} loop={loop} {...events} /></>}
    </div>
    {kind !== "image" ? <div className="motion-player-controls motion-player-responsive shrink-0 px-3 pb-2">
      <input type="range" min={0} max={duration} step="any" value={Math.min(time, duration)} disabled={!duration || failed}
        aria-label={t("Seek preview")} data-studio-control="seek-preview" className="w-full"
        style={{ "--preview-progress": `${duration ? time / duration * 100 : 0}%` } as CSSProperties}
        onChange={event => { if (media.current) { media.current.currentTime = event.currentTarget.valueAsNumber; setTime(media.current.currentTime); } }} />
      <div className="motion-player-control-row">
        <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-text-2">{formatTime(time)} / {formatTime(duration)}</span>
        <Tooltip label={t(playing ? "Pause" : "Play")}><button type="button" aria-label={t(playing ? "Pause" : "Play")} onClick={toggle} disabled={failed}
          className="flex h-7 w-8 items-center justify-center justify-self-center rounded-md hover:bg-hover disabled:opacity-30"><RemixIcon name={playing ? "pause-fill" : "play-fill"} size={20} /></button></Tooltip>
        <div className="motion-player-secondary flex min-w-0 items-center justify-self-end">
          <VolumeControl audioVolume={volume} audioMuted={muted} setAudioVolume={setVolume} setAudioMuted={setMuted} disabled={failed} />
          <SpeedMenu playbackRate={rate} setPlaybackRate={setRate} disabled={failed} />
          <Tooltip label={t(loop ? "Disable loop playback" : "Enable loop playback")}><button type="button" aria-label={t(loop ? "Disable loop playback" : "Enable loop playback")} aria-pressed={loop} onClick={() => setLoop(!loop)} disabled={failed}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-hover"><RemixIcon name="repeat-line" size={16} /></button></Tooltip>
        </div>
      </div>
    </div> : <div className="h-3 shrink-0" />}
  </>;
}
