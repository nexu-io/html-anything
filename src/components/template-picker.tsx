"use client";

import {
  useTemplates,
  fetchTemplateExample,
  SCENARIO_ORDER,
  scenarioLabelKey,
  type TemplateDef,
} from "@/lib/templates";
import { useStore, selectActiveTask } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";

type Filter = "all" | string;

function rankFeatured(t: TemplateDef): number {
  // smaller comes first; templates without `featured` go to the back of the bucket
  return typeof t.featured === "number" ? t.featured : 9999;
}

function rankRecommended(t: TemplateDef): number {
  return typeof t.recommended === "number" ? t.recommended : 9999;
}

/** Synthetic scenario key for the curated "Featured" group at the top of the picker. */
const FEATURED_KEY = "_featured";

function matchesQuery(tpl: TemplateDef, q: string): boolean {
  if (!q) return true;
  const hay = [
    tpl.zhName,
    tpl.enName,
    tpl.description,
    tpl.aspectHint,
    tpl.category,
    tpl.scenario,
    ...(tpl.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => hay.includes(tok));
}

export function TemplatePicker() {
  const templates = useTemplates();
  const selectedId = useStore((s) => selectActiveTask(s)?.templateId ?? "article-magazine");
  const setSelected = useStore((s) => s.setSelectedTemplate);
  const loadSample = useStore((s) => s.loadSample);
  const locale = useStore((s) => s.locale);
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = templates ?? [];
  const tpl = list.find((tplDef) => tplDef.id === selectedId) ?? list[0];
  const scenarioText = (s: string) => {
    const key = scenarioLabelKey(s);
    return key ? t(key) : s;
  };
  const templateName = (def: TemplateDef) => (locale === "en" ? def.enName : def.zhName);

  // hover preview state — load + cache example.html lazily on hover.
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const previewCache = useRef<Map<string, string>>(new Map());
  const [, forceRender] = useState(0);
  const [hoverLoading, setHoverLoading] = useState(false);
  const hoverEnterTimer = useRef<number | null>(null);
  const hoverLeaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!hoveredId) {
      setHoverLoading(false);
      return;
    }
    if (previewCache.current.has(hoveredId)) {
      setHoverLoading(false);
      return;
    }
    let cancelled = false;
    setHoverLoading(true);
    void (async () => {
      const ex = await fetchTemplateExample(hoveredId);
      if (cancelled) return;
      if (ex?.html) {
        previewCache.current.set(hoveredId, ex.html);
        forceRender((n) => n + 1);
      }
      setHoverLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hoveredId]);

  const hoveredTpl = hoveredId ? list.find((def) => def.id === hoveredId) ?? null : null;
  const hoveredHtml = hoveredId ? previewCache.current.get(hoveredId) ?? null : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // focus search when opening; reset transient state on close
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setQuery("");
    setFilter("all");
  }, [open]);

  // esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hasRecommended = useMemo(
    () => list.some((tpl) => typeof tpl.recommended === "number"),
    [list],
  );

  const filterChips = useMemo(() => {
    const present = new Set(list.map((def) => def.scenario));
    const ordered = SCENARIO_ORDER.filter((s) => present.has(s));
    const extras = Array.from(present).filter((s) => !scenarioLabelKey(s));
    return [
      { id: "all", label: t("template.filter.all") },
      ...(hasRecommended ? [{ id: FEATURED_KEY, label: t("template.filter.featured") }] : []),
      ...ordered.map((s) => ({ id: s, label: scenarioText(s) })),
      ...extras.map((s) => ({ id: s, label: s })),
    ];
  }, [list, hasRecommended, t, scenarioText]);

  const grouped = useMemo(() => {
    // explicit "Featured" filter: show only recommended, sorted by recommended rank
    if (filter === FEATURED_KEY) {
      const items = list
        .filter((tpl) => typeof tpl.recommended === "number" && matchesQuery(tpl, query))
        .sort(
          (a, b) =>
            rankRecommended(a) - rankRecommended(b) || a.zhName.localeCompare(b.zhName, "zh"),
        );
      return [{ key: FEATURED_KEY, label: t("template.filter.featured"), items }];
    }

    const filtered = list
      .filter((tpl) => (filter === "all" || tpl.scenario === filter) && matchesQuery(tpl, query))
      .sort((a, b) => rankFeatured(a) - rankFeatured(b) || a.zhName.localeCompare(b.zhName, "zh"));

    // scenario filter or active search: flat result list, no recommended group
    if (filter !== "all" || query) {
      return [{ key: "_results", label: "", items: filtered }];
    }

    // default "全部" view: 推荐 group first, then scenarios (with recommended templates removed
    // so each template appears once)
    const recommendedItems = filtered
      .filter((tpl) => typeof tpl.recommended === "number")
      .sort(
        (a, b) =>
          rankRecommended(a) - rankRecommended(b) || a.zhName.localeCompare(b.zhName, "zh"),
      );
    const rest = filtered.filter((def) => typeof def.recommended !== "number");
    const buckets = new Map<string, TemplateDef[]>();
    for (const def of rest) {
      if (!buckets.has(def.scenario)) buckets.set(def.scenario, []);
      buckets.get(def.scenario)!.push(def);
    }
    const present = SCENARIO_ORDER.filter((s) => buckets.has(s));
    const extras = Array.from(buckets.keys()).filter((s) => !scenarioLabelKey(s));
    const scenarioGroups = [...present, ...extras].map((s) => ({
      key: s,
      label: scenarioText(s),
      items: buckets.get(s)!,
    }));
    return [
      ...(recommendedItems.length > 0
        ? [{ key: FEATURED_KEY, label: t("template.filter.featured"), items: recommendedItems }]
        : []),
      ...scenarioGroups,
    ];
  }, [list, filter, query, t, scenarioText]);

  const total = useMemo(
    () => grouped.reduce((n, g) => n + g.items.length, 0),
    [grouped],
  );

  const onPreview = async (def: TemplateDef) => {
    setLoadingPreview(def.id);
    try {
      const ex = await fetchTemplateExample(def.id);
      if (!ex) return;
      loadSample({
        id: ex.id,
        name: ex.name,
        content: ex.content,
        format: ex.format,
        templateId: ex.templateId,
        html: ex.html,
      });
      setOpen(false);
    } finally {
      setLoadingPreview(null);
    }
  };

  if (!tpl) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]"
        style={{ background: "var(--surface)", borderColor: "var(--line)", opacity: 0.5 }}
      >
        <span className="text-base">⋯</span>
        <span className="font-medium text-[var(--ink)]">{t("template.loading")}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-all hover:border-[var(--ink)]/30"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      >
        <span className="text-base">{tpl.emoji}</span>
        <span className="font-medium text-[var(--ink)]">{templateName(tpl)}</span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-faint)]">{tpl.aspectHint}</span>
        <span className="text-[var(--ink-faint)]">▾</span>
      </button>

      {open && (
        <div
          className="absolute left-0 z-40 mt-2 w-[560px] od-fade-in rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 30px 60px -20px rgba(21, 20, 15, 0.25)",
            maxHeight: "min(640px, 78vh)",
          }}
        >
          {/* sticky header: title + search + chips */}
          <div
            className="px-4 pt-3 pb-2"
            style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">
                {t("template.heading")}
              </div>
              <div className="text-[10px] text-[var(--ink-faint)]">
                {total} / {list.length}
              </div>
            </div>
            <div
              className="mt-2 flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: "var(--paper)", border: "1px solid var(--line-faint)" }}
            >
              <span className="text-[var(--ink-faint)] text-[12px]">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("template.search.placeholder")}
                className="flex-1 bg-transparent outline-none text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[11px] text-[var(--ink-faint)] hover:text-[var(--ink)]"
                  title={t("template.search.clear")}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="mt-2 -mx-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterChips.map((c) => {
                const active = filter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFilter(c.id)}
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] transition-colors"
                    style={
                      active
                        ? { background: "var(--ink)", color: "var(--paper)" }
                        : { background: "transparent", color: "var(--ink-mute)", border: "1px solid var(--line-faint)" }
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* scrollable list */}
          <div className="flex-1 overflow-y-auto p-2">
            {total === 0 ? (
              <div className="py-12 text-center text-[12px] text-[var(--ink-faint)]">
                {templates === undefined ? t("template.empty.loading") : t("template.empty.noMatch")}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.key} className="mb-2 last:mb-0">
                  {group.label && (
                    <div
                      className="sticky top-0 z-10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]"
                      style={{ background: "var(--surface)" }}
                    >
                      {group.label}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-0.5">
                    {group.items.map((def) => {
                      const isSelected = selectedId === def.id;
                      const hasPreview = !!def.example?.hasHtml;
                      const isLoading = loadingPreview === def.id;
                      return (
                        <div
                          key={def.id}
                          className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--paper)]"
                          style={
                            isSelected
                              ? { background: "var(--coral-soft)" }
                              : hoveredId === def.id
                                ? { background: "var(--paper)" }
                                : undefined
                          }
                          onMouseEnter={() => {
                            if (!def.example?.hasHtml) return;
                            if (hoverLeaveTimer.current) {
                              window.clearTimeout(hoverLeaveTimer.current);
                              hoverLeaveTimer.current = null;
                            }
                            if (hoverEnterTimer.current) window.clearTimeout(hoverEnterTimer.current);
                            hoverEnterTimer.current = window.setTimeout(() => {
                              setHoveredId(def.id);
                            }, 260);
                          }}
                          onMouseLeave={() => {
                            if (hoverEnterTimer.current) {
                              window.clearTimeout(hoverEnterTimer.current);
                              hoverEnterTimer.current = null;
                            }
                            if (hoverLeaveTimer.current) window.clearTimeout(hoverLeaveTimer.current);
                            hoverLeaveTimer.current = window.setTimeout(() => {
                              setHoveredId((prev) => (prev === def.id ? null : prev));
                            }, 180);
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelected(def.id);
                              setOpen(false);
                            }}
                            className="flex items-start gap-3 flex-1 min-w-0 text-left"
                          >
                            <span className="text-2xl shrink-0 leading-none mt-0.5">{def.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-semibold text-[var(--ink)] truncate">
                                  {templateName(def)}
                                </span>
                                {typeof def.recommended === "number" && (
                                  <span
                                    className="shrink-0 text-[9.5px] font-bold"
                                    style={{ color: "var(--coral)" }}
                                    title={t("template.filter.featured")}
                                  >
                                    {t("template.featured.symbol")}
                                  </span>
                                )}
                                <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
                                  {def.aspectHint}
                                </span>
                              </div>
                              <div className="text-[11.5px] text-[var(--ink-mute)] leading-snug mt-0.5 line-clamp-2">
                                {def.description}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0 mt-1">
                            {def.example?.source && (
                              <a
                                href={def.example.source.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-full px-2 py-1 text-[10.5px] font-medium transition-all hover:text-[var(--ink)]"
                                style={{
                                  background: "transparent",
                                  color: "var(--ink-faint)",
                                  border: "1px solid var(--line-faint)",
                                }}
                                title={t("template.source.tooltip", { label: def.example.source.label })}
                              >
                                ↗ {def.example.source.label}
                              </a>
                            )}
                            {hasPreview && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void onPreview(def);
                                }}
                                disabled={isLoading}
                                className="rounded-full px-2 py-1 text-[10.5px] font-semibold transition-all disabled:opacity-40"
                                style={{
                                  background: "var(--paper)",
                                  color: "var(--ink-mute)",
                                  border: "1px solid var(--line-faint)",
                                }}
                                title={t("template.preview.tooltip")}
                              >
                                {isLoading ? t("template.preview.loadingButton") : t("template.preview.button")}
                              </button>
                            )}
                            {isSelected && <span className="text-[var(--coral)]">●</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* footer hint */}
          <div
            className="px-4 py-2 text-[10.5px] text-[var(--ink-faint)] flex items-center justify-between"
            style={{ borderTop: "1px solid var(--line-faint)", background: "var(--paper)" }}
          >
            <span>
              {t("template.footer.hint.search")} ·{" "}
              <span className="opacity-70">{t("template.footer.hint.filter")}</span> ·{" "}
              <span className="opacity-70">{t("template.footer.hint.hover")}</span> ·{" "}
              <span className="opacity-70">{t("template.footer.hint.preview")}</span>
            </span>
            <span>
              <kbd className="rounded border border-[var(--line-faint)] px-1">Esc</kbd> {t("template.footer.esc")}
            </span>
          </div>
        </div>
      )}

      {/* hover preview popover — appears next to dropdown when a row with example.html is hovered */}
      {open && hoveredTpl && hoveredTpl.example?.hasHtml && (
        <aside
          className="absolute z-40 mt-2 od-fade-in flex flex-col rounded-2xl overflow-hidden"
          style={{
            left: "calc(560px + 12px)",
            top: 0,
            width: 560,
            maxHeight: "min(640px, 78vh)",
            background: "var(--surface)",
            border: "1px solid var(--line-soft)",
            boxShadow: "0 30px 60px -20px rgba(21, 20, 15, 0.25)",
          }}
          onMouseEnter={() => {
            if (hoverLeaveTimer.current) {
              window.clearTimeout(hoverLeaveTimer.current);
              hoverLeaveTimer.current = null;
            }
          }}
          onMouseLeave={() => {
            if (hoverLeaveTimer.current) window.clearTimeout(hoverLeaveTimer.current);
            hoverLeaveTimer.current = window.setTimeout(() => setHoveredId(null), 160);
          }}
        >
          {/* header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--surface)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">{hoveredTpl.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold text-[var(--ink)] truncate">
                  {templateName(hoveredTpl)}
                </div>
                <div className="text-[10.5px] text-[var(--ink-faint)] uppercase tracking-wider">
                  {hoveredTpl.aspectHint} · {locale === "en" ? hoveredTpl.zhName : hoveredTpl.enName}
                </div>
              </div>
              {hoveredTpl.example?.source && (
                <a
                  href={hoveredTpl.example.source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="shrink-0 rounded-full px-2 py-1 text-[10.5px] font-medium hover:text-[var(--ink)]"
                  style={{
                    background: "transparent",
                    color: "var(--ink-faint)",
                    border: "1px solid var(--line-faint)",
                  }}
                  title={t("template.source.tooltip", { label: hoveredTpl.example.source.label })}
                >
                  ↗ {hoveredTpl.example.source.label}
                </a>
              )}
            </div>
          </div>

          {/* scaled iframe thumbnail */}
          <div
            className="relative flex-1"
            style={{
              background: "var(--paper)",
              height: 400,
              overflow: "hidden",
            }}
          >
            {hoverLoading && !hoveredHtml && (
              <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[var(--ink-faint)]">
                {t("template.popover.loading")}
              </div>
            )}
            {hoveredHtml && (
              <iframe
                key={hoveredTpl.id}
                title={templateName(hoveredTpl)}
                srcDoc={hoveredHtml}
                sandbox="allow-scripts allow-same-origin"
                style={{
                  width: 1280,
                  height: 960,
                  border: 0,
                  transform: "scale(0.4375)",
                  transformOrigin: "top left",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* footer */}
          <div
            className="px-4 py-2 text-[10.5px] text-[var(--ink-faint)] flex items-center justify-between"
            style={{ borderTop: "1px solid var(--line-faint)", background: "var(--paper)" }}
          >
            <span className="line-clamp-1">{hoveredTpl.example?.tagline ?? hoveredTpl.description}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void onPreview(hoveredTpl);
              }}
              className="shrink-0 rounded-full px-2 py-1 text-[10.5px] font-semibold transition-all"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
              }}
              title={t("template.popover.loadIntoTooltip")}
            >
              {t("template.popover.loadInto")}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
