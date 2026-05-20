/**
 * Client-facing types + hook for the disk-backed skill registry. The previous
 * 1600-line hardcoded `TEMPLATES` array has been replaced by a folder-per-skill
 * layout under `src/lib/templates/skills/`. Adding a new template = adding a
 * new folder with `SKILL.md` (+ optional `example.md` / `example.html`).
 *
 * - Server-only: `loader.ts` reads disk.
 * - Public API:  `/api/templates` returns the SkillMeta[] list, `/api/templates/:id/example` returns one skill's bundled example.
 * - Client:      `useTemplates()` below caches the fetch across all callers.
 */

"use client";

import { useEffect, useState } from "react";
import type { SkillMeta as ServerSkillMeta, SkillExampleMeta } from "./loader";

export type TemplateDef = ServerSkillMeta;
export type TemplateExampleMeta = SkillExampleMeta;

// Module-level cache + in-flight promise dedupes parallel callers across the
// React tree. SWR / react-query would also work but adding a dep for one
// endpoint is overkill — this is ~25 lines and behaves the same.
let cache: TemplateDef[] | null = null;
let inflight: Promise<TemplateDef[]> | null = null;
type Listener = (v: TemplateDef[]) => void;
const listeners = new Set<Listener>();

async function fetchTemplates(): Promise<TemplateDef[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch("/api/templates");
    if (!res.ok) throw new Error(`GET /api/templates → ${res.status}`);
    const json = (await res.json()) as { templates: TemplateDef[] };
    cache = json.templates;
    for (const l of listeners) l(cache);
    return cache;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Returns the registry. `undefined` while loading; never throws. */
export function useTemplates(): TemplateDef[] | undefined {
  const [data, setData] = useState<TemplateDef[] | undefined>(cache ?? undefined);
  useEffect(() => {
    if (cache) {
      setData(cache);
      return;
    }
    const listener = (v: TemplateDef[]) => setData(v);
    listeners.add(listener);
    fetchTemplates().catch(() => {
      // surface as empty — picker shows "no matches", caller can decide
      setData([]);
    });
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return data;
}

/** Fetch one skill's bundled example (content + html). */
export async function fetchTemplateExample(id: string): Promise<{
  id: string;
  name: string;
  templateId: string;
  format: string;
  tagline: string;
  desc: string;
  source?: { url: string; label: string };
  content: string;
  html: string;
} | null> {
  const res = await fetch(`/api/templates/${encodeURIComponent(id)}/example`);
  if (!res.ok) return null;
  return res.json();
}

/** Look up one template by id from the in-memory cache. Returns `undefined` if not loaded yet. */
export function getCachedTemplate(id: string): TemplateDef | undefined {
  return cache?.find((t) => t.id === id);
}

// Re-export scenario constants so existing imports from `@/lib/templates`
// keep working without touching every consumer.
export { SCENARIO_KEYS, SCENARIO_ORDER, scenarioLabelKey } from "./scenarios";
