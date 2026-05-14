"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useDraft } from "@/lib/use-draft";
import { useUploadFile } from "@/lib/use-upload";

const ACCEPT_TYPES =
  ".md,.txt,.csv,.tsv,.xlsx,.xls,.json,.sql,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp,.svg,.html,.htm,.xml,.log";

/**
 * Sticky one-line input pinned to the bottom of the editor's Text tab. The
 * user types a natural-language instruction ("write a tweet about X"); the
 * selected agent streams a markdown draft that's appended below the current
 * editor content. The 📎 button on the same row reuses the same upload
 * pipeline as the textarea drag-and-drop target, so users can attach a file
 * without leaving this row. Convert (HTML output) is unaffected — Draft is
 * a separate /api/draft endpoint that prompts the agent for plain markdown.
 */
export function AiPromptBar() {
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agent = useStore((s) => s.selectedAgent);
  const { run, cancel, status, error } = useDraft();
  const { ingest } = useUploadFile();
  const t = useT();

  const isRunning = status === "running";
  const canSubmit = !!agent && !!value.trim() && !isRunning;

  const onSubmit = () => {
    if (isRunning) {
      cancel();
      return;
    }
    if (!canSubmit) return;
    const instruction = value.trim();
    setValue("");
    run({ instruction });
  };

  return (
    <div
      className="border-t px-3 py-2"
      style={{
        borderColor: "var(--line-faint)",
        background: "var(--paper)",
      }}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="shrink-0 text-[14px] opacity-60">✨</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={agent ? t("aiPrompt.placeholder") : t("aiPrompt.needAgent")}
          disabled={!agent || isRunning}
          className="min-w-0 flex-1 rounded-full px-3.5 py-1.5 text-[12.5px] outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] text-[var(--ink-mute)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          title={t("editor.attachTooltip")}
        >
          <span aria-hidden>📎</span>
          <span className="hidden text-[11.5px] sm:inline">{t("editor.attach")}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPT_TYPES}
          onChange={(e) => {
            ingest(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!isRunning && !canSubmit}
          className="shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: isRunning ? "var(--coral)" : "var(--ink)",
            color: "#fff",
            border: "1px solid transparent",
          }}
          title={t("aiPrompt.hint")}
        >
          {isRunning ? t("aiPrompt.stop") : t("aiPrompt.submit")}
          <span className="ml-1.5 hidden text-[10px] opacity-60 sm:inline">⌘↵</span>
        </button>
      </div>
      {error && (
        <div className="mt-1 text-[11px]" style={{ color: "var(--red)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
