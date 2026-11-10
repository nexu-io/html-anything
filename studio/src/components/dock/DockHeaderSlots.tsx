import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { PanelId } from "./panelRegistry";

type HeaderSlots = Partial<Record<PanelId, HTMLElement>>;
const HeaderContext = createContext<{
  slots: HeaderSlots;
  register: (id: PanelId, node: HTMLElement | null) => void;
} | null>(null);

/** Portals keep panel-owned controls and state together across Dockview's separate roots. */
export function DockHeaderSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<HeaderSlots>({});
  const register = useCallback((id: PanelId, node: HTMLElement | null) => {
    setSlots((previous) => {
      if (previous[id] === (node ?? undefined)) return previous;
      const next = { ...previous };
      if (node) next[id] = node;
      else delete next[id];
      return next;
    });
  }, []);
  return <HeaderContext.Provider value={{ slots, register }}>{children}</HeaderContext.Provider>;
}

export function DockHeaderSlot({ id }: { id: PanelId }) {
  const register = useContext(HeaderContext)?.register;
  const ref = useCallback((node: HTMLDivElement | null) => register?.(id, node), [id, register]);
  return <div ref={ref} data-panel-header-controls={id} className="flex items-center h-full" />;
}

export function useDockHeaderSlot(id: PanelId) {
  return useContext(HeaderContext)?.slots[id] ?? null;
}
