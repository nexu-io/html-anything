import { RemixIcon } from "../icons/RemixIcons";
import { useI18n } from "../i18n/I18n";
import { useMvpEditor } from "../motion/StudioHost";
import type { ReactNode } from "react";
import { ArrowLineLeft, ArrowLineRight, CaretDown } from "../icons/RemixIcons";
import { usePlayerStore } from "../player";
import { Scissors } from "../icons/SystemIcons";
import { Menu, MenuItem, Tooltip } from "./ui";
import { cn } from "./ui/cn";
import { flatActive, flatIdle } from "./timelineToolbarStyles";
import { keyHint, useStudioKeys } from "../player/components/studioShortcuts";

function SelectIcon() {
  return (
    <RemixIcon name="cursor-line" size={16} />
  );
}

interface ToolRow {
  label: string;
  shortcut: string;
  icon: ReactNode;
  active: boolean;
  run: () => void;
}

/** The MVP exposes its two tools directly; the full editor retains the tool menu. */
export function TimelineToolPicker({ showSelectAroundPlayhead = true }) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const activeTool = usePlayerStore((s) => s.activeTool);
  const keys = useStudioKeys();
  const store = () => usePlayerStore.getState();
  const rows: ToolRow[] = [
    {
      label: "Select",
      shortcut: keyHint("selectTool", keys),
      icon: <SelectIcon />,
      active: activeTool === "select",
      run: () => store().setActiveTool("select"),
    },
    {
      label: "Blade tool",
      shortcut: keyHint("razorTool", keys),
      icon: <Scissors size={16} />,
      active: activeTool === "razor",
      run: () => store().setActiveTool("razor"),
    },
  ];
  if (mvp) {
    return (
      <div role="group" aria-label={t("Timeline tools")} className="flex items-center gap-0.5">
        {rows.map((row) => (
          <Tooltip
            key={row.label}
            side="bottom"
            label={`${t(row.label)} (${row.shortcut})`}
            description={row.label === "Blade tool"
              ? `${t("Click a clip where you want to split it. Switch back to Select to move or select clips.")} (${keyHint("selectTool", keys)})`
              : undefined}
          >
            <button
              type="button"
              aria-label={t(row.label)}
              aria-pressed={row.active}
              className={row.active ? flatActive : flatIdle}
              onClick={row.run}
            >
              {row.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    );
  }
  if (showSelectAroundPlayhead) {
    rows.push(
      {
        label: "Select leftward",
        shortcut: keyHint("selectLeftward", keys),
        icon: <ArrowLineLeft size={16} aria-hidden="true" />,
        active: false,
        run: () => store().selectLeftward(),
      },
      {
        label: "Select rightward",
        shortcut: keyHint("selectRightward", keys),
        icon: <ArrowLineRight size={16} aria-hidden="true" />,
        active: false,
        run: () => store().selectRightward(),
      },
    );
  }
  const current = rows.find((row) => row.active) ?? rows[0];
  return (
    <Menu
      aria-label={t("Timeline tools")}
      trigger={
        <button
          type="button"
          aria-label={t("Timeline tool: {value0}", { value0: t(current.label) })}
          className={cn(flatIdle, "gap-0.5")}
        >
          {current.icon}
          <CaretDown size={10} weight="bold" aria-hidden="true" />
        </button>
      }
    >
      {rows.map((row) => (
        <MenuItem
          key={t(row.label)}
          shortcut={row.shortcut}
          onClick={row.run}
          data-active={row.active || undefined}
          className={row.active ? "bg-press text-text-0" : undefined}
        >
          <span className="flex items-center gap-2">
            {row.icon}
            {t(row.label)}
          </span>
        </MenuItem>
      ))}
    </Menu>
  );
}
