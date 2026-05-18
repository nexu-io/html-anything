"use client";

/**
 * Lightweight drafts history kept in localStorage. Survives refresh.
 * Snapshots a content string at most every `MIN_GAP_MS` and keeps the most
 * recent `MAX_SNAPSHOTS`. We intentionally key these *separately* from the
 * zustand persist store so a corrupted store can never wipe your drafts.
 */
// Legacy key from the old "HTML Everything" brand; do NOT rename — every
// existing user's draft history lives under this localStorage key.
const KEY = "html-everything-drafts";
const MAX_SNAPSHOTS = 8;
const MIN_GAP_MS = 30_000; // do not snapshot more than once per 30s
const MIN_DELTA = 30; // ignore tiny edits

export type Draft = {
  ts: number;
  format: string;
  filename?: string;
  preview: string; // first 80 chars
  bytes: number;
  content: string;
};

function read(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Draft[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: Draft[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    // localStorage might be full — drop oldest until it fits
    let trimmed = list.slice(-Math.max(2, list.length - 2));
    for (let i = 0; i < 5 && trimmed.length; i++) {
      try {
        localStorage.setItem(KEY, JSON.stringify(trimmed));
        return;
      } catch {
        trimmed = trimmed.slice(1);
      }
    }
    console.warn("drafts: localStorage write failed", err);
  }
}

export function listDrafts(): Draft[] {
  return read().sort((a, b) => b.ts - a.ts);
}

export function snapshotDraft(content: string, format: string, filename?: string): Draft | null {
  if (!content || content.trim().length < 20) return null;
  const list = read();
  const last = list[list.length - 1];
  const now = Date.now();
  if (last) {
    const sameContent = last.content === content;
    const tooSoon = now - last.ts < MIN_GAP_MS;
    const tooSimilar = Math.abs(content.length - last.content.length) < MIN_DELTA;
    if (sameContent || (tooSoon && tooSimilar)) return null;
  }
  const draft: Draft = {
    ts: now,
    format,
    filename,
    preview: content.replace(/\s+/g, " ").slice(0, 80),
    bytes: content.length,
    content,
  };
  const next = [...list, draft].slice(-MAX_SNAPSHOTS);
  write(next);
  return draft;
}

export function deleteDraft(ts: number) {
  const next = read().filter((d) => d.ts !== ts);
  write(next);
}

export function clearDrafts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
