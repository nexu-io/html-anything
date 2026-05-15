"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore, selectActiveTask, type LogEntry, type RunStats } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import { previewHtml, extractHtml } from "@/lib/extract-html";
import { isDeck } from "@/lib/deck";
import { DeckViewer } from "./deck-viewer";
import { DeployControl } from "./deploy-control";

type PreviewTab = "preview" | "deck" | "code" | "log";

const PREVIEW_TAB_KEY: Record<PreviewTab, DictKey> = {
  preview: "preview.tab.preview",
  deck: "preview.tab.deck",
  code: "preview.tab.code",
  log: "preview.tab.log",
};

const STATUS_KEY: Record<string, DictKey> = {
  idle: "preview.status.idle",
  running: "preview.status.running",
  done: "preview.status.done",
  error: "preview.status.error",
};

const CHIP_KEYS: DictKey[] = [
  "preview.placeholder.chip.article",
  "preview.placeholder.chip.deck",
  "preview.placeholder.chip.resume",
  "preview.placeholder.chip.poster",
  "preview.placeholder.chip.xiaohongshu",
  "preview.placeholder.chip.twitterCard",
  "preview.placeholder.chip.webProto",
  "preview.placeholder.chip.dataReport",
];

// stable references so the selector doesn't force re-render when active task is missing
const EMPTY_LOG: LogEntry[] = [];
const EMPTY_STATS: RunStats = { outputBytes: 0, deltaCount: 0 };

export function PreviewPane({
  iframeRef,
}: {
  iframeRef?: React.MutableRefObject<HTMLIFrameElement | null>;
}) {
  const html = useStore((s) => selectActiveTask(s)?.html ?? "");
  const status = useStore((s) => selectActiveTask(s)?.status ?? "idle");
  const log = useStore((s) => selectActiveTask(s)?.log ?? EMPTY_LOG);
  const stats = useStore((s) => selectActiveTask(s)?.stats ?? EMPTY_STATS);
  const activeTaskId = useStore((s) => s.activeTaskId);
  const templateId = useStore((s) => selectActiveTask(s)?.templateId);
  const setHtmlFor = useStore((s) => s.setHtmlFor);

  // Template example HTML — fetched lazily when no task.html exists yet, so
  // switching templates in the picker shows that template's pre-shipped
  // `example.html` immediately, without burning agent tokens. Cleared as soon
  // as Convert produces real html, never written to task state.
  const [templateExample, setTemplateExample] = useState<string>("");
  useEffect(() => {
    // only fetch when there's no real output yet AND the run is idle
    if (html || status === "running") {
      setTemplateExample("");
      return;
    }
    if (!templateId) return;
    let cancelled = false;
    fetch(`/api/templates/${encodeURIComponent(templateId)}/example`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const exampleHtml = (data?.html ?? "") as string;
        setTemplateExample(exampleHtml);
      })
      .catch(() => {
        if (!cancelled) setTemplateExample("");
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, html, status]);
  const [tab, setTab] = useState<PreviewTab>("preview");
  const localRef = useRef<HTMLIFrameElement | null>(null);
  const codeRef = useRef<HTMLTextAreaElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Bumping this remounts the iframe, forcing a clean re-render with the current
  // HTML — useful when the streaming preview committed a partial render and the
  // final state didn't repaint, or when injected scripts/styles need to re-init.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((n) => n + 1), []);
  const t = useT();

  // Browser-level fullscreen for the whole preview pane. The Deck tab has its
  // own fullscreen wired in DeckViewer; we only handle Preview / Source / Log.
  useEffect(() => {
    const onFs = () => setIsFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // F to toggle fullscreen (only when not on Deck tab — DeckViewer handles its own).
  useEffect(() => {
    if (tab === "deck") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tagName = e.target.tagName;
        if (tagName === "INPUT" || tagName === "TEXTAREA" || e.target.isContentEditable) return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, toggleFullscreen]);

  // Effective html for this render = real task output if any, else the
  // template example fetched above. Downstream (deck detection, debounce,
  // iframe srcDoc) treats both identically — the only difference is provenance.
  const effectiveHtml = html || templateExample;
  const isPreviewingTemplate = !html && !!templateExample;

  // Detect deck off the cleaned (un-fenced) html — extract once for reuse.
  const cleaned = useMemo(() => extractHtml(effectiveHtml), [effectiveHtml]);
  const deckMode = useMemo(() => isDeck(cleaned), [cleaned]);

  // First time we see a deck, auto-promote the user to the Deck tab so the
  // feature is discoverable. We only do this once per task run (track the
  // latest html length seen as the "trigger") to avoid stealing focus if the
  // user explicitly switched back to the single-page preview.
  const autoSwitchedRef = useRef(false);
  useEffect(() => {
    if (status === "running") return;
    if (deckMode && !autoSwitchedRef.current && tab === "preview") {
      setTab("deck");
      autoSwitchedRef.current = true;
    }
    if (!deckMode) autoSwitchedRef.current = false;
    if (!deckMode && tab === "deck") setTab("preview");
  }, [deckMode, status, tab]);

  // Debounce srcDoc updates to ~3 fps during streaming so the iframe
  // doesn't reload on every delta. Last value always commits when status changes.
  const [debouncedHtml, setDebouncedHtml] = useState(effectiveHtml);
  useEffect(() => {
    if (status !== "running") {
      setDebouncedHtml(effectiveHtml);
      return;
    }
    const id = setTimeout(() => setDebouncedHtml(effectiveHtml), 320);
    return () => clearTimeout(id);
  }, [effectiveHtml, status]);
  const display = useMemo(() => previewHtml(debouncedHtml), [debouncedHtml]);

  useEffect(() => {
    if (iframeRef) iframeRef.current = localRef.current;
  });

  // Auto-scroll code to bottom while streaming. Skip while the user is editing
  // (textarea is focused) so we don't yank the caret around.
  useEffect(() => {
    if (status !== "running" || !codeRef.current) return;
    if (document.activeElement === codeRef.current) return;
    codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [html, status]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // Auto-switch to code tab when stream starts so user sees output forming
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current !== "running" && status === "running" && tab === "preview" && !html) {
      // stay on preview but no-op; we keep preview as default for live HTML render
    }
    prevStatusRef.current = status;
  }, [status, tab, html]);

  const showMetrics = status !== "idle" || !!stats.startedAt;

  // Present button is meaningful for Preview / Source / Log. The Deck tab has
  // its own Present button inside DeckViewer; suppress ours there to avoid
  // two competing fullscreens. Template-only previews count as "has html" for
  // the Present button so users can preview at full size without converting.
  const canPresent = tab !== "deck" && (tab !== "preview" || !!effectiveHtml);

  return (
    <div
      ref={wrapRef}
      className="flex h-full flex-col"
      style={{ background: isFullscreen ? "#0a0a0a" : "var(--paper)" }}
    >
      {!isFullscreen && (
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm"
          style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--surface)" }}
        >
          <div className="flex gap-1">
            {(["preview", ...(deckMode ? (["deck"] as const) : []), "code", "log"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={tab === id ? "pill pill-active" : "pill"}
                style={tab === id ? undefined : { background: "transparent", border: "1px solid transparent" }}
              >
                {t(PREVIEW_TAB_KEY[id])}
                {id === "log" && log.length > 0 && (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={{
                      background: tab === "log" ? "rgba(255,255,255,0.18)" : "var(--coral-soft)",
                      color: tab === "log" ? "#fff" : "var(--coral)",
                    }}
                  >
                    {log.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {tab === "preview" && html && (
              <button
                onClick={refresh}
                className="grid h-[22px] w-[22px] place-items-center rounded-full"
                style={{
                  background: "transparent",
                  color: "var(--ink-soft)",
                  border: "1px solid var(--line)",
                }}
                title={t("preview.refreshTooltip")}
                aria-label={t("preview.refresh")}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-3.46-7.1" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
              </button>
            )}
            {canPresent && (
              <button
                onClick={toggleFullscreen}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "transparent",
                  color: "var(--ink-soft)",
                  border: "1px solid var(--line)",
                }}
                title={t("preview.presentTooltip")}
              >
                {t("preview.present")} <span className="opacity-50">F</span>
              </button>
            )}
            {/* Publish-to-Vercel button — only meaningful once a Convert has
                produced html, and only on tabs that show the user that html. */}
            {(tab === "preview" || tab === "code") && status === "done" && html && (
              <DeployControl />
            )}
            <StatusPill status={status} />
          </div>
        </div>
      )}

      {!isFullscreen && showMetrics && <MetricsBar stats={stats} status={status} html={html} />}

      <div className="relative flex-1 overflow-hidden">
        {tab === "preview" && (
          <>
            {!effectiveHtml && <PreviewPlaceholder status={status} />}
            {effectiveHtml && (
              <>
                <iframe
                  key={refreshKey}
                  ref={localRef}
                  title="preview"
                  srcDoc={display}
                  sandbox="allow-scripts allow-same-origin"
                  className="h-full w-full"
                  style={{ background: "#fff" }}
                />
                {isPreviewingTemplate && (
                  <div
                    className="pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-wide"
                    style={{
                      background: "rgba(15, 14, 12, 0.78)",
                      color: "#f3efe6",
                      backdropFilter: "blur(6px)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    模板预览 · TEMPLATE EXAMPLE
                  </div>
                )}
              </>
            )}
          </>
        )}
        {tab === "deck" && (
          <DeckViewer
            html={cleaned}
            active={tab === "deck"}
            // Hand the active slide iframe to the parent ref so the existing
            // ExportMenu's "PNG" / "Image" actions snapshot the *current
            // slide*, not the underlying multi-slide doc.
            onMainIframe={(el) => {
              if (iframeRef) iframeRef.current = el;
              localRef.current = el;
            }}
          />
        )}
        {tab === "code" && (
          <CodeEditor
            html={html}
            status={status}
            taskId={activeTaskId}
            setHtmlFor={setHtmlFor}
            textareaRef={codeRef}
          />
        )}
        {tab === "log" && (
          <LogPanel logRef={logRef} log={log} />
        )}

        {/* Fullscreen exit chip — only shown when this pane owns the fullscreen.
            Deck mode is excluded because DeckViewer manages its own fullscreen
            chrome (Present / Exit / nav arrows). */}
        {isFullscreen && tab !== "deck" && (
          <button
            onClick={toggleFullscreen}
            className="absolute right-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{
              background: "rgba(255,255,255,0.10)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
            }}
            title={t("preview.presentTooltip")}
          >
            {t("preview.exitPresent")} <span className="opacity-60">F</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const map: Record<string, { bg: string; fg: string; dot: boolean }> = {
    idle:    { bg: "transparent",                 fg: "var(--ink-faint)", dot: false },
    running: { bg: "var(--coral-soft)",           fg: "var(--coral)",     dot: true },
    done:    { bg: "rgba(31,122,58,0.12)",        fg: "var(--green)",     dot: false },
    error:   { bg: "rgba(156,42,37,0.12)",        fg: "var(--red)",       dot: false },
  };
  const c = map[status] ?? map.idle;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.dot && <span className="pulse-dot" />}
      {t(STATUS_KEY[status] ?? "preview.status.idle")}
    </span>
  );
}

function MetricsBar({ stats, status, html }: { stats: RunStats; status: string; html: string }) {
  const t = useT();
  // tick to keep elapsed/ttfb live while running
  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [status]);

  const elapsed = stats.startedAt ? ((stats.endedAt ?? Date.now()) - stats.startedAt) / 1000 : 0;
  const ttfb = stats.firstByteAt && stats.startedAt ? (stats.firstByteAt - stats.startedAt) / 1000 : null;
  const sizeKB = html.length / 1024;
  const live = status === "running";

  const metrics: Array<{ label: string; value: string; hint?: string; live?: boolean }> = [
    { label: "Elapsed", value: `${elapsed.toFixed(1)}s`, live },
    { label: "TTFB", value: ttfb !== null ? `${ttfb.toFixed(2)}s` : "—", hint: t("preview.metric.ttfbHint") },
    { label: "Size", value: `${sizeKB.toFixed(1)} KB` },
    ...(stats.deltaCount > 0 ? [{ label: "Chunks", value: stats.deltaCount.toLocaleString() }] : []),
    ...(stats.outputTokens ? [{ label: "Output", value: `${stats.outputTokens.toLocaleString()} tok` }] : []),
    ...(stats.inputTokens ? [{ label: "Input", value: `${stats.inputTokens.toLocaleString()} tok` }] : []),
    ...(stats.cacheReadTokens ? [{ label: "Cache", value: `${stats.cacheReadTokens.toLocaleString()} tok` }] : []),
    ...(stats.costUsd !== undefined && stats.costUsd > 0
      ? [{ label: "Cost", value: `$${stats.costUsd.toFixed(4)}` }]
      : []),
    ...(stats.model ? [{ label: "Model", value: stats.model.replace(/\[.*\]$/, "") }] : []),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2"
      style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--paper)" }}
    >
      {metrics.map((m) => (
        <Metric key={m.label} label={m.label} value={m.value} hint={m.hint} live={m.live} />
      ))}
    </div>
  );
}

function Metric({ label, value, hint, live }: { label: string; value: string; hint?: string; live?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap" title={hint}>
      <span className="text-[9.5px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">{label}</span>
      <span
        className="text-[12px] tabular-nums font-[family-name:var(--font-mono)]"
        style={{ color: live ? "var(--coral)" : "var(--ink-soft)", fontWeight: live ? 500 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}

function CodeEditor({
  html,
  status,
  taskId,
  setHtmlFor,
  textareaRef,
}: {
  html: string;
  status: string;
  taskId: string;
  setHtmlFor: (taskId: string, html: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const t = useT();
  const isRunning = status === "running";
  const editable = !isRunning;
  const placeholder = isRunning ? t("preview.code.waiting") : t("preview.code.empty");

  return (
    <div className="flex h-full flex-col" style={{ background: "#15140f" }}>
      <div
        className="flex items-center justify-between gap-3 px-4 py-1.5 text-[10.5px]"
        style={{
          color: editable ? "#9ca28a" : "#8b8676",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span>{editable ? t("preview.code.editHint") : t("preview.code.lockedHint")}</span>
      </div>
      <textarea
        ref={textareaRef}
        value={html}
        onChange={(e) => setHtmlFor(taskId, e.target.value)}
        readOnly={!editable}
        spellCheck={false}
        placeholder={placeholder}
        className="flex-1 w-full resize-none overflow-auto p-4 text-[11.5px] leading-relaxed font-[family-name:var(--font-mono)] focus:outline-none"
        style={{
          background: "#15140f",
          color: "#e8e4dc",
          caretColor: "#ffb55a",
          border: "none",
          tabSize: 2,
        }}
      />
    </div>
  );
}

function LogPanel({
  log,
  logRef,
}: {
  log: LogEntry[];
  logRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const t = useT();
  return (
    <div ref={logRef} className="h-full overflow-auto p-3 text-[11.5px] font-[family-name:var(--font-mono)]" style={{ background: "var(--paper)" }}>
      {log.length === 0 && (
        <div className="text-[var(--ink-faint)] p-4 text-center">{t("preview.log.empty")}</div>
      )}
      {log.map((l, i) => (
        <LogLine key={i} entry={l} />
      ))}
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const colorMap: Record<string, { tag: string; bg: string; fg: string; text: string }> = {
    info:   { tag: "INFO",   bg: "rgba(35,72,184,0.10)",  fg: "var(--blue)",   text: "var(--ink)" },
    start:  { tag: "START",  bg: "var(--coral-soft)",     fg: "var(--coral)",  text: "var(--ink)" },
    delta:  { tag: "DELTA",  bg: "rgba(31,122,58,0.10)",  fg: "var(--green)",  text: "var(--ink)" },
    meta:   { tag: "META",   bg: "rgba(108,58,166,0.10)", fg: "var(--purple)", text: "var(--ink-soft)" },
    stderr: { tag: "STDERR", bg: "rgba(178,98,0,0.10)",   fg: "var(--amber)",  text: "var(--ink-soft)" },
    raw:    { tag: "RAW",    bg: "rgba(21,20,15,0.05)",   fg: "var(--ink-faint)", text: "var(--ink-mute)" },
    done:   { tag: "DONE",   bg: "rgba(31,122,58,0.10)",  fg: "var(--green)",  text: "var(--ink)" },
    error:  { tag: "ERROR",  bg: "rgba(156,42,37,0.10)",  fg: "var(--red)",    text: "var(--red)" },
  };
  const c = colorMap[entry.kind] ?? colorMap.info;
  const elapsed = entry.elapsed !== undefined ? `+${(entry.elapsed / 1000).toFixed(2)}s` : "";

  return (
    <div className="flex items-start gap-2 py-0.5 px-1 hover:bg-[var(--line-faint)] rounded">
      <span className="text-[var(--ink-faint)] tabular-nums shrink-0 w-[58px]">{elapsed}</span>
      <span
        className="shrink-0 rounded px-1.5 py-px text-[10px] font-bold tracking-wider"
        style={{ background: c.bg, color: c.fg }}
      >
        {c.tag}
      </span>
      <span style={{ color: c.text }} className="break-all whitespace-pre-wrap">
        {entry.text}
      </span>
    </div>
  );
}

function PreviewPlaceholder({ status }: { status: string }) {
  const t = useT();
  const isRunning = status === "running";
  const stats = useStore((s) => selectActiveTask(s)?.stats ?? EMPTY_STATS);
  const secWaited = stats.startedAt ? ((Date.now() - stats.startedAt) / 1000).toFixed(1) : "0";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center p-8" style={{ background: "var(--paper)" }}>
      <div className={`text-6xl ${isRunning ? "shimmer" : ""}`}>{isRunning ? "✨" : "🪄"}</div>
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-[var(--ink)] font-[family-name:var(--font-display)]">
          {isRunning ? (
            <>
              {t("preview.placeholder.runningTitle.part1")}{" "}
              <em className="serif-em">{t("preview.placeholder.runningTitle.accent")}</em>…
            </>
          ) : (
            <>
              {t("preview.placeholder.idleTitle.part1")}{" "}
              <em className="serif-em">{t("preview.placeholder.idleTitle.accent")}</em>{" "}
              {t("preview.placeholder.idleTitle.part2")}
            </>
          )}
        </h2>
        <p className="mt-2 text-[13px] text-[var(--ink-mute)] max-w-sm leading-relaxed">
          {isRunning
            ? t("preview.placeholder.runningDescr", { sec: secWaited })
            : t("preview.placeholder.idleDescr")}
        </p>
      </div>
      {!isRunning && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
          {CHIP_KEYS.map((key) => (
            <span key={key} className="pill" style={{ fontSize: 11 }}>
              {t(key)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
