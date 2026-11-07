import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { mediaPopoverPosition, type MediaPopoverAnchor } from './mediaPopoverPosition';

/** Measure the actual surface and follow its opener through scrolling and Dock resizing. */
export function useMediaPopoverPosition(anchor: MediaPopoverAnchor | undefined, width: number, enabled = true) {
  const ref = useRef<HTMLElement>(null);
  // Keep mount-time autofocus available; the layout effect sets the final position before paint.
  const [style, setStyle] = useState<CSSProperties>({ left: 12, top: 12 });
  const update = useCallback(() => {
    const panel = ref.current;
    if (!enabled || !panel) return;
    const viewport = window.visualViewport;
    const bounds = { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
      width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
    const rect = panel.getBoundingClientRect();
    const panelWidth = rect.width || Math.min(width, bounds.width - 24);
    const panelHeight = Math.max(rect.height, panel.scrollHeight + panel.offsetHeight - panel.clientHeight);
    // Programmatic callers without an opener get a centered, viewport-safe panel.
    const next = anchor ? mediaPopoverPosition(anchor.getBoundingClientRect(), { width: panelWidth, height: panelHeight }, bounds) : {
      left: bounds.left + (bounds.width - panelWidth) / 2,
      top: bounds.top + Math.max(12, (bounds.height - panelHeight) / 2),
      maxHeight: bounds.height - 24,
    };
    setStyle(previous => previous.left === next.left && previous.top === next.top && previous.maxHeight === next.maxHeight ? previous : next);
  }, [anchor, width, enabled]);
  // Results, tabs and expanded parameters can resize the panel in the same commit.
  // Measure before paint as well as observing external layout/image changes.
  useLayoutEffect(update);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!enabled || !panel) return;
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    // Ancestor size changes include the split panes that can move the opener without resizing it.
    for (let element = anchor?.contextElement; element; element = element.parentElement ?? undefined) observer.observe(element);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [anchor, enabled, update]);
  return { ref, style };
}
