"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

/**
 * Format gallery — content-format snippets the user can one-click load into
 * the editor. Different from `samples-gallery.tsx` (which ships fully
 * pre-rendered HTML samples tied to specific skills): here every card is a
 * tiny example of an *input* shape (.md / .csv / .json / .sql / .yaml /
 * image, …). After loading, the template picker in the top toolbar decides
 * the *output* shape.
 */

type FormatKind = "text" | "data" | "code" | "image";

type FormatExample = {
  id: string;
  ext: string;
  label: string;
  icon: string;
  /** which group chip surfaces it (and tints the card) */
  kind: FormatKind;
  /** short human description shown under the title */
  description: string;
  /** stored as task.format (matches `DetectedFormat`) */
  format: string;
  /** stored as task.filename */
  filename: string;
  /** content pasted into the textarea */
  content: string;
};

// Tiny inline SVG → data URL helper. Kept inline so the gallery has no extra
// network deps; an SVG is fine for image-format demos because the file
// pipeline only cares that the upload becomes `![name](data:image/...)`.
function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${typeof window === "undefined" ? Buffer.from(svg).toString("base64") : btoa(unescape(encodeURIComponent(svg)))}`;
}

const PHOTO_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4a259"/><stop offset="1" stop-color="#c96442"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><g fill="#fff" font-family="-apple-system, Helvetica, Arial" text-anchor="middle"><text x="320" y="190" font-size="40" font-weight="700">PNG sample</text><text x="320" y="234" font-size="18" opacity="0.85">640 × 400 · placeholder photo</text></g><circle cx="500" cy="100" r="40" fill="#fff" opacity="0.9"/></svg>`;

const CHART_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" fill="#faf9f7"/><g fill="#15140f"><text x="36" y="48" font-size="20" font-weight="700" font-family="-apple-system, Helvetica, Arial">Sales by quarter</text></g><g fill="#c96442"><rect x="80"  y="140" width="60" height="170"/><rect x="180" y="100" width="60" height="210"/><rect x="280" y="120" width="60" height="190"/><rect x="380" y="60"  width="60" height="250"/><rect x="480" y="40"  width="60" height="270"/></g><g fill="#8b8676" font-size="12" font-family="-apple-system, Helvetica, Arial" text-anchor="middle"><text x="110" y="330">Q1</text><text x="210" y="330">Q2</text><text x="310" y="330">Q3</text><text x="410" y="330">Q4 (proj)</text><text x="510" y="330">FY27</text></g></svg>`;

const EXAMPLES: FormatExample[] = [
  {
    id: "md-article",
    ext: ".md",
    label: "Markdown",
    icon: "📝",
    kind: "text",
    description: "Headings, lists, tables, quotes — the default doc shape.",
    format: "markdown",
    filename: "quarterly-review.md",
    content: `# Quarterly Review · Q3 2026

> A short note on what shipped this quarter and what's next.

## Highlights
- **Revenue** grew 23% QoQ
- 4 new enterprise logos closed
- Deploy time: 12 min → 4 min

## Numbers

| Metric | Q2  | Q3   | Δ     |
| ------ | --- | ---- | ----- |
| MRR    | $84k | $103k | +23% |
| Churn  | 4.1% | 3.2%  | -0.9pp |
| NPS    | 41   | 48    | +7    |

## What's next
1. Hire two senior engineers
2. Ship the v2 API
3. Open a Tokyo office

\`\`\`bash
$ npm run deploy --target=tokyo
\`\`\`

[Read the full report →](https://example.com)
`,
  },
  {
    id: "txt-note",
    ext: ".txt",
    label: "Plain text",
    icon: "🗒️",
    kind: "text",
    description: "Raw narrative — paste a draft and let the template style it.",
    format: "text",
    filename: "memo.txt",
    content: `Subject: A note on shipping cadence

Team,

The last two weeks taught us that small, frequent releases beat one big drop.
We cut a hotfix in 12 minutes on Tuesday and nobody noticed — that's the goal.

Three things going forward:
First, we ship behind flags. Always.
Second, no green deploy past 4 pm on Fridays. The on-call should sleep.
Third, every release notes file ends with one customer-visible sentence.

If anything blocks you on this, ping me directly.

— Sam
`,
  },
  {
    id: "csv-people",
    ext: ".csv",
    label: "CSV",
    icon: "📊",
    kind: "data",
    description: "Comma-separated rows — agents render this as styled tables.",
    format: "csv",
    filename: "team.csv",
    content: `name,role,city,joined,salary
Alice Chen,Engineer,Shanghai,2021-04-12,180000
Bob Park,Designer,Seoul,2020-11-03,150000
Carla Ruiz,PM,Madrid,2022-08-21,165000
Daniel Wu,Engineer,Taipei,2023-02-14,175000
Elena Costa,Researcher,Milan,2021-09-30,170000
Felix Oduya,Engineer,Nairobi,2024-01-08,160000
`,
  },
  {
    id: "tsv-metrics",
    ext: ".tsv",
    label: "TSV",
    icon: "📈",
    kind: "data",
    description: "Tab-separated — what you get pasting from Excel / Sheets.",
    format: "tsv",
    filename: "weekly-metrics.tsv",
    content: `week\tsignups\tactivations\tretained_d7\trevenue_usd
2026-W14\t842\t611\t418\t12480
2026-W15\t903\t672\t461\t13720
2026-W16\t1124\t831\t579\t16950
2026-W17\t987\t714\t503\t14280
2026-W18\t1208\t912\t648\t18410
`,
  },
  {
    id: "xlsx-multisheet",
    ext: ".xlsx",
    label: "Excel",
    icon: "🧮",
    kind: "data",
    description: "Multi-sheet workbook — flattened to CSV blocks per sheet.",
    format: "csv",
    filename: "fy26-plan.xlsx",
    content: `# Sheet: Sales
month,product,units,revenue_usd
2026-01,Pro plan,142,28400
2026-02,Pro plan,168,33600
2026-03,Pro plan,201,40200
2026-01,Team plan,38,19000
2026-02,Team plan,44,22000
2026-03,Team plan,51,25500

# Sheet: Pipeline
stage,deal,owner,arr_usd
qualified,Acme Co,Alice,48000
proposal,Globex,Daniel,72000
negotiation,Initech,Carla,96000
closed_won,Umbrella,Bob,120000
`,
  },
  {
    id: "json-object",
    ext: ".json",
    label: "JSON",
    icon: "🧬",
    kind: "code",
    description: "Structured object — good for product cards, profiles, specs.",
    format: "json",
    filename: "product.json",
    content: `{
  "product": "HTML Anything",
  "version": "0.4.0",
  "tagline": "Anything → beautiful HTML",
  "author": {
    "name": "pftom",
    "url": "https://github.com/pftom"
  },
  "metrics": {
    "weekly_active_users": 1240,
    "conversions_total": 8123,
    "avg_first_byte_ms": 1820
  },
  "features": [
    "60+ templates",
    "diff-edit mode",
    "i18n (en / zh-CN)",
    "local agents (Claude Code, Codex, Gemini)"
  ],
  "shipped": true
}
`,
  },
  {
    id: "sql-query",
    ext: ".sql",
    label: "SQL",
    icon: "🛢️",
    kind: "code",
    description: "Queries and DDL — show the query + format the result.",
    format: "sql",
    filename: "top-customers.sql",
    content: `-- Top 10 customers by lifetime value (FY26)
SELECT
  c.id,
  c.name,
  c.country,
  SUM(o.amount_usd)  AS lifetime_value,
  COUNT(o.id)        AS order_count,
  MIN(o.created_at)  AS first_order,
  MAX(o.created_at)  AS last_order
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE c.created_at >= '2025-04-01'
  AND o.status = 'paid'
GROUP BY c.id, c.name, c.country
HAVING SUM(o.amount_usd) > 10000
ORDER BY lifetime_value DESC
LIMIT 10;
`,
  },
  {
    id: "yaml-config",
    ext: ".yaml",
    label: "YAML",
    icon: "⚙️",
    kind: "code",
    description: "Config files — k8s, GitHub Actions, openapi specs.",
    format: "yaml",
    filename: "deploy.yaml",
    content: `project: html-anything
version: 0.4.0
description: Anything → beautiful HTML

agents:
  - id: claude-code
    label: Claude Code
    protocol: stdin
    models: [opus-4-7, sonnet-4-6, haiku-4-5]
  - id: codex
    label: OpenAI Codex
    protocol: argv
    models: [gpt-5, gpt-4.1]
  - id: gemini
    label: Gemini CLI
    protocol: stdin
    models: [gemini-2.5-pro]

deploy:
  region: us-east-1
  replicas: 3
  resources:
    cpu: "500m"
    memory: "1Gi"
  env:
    NODE_ENV: production
    LOG_LEVEL: info
`,
  },
  {
    id: "html-page",
    ext: ".html",
    label: "HTML",
    icon: "🌐",
    kind: "code",
    description: "A page or fragment — the agent restyles it or extracts content.",
    format: "html",
    filename: "snippet.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Hello, HTML Anything</title>
</head>
<body>
  <header>
    <h1>It works!</h1>
    <p class="lede">Drop any HTML here and the agent will restyle it for the picked template.</p>
  </header>
  <section>
    <h2>What you can do</h2>
    <ul>
      <li>Paste a Notion / Linear export</li>
      <li>Drop in a scraped page</li>
      <li>Hand-roll a quick prototype</li>
    </ul>
  </section>
</body>
</html>
`,
  },
  {
    id: "png-photo",
    ext: ".png",
    label: "PNG",
    icon: "🖼️",
    kind: "image",
    description: "Bitmap photo — embedded as data URL, agent writes copy around it.",
    format: "image",
    filename: "photo.png",
    content: `![photo.png](${svgDataUrl(PHOTO_PLACEHOLDER_SVG)})

Caption: a placeholder hero image. Replace with a real photo, then ⌘+Enter to render in the picked template (Xiaohongshu card, Twitter card, magazine…).
`,
  },
  {
    id: "jpg-chart",
    ext: ".jpg",
    label: "JPG",
    icon: "📷",
    kind: "image",
    description: "Chart / screenshot — agent annotates it with a styled writeup.",
    format: "image",
    filename: "sales-chart.jpg",
    content: `![sales-chart.jpg](${svgDataUrl(CHART_PLACEHOLDER_SVG)})

Sales by quarter — FY26 closed with Q4 at $250k (projected) and FY27 starting at $270k. The agent will turn this into a finance report card or a magazine pull-out, depending on the template.
`,
  },
];

const KIND_LABEL: Record<FormatKind, { en: string; zh: string; tint: string }> = {
  text: { en: "Text", zh: "文本", tint: "rgba(35,72,184,0.10)" },
  data: { en: "Data", zh: "数据", tint: "rgba(31,122,58,0.10)" },
  code: { en: "Code", zh: "代码", tint: "rgba(108,58,166,0.10)" },
  image: { en: "Image", zh: "图片", tint: "rgba(201,100,66,0.12)" },
};

export function FormatsGallery({ onLoaded }: { onLoaded?: () => void }) {
  const setContent = useStore((s) => s.setContent);
  const setFormat = useStore((s) => s.setFormat);
  const setFilename = useStore((s) => s.setFilename);
  const pushLog = useStore((s) => s.pushLog);
  const locale = useStore((s) => s.locale);
  const t = useT();
  const [filter, setFilter] = useState<FormatKind | "all">("all");

  const filters: Array<{ id: FormatKind | "all"; label: string; emoji: string }> = useMemo(() => {
    const zh = locale === "zh-CN";
    return [
      { id: "all", label: t("samples.filter.all"), emoji: "✨" },
      { id: "text", label: zh ? KIND_LABEL.text.zh : KIND_LABEL.text.en, emoji: "📝" },
      { id: "data", label: zh ? KIND_LABEL.data.zh : KIND_LABEL.data.en, emoji: "📊" },
      { id: "code", label: zh ? KIND_LABEL.code.zh : KIND_LABEL.code.en, emoji: "🧬" },
      { id: "image", label: zh ? KIND_LABEL.image.zh : KIND_LABEL.image.en, emoji: "🖼️" },
    ];
  }, [locale, t]);

  const visible = useMemo(
    () => (filter === "all" ? EXAMPLES : EXAMPLES.filter((e) => e.kind === filter)),
    [filter],
  );

  const handleLoad = (ex: FormatExample) => {
    setContent(ex.content);
    setFormat(ex.format);
    setFilename(ex.filename);
    pushLog({
      kind: "info",
      text: t("formats.loadedLog", { name: ex.filename, fmt: ex.format }),
    });
    onLoaded?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--paper)" }}
      >
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)] mb-1.5">
            {t("formats.eyebrow")}
          </div>
          <div className="text-[11.5px] text-[var(--ink-mute)] leading-snug max-w-md">
            {t("formats.subtitle")}
          </div>
        </div>
        <div className="text-[11px] text-[var(--ink-faint)] whitespace-nowrap mt-1">
          {visible.length} / {EXAMPLES.length}
        </div>
      </div>

      <div
        className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ borderBottom: "1px solid var(--line-faint)", background: "var(--paper)" }}
      >
        {filters.map((c) => {
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ex) => (
            <FormatCard key={ex.id} ex={ex} onLoad={() => handleLoad(ex)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FormatCard({ ex, onLoad }: { ex: FormatExample; onLoad: () => void }) {
  const t = useT();
  const tint = KIND_LABEL[ex.kind].tint;
  const previewText = ex.content.split("\n").slice(0, 6).join("\n");
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 0 var(--line-faint), 0 14px 32px -22px rgba(21,20,15,0.18)",
      }}
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5"
        style={{ background: tint, borderBottom: "1px solid var(--line-faint)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[18px] leading-none">{ex.icon}</span>
          <span className="font-semibold text-[13px] text-[var(--ink)] truncate">{ex.label}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-mono tracking-wide"
            style={{ background: "var(--paper)", color: "var(--ink-soft)", border: "1px solid var(--line-faint)" }}
          >
            {ex.ext}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)] whitespace-nowrap">
          {ex.format}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11.5px] text-[var(--ink-mute)] leading-snug">{ex.description}</div>
        <pre
          className="rounded-md px-2.5 py-2 text-[10.5px] leading-snug font-[family-name:var(--font-mono)] overflow-hidden whitespace-pre"
          style={{
            background: "var(--paper)",
            color: "var(--ink-soft)",
            border: "1px solid var(--line-faint)",
            maxHeight: "5.4em",
          }}
          title={ex.content}
        >
          {previewText}
        </pre>
        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
          <span
            className="min-w-0 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]"
            title={ex.filename}
          >
            {ex.filename}
          </span>
          <button
            onClick={onLoad}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: "var(--coral)",
              color: "#fff",
              boxShadow: "0 8px 18px -12px rgba(201,100,66,0.85)",
            }}
          >
            {t("formats.loadButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
