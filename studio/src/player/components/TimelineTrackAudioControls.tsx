import { Popover } from '@base-ui/react/popover';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18n';
import { RemixIcon } from '../../icons/RemixIcons';
import { useTimelineEditContextOptional } from '../../contexts/TimelineEditContext';
import { useStudioShellContextOptional } from '../../contexts/StudioContext';
import type { TimelineElement } from '../store/timelineElement';

const buttonClass = 'flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-3 hover:bg-hover hover:text-text-0 disabled:opacity-40';

/** Track-level controls write each audible clip through the native batch/undo path. */
export function TimelineTrackAudioControls({ elements, trackLabel, isAudioOnly, hidden, onUnhide }: {
  elements: readonly TimelineElement[];
  trackLabel: string;
  isAudioOnly: boolean;
  hidden: boolean;
  onUnhide: () => void;
}) {
  const { t } = useI18n();
  const { onSetElementsAttributeQuiet } = useTimelineEditContextOptional();
  const shell = useStudioShellContextOptional();
  const clips = elements.filter(el => el.tag === 'audio' || (el.tag === 'video' && (el.hasAudio === true || el.muted === true)));
  const signature = clips.map(el => `${el.key ?? el.id}:${el.volume ?? 1}:${!!el.muted}`).join('|');
  const volume = Math.round((clips[0]?.volume ?? 1) * 100);
  const mixed = clips.some(el => Math.round((el.volume ?? 1) * 100) !== volume);
  const muted = clips.length > 0 && clips.every(el => el.muted === true);
  const silent = muted || (isAudioOnly && hidden);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(volume);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  useEffect(() => { setDraft(volume); setDirty(false); }, [signature, open]);
  const disabled = busy || !onSetElementsAttributeQuiet || !!shell?.writeBlockedReason || !!shell?.renderQueue?.isRendering;
  if (!clips.length) return null;

  const save = async (attr: string, value: string | null, label: string) => {
    if (disabled || running.current || !onSetElementsAttributeQuiet) return;
    running.current = true; setBusy(true);
    try {
      const result = await onSetElementsAttributeQuiet(clips.map(element => ({ element, value })), attr, label);
      return !result || result.status === 'saved';
    } catch (error) {
      shell?.showToast(error instanceof Error ? error.message : t('Could not save changes'), 'error');
      return false;
    } finally { running.current = false; setBusy(false); }
  };
  const commitVolume = async () => {
    if (!dirty) return;
    const saved = await save('data-volume', String(draft / 100), 'Change volume');
    if (saved) setDirty(false);
    else { setDraft(volume); setDirty(false); }
  };
  const muteLabel = t(silent ? 'Unmute audio' : 'Mute audio');
  return <div className="ml-2 flex shrink-0 items-center" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
    <Popover.Root open={open} onOpenChange={(nextOpen, details) => {
      // Pressing the speaker changes mute only; hover/focus owns the slider.
      if (details.reason === 'trigger-press') { details.cancel(); return; }
      setOpen(nextOpen);
    }}>
      <Popover.Trigger openOnHover delay={150} closeDelay={250}
        className={buttonClass} aria-label={`${muteLabel} · ${trackLabel}`} aria-pressed={silent} disabled={disabled}
        onFocus={() => setOpen(true)}
        onClick={() => void (async () => {
          const saved = await save('muted', silent ? null : 'true', silent ? 'Unmute audio' : 'Mute audio');
          if (saved && silent && isAudioOnly && hidden) onUnhide();
        })()}>
        <RemixIcon name={silent ? 'volume-mute-line' : 'volume-up-line'} size={16} />
      </Popover.Trigger>
      <Popover.Portal><Popover.Positioner side="top" align="start" sideOffset={6} collisionPadding={12} className="z-150">
        <Popover.Popup initialFocus={false} finalFocus={false} className="w-48 rounded-lg border border-border bg-surface p-3 text-text-1 shadow-menu outline-none">
          <div className="mb-2 flex justify-between text-xs"><Popover.Title>{t('Volume')}</Popover.Title><span>{mixed && !dirty ? t('Mixed') : `${draft}%`}</span></div>
          <input type="range" min={0} max={Math.max(200, volume)} step={1} value={draft} disabled={disabled}
            aria-label={t('Volume')} aria-valuetext={`${draft}%`} className="w-full accent-current"
            onChange={e => { setDraft(Number(e.currentTarget.value)); setDirty(true); }}
            onPointerUp={() => void commitVolume()} onKeyUp={() => void commitVolume()} onBlur={() => void commitVolume()} />
        </Popover.Popup>
      </Popover.Positioner></Popover.Portal>
    </Popover.Root>
  </div>;
}
