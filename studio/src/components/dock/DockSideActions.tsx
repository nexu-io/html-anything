import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { IDockviewHeaderActionsProps } from "dockview-react";
import { RemixIcon } from "../../icons/RemixIcons";
import { useI18n } from "../../i18n/I18n";
import { IconButton, Tooltip } from "../ui";
import { TAB_ICONS } from "./DockTab";
import { useDockLayoutStore } from "./dockLayoutStore";
import { isPanelId, PANEL_DEFINITIONS } from "./panelRegistry";

/** A collapsed side keeps its Dockview group, tabs and preview sibling intact. */
export function DockSideActions({ group, panels }: Pick<IDockviewHeaderActionsProps, "group" | "panels" | "activePanel">) {
  const { t } = useI18n();
  const first = panels.find(panel => isPanelId(panel.id))?.id;
  const zone = isPanelId(first) ? PANEL_DEFINITIONS[first].zone : "center";
  const collapsed = useDockLayoutStore(state => state.collapsedZones?.includes(zone) ?? false);
  const controller = useDockLayoutStore(state => state.controller);
  const activatePanel = useDockLayoutStore(state => state.activatePanel);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const previous = useRef(collapsed);
  useEffect(() => {
    if (previous.current !== collapsed) buttonRef.current?.focus({ preventScroll: true });
    previous.current = collapsed;
  }, [collapsed]);
  if (!isPanelId(first) || zone === "center") return null;
  const label = t(zone === "left"
    ? collapsed ? "Expand left panel" : "Collapse left panel"
    : collapsed ? "Expand right panel" : "Collapse right panel");
  const toggle = (
    <Tooltip label={t(collapsed ? "Expand" : "Collapse")} side={collapsed ? zone === "left" ? "right" : "left" : "bottom"}>
      <IconButton ref={buttonRef} size={collapsed ? "lg" : "sm"} aria-label={label}
        aria-expanded={!collapsed} icon={<RemixIcon name="arrow-right-s-line" size={16} mirrored={zone === "left" ? !collapsed : collapsed} />}
        onClick={event => controller?.setGroupCollapsed?.(first, !collapsed, event.detail > 0)} />
    </Tooltip>
  );
  if (!collapsed) return <div className="hf-dock-side-actions">{toggle}</div>;
  return createPortal(
    <nav className="hf-dock-side-rail" aria-label={t(zone === "left" ? "Left panels" : "Right panels")}>
      {toggle}
      <div className="hf-dock-side-rail-divider" role="separator" />
      <div className="hf-dock-side-rail-items">
        {panels.map(panel => {
          if (!isPanelId(panel.id)) return null;
          const id = panel.id;
          const Icon = TAB_ICONS[id];
          const title = panel.title || t(PANEL_DEFINITIONS[id].title);
          return <Tooltip key={id} label={title} side={zone === "left" ? "right" : "left"}>
            <IconButton size="lg" aria-label={title} aria-expanded={false}
              icon={<Icon size={16} />} onClick={event => {
                controller?.setGroupCollapsed?.(id, false, event.detail > 0);
                activatePanel(id);
              }} />
          </Tooltip>;
        })}
      </div>
    </nav>, group.element,
  );
}
