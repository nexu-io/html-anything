"use client";

import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TemplatePicker } from "./template-picker";
import { ExportMenu } from "./export-menu";
import { LayoutModeToggle } from "./layout-mode-toggle";
import { DeployControl } from "./deploy-control";

export function Toolbar({
  iframeRef,
  onOpenAgentPicker,
  onOpenSettings,
  onRequestConfigureDeploy,
  deployConfigRev,
}: {
  iframeRef: React.MutableRefObject<HTMLIFrameElement | null>;
  onOpenAgentPicker: () => void;
  onOpenSettings: () => void;
  onRequestConfigureDeploy: () => void;
  deployConfigRev: number;
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
        <CommunityLinks />
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
        <DeployControl
          onRequestConfigureDeploy={onRequestConfigureDeploy}
          configRev={deployConfigRev}
        />
        <ExportMenu iframeRef={iframeRef} />
      </div>
    </header>
  );
}

function CommunityLinks() {
  const t = useT();
  const linkCls =
    "grid h-9 w-9 place-items-center rounded-full border text-[var(--ink-soft)] transition-all hover:border-[var(--ink)]/30 hover:text-[var(--ink)]";
  const linkStyle = { background: "var(--surface)", borderColor: "var(--line)" };
  const githubLabel = t("community.starOnGitHub");
  const discordLabel = t("community.joinDiscord");
  return (
    <div className="hidden md:flex items-center gap-1.5">
      <a
        href="https://github.com/nexu-io/html-anything"
        target="_blank"
        rel="noreferrer noopener"
        className={linkCls}
        style={linkStyle}
        title={githubLabel}
        aria-label={githubLabel}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.79 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1-.32 3.3 1.23a11.45 11.45 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.11 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>
      <a
        href="https://discord.com/invite/qhbcCH8Am4"
        target="_blank"
        rel="noreferrer noopener"
        className={linkCls}
        style={linkStyle}
        title={discordLabel}
        aria-label={discordLabel}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
          <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.073.035c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.07.07 0 0 0-.073-.035A19.74 19.74 0 0 0 3.677 4.37a.06.06 0 0 0-.029.025C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.07.07 0 0 0-.041-.099 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.007-.118c.126-.094.252-.192.372-.291a.07.07 0 0 1 .074-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .075.009c.121.099.247.198.373.292a.07.07 0 0 1-.006.118 12.3 12.3 0 0 1-1.873.891.07.07 0 0 0-.04.1 15.83 15.83 0 0 0 1.226 1.993.07.07 0 0 0 .083.028 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.025zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </a>
    </div>
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
