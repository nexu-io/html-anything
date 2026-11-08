export type MediaAnchorRect = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>;
export type MediaPopoverAnchor = {
  getBoundingClientRect: () => MediaAnchorRect;
  contextElement?: Element;
};

/** Keep the last visible position when an opener disappears after inserting a clip. */
export function mediaPopoverAnchor(element: HTMLElement): MediaPopoverAnchor {
  let lastRect = element.getBoundingClientRect();
  return {
    contextElement: element,
    getBoundingClientRect: () => {
      const rect = element.getBoundingClientRect();
      if (element.isConnected && (rect.width || rect.height)) lastRect = rect;
      return lastRect;
    },
  };
}

export function mediaPopoverPosition(
  anchor: MediaAnchorRect,
  panel: { width: number; height: number },
  viewport: { left: number; top: number; width: number; height: number },
) {
  const margin = 12, gap = 8;
  const leftEdge = viewport.left + margin, rightEdge = viewport.left + viewport.width - margin;
  const topEdge = viewport.top + margin, bottomEdge = viewport.top + viewport.height - margin;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
  const anchorTop = clamp(anchor.top, topEdge, bottomEdge);
  const anchorBottom = clamp(anchor.bottom, topEdge, bottomEdge);
  const above = Math.max(0, anchorTop - topEdge - gap);
  const below = Math.max(0, bottomEdge - anchorBottom - gap);
  const side = panel.height <= above || (panel.height > below && above >= below) ? 'top' : 'bottom';
  const maxHeight = side === 'top' ? above : below;
  const height = Math.min(panel.height, maxHeight);
  return {
    left: clamp((anchor.left + anchor.right - panel.width) / 2, leftEdge, rightEdge - panel.width),
    top: side === 'top' ? anchorTop - gap - height : anchorBottom + gap,
    maxHeight,
  };
}
