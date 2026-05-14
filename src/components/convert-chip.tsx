"use client";

import { useStore, selectActiveTask } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useConvert } from "@/lib/use-convert";

/**
 * Floating chip pinned to the editor / preview divider that runs the same
 * Convert action as the toolbar button. Mirrors `Toolbar`'s logic but stays
 * close to the editor so users notice it after editing without traveling
 * back up to the top bar. Toolbar's own button (and ⌘+Enter shortcut) stay.
 */
export function ConvertChip() {
  const agent = useStore((s) => s.selectedAgent);
  const agents = useStore((s) => s.agents);
  const agentModels = useStore((s) => s.agentModels);
  const activeTaskId = useStore((s) => s.activeTaskId);
  const template = useStore((s) => selectActiveTask(s)?.templateId ?? "article-magazine");
  const content = useStore((s) => selectActiveTask(s)?.content ?? "");
  const format = useStore((s) => selectActiveTask(s)?.format ?? "text");
  const status = useStore((s) => selectActiveTask(s)?.status ?? "idle");
  const layoutMode = useStore((s) => s.layoutMode);
  const { run, cancel } = useConvert();
  const t = useT();

  // Only show in split mode — when only one pane is visible there's no
  // divider to hang off, and the toolbar button is already obvious.
  if (layoutMode !== "split") return null;

  const agentInfo = agents.find((a) => a.id === agent);
  const model = agent ? agentModels[agent] ?? "default" : "default";
  const canConvert =
    !!agent && !!content.trim() && status !== "running" && !agentInfo?.unsupported;

  const isRunning = status === "running";

  const tip = !agent
    ? t("toolbar.firstSelectAgent")
    : agentInfo?.unsupported
      ? t("toolbar.unsupportedProtocol")
      : !content.trim()
        ? t("toolbar.enterContent")
        : t("convertChip.tooltip");

  const onClick = () => {
    if (isRunning) {
      cancel(activeTaskId);
      return;
    }
    if (!canConvert) return;
    run({ taskId: activeTaskId, agent: agent!, templateId: template, content, format, model });
  };

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-30 flex items-center"
      style={{ transform: "translateX(-50%)" }}
    >
      <button
        onClick={onClick}
        disabled={!isRunning && !canConvert}
        title={tip}
        aria-label={t("convertChip.label")}
        className="pointer-events-auto group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-medium shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: isRunning
            ? "var(--coral)"
            : canConvert
              ? "var(--ink)"
              : "var(--ink-mute)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 18px rgba(15, 14, 12, 0.18)",
        }}
      >
        {isRunning ? (
          <>
            <span className="pulse-dot" style={{ background: "#fff" }} />
            {t("toolbar.stop")}
          </>
        ) : (
          <>
            <span aria-hidden>⚡</span>
            {t("convertChip.label")}
          </>
        )}
      </button>
    </div>
  );
}
