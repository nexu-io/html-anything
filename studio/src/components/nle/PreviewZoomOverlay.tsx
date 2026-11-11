import { createPortal } from "react-dom";
import { useI18n } from "../../i18n/I18n";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { CaretDown } from "../../icons/RemixIcons";
import { Menu, MenuRadioGroup, MenuRadioItem } from "../ui/Menu";
import {
  isFitZoom,
  isPreviewAtFit,
  resolvePreviewVisibleRegion,
  toDomPrecision,
  type PreviewZoomState,
} from "./previewZoom";

const NAVIGATOR_PX = 112;
const ZOOM_PRESETS = [50, 75, 100, 150, 200] as const;

function navigatorFrameSize(stage: { width: number; height: number }) {
  const ratio = stage.width > 0 && stage.height > 0 ? stage.width / stage.height : 16 / 9;
  return ratio >= 1
    ? { width: NAVIGATOR_PX, height: toDomPrecision(NAVIGATOR_PX / ratio) }
    : { width: toDomPrecision(NAVIGATOR_PX * ratio), height: NAVIGATOR_PX };
}

/** `draw` moves the navigator's highlight without a render, so it can follow every transform write. */
export function usePreviewNavigator(
  viewportRef: RefObject<HTMLDivElement | null>,
  stageSize: { width: number; height: number },
  zoomRef: RefObject<PreviewZoomState>,
) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const stageSizeRef = useRef(stageSize);
  stageSizeRef.current = stageSize;
  const draw = useCallback(
    (state: PreviewZoomState) => {
      const region = regionRef.current;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!region || !rect) return;
      const visible = resolvePreviewVisibleRegion({
        state,
        viewportWidth: rect.width,
        viewportHeight: rect.height,
        contentWidth: stageSizeRef.current.width,
        contentHeight: stageSizeRef.current.height,
      });
      region.style.left = `${visible.left * 100}%`;
      region.style.top = `${visible.top * 100}%`;
      region.style.width = `${visible.width * 100}%`;
      region.style.height = `${visible.height * 100}%`;
    },
    [viewportRef],
  );
  const setRegion = useCallback(
    (node: HTMLDivElement | null) => {
      regionRef.current = node;
      draw(zoomRef.current);
    },
    [draw, zoomRef],
  );
  useEffect(() => draw(zoomRef.current), [stageSize, draw, zoomRef]);
  return { draw, setRegion };
}

export function PreviewZoomOverlay({
  zoom,
  stageSize,
  onFit,
  navigatorRegionRef,
  controlsTarget,
  onZoomPercent,
  showNavigator = true,
}: {
  controlsTarget?: HTMLElement | null;
  onZoomPercent: (percent: number) => void;
  showNavigator?: boolean;
  zoom: PreviewZoomState;
  stageSize: { width: number; height: number };
  onFit: () => void;
  navigatorRegionRef: (node: HTMLDivElement | null) => void;
}) {
  const { t } = useI18n();
  const atFit = isPreviewAtFit(zoom);
  if (atFit && !controlsTarget) return null;
  const controls = (
    <div
      className={controlsTarget
        ? "flex items-center gap-2 px-1 text-xs text-text-0 whitespace-nowrap"
        : "absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-md py-1 pl-2.5 pr-1 text-xs text-white/90 bg-black/80 backdrop-blur-xs"}
      data-testid="preview-zoom-chip"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {controlsTarget ? (
        <Menu
          align="end"
          className="motion-preview-zoom-menu"
          aria-label={t("Scale")}
          trigger={<button
            type="button"
            aria-label={`${t("Scale")}: ${Math.round(zoom.zoomPercent)}%`}
            className="flex items-center gap-1 rounded px-2 py-1 tabular-nums text-[11px] hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-studio-accent"
            data-testid="preview-zoom-menu"
          >
            {Math.round(zoom.zoomPercent)}%<CaretDown size={12} />
          </button>}
        >
          <MenuRadioGroup value={zoom.zoomPercent} onValueChange={(value) => onZoomPercent(Number(value))}>
            {ZOOM_PRESETS.map(percent => <MenuRadioItem key={percent} value={percent} closeOnClick>{percent}%</MenuRadioItem>)}
          </MenuRadioGroup>
        </Menu>
      ) : <span className="tabular-nums">{!atFit && isFitZoom(zoom.zoomPercent) ? t("Panned") : t("Zoomed {percent}%", { percent: Math.round(zoom.zoomPercent) })}</span>}
      {!atFit && <button
        type="button"
        className={controlsTarget
          ? "rounded px-2 py-1 font-medium text-text-0 bg-hover hover:bg-press disabled:opacity-40 disabled:cursor-default"
          : "rounded px-1.5 py-0.5 font-medium text-white bg-white/15 hover:bg-white/25 transition-colors"}
        onClick={onFit}
        aria-label={t("Fit the whole frame in view")}
        data-testid="preview-zoom-fit"
      >
        {t("Fit")}
      </button>}
    </div>
  );
  return (
    <>
      {controlsTarget ? createPortal(controls, controlsTarget) : controls}
      {showNavigator && !atFit && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 z-50 rounded-md p-1.5 bg-black/60 backdrop-blur-xs"
          data-testid="preview-zoom-navigator"
        >
          <div className="relative overflow-hidden bg-white/10" style={navigatorFrameSize(stageSize)}>
            <div
              ref={navigatorRegionRef}
              className="absolute rounded-[1px] border border-studio-accent bg-studio-accent/15"
              data-testid="preview-zoom-navigator-region"
            />
          </div>
        </div>
      )}
    </>
  );
}
