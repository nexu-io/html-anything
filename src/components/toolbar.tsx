"use client";

import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TemplatePicker } from "./template-picker";
import { ExportMenu } from "./export-menu";
import { LayoutModeToggle } from "./layout-mode-toggle";

export function Toolbar({
  iframeRef,
  onOpenAgentPicker,
  onOpenSettings,
}: {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  onOpenAgentPicker: () => void;
  onOpenSettings: () => void;
}) {
  const agent = useStore((s) => s.selectedAgent);
  const agents = useStore((s) => s.agents);
  const agentModels = useStore((s) => s.agentModels);
  const t = useT();

  const agentInfo = agents.find((a) => a.id === agent);
  const model = agent ? agentModels[agent] ?? "default" : "default";

  return (
    <header
      className="relative z-40 flex flex-wrap items-center justify-between gap-3 px-5 py-3"
      style={{
        background: "rgba(250, 249, 247, 0.92)",
        borderBottom: "1px solid var(--line-faint)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-4">
        <Brand />
        <div className="hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} />
        <button
          onClick={onOpenAgentPicker}
          className="flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-[13px] transition-all hover:border-[var(--ink)]/30"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          title={t("toolbar.switchAgent")}
        >
          {agentInfo ? (
            <>
              <span className="pulse-dot" />
              <span className="font-medium text-[var(--ink)]">{agentInfo.label}</span>
              {model !== "default" && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10.5px] font-mono"
                  style={{ background: "var(--paper)", color: "var(--ink-mute)", border: "1px solid var(--line-faint)" }}
                  title={`model = ${model}`}
                >
                  {model}
                </span>
              )}
              <span className="text-[var(--ink-faint)]">›</span>
            </>
          ) : (
            <>
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--coral)] text-[9px] text-white font-bold">!</span>
              <span className="font-medium text-[var(--coral)]">{t("toolbar.selectAgent")}</span>
            </>
          )}
        </button>
        <TemplatePicker />
      </div>

      <div className="flex items-center gap-2">
        <LayoutModeToggle />
        <div className="hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} />
        <button
          onClick={onOpenSettings}
          className="grid h-9 w-9 place-items-center rounded-full border text-[var(--ink-soft)] transition-all hover:border-[var(--ink)]/30 hover:text-[var(--ink)]"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          title={t("toolbar.settings")}
          aria-label={t("toolbar.settings")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <ExportMenu iframeRef={iframeRef} />
      </div>
    </header>
  );
}

function Brand() {
  const t = useT();
  return (
    <a href="/" className="flex items-center gap-2.5">
      <div
        className="grid h-9 w-9 place-items-center rounded-full font-[family-name:var(--font-serif)] italic text-[18px] font-semibold text-[var(--ink)]"
        style={{ border: "1.5px solid var(--ink)", background: "var(--surface)" }}
      >
        H
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
          HTML <em className="serif-em not-italic font-[family-name:var(--font-serif)] italic font-semibold">Anything</em>
        </div>
        <div className="text-[9.5px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
          {t("brand.subtitle")}
        </div>
      </div>
    </a>
  );
}
