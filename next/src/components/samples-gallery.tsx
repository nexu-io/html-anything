"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  useTemplates,
  fetchTemplateExample,
  scenarioLabelKey,
  type TemplateDef,
} from "@/lib/templates";

/**
 * Samples gallery — rendered on the "示例" tab in the editor pane. The list
 * comes from `/api/templates` filtered to skills that ship a pre-rendered
 * `example.html` (so every card has something to preview). Each card uses
 * `<iframe src=…>` pointing at `/api/templates/<id>/preview` — the browser
 * does the fetching + caching, no `srcDoc` round-trip through React state.
 */
export function SamplesGallery({ onLoaded }: { onLoaded?: () => void }) {
  const templates = useTemplates();
  const loadSample = useStore((s) => s.loadSample);
  const tasks = useStore((s) => s.tasks);
  const locale = useStore((s) => s.locale);
  const t = useT();
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const previewable = useMemo(
    () => (templates ?? []).filter((tpl) => tpl.example?.hasHtml),
    [templates],
  );

  // group filter chips by scenario (only show scenarios that have ≥1 previewable template)
  const filterChips = useMemo(() => {
    const seen = new Map<string, TemplateDef>();
    for (const tpl of previewable) if (!seen.has(tpl.scenario)) seen.set(tpl.scenario, tpl);
    return [
      { id: "all", label: t("samples.filter.all"), emoji: "✨" },
      ...Array.from(seen.entries()).map(([s, tpl]) => {
        const k = scenarioLabelKey(s);
        return { id: s, label: k ? t(k) : s, emoji: tpl.emoji };
      }),
    ];
  }, [previewable, t]);

  const visible = useMemo(
    () => (filter === "all" ? previewable : previewable.filter((tpl) => tpl.scenario === filter)),
    [filter, previewable],
  );

  const loadedSampleIds = useMemo(
    () => new Set(tasks.map((task) => task.sampleId).filter(Boolean) as string[]),
    [tasks],
  );

  const handleLoad = async (tpl: TemplateDef) => {
    setLoadingId(tpl.id);
    try {
      const ex = await fetchTemplateExample(tpl.id);
      if (!ex) return;
      loadSample({
        id: ex.id,
        name: ex.name,
        content: ex.content,
        format: ex.format,
        templateId: ex.templateId,
        html: ex.html,
      });
      onLoaded?.();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* sticky filter strip */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--paper)" }}
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-1.5">
            {t("samples.eyebrow")}
          </div>
          <div className="text-[11.5px] text-[var(--ink-mute)] leading-snug max-w-md">
            {(() => {
              const SEP = "\u0007";
              const body = t("samples.subtitle.body", {
                preRendered: SEP + "PRE" + SEP,
                diff: SEP + "DIFF" + SEP,
              });
              return body.split(SEP).map((piece, i) => {
                if (piece === "PRE") {
                  return (
                    <strong key={i} className="text-[var(--ink)]">
                      {t("samples.subtitle.preRendered")}
                    </strong>
                  );
                }
                if (piece === "DIFF") {
                  return (
                    <strong key={i} className="text-[var(--coral)]">
                      {t("samples.subtitle.diff")}
                    </strong>
                  );
                }
                const kbdParts = piece.split("⌘+Enter");
                if (kbdParts.length === 2) {
                  return (
                    <span key={i}>
                      {kbdParts[0]}
                      <kbd className="px-1 py-px rounded bg-white border border-[var(--line)] font-mono text-[10px]">
                        ⌘+Enter
                      </kbd>
                      {kbdParts[1]}
                    </span>
                  );
                }
                return <span key={i}>{piece}</span>;
              });
            })()}
          </div>
        </div>
        <div className="text-[11px] text-[var(--ink-faint)] whitespace-nowrap mt-1">
          {visible.length} / {previewable.length}
        </div>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--paper)" }}
      >
        {filterChips.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] transition-colors"
              style={
                active
                  ? { background: "var(--ink)", color: "var(--paper)" }
                  : {
                      background: "var(--surface)",
                      color: "var(--ink-mute)",
                      border: "1px solid var(--line-faint)",
                    }
              }
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {templates === undefined ? (
          <div className="py-12 text-center text-[12px] text-[var(--ink-faint)]">
            {t("samples.loading")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {visible.map((tpl) => (
              <SampleCard
                key={tpl.id}
                tpl={tpl}
                loaded={!!tpl.example && loadedSampleIds.has(tpl.example.id)}
                loading={loadingId === tpl.id}
                onLoad={() => handleLoad(tpl)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SampleCard({
  tpl,
  loaded,
  loading,
  onLoad,
}: {
  tpl: TemplateDef;
  loaded: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const t = useT();
  const locale = useStore((s) => s.locale);
  const example = tpl.example;
  const previewUrl = `/api/templates/${encodeURIComponent(tpl.id)}/preview`;
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 0 var(--line-faint), 0 14px 32px -22px rgba(21,20,15,0.18)",
      }}
    >
      {/* live HTML thumbnail (scaled-down iframe pointing at /api/.../preview) */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: "var(--paper)", borderBottom: "1px solid var(--line-faint)" }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: "scale(0.32)",
            width: "calc(100% / 0.32)",
            height: "calc(176px / 0.32)",
            pointerEvents: "none",
          }}
        >
          <iframe
            title={tpl.id}
            src={previewUrl}
            sandbox=""
            loading="lazy"
            className="block h-full w-full"
            style={{ background: "#fff", border: "none" }}
          />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span
            className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur"
            style={{ border: "1px solid var(--line-faint)", color: "var(--ink)" }}
          >
            {tpl.emoji} {locale === "en" ? tpl.enName : tpl.zhName}
          </span>
          {loaded && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur"
              style={{ background: "rgba(31,122,58,0.15)", color: "var(--green)" }}
              title={t("samples.loadedTooltip")}
            >
              {t("samples.loaded")}
            </span>
          )}
        </div>
        <div className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-mono tracking-wide backdrop-blur" style={{ border: "1px solid var(--line-faint)", color: "var(--ink-mute)" }}>
          {tpl.aspectHint}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <div className="font-semibold text-[14px] text-[var(--ink)] leading-snug">
            {example?.name || (locale === "en" ? tpl.enName : tpl.zhName)}
          </div>
          {example?.tagline && (
            <div className="text-[11.5px] text-[var(--coral)] mt-0.5">{example.tagline}</div>
          )}
        </div>
        <div className="text-[11.5px] text-[var(--ink-mute)] leading-snug">
          {example?.desc || tpl.description}
        </div>

        {example?.source && (
          <a
            href={example.source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors"
            style={{
              background: "var(--paper)",
              color: "var(--ink-mute)",
              border: "1px solid var(--line-faint)",
            }}
            title={example.source.url}
          >
            <span>↗</span>
            <span>{t("samples.sourceLink", { label: example.source.label })}</span>
          </a>
        )}

        <div className="flex items-center justify-between gap-2 pt-1.5 mt-auto">
          <span
            className="min-w-0 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]"
            title={`${tpl.scenario} · ${example?.format ?? "html"}`}
          >
            {tpl.scenario} · {example?.format ?? "html"}
          </span>
          <button
            onClick={onLoad}
            disabled={loading}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--coral)",
              color: "#fff",
              boxShadow: "0 8px 18px -12px rgba(201,100,66,0.85)",
            }}
          >
            {loading ? t("samples.loadingButton") : t("samples.loadButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
