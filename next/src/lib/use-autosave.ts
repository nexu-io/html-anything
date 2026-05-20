"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, selectActiveTask } from "./store";
import { snapshotDraft } from "./drafts";

/**
 * Watches editor content and reports save status.
 *
 * The zustand store's `persist` middleware already writes content to
 * localStorage on every change (debounced by React reconciliation), so the
 * "save" itself is automatic. This hook produces the *visible* state:
 *   - "saving" briefly after the user types
 *   - "saved" once persist has written, with a timestamp
 *   - additionally, periodically snapshots a versioned draft to drafts.ts
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave() {
  const content = useStore((s) => selectActiveTask(s)?.content ?? "");
  const format = useStore((s) => selectActiveTask(s)?.format ?? "text");
  const filename = useStore((s) => selectActiveTask(s)?.filename);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const lastContentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // initial: if content already exists (rehydrated from persist), mark saved
  useEffect(() => {
    if (content && status === "idle") {
      setStatus("saved");
      setSavedAt(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (content === lastContentRef.current) return;
    lastContentRef.current = content;
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        // zustand persist has already saved by now; we additionally snapshot
        snapshotDraft(content, format, filename);
        setStatus("saved");
        setSavedAt(Date.now());
      } catch {
        setStatus("error");
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, format, filename]);

  return { status, savedAt };
}

export function relativeTime(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.max(0, Date.now() - ts) / 1000;
  if (diff < 5) return "刚刚";
  if (diff < 60) return `${Math.round(diff)} 秒前`;
  if (diff < 3600) return `${Math.round(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.round(diff / 3600)} 小时前`;
  return new Date(ts).toLocaleString();
}

/**
 * Tracks whether the component is mounted on the client. Use to gate any
 * value derived from `Date.now()` or other browser-only state so SSR and
 * the first client render produce the same HTML.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
