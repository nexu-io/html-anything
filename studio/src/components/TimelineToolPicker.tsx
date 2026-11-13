import { RemixIcon } from "../icons/RemixIcons";
import { useI18n } from "../i18n/I18n";
import { useMvpEditor } from "../motion/StudioHost";
import { useEffect, type ReactNode } from "react";
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

/** The MVP exposes selection only; the full editor retains its pointer-mode menu. */
export function TimelineToolPicker({ showSelectAroundPlayhead = true, splitShortcut }: { showSelectAroundPlayhead?: boolean; splitShortcut?: string }) {
  const { t } = useI18n();
  const mvp = useMvpEditor();
  const activeTool = usePlayerStore((s) => s.activeTool);
  const keys = useStudioKeys();
  const store = () => usePlayerStore.getState();
  useEffect(() => {
    if (mvp) usePlayerStore.getState().setActiveTool("select");
  }, [mvp]);
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
    return <Tooltip label={`${t("Select")} (${keyHint("selectTool", keys)})`}>
      <button type="button" aria-label={t("Select")} aria-pressed={true} className={flatActive}
        onClick={() => store().setActiveTool("select")}><SelectIcon /></button>
    </Tooltip>;
  }
  if (showSelectAroundPlayhead && !mvp) {
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
    <Tooltip
      label={t("Timeline tool: {value0}", { value0: t(current.label) })}
      description={t("Select ({select}): select and move clips. Blade ({blade}): click a clip to cut at the pointer. Split ({split}) cuts at the playhead.", { select: keyHint("selectTool", keys), blade: keyHint("razorTool", keys), split: splitShortcut ?? keyHint("split", keys) })}
    >
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
    </Tooltip>
  );
}
