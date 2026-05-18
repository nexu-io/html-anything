"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ModelOption = { id: string; label: string };

export type AgentInfo = {
  id: string;
  label: string;
  vendor: string;
  available: boolean;
  path?: string;
  /** UI uses this to badge unsupported / batch adapters. Mirrors AgentProtocol on the server. */
  protocol: "stdin" | "argv" | "argv-message" | "acp" | "pi-rpc";
  /** Curated model list for the picker. Always begins with `default`. */
  models: ModelOption[];
  /** True for ACP / pi-rpc adapters where Convert returns a friendly error. */
  unsupported?: boolean;
};

export type ConvertStatus = "idle" | "running" | "done" | "error";

export type LogEntry = {
  kind:
    | "info"
    | "stderr"
    | "error"
    | "delta"
    | "meta"
    | "start"
    | "done"
    | "raw";
  text: string;
  ts: number;
  /** elapsed ms from convert start */
  elapsed?: number;
  /** structured payload for meta events */
  data?: unknown;
};

export type RunStats = {
  startedAt?: number;
  firstByteAt?: number;
  endedAt?: number;
  promptBytes?: number;
  outputBytes: number;
  deltaCount: number;
  model?: string;
  costUsd?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreateTokens?: number;
  durationMs?: number;
  bin?: string;
};

export type Task = {
  id: string;
  name: string;
  // input
  content: string;
  format: string;
  filename?: string;
  templateId: string;
  // output
  html: string;
  status: ConvertStatus;
  log: LogEntry[];
  stats: RunStats;
  // sample-derived fields — when populated, the next convert switches to
  // diff-edit mode and asks the agent to make minimal changes to baseHtml
  // instead of regenerating from scratch.
  baseContent?: string;
  baseHtml?: string;
  /** id of the source sample (if any), so the gallery can mark it loaded */
  sampleId?: string;
  /**
   * Pasted/uploaded image data URLs, keyed by the short `asset:<id>` token
   * shown in the editor textarea. Keeps the textarea readable while
   * preserving the real bytes for Convert. Resolved back to inline data URLs
   * in `use-convert.ts` before the prompt is shipped to the agent.
   */
  assets?: Record<string, string>;
  /**
   * Past one-click deployments of this task's html. Bounded ring (latest
   * 5 per task to keep localStorage from ballooning). Each entry pairs
   * a (provider, hash-of-html-at-deploy-time, url) so the user can tell
   * which historical version of the HTML each public URL points to.
   */
  deployments?: DeploymentRecord[];
  // meta
  createdAt: number;
  updatedAt: number;
};

export type DeploymentStatus = "ready" | "protected" | "link-delayed";

export type DeploymentRecord = {
  id: string;
  /** "vercel" | "cloudflare-pages" — keep open-ended for future providers. */
  provider: string;
  url: string;
  /** Provider-side deployment id, surfaced in error messages / dashboards. */
  deploymentId?: string;
  /** SHA-256 (first 12 hex chars) of the HTML that was deployed. Lets the
   *  user tell which version of the page each URL points to. */
  htmlHash?: string;
  htmlBytes?: number;
  status: DeploymentStatus;
  statusMessage?: string;
  deployedAt: number;
  reachableAt?: number;
};

const emptyStats: RunStats = { outputBytes: 0, deltaCount: 0 };

function makeTask(init?: Partial<Task>): Task {
  const now = Date.now();
  return {
    id: init?.id ?? `t_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: init?.name ?? "新任务",
    content: init?.content ?? "",
    format: init?.format ?? "text",
    filename: init?.filename,
    templateId: init?.templateId ?? "article-magazine",
    html: init?.html ?? "",
    status: init?.status ?? "idle",
    log: init?.log ?? [],
    stats: init?.stats ?? emptyStats,
    baseContent: init?.baseContent,
    baseHtml: init?.baseHtml,
    sampleId: init?.sampleId,
    createdAt: init?.createdAt ?? now,
    updatedAt: init?.updatedAt ?? now,
  };
}

// Shipped locales. Adding a new one means dropping a dictionary into
// `src/lib/i18n/locales/` and registering it in `src/lib/i18n.ts`.
// We ship only en + zh-CN today and leave the rest to contributors.
export type Locale = "en" | "zh-CN";

export const LOCALES: Locale[] = ["en", "zh-CN"];

export const LOCALE_LABEL: Record<Locale, string> = {
  "en": "English",
  "zh-CN": "简体中文",
};

/**
 * Which workspace panes are visible.
 *  - "split"   — editor on the left, preview on the right (default)
 *  - "editor"  — editor only (full-width input, hide preview)
 *  - "preview" — preview only (after the convert is done you usually want the
 *                full canvas — esp. for decks)
 */
export type LayoutMode = "split" | "editor" | "preview";

export const LAYOUT_MODES: LayoutMode[] = ["editor", "split", "preview"];

type Persisted = {
  tasks: Task[];
  activeTaskId: string;
  selectedAgent: string | undefined;
  /** Per-agent last-picked model id. Empty / "default" means no `--model` flag. */
  agentModels: Record<string, string>;
  /**
   * Per-agent absolute path override. Wins over PATH scan and `envOverride`
   * when set. Used by users whose CLI lives somewhere our `userToolchainDirs`
   * heuristic doesn't cover (Scoop on Windows, custom installs, etc.).
   */
  agentBinOverrides: Record<string, string>;
  welcomeAck: boolean;
  sidebarCollapsed: boolean;
  locale: Locale;
  layoutMode: LayoutMode;
};

type State = {
  // multi-task
  tasks: Task[];
  activeTaskId: string;

  // global
  agents: AgentInfo[];
  selectedAgent?: string;
  /** Per-agent model id. "default" or absent = no --model flag. */
  agentModels: Record<string, string>;
  /** Per-agent absolute binary path override. See Persisted comment. */
  agentBinOverrides: Record<string, string>;
  welcomeAck: boolean;
  sidebarCollapsed: boolean;
  locale: Locale;
  layoutMode: LayoutMode;

  // task lifecycle
  newTask: (init?: Partial<Pick<Task, "name" | "content" | "format" | "filename" | "templateId">>) => string;
  deleteTask: (id: string) => void;
  setActiveTask: (id: string) => void;
  renameTask: (id: string, name: string) => void;
  duplicateTask: (id: string) => string;
  /**
   * Load a sample into a brand-new task. Sets content / format / templateId /
   * html / baseContent / baseHtml so the user can immediately preview the
   * world-class HTML, edit the content, and the next Convert switches to
   * diff-edit mode (minimal token use).
   */
  loadSample: (sample: {
    id: string;
    name: string;
    content: string;
    format: string;
    templateId: string;
    html: string;
  }) => string;

  // active-task field setters (operate on the currently active task)
  setContent: (s: string) => void;
  setFormat: (f: string) => void;
  setFilename: (f?: string) => void;
  setSelectedTemplate: (id: string) => void;
  /**
   * Add an image (or other binary) asset to the active task and return the
   * `asset:<id>` placeholder token to insert into the textarea. The data URL
   * is kept off-textarea so editing stays readable.
   */
  addAsset: (dataUrl: string) => string;

  // active-task convert-state setters (used by ad-hoc callers, e.g. drafts-menu)
  pushLog: (entry: Omit<LogEntry, "ts">) => void;

  // per-task convert-state setters (used by convert pipeline so a background
  // task keeps streaming even when the user switches to a different one)
  setHtmlFor: (taskId: string, html: string) => void;
  appendHtmlFor: (taskId: string, chunk: string) => void;
  resetHtmlFor: (taskId: string) => void;
  setStatusFor: (taskId: string, s: ConvertStatus) => void;
  pushLogFor: (taskId: string, entry: Omit<LogEntry, "ts">) => void;
  clearLogFor: (taskId: string) => void;
  resetStatsFor: (taskId: string) => void;
  patchStatsFor: (taskId: string, patch: Partial<RunStats>) => void;
  /** snapshot the current (content, html) as the new diff-edit baseline */
  commitBaseFor: (taskId: string) => void;
  /** record a successful one-click deployment of the task's html. */
  pushDeploymentFor: (taskId: string, deployment: DeploymentRecord) => void;
  /** delete a past deployment record (UI only; the public URL remains). */
  removeDeploymentFor: (taskId: string, deploymentRecordId: string) => void;

  // global setters
  setAgents: (a: AgentInfo[]) => void;
  setSelectedAgent: (id?: string) => void;
  setAgentModel: (agentId: string, modelId: string) => void;
  /** Set / clear an absolute path override for one agent. Empty string clears. */
  setAgentBinOverride: (agentId: string, path: string) => void;
  setWelcomeAck: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setLocale: (l: Locale) => void;
  setLayoutMode: (m: LayoutMode) => void;
};

function patchTask(tasks: Task[], id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)): Task[] {
  let changed = false;
  const next = tasks.map((t) => {
    if (t.id !== id) return t;
    const p = typeof patch === "function" ? patch(t) : patch;
    changed = true;
    return { ...t, ...p, updatedAt: Date.now() };
  });
  return changed ? next : tasks;
}

const initialTask = makeTask({ name: "任务 1" });

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      tasks: [initialTask],
      activeTaskId: initialTask.id,
      agents: [],
      selectedAgent: undefined,
      agentModels: {},
      agentBinOverrides: {},
      welcomeAck: false,
      sidebarCollapsed: false,
      locale: "en",
      layoutMode: "split",

      newTask: (init) => {
        const tasks = get().tasks;
        const n = tasks.length + 1;
        const t = makeTask({ name: init?.name ?? `任务 ${n}`, ...init });
        set({ tasks: [...tasks, t], activeTaskId: t.id });
        return t.id;
      },
      deleteTask: (id) => {
        const { tasks, activeTaskId } = get();
        if (tasks.length <= 1) {
          // never leave 0 tasks — replace with a fresh empty one
          const fresh = makeTask({ name: "任务 1" });
          set({ tasks: [fresh], activeTaskId: fresh.id });
          return;
        }
        const next = tasks.filter((t) => t.id !== id);
        const nextActive =
          activeTaskId === id ? next[Math.max(0, tasks.findIndex((t) => t.id === id) - 1)]?.id ?? next[0].id : activeTaskId;
        set({ tasks: next, activeTaskId: nextActive });
      },
      setActiveTask: (id) => {
        if (get().tasks.some((t) => t.id === id)) set({ activeTaskId: id });
      },
      renameTask: (id, name) => {
        set((s) => ({ tasks: patchTask(s.tasks, id, { name: name.trim() || "未命名" }) }));
      },
      duplicateTask: (id) => {
        const src = get().tasks.find((t) => t.id === id);
        if (!src) return id;
        const copy = makeTask({
          name: `${src.name} · 副本`,
          content: src.content,
          format: src.format,
          filename: src.filename,
          templateId: src.templateId,
        });
        set((s) => ({ tasks: [...s.tasks, copy], activeTaskId: copy.id }));
        return copy.id;
      },
      loadSample: (sample) => {
        const { tasks, activeTaskId } = get();
        const active = tasks.find((t) => t.id === activeTaskId);
        // if the active task is empty (no content, no html), reuse it; otherwise create a new task
        const reuseActive = active && !active.content.trim() && !active.html;
        const t = makeTask({
          id: reuseActive ? active!.id : undefined,
          name: sample.name,
          content: sample.content,
          format: sample.format,
          templateId: sample.templateId,
          html: sample.html,
          baseContent: sample.content,
          baseHtml: sample.html,
          sampleId: sample.id,
          status: sample.html ? "done" : "idle",
        });
        if (reuseActive) {
          set((s) => ({ tasks: patchTask(s.tasks, active!.id, t), activeTaskId: active!.id }));
          return active!.id;
        }
        set((s) => ({ tasks: [...s.tasks, t], activeTaskId: t.id }));
        return t.id;
      },

      setContent: (s) =>
        set((st) => ({ tasks: patchTask(st.tasks, st.activeTaskId, { content: s }) })),
      setFormat: (f) =>
        set((st) => ({ tasks: patchTask(st.tasks, st.activeTaskId, { format: f }) })),
      setFilename: (f) =>
        set((st) => ({ tasks: patchTask(st.tasks, st.activeTaskId, { filename: f }) })),
      setSelectedTemplate: (id) =>
        set((st) => ({ tasks: patchTask(st.tasks, st.activeTaskId, { templateId: id }) })),

      addAsset: (dataUrl: string) => {
        const id = `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        set((st) => ({
          tasks: patchTask(st.tasks, st.activeTaskId, (t) => ({
            assets: { ...(t.assets ?? {}), [id]: dataUrl },
          })),
        }));
        return id;
      },

      pushLog: (entry) =>
        set((st) => ({
          tasks: patchTask(st.tasks, st.activeTaskId, (t) => ({
            log: [...t.log.slice(-400), { ...entry, ts: Date.now() }],
          })),
        })),

      setHtmlFor: (taskId, html) =>
        set((st) => ({ tasks: patchTask(st.tasks, taskId, { html }) })),
      appendHtmlFor: (taskId, chunk) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => ({
            html: t.html + chunk,
            stats: {
              ...t.stats,
              outputBytes: t.stats.outputBytes + chunk.length,
              deltaCount: t.stats.deltaCount + 1,
              firstByteAt: t.stats.firstByteAt ?? Date.now(),
            },
          })),
        })),
      resetHtmlFor: (taskId) =>
        set((st) => ({ tasks: patchTask(st.tasks, taskId, { html: "" }) })),
      setStatusFor: (taskId, s) =>
        set((st) => ({ tasks: patchTask(st.tasks, taskId, { status: s }) })),
      pushLogFor: (taskId, entry) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => ({
            log: [...t.log.slice(-400), { ...entry, ts: Date.now() }],
          })),
        })),
      clearLogFor: (taskId) =>
        set((st) => ({ tasks: patchTask(st.tasks, taskId, { log: [] }) })),
      resetStatsFor: (taskId) =>
        set((st) => ({ tasks: patchTask(st.tasks, taskId, { stats: emptyStats }) })),
      patchStatsFor: (taskId, patch) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => ({ stats: { ...t.stats, ...patch } })),
        })),
      commitBaseFor: (taskId) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => ({
            baseContent: t.content,
            baseHtml: t.html,
          })),
        })),
      pushDeploymentFor: (taskId, deployment) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => {
            const prev = t.deployments ?? [];
            // Bounded ring: latest 5 per task. Older entries roll off so
            // localStorage doesn't bloat with stale public URLs over time.
            const next = [deployment, ...prev].slice(0, 5);
            return { deployments: next };
          }),
        })),
      removeDeploymentFor: (taskId, deploymentRecordId) =>
        set((st) => ({
          tasks: patchTask(st.tasks, taskId, (t) => ({
            deployments: (t.deployments ?? []).filter(
              (d) => d.id !== deploymentRecordId,
            ),
          })),
        })),

      setAgents: (a) => set({ agents: a }),
      setSelectedAgent: (id) => set({ selectedAgent: id }),
      setAgentModel: (agentId, modelId) =>
        set((s) => ({ agentModels: { ...s.agentModels, [agentId]: modelId } })),
      setAgentBinOverride: (agentId, path) =>
        set((s) => {
          const next = { ...s.agentBinOverrides };
          if (path.trim()) next[agentId] = path.trim();
          else delete next[agentId];
          return { agentBinOverrides: next };
        }),
      setWelcomeAck: (v) => set({ welcomeAck: v }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setLocale: (l) => set({ locale: l }),
      setLayoutMode: (m) => set({ layoutMode: m }),
    }),
    {
      // Legacy key from the old "HTML Everything" brand; do NOT rename — every
      // existing user's saved tasks live under this localStorage key.
      name: "html-everything-store",
      version: 7,
      partialize: (s): Persisted => ({
        tasks: s.tasks.map((t) => ({
          ...t,
          // never persist running status — a dropped tab can't keep the stream
          status: (t.status === "running" ? "idle" : t.status) as ConvertStatus,
        })),
        activeTaskId: s.activeTaskId,
        selectedAgent: s.selectedAgent,
        agentModels: s.agentModels,
        agentBinOverrides: s.agentBinOverrides,
        welcomeAck: s.welcomeAck,
        sidebarCollapsed: s.sidebarCollapsed,
        locale: s.locale,
        layoutMode: s.layoutMode,
      }),
      migrate: (persisted, fromVersion): Persisted => {
        // v1 → v2: wrap top-level content/format/filename/selectedTemplate into a single task.
        if (fromVersion < 2 && persisted && typeof persisted === "object") {
          const old = persisted as Record<string, unknown>;
          const t = makeTask({
            name: "任务 1",
            content: typeof old.content === "string" ? old.content : "",
            format: typeof old.format === "string" ? old.format : "text",
            filename: typeof old.filename === "string" ? old.filename : undefined,
            templateId: typeof old.selectedTemplate === "string" ? old.selectedTemplate : "article-magazine",
          });
          persisted = {
            tasks: [t],
            activeTaskId: t.id,
            selectedAgent: typeof old.selectedAgent === "string" ? old.selectedAgent : undefined,
            welcomeAck: !!old.welcomeAck,
            sidebarCollapsed: false,
          };
        }
        // v2 → v3: introduce agentModels map.
        if (fromVersion < 3 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (!p.agentModels || typeof p.agentModels !== "object") {
            p.agentModels = {};
          }
        }
        // v3 → v4: introduce UI locale (default English).
        if (fromVersion < 4 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (!p.locale || typeof p.locale !== "string" || !(LOCALES as string[]).includes(p.locale as string)) {
            p.locale = "en";
          }
        }
        // v4 → v5: introduce workspace layoutMode (default split).
        if (fromVersion < 5 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (
            !p.layoutMode ||
            typeof p.layoutMode !== "string" ||
            !(LAYOUT_MODES as string[]).includes(p.layoutMode as string)
          ) {
            p.layoutMode = "split";
          }
        }
        // v5 → v6: introduce agentBinOverrides map.
        if (fromVersion < 6 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (!p.agentBinOverrides || typeof p.agentBinOverrides !== "object") {
            p.agentBinOverrides = {};
          }
        }
        // v6 → v7: per-task deployments[] ring buffer for one-click
        // publishing. Initialize to undefined on existing tasks; the new
        // deploy code reads `t.deployments ?? []`, so explicit init is
        // unnecessary, but we leave the migration entry here so the
        // version bump is auditable.
        if (fromVersion < 7 && persisted && typeof persisted === "object") {
          const p = persisted as Record<string, unknown>;
          if (Array.isArray(p.tasks)) {
            for (const t of p.tasks as Array<Record<string, unknown>>) {
              if (!Array.isArray(t.deployments)) t.deployments = [];
            }
          }
        }
        return persisted as Persisted;
      },
    },
  ),
);

/** Returns true once the persist middleware has finished restoring state. */
export function usePersistHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useStore.persist.hasHydrated());
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
}

// ── selectors / hooks for active task ──────────────────────────────
export const selectActiveTask = (s: State): Task | undefined =>
  s.tasks.find((t) => t.id === s.activeTaskId);

export function useActiveTask(): Task | undefined {
  return useStore(selectActiveTask);
}

export function useActiveField<K extends keyof Task>(field: K): Task[K] | undefined {
  return useStore((s) => selectActiveTask(s)?.[field]);
}
