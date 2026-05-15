"use client";

import { useEffect, useRef, useState } from "react";
import { useDeploy } from "@/lib/use-deploy";
import { useT } from "@/lib/i18n";
import {
  useStore,
  selectActiveTask,
  type DeploymentRecord,
} from "@/lib/store";

/**
 * Publish-to-Vercel control rendered next to the preview-pane toolbar
 * actions. Renders three things in one rounded popover-anchor block:
 *
 *  1. The Publish / Deploying… / coral pill — primary CTA. Disabled when
 *     the task has no html yet.
 *  2. A compact result line — "Live at <url> [Copy] [Open]" — appearing
 *     immediately below the button after a successful deploy. Persists
 *     until the user navigates away from the task.
 *  3. A "Past deployments" dropdown listing the bounded ring (latest 5
 *     entries, hash-tagged so the user can tell which version of the html
 *     each url corresponds to).
 *
 * Cloudflare Pages provider is intentionally absent until the wasm-blake3
 * dependency lands in a follow-up PR — Settings → Deploy already shows a
 * "coming soon" placeholder for it.
 */

export function DeployControl() {
  const html = useStore((s) => selectActiveTask(s)?.html ?? "");
  const taskId = useStore((s) => s.activeTaskId);
  const deployments = useStore(
    (s) => selectActiveTask(s)?.deployments ?? [],
  );
  const removeDeploymentFor = useStore((s) => s.removeDeploymentFor);
  const t = useT();
  const { status, error, latest, deploy } = useDeploy();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close the history dropdown on outside click.
  useEffect(() => {
    if (!historyOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [historyOpen]);

  // Auto-clear the "Copied" feedback after 1.5 s.
  useEffect(() => {
    if (!copiedUrl) return;
    const id = setTimeout(() => setCopiedUrl(null), 1500);
    return () => clearTimeout(id);
  }, [copiedUrl]);

  const isDeploying = status === "deploying";
  const canDeploy = html.length > 0 && !isDeploying;

  const onClickPublish = () => {
    if (!canDeploy) return;
    void deploy({ taskId, provider: "vercel", html });
  };

  const onCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
    } catch {
      /* clipboard may be denied — surface nothing, the URL is still visible */
    }
  };

  // Newest record first; `latest` may be the same as `deployments[0]` so we
  // dedupe by id to avoid rendering it twice in the result line + history.
  const visibleHistory = deployments.filter((d) => d.id !== latest?.id);

  return (
    <div ref={popoverRef} className="relative inline-flex items-center gap-1.5">
      <button
        onClick={onClickPublish}
        disabled={!canDeploy}
        title={canDeploy ? undefined : t("deploy.button.disabled")}
        className="rounded-full px-3 py-0.5 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: isDeploying ? "var(--coral)" : "var(--ink)",
          color: "#fff",
          border: "1px solid transparent",
        }}
      >
        {isDeploying ? (
          <>
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white align-middle" />
            {t("deploy.deploying")}
          </>
        ) : (
          <>📤 {t("deploy.button")}</>
        )}
      </button>

      {deployments.length > 0 && (
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="rounded-full px-2 py-0.5 text-[11px]"
          title={t("deploy.history.title")}
          style={{
            background: "transparent",
            color: "var(--ink-soft)",
            border: "1px solid var(--line)",
          }}
        >
          ↶ <span className="tabular-nums">{deployments.length}</span>
        </button>
      )}

      {/* Inline result row — shown right after a successful deploy. */}
      {latest && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 flex max-w-[420px] flex-col gap-1 rounded-xl px-3 py-2 text-[11px] shadow-lg"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line-soft)",
            color: "var(--ink)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  latest.status === "ready"
                    ? "var(--green)"
                    : latest.status === "protected"
                      ? "var(--coral)"
                      : "var(--amber, #d97706)",
              }}
            />
            <span className="font-medium">
              {latest.status === "ready"
                ? t("deploy.success.label")
                : latest.status === "protected"
                  ? t("deploy.protected.label")
                  : t("deploy.delayed.label")}
            </span>
          </div>
          <a
            href={latest.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block max-w-full truncate font-mono text-[11px] text-[var(--coral)] hover:underline"
            title={latest.url}
          >
            {latest.url}
          </a>
          {latest.status !== "ready" && latest.statusMessage && (
            <div className="text-[10.5px] text-[var(--ink-mute)] leading-snug">
              {latest.statusMessage}
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-1.5">
            <button
              onClick={() => onCopy(latest.url)}
              className="rounded-full px-2 py-0.5 text-[10.5px] hover:bg-[var(--surface)]"
              style={{
                background: "transparent",
                color: "var(--ink-soft)",
                border: "1px solid var(--line)",
              }}
            >
              {copiedUrl === latest.url
                ? t("deploy.success.copied")
                : `📋 ${t("deploy.success.copy")}`}
            </button>
            <a
              href={latest.url}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full px-2 py-0.5 text-[10.5px] no-underline hover:bg-[var(--surface)]"
              style={{
                background: "transparent",
                color: "var(--ink-soft)",
                border: "1px solid var(--line)",
              }}
            >
              ↗ {t("deploy.success.open")}
            </a>
          </div>
        </div>
      )}

      {/* History dropdown — past deployments other than `latest`. */}
      {historyOpen && visibleHistory.length > 0 && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-40 flex w-[320px] flex-col rounded-xl px-2 py-2 shadow-lg"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line-soft)",
          }}
        >
          <div className="px-2 py-1 text-[10.5px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            {t("deploy.history.title")}
          </div>
          <div className="flex flex-col gap-0.5">
            {visibleHistory.map((d) => (
              <HistoryRow
                key={d.id}
                d={d}
                onForget={() => removeDeploymentFor(taskId, d.id)}
                onCopy={() => onCopy(d.url)}
                copied={copiedUrl === d.url}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {error && status === "error" && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 max-w-[420px] rounded-xl px-3 py-2 text-[11px] shadow-lg"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--coral)",
            color: "var(--coral)",
          }}
        >
          <div className="font-medium">{t("deploy.error.label")}</div>
          <div className="mt-1 text-[10.5px] text-[var(--ink-mute)] leading-snug">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  d,
  onForget,
  onCopy,
  copied,
  t,
}: {
  d: DeploymentRecord;
  onForget: () => void;
  onCopy: () => void;
  copied: boolean;
  t: ReturnType<typeof useT>;
}) {
  const ts = new Date(d.deployedAt);
  const stamp = `${ts.getMonth() + 1}/${ts.getDate()} ${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
  return (
    <div
      className="group flex flex-col gap-0.5 rounded-lg px-2 py-1.5 hover:bg-[var(--surface)]"
    >
      <a
        href={d.url}
        target="_blank"
        rel="noreferrer noopener"
        className="block truncate font-mono text-[11px] text-[var(--coral)] hover:underline"
        title={d.url}
      >
        {d.url}
      </a>
      <div className="flex items-center gap-2 text-[10px] text-[var(--ink-faint)]">
        <span>{d.provider}</span>
        <span>·</span>
        <span>{stamp}</span>
        {d.htmlHash && (
          <>
            <span>·</span>
            <span className="font-mono">#{d.htmlHash.slice(0, 6)}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onCopy}
            className="rounded px-1.5 py-0.5 text-[10px] hover:bg-[var(--paper)]"
          >
            {copied ? t("deploy.success.copied") : t("deploy.success.copy")}
          </button>
          <button
            onClick={onForget}
            className="rounded px-1.5 py-0.5 text-[10px] text-[var(--ink-mute)] hover:bg-[var(--paper)] hover:text-[var(--coral)]"
          >
            {t("deploy.history.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
