import { useMvpEditor } from "../../motion/StudioHost";
import { useCallback, useSyncExternalStore } from "react";
import { useI18n } from '../../i18n/I18n';
import {
  Aperture,
  BracketsCurly,
  ChartBarHorizontal,
  ClockCounterClockwise,
  Code,
  FilmSlate,
  FilmStrip,
  Image,
  Monitor,
  Presentation,
  SlidersHorizontal,
  Sparkle,
  Stack,
  X,
  type Icon,
} from "../../icons/RemixIcons";
import type { IDockviewPanelHeaderProps } from "dockview-react";
import { isPanelId, PANEL_DEFINITIONS, type PanelId } from "./panelRegistry";

export const TAB_ICONS: Record<PanelId, Icon> = {
  preview: Monitor,
  timeline: ChartBarHorizontal,
  compositions: FilmStrip,
  assets: Image,
  code: Code,
  catalog: Sparkle,
  design: SlidersHorizontal,
  layers: Stack,
  renders: FilmSlate,
  variables: BracketsCurly,
  slideshow: Presentation,
  motionBlur: Aperture,
  history: ClockCounterClockwise,
};

/**
 * A dock tab. dock.css shows the type icon and close glyph on the shown tab only, keyed on
 * dockview's own tab class, so they swap in the frame the tab changes rather than a render later.
 * MVP side panels and the preview use text-only titles.
 */
export function DockTab({ api }: IDockviewPanelHeaderProps) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const subscribe = useCallback(
    (onChange: () => void) => {
      const subscription = api.onDidTitleChange(onChange);
      return () => subscription.dispose();
    },
    [api],
  );
  const title = useSyncExternalStore(subscribe, () => api.title ?? "");
  const TypeIcon = isPanelId(api.id) && (!mvp || (PANEL_DEFINITIONS[api.id].zone === "center" && api.id !== "preview"))
    ? TAB_ICONS[api.id]
    : null;
  return (
    <div className="hf-dock-tab" data-preview-heading={mvp && api.id === "preview" || undefined} data-panel-zone={isPanelId(api.id) ? PANEL_DEFINITIONS[api.id].zone : undefined}>
      {TypeIcon ? <TypeIcon className="hf-dock-tab-icon" size={14} aria-hidden /> : null}
      <span className="hf-dock-tab-label">{title}</span>
      {/* Same shape as dockview's own close control: a tab cannot hold a focusable button. */}
      {!mvp && (
        <div
          role="button"
          tabIndex={-1}
          aria-label={t('Close {title}', { title })}
          className="hf-dock-tab-close"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            api.close();
          }}
        >
          <X size={12} aria-hidden />
        </div>
      )}
    </div>
  );
}
