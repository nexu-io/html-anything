"use client";

import { useEffect, useRef, useState } from "react";
import { listDrafts, deleteDraft, type Draft } from "@/lib/drafts";
import { relativeTime } from "@/lib/use-autosave";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export function DraftsMenu() {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const setContent = useStore((s) => s.setContent);
  const setFormat = useStore((s) => s.setFormat);
  const setFilename = useStore((s) => s.setFilename);
  const pushLog = useStore((s) => s.pushLog);
  const t = useT();

  const refresh = () => setDrafts(listDrafts());

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const restore = (d: Draft) => {
    if (!confirm(t("drafts.restoreConfirm", { when: relativeTime(d.ts) }))) return;
    setContent(d.content);
    setFormat(d.format);
    setFilename(d.filename);
    pushLog({
      kind: "info",
      text: t("drafts.restoredLog", { when: relativeTime(d.ts), n: d.bytes.toLocaleString() }),
    });
    setOpen(false);
  };

  const remove = (e: React.MouseEvent, ts: number) => {
    e.stopPropagation();
    deleteDraft(ts);
    refresh();
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors px-1.5 py-0.5"
        title={t("drafts.tooltip")}
      >
        {t("drafts.button")}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-30 w-[360px] od-fade-in overflow-hidden rounded-2xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 30px 60px -20px rgba(21, 20, 15, 0.25)",
          }}
        >
          <div
            className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)] flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--line-faint)" }}
          >
            <span>{t("drafts.heading")}</span>
            <span className="font-mono text-[var(--ink-mute)] normal-case tracking-normal">
              {t("drafts.count", { n: drafts.length })}
            </span>
          </div>
          {drafts.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[var(--ink-mute)]">
              {t("drafts.empty.title")}
              <div className="text-[11px] text-[var(--ink-faint)] mt-1">{t("drafts.empty.hint")}</div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-1.5">
              {drafts.map((d) => (
                <button
                  key={d.ts}
                  onClick={() => restore(d)}
                  className="group w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--paper)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-medium text-[var(--ink)]">{relativeTime(d.ts)}</span>
                      <span className="text-[10px] text-[var(--ink-faint)]">·</span>
                      <span className="text-[10.5px] font-mono text-[var(--ink-mute)]">
                        {d.format} · {t("drafts.chars", { n: d.bytes.toLocaleString() })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--ink-mute)] mt-0.5 line-clamp-1">
                      {d.preview || t("drafts.emptyPreview")}
                    </div>
                  </div>
                  <span
                    onClick={(e) => remove(e, d.ts)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[var(--ink-faint)] hover:text-[var(--red)] transition-opacity text-xs px-1"
                    title={t("drafts.delete")}
                  >
                    ✕
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
