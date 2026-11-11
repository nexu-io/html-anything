import { DockHeaderSlot } from "./DockHeaderSlots";
import { useMvpEditor } from "../../motion/StudioHost";
import { useI18n } from "../../i18n/I18n";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { CornersIn, CornersOut, DotsThree, X } from "../../icons/RemixIcons";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { IconButton, Menu, MenuCheckboxItem, MenuItem, MenuSeparator, Tooltip } from "../ui";
import { useDockLayoutStore } from "./dockLayoutStore";
import { PANEL_DEFINITIONS, isPanelId, panelsInZone } from "./panelRegistry";

/** Panel menu, maximise and close group, drawn on the active group's strip only. */
export function DockStripActions({
  api,
  containerApi,
  panels,
  isGroupActive,
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
  useEffect(() => {
    if (!mvp || !previewGroup || !maximized) return;
    const restore = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || document.fullscreenElement) return;
      if (document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
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
          onClick={() => (maximized ? api.exitMaximized() : api.maximize())}
        />
      </Tooltip>
    </div>
  ) : null;
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
