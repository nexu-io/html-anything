import { DockHeaderSlot } from "./DockHeaderSlots";
import { DockSideActions } from "./DockSideActions";
import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { CornersIn, CornersOut, DotsThree, X } from "../../icons/RemixIcons";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { IconButton, Menu, MenuCheckboxItem, MenuItem, MenuSeparator, Tooltip } from "../ui";
import { useDockLayoutStore } from "./dockLayoutStore";
import { PANEL_DEFINITIONS, isPanelId, panelsInZone } from "./panelRegistry";
import { clickMethod, trackStudioClick } from "../../motion/editorTracking";

/** Panel menu, maximise and close group, drawn on the active group's strip only. */
export function DockStripActions({
  api,
  containerApi,
  panels,
  isGroupActive,
  group,
  activePanel,
}: IDockviewHeaderActionsProps) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const subscribe = useCallback(
    (onChange: () => void) => {
      const subscription = containerApi.onDidMaximizedGroupChange(onChange);
      return () => subscription.dispose();
    },
    [containerApi],
  );
  const maximized = useSyncExternalStore(subscribe, () => api.isMaximized());
  const openPanels = useDockLayoutStore((state) => state.openPanels);
  const togglePanel = useDockLayoutStore((state) => state.togglePanel);
  const resetLayout = useDockLayoutStore((state) => state.resetLayout);
  const previewGroup = panels.some((panel) => panel.id === "preview");
  const expandButton = useRef<HTMLButtonElement>(null);
  const previewMotion = useRef<Animation | null>(null);
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const stop = () => { previewMotion.current?.cancel(); previewMotion.current = null; };
    const onChange = () => { if (preference?.matches) stop(); };
    preference?.addEventListener("change", onChange);
    return () => { stop(); preference?.removeEventListener("change", onChange); };
  }, []);
  const togglePreview = (animate: boolean) => {
    const element = containerApi.getPanel("preview")?.view.content.element;
    const previous = previewMotion.current && element ? getComputedStyle(element) : null;
    const from = previous ? { opacity: previous.opacity, transform: previous.transform } : null;
    previewMotion.current?.cancel();
    previewMotion.current = null;
    const restoring = api.isMaximized();
    if (restoring) api.exitMaximized();
    else api.maximize();
    if (!animate || !element?.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Animate the live content, not Dockview's measured overlay or a cloned player.
    const animation = element.animate([
      from ?? { opacity: 0.86, transform: restoring ? "scale(1.01)" : "scale(0.985)" },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    previewMotion.current = animation;
    animation.onfinish = () => { if (previewMotion.current === animation) previewMotion.current = null; };
  };
  useEffect(() => {
    if (!mvp || !previewGroup || !maximized) return;
    const restore = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.fullscreenElement) return;
      if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      previewMotion.current?.cancel();
      previewMotion.current = null;
      api.exitMaximized();
      expandButton.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", restore, true);
    return () => window.removeEventListener("keydown", restore, true);
  }, [api, mvp, previewGroup, maximized]);
  if (mvp) return previewGroup ? (
    <div className="flex items-center h-full gap-1 pr-1">
      <DockHeaderSlot id="preview" />
      <Tooltip
        label={t(maximized ? "Restore preview" : "Expand preview")}
        description={t(maximized ? "Return to the editor layout. You can also press Esc." : "Enlarge the preview within this workspace, keeping your chat visible.")}
      >
        <IconButton
          ref={expandButton}
          size="sm"
          aria-label={t(maximized ? "Restore preview" : "Expand preview")}
          aria-expanded={maximized}
          icon={maximized ? <CornersIn size={16} /> : <CornersOut size={16} />}
          onClick={(event) => {
            trackStudioClick("preview", maximized ? "restore_preview" : "expand_preview", undefined, clickMethod(event));
            togglePreview(event.detail > 0);
          }}
        />
      </Tooltip>
    </div>
  ) : <DockSideActions group={group} panels={panels} activePanel={activePanel} />;
  if (!isGroupActive) return null;

  const first = panels.find((panel) => isPanelId(panel.id))?.id;
  const menuPanels = isPanelId(first) ? panelsInZone(PANEL_DEFINITIONS[first].zone) : [];
  return (
    <div className="hf-dock-strip-actions">
      <Menu
        align="end"
        aria-label={t("Panel menu")}
        trigger={<IconButton size="sm" aria-label={t("Panel menu")} icon={<DotsThree size={16} />} />}
      >
        {menuPanels.map((id) => (
          <MenuCheckboxItem
            key={id}
            checked={openPanels.has(id)}
            onCheckedChange={() => togglePanel(id)}
          >
            {t(PANEL_DEFINITIONS[id].title)}
          </MenuCheckboxItem>
        ))}
        <MenuSeparator />
        <MenuItem onClick={resetLayout}>{t("Reset layout")}</MenuItem>
      </Menu>
      <IconButton
        size="sm"
        aria-label={maximized ? t("Restore panel") : t("Maximize panel")}
        icon={maximized ? <CornersIn size={16} /> : <CornersOut size={16} />}
        onClick={() => (maximized ? api.exitMaximized() : api.maximize())}
      />
      <IconButton
        size="sm"
        aria-label={t("Close group")}
        icon={<X size={16} />}
        onClick={() => api.close()}
      />
    </div>
  );
}
