import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { PLAYHEAD_GLOW_W } from "./PlayheadIndicator";

// Keep the header boundary clipped even during scrolling. Update only this layer's
// style, without re-rendering the timeline or its clips on every scroll frame.
// Half the glow may pass the edge so the head at 00:00 remains fully visible.
export function TimelinePlayheadLayer({
  scrollRef,
  contentOrigin,
  children,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  contentOrigin: number;
  children: ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  // The ancestor viewport's ref is attached after child layout effects.
  useEffect(() => {
    const scroll = scrollRef.current;
    const layer = layerRef.current;
    if (!scroll || !layer) return;
    const syncClip = () => {
      layer.style.clipPath = `inset(0 0 0 ${scroll.scrollLeft + contentOrigin - PLAYHEAD_GLOW_W / 2}px)`;
    };
    syncClip();
    scroll.addEventListener("scroll", syncClip, { passive: true });
    return () => scroll.removeEventListener("scroll", syncClip);
  }, [scrollRef, contentOrigin]);
  return (
    <div
      ref={layerRef}
      data-timeline-playhead-layer=""
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 100,
        clipPath: `inset(0 0 0 ${contentOrigin - PLAYHEAD_GLOW_W / 2}px)`,
      }}
    >
      {children}
    </div>
  );
}
