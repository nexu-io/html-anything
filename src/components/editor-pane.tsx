"use client";

import { useState, useMemo, useEffect } from "react";
import { useStore, selectActiveTask, usePersistHydrated } from "@/lib/store";
import { detectFormat } from "@/lib/parsers/auto";
import { useAutosave, relativeTime } from "@/lib/use-autosave";
import { downloadMarkdown } from "@/lib/export/download";
import { useT, type DictKey } from "@/lib/i18n";
import { UploadDropzone } from "./upload-dropzone";
import { DraftsMenu } from "./drafts-menu";
import { SamplesGallery } from "./samples-gallery";
import { FormatsGallery } from "./formats-gallery";
import { AiPromptBar } from "./ai-prompt-bar";

const TAB_KEY: Record<"text" | "upload" | "formats" | "samples", DictKey> = {
  text: "editor.tab.text",
  upload: "editor.tab.upload",
  formats: "editor.tab.formats",
  samples: "editor.tab.samples",
};

export function EditorPane() {
  const [tab, setTab] = useState<"text" | "upload" | "formats" | "samples">("text");
  const hydrated = usePersistHydrated();
  const content = useStore((s) => selectActiveTask(s)?.content ?? "");
  const setContent = useStore((s) => s.setContent);
  const format = useStore((s) => selectActiveTask(s)?.format ?? "text");
  const setFormat = useStore((s) => s.setFormat);
  const filename = useStore((s) => selectActiveTask(s)?.filename);
  const setFilename = useStore((s) => s.setFilename);
  const { status: saveStatus, savedAt } = useAutosave();
  const t = useT();

  const detected = useMemo(() => detectFormat(content), [content]);

  const hasContent = content.length > 0;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--surface)" }}>
      <div
        className="flex flex-col gap-1.5 px-4 py-2 text-sm"
        style={{ borderBottom: "1px solid var(--line-faint)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["text", "upload", "formats", "samples"] as const).map((id) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={
                  (tab === id ? "pill pill-active" : "pill") + " whitespace-nowrap"
                }
                style={tab === id ? undefined : { background: "transparent", border: "1px solid transparent" }}
              >
                {t(TAB_KEY[id])}
              </button>
            ))}
          </div>
          {hasContent && (
            <SaveIndicator status={saveStatus} savedAt={savedAt} hasContent={hasContent} />
          )}
        </div>

        {hasContent && (
          <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 whitespace-nowrap text-[11px] text-[var(--ink-faint)]">
            <button
              onClick={() => downloadMarkdown(content, filename?.replace(/\.[^.]+$/, "") || "draft")}
              className="shrink-0 whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              title={t("editor.backupTooltip")}
            >
              {t("editor.backup")}
            </button>
            <DraftsMenu />
            <span className="shrink-0 opacity-40">|</span>
            {filename && (
              <span
                className="max-w-[160px] shrink-0 truncate rounded-md px-1.5 py-0.5 font-mono"
                style={{ background: "var(--paper)", color: "var(--ink-soft)" }}
                title={filename}
              >
                {filename}
              </span>
            )}
            <span className="shrink-0 whitespace-nowrap">
              <code className="font-mono text-[var(--ink-soft)]">{format || detected}</code>
              <span className="mx-1 opacity-40">·</span>
              {t("editor.chars", { n: content.length.toLocaleString() })}
            </span>
          </div>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden">
        {tab === "text" && (
          <div className="flex h-full flex-col">
            <div className="relative flex-1 overflow-hidden">
              {!hydrated && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-[11px] text-[var(--ink-faint)]">{t("editor.restoring")}</div>
                </div>
              )}
              <textarea
                value={hydrated ? content : ""}
                onChange={(e) => {
                  if (!hydrated) return;
                  setContent(e.target.value);
                  setFilename(undefined);
                  const fmt = detectFormat(e.target.value);
                  if (fmt !== format) setFormat(fmt);
                }}
                placeholder={t("editor.placeholder")}
                className="block h-full w-full resize-none border-0 bg-transparent p-5 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                spellCheck={false}
                disabled={!hydrated}
              />
            </div>
            <AiPromptBar />
          </div>
        )}
        {tab === "upload" && (
          <div className="h-full p-4">
            <UploadDropzone />
          </div>
        )}
        {tab === "formats" && (
          <FormatsGallery onLoaded={() => setTab("text")} />
        )}
        {tab === "samples" && (
          <SamplesGallery onLoaded={() => setTab("text")} />
        )}
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  savedAt,
  hasContent,
}: {
  status: "idle" | "saving" | "saved" | "error";
  savedAt: number | null;
  hasContent: boolean;
}) {
  const t = useT();
  // re-render every ~15s so "saved Xs ago" stays current
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!hasContent) return;
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [hasContent]);

  if (!hasContent) return null;

  if (status === "saving") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[var(--coral)] shimmer">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]" />
        {t("editor.saving")}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[var(--red)]">
        {t("editor.saveFailed")}
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[var(--green)]"
      title={t("editor.autosaveTooltip")}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
      {t("editor.autosaved")}
      {savedAt && <span className="text-[var(--ink-faint)] tabular-nums">· {relativeTime(savedAt)}</span>}
    </span>
  );
}
