"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, type Task, type ConvertStatus } from "@/lib/store";
import { useTemplates, type TemplateDef } from "@/lib/templates";
import { relativeTime, useMounted } from "@/lib/use-autosave";
import { useT, type DictKey } from "@/lib/i18n";

// Fallback so tasks render before the registry fetch completes.
const FALLBACK_TPL = {
  id: "",
  zhName: "—",
  enName: "—",
  emoji: "📄",
  description: "",
  category: "other",
  scenario: "marketing",
  aspectHint: "",
  tags: [] as string[],
} satisfies TemplateDef;

const STATUS_DOT: Record<ConvertStatus, { color: string; key: DictKey; live: boolean }> = {
  idle:    { color: "var(--ink-faint)",         key: "tasks.status.idle",    live: false },
  running: { color: "var(--coral)",             key: "tasks.status.running", live: true  },
  done:    { color: "var(--green)",             key: "tasks.status.done",    live: false },
  error:   { color: "var(--red)",               key: "tasks.status.error",   live: false },
};

export function TasksSidebar() {
  const tasks = useStore((s) => s.tasks);
  const activeTaskId = useStore((s) => s.activeTaskId);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  const newTask = useStore((s) => s.newTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const setActive = useStore((s) => s.setActiveTask);
  const renameTask = useStore((s) => s.renameTask);
  const duplicateTask = useStore((s) => s.duplicateTask);
  const templates = useTemplates();
  const t = useT();

  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? tasks.filter((task) => {
        if (task.name.toLowerCase().includes(trimmed)) return true;
        if (task.content.toLowerCase().includes(trimmed)) return true;
        const tpl = templates?.find((x) => x.id === task.templateId);
        if (tpl) {
          if (tpl.zhName.toLowerCase().includes(trimmed)) return true;
          if (tpl.enName.toLowerCase().includes(trimmed)) return true;
        }
        return false;
      })
    : tasks;

  // tick once per minute so "Xs ago" stays current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (collapsed) {
    return (
      <aside
        className="flex flex-col items-center gap-2 py-3"
        style={{
          width: 48,
          background: "var(--paper)",
          borderRight: "1px solid var(--line-faint)",
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          title={t("tasks.expand")}
          className="grid h-9 w-9 place-items-center rounded-xl transition-colors hover:bg-[var(--line-faint)]"
          style={{ color: "var(--ink-soft)" }}
        >
          <span className="text-[15px]">›</span>
        </button>
        <button
          onClick={() => newTask()}
          title={t("tasks.newTask")}
          className="grid h-9 w-9 place-items-center rounded-xl text-[18px] transition-all hover:bg-[var(--coral-soft)]"
          style={{ color: "var(--coral)" }}
        >
          ＋
        </button>
        <div className="my-1 h-px w-6" style={{ background: "var(--line-faint)" }} />
        <div className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-1">
          {tasks.map((task, i) => (
            <button
              key={task.id}
              onClick={() => setActive(task.id)}
              title={`${task.name} · ${t(STATUS_DOT[task.status].key)}`}
              className={`relative grid h-9 w-9 place-items-center rounded-xl text-[12px] transition-colors ${
                activeTaskId === task.id ? "ring-1" : "hover:bg-[var(--line-faint)]"
              }`}
              style={{
                background: activeTaskId === task.id ? "var(--surface)" : "transparent",
                color: "var(--ink-soft)",
                ["--tw-ring-color" as string]: "var(--ink)",
              }}
            >
              <span className="font-mono text-[10px]">{i + 1}</span>
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${
                  STATUS_DOT[task.status].live ? "pulse-dot !w-2 !h-2" : ""
                }`}
                style={{ background: STATUS_DOT[task.status].color }}
              />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 268,
        background: "var(--paper)",
        borderRight: "1px solid var(--line-faint)",
      }}
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--line-faint)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">
            {t("tasks.heading")}
          </span>
          <span
            className="rounded-full px-1.5 text-[10px] font-mono tabular-nums"
            style={{ background: "var(--surface)", color: "var(--ink-mute)", border: "1px solid var(--line-faint)" }}
            title={trimmed ? t("tasks.matchTooltip", { a: filtered.length, b: tasks.length }) : undefined}
          >
            {trimmed ? `${filtered.length}/${tasks.length}` : tasks.length}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title={t("tasks.collapse")}
          className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-[14px] px-1"
        >
          ‹
        </button>
      </div>

      <button
        onClick={() => newTask()}
        className="mx-3 mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium transition-all hover:-translate-y-px"
        style={{
          background: "var(--coral)",
          color: "#fff",
          boxShadow: "0 10px 22px -16px rgba(201, 100, 66, 0.85)",
        }}
      >
        {t("tasks.newTask")}
      </button>

      <div className="relative mx-3 mt-2.5">
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-[var(--ink-faint)]"
          aria-hidden
        >
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("tasks.search.placeholder")}
          className="w-full rounded-lg bg-[var(--surface)] py-1.5 pl-7 pr-7 text-[12px] text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--ink-faint)] focus:shadow-[0_0_0_2px_var(--coral-soft)]"
          style={{ border: "1px solid var(--line-faint)" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded text-[11px] text-[var(--ink-faint)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            title={t("tasks.search.clear")}
            aria-label={t("tasks.search.clear")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 pt-2.5">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-[var(--ink-mute)]">
            {(() => {
              const intro = t("tasks.empty.intro", { query: "​" }).split("​");
              return (
                <>
                  {intro[0]}
                  <span className="font-mono text-[var(--ink)]">{query}</span>
                  {intro[1] ?? ""}
                </>
              );
            })()}
            <div className="mt-1.5">
              <button
                onClick={() => setQuery("")}
                className="text-[11px] text-[var(--ink-faint)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
              >
                {t("tasks.empty.clear")}
              </button>
            </div>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              active={task.id === activeTaskId}
              canDelete={tasks.length > 1}
              onActivate={() => setActive(task.id)}
              onRename={(name) => renameTask(task.id, name)}
              onDuplicate={() => duplicateTask(task.id)}
              onDelete={() => {
                if (confirm(t("tasks.deleteConfirm", { name: task.name }))) {
                  deleteTask(task.id);
                }
              }}
            />
          ))
        )}
      </div>

      <div
        className="flex flex-col gap-2 px-4 py-3"
        style={{ borderTop: "1px solid var(--line-faint)" }}
      >
        <span className="text-[10.5px] text-[var(--ink-faint)]">{t("tasks.footer")}</span>
        <a
          href="https://github.com/nexu-io/open-design"
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors hover:border-[var(--ink)]/40"
          style={{
            background: "var(--surface)",
            borderColor: "var(--line)",
            color: "var(--ink-soft)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            width="12"
            height="12"
            className="opacity-70 transition-opacity group-hover:opacity-100"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.79 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1-.32 3.3 1.23a11.45 11.45 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.11 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12.01 12.01 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>
            {t("community.builtBy")}{" "}
            <span style={{ color: "var(--ink)" }}>Open Design</span>{" "}
            <span className="text-[var(--ink-faint)]">↗</span>
          </span>
        </a>
      </div>
    </aside>
  );
}

function TaskCard({
  task,
  active,
  canDelete,
  onActivate,
  onRename,
  onDuplicate,
  onDelete,
}: {
  task: Task;
  active: boolean;
  canDelete: boolean;
  onActivate: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const templates = useTemplates();
  const tpl = templates?.find((tplDef) => tplDef.id === task.templateId) ?? FALLBACK_TPL;
  const status = STATUS_DOT[task.status];
  const mounted = useMounted();
  const t = useT();
  const locale = useStore((s) => s.locale);

  useEffect(() => {
    if (editing) {
      setDraft(task.name);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, task.name]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== task.name) onRename(draft);
  };

  const preview = task.content.replace(/\s+/g, " ").trim().slice(0, 64);
  const sizeKB = task.html ? `${(task.html.length / 1024).toFixed(1)} KB` : null;

  return (
    <div
      onClick={() => !editing && onActivate()}
      className={`group relative mb-1.5 cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${
        active ? "" : "hover:bg-[var(--surface)]"
      }`}
      style={
        active
          ? {
              background: "var(--surface)",
              boxShadow: "0 1px 0 var(--line-faint), 0 8px 18px -16px rgba(21,20,15,0.18)",
              border: "1px solid var(--line-soft)",
            }
          : { border: "1px solid transparent" }
      }
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${status.live ? "pulse-dot !w-2 !h-2" : ""}`}
          style={{ background: status.color }}
          title={t(status.key)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") setEditing(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded-md bg-[var(--paper)] px-1.5 py-0.5 text-[13px] font-medium text-[var(--ink)] outline-none ring-1 ring-[var(--coral)]"
              />
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="truncate text-[13px] font-semibold text-[var(--ink)]"
                title={t("tasks.renameDblHint")}
              >
                {task.name}
              </div>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[var(--ink-mute)]">
            <span>{tpl.emoji}</span>
            <span className="truncate">{locale === "en" ? tpl.enName : tpl.zhName}</span>
            {sizeKB && (
              <>
                <span className="text-[var(--ink-faint)]">·</span>
                <span className="font-mono tabular-nums text-[var(--ink-faint)]">{sizeKB}</span>
              </>
            )}
          </div>
          <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--ink-mute)]">
            {preview || <span className="italic text-[var(--ink-faint)]">{t("tasks.emptyContent")}</span>}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--ink-faint)]">
            <span suppressHydrationWarning>{mounted ? relativeTime(task.updatedAt) : ""}</span>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="rounded px-1 py-0.5 hover:text-[var(--ink)]"
                title={t("tasks.rename")}
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="rounded px-1 py-0.5 hover:text-[var(--ink)]"
                title={t("tasks.duplicate")}
              >
                ⎘
              </button>
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="rounded px-1 py-0.5 hover:text-[var(--red)]"
                  title={t("tasks.delete")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
