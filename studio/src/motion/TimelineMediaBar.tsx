import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMediaGateway } from './MediaGatewayContext';
import { selectedMedia } from './timelineMediaSelection';
import { useTimelineContext } from '../player/components/TimelineProvider';
import { useTimelineReadOnlyPress } from '../player/components/timelineReadOnly';
import { RULER_H } from '../player/components/timelineLayout';
import { usePlayerStore } from '../player/store/playerStore';
import { useStudioShellContextOptional } from '../contexts/StudioContext';
import { useI18n } from '../i18n/I18n';
import { EditPopover } from '../player/components/EditModal';
import { useArtifactViewActive } from './ArtifactViewState';
import { useMediaPopoverPosition } from './useMediaPopoverPosition';
import type { MediaPopoverAnchor } from './mediaPopoverPosition';

export function TimelineMediaBar() {
  const gateway = useMediaGateway();
  const active = useArtifactViewActive();
  return gateway && active ? <ConnectedTimelineMediaBar /> : null;
}

function ConnectedTimelineMediaBar() {
  const gateway = useMediaGateway()!; const { t } = useI18n();
  const { state } = useTimelineContext(); const shell = useStudioShellContextOptional();
  const readOnly = useTimelineReadOnlyPress();
  const playing = usePlayerStore(s => s.isPlaying);
  const selectedIds = usePlayerStore(s => s.selectedElementIds);
  const [interaction, setInteraction] = useState(0), [caret, setCaret] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(''), [prompt, setPrompt] = useState(''), [ask, setAsk] = useState(false);
  const range = state.overlays.showPopover ? state.overlays.rangeSelection : null;
  const clip = !range && selectedIds.size <= 1 ? state.elements.find(el => (el.key ?? el.id) === state.selectedElementId) : undefined;
  const media = selectedMedia(clip);
  const start = range ? Math.min(range.start, range.end) : clip?.start ?? caret ?? 0;
  const duration = range ? Math.abs(range.end - range.start) : clip?.duration ?? 3;
  const identity = `${shell?.projectId}:${state.sessionEpoch}:${range ? 'range' : clip?.key ?? clip?.id ?? 'caret'}:${start}:${duration}:${interaction}`;
  const scroll = state.canvas.scrollRef;
  const clipKey = clip?.key ?? clip?.id;
  const pps = state.canvas.pps, contentOrigin = state.canvas.contentOrigin;
  const rangeY = range?.anchorY;
  const anchor = useMemo<MediaPopoverAnchor>(() => {
    let rangeOffset: number | undefined;
    return {
      get contextElement() { return scroll.current ?? undefined; },
      getBoundingClientRect: () => {
        const viewport = scroll.current;
        if (!viewport) return { left: 12, right: 12, top: window.innerHeight - 12, bottom: window.innerHeight - 12 };
        const rect = viewport.getBoundingClientRect();
        const clampX = (x: number) => Math.max(rect.left + contentOrigin, Math.min(x, rect.right));
        const clampY = (y: number) => Math.max(rect.top + RULER_H, Math.min(y, rect.bottom));
        const element = clipKey ? viewport.querySelector(`[data-clip][data-el-id="${CSS.escape(clipKey)}"]`) : null;
        if (element) {
          const clipRect = element.getBoundingClientRect();
          return { left: clampX(clipRect.left), right: clampX(clipRect.right), top: clampY(clipRect.top), bottom: clampY(clipRect.bottom) };
        }
        const left = clampX(rect.left + contentOrigin + start * pps - viewport.scrollLeft);
        if (rangeY === undefined) return { left, right: left, top: rect.top, bottom: rect.top + RULER_H };
        rangeOffset ??= rangeY - rect.top + viewport.scrollTop;
        const y = clampY(rect.top + rangeOffset - viewport.scrollTop);
        return { left, right: clampX(rect.left + contentOrigin + (start + duration) * pps - viewport.scrollLeft), top: y, bottom: y };
      },
    };
  }, [scroll, clipKey, start, duration, pps, contentOrigin, rangeY]);
  useEffect(() => {
    const viewport = scroll.current;
    if (!viewport) return;
    const activate = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = viewport.getBoundingClientRect();
      const ruler = event.clientY >= rect.top && event.clientY < rect.top + RULER_H;
      if (ruler) setCaret(Math.max(0, (event.clientX - rect.left + viewport.scrollLeft - state.canvas.contentOrigin) / state.canvas.pps));
      else setCaret(null);
      setInteraction(n => n + 1);
    };
    viewport.addEventListener('pointerup', activate);
    return () => viewport.removeEventListener('pointerup', activate);
  }, [scroll, state.timelineReady, state.canvas.pps, state.canvas.contentOrigin]);
  useEffect(() => { setCaret(null); setAsk(false); }, [state.sessionEpoch, shell?.activeCompPath]);
  const hidden = readOnly || !state.timelineReady || gateway.generationOpen || playing || shell?.writeBlockedReason || shell?.renderQueue.isRendering
    || state.canvas.isScrubbing || state.canvas.draggedElement || state.canvas.resizingClip || state.canvas.marqueeRect
    || state.overlays.clipContextMenu || state.overlays.kfContextMenu || state.overlays.gapContextMenu
    || dismissed === identity || (!range && !clip && caret === null);
  const popover = useMediaPopoverPosition(anchor, 680, !hidden && !ask);
  if (hidden) return null;
  const close = () => { setDismissed(identity); setAsk(false); };
  const open = (edit = false) => gateway.openGenerator({ prompt, placement: { start, duration: Math.max(.1, duration), track: clip?.track ?? 0 },
    anchor, modality: media?.modality, selection: media, ...(edit ? { intent: 'edit' as const } : {}) });
  const host = document.querySelector('[data-motion-studio]') ?? document.body;
  const anchorRect = anchor.getBoundingClientRect();
  return createPortal(ask ? <EditPopover initialPrompt={prompt} rangeStart={start} rangeEnd={start + duration} anchorX={(anchorRect.left + anchorRect.right) / 2} anchorY={anchorRect.top - 8} onClose={close} /> :
    <aside ref={popover.ref} className="motion-timeline-media-bar motion-media-surface" style={popover.style} aria-label={t('Timeline media actions')} onPointerDown={e => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') close(); }}>
      <div className="motion-media-context"><span>{start.toFixed(1)}–{(start + duration).toFixed(1)}s</span><span title={media?.label}>{media?.label ?? t(range ? 'Selected time range' : clip ? 'Selected clip' : 'At playhead')}</span><button className="motion-media-close" aria-label={t('Close timeline media actions')} onClick={close}>×</button></div>
      <form onSubmit={e => { e.preventDefault(); open(); }}>
        <input aria-label={t('Timeline media prompt')} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t(media?.modality === 'image' ? 'Describe a new image or how to change this one…' : 'Describe what goes here…')} />
        <button type="submit">{t('Generate media')}</button>
        {media?.modality === 'image' && <button type="button" className="motion-media-primary" onClick={() => open(true)}>{t('Edit image')}</button>}
        <button type="button" onClick={() => setAsk(true)}>{t('Ask Agent')}</button>
      </form>
    </aside>, host);
}
