import Papa from "papaparse";

export type DetectedFormat =
  | "markdown"
  | "html"
  | "json"
  | "csv"
  | "tsv"
  | "sql"
  | "yaml"
  | "text";

export function detectFormat(input: string): DetectedFormat {
  const t = input.trim();
  if (!t) return "text";

  // HTML
  if (/^<!DOCTYPE\s+html/i.test(t) || /^<html[\s>]/i.test(t)) return "html";

  // JSON
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try {
      JSON.parse(t);
      return "json";
    } catch {}
  }

  // SQL
  if (/^\s*(select|insert|update|delete|create|drop|alter|with)\s+/i.test(t)) {
    return "sql";
  }

  // YAML — naive
  if (/^---\s*$/m.test(t.split("\n")[0]) || /^[a-zA-Z_][\w-]*\s*:\s*\S/m.test(t)) {
    if (!/^#{1,6}\s/m.test(t) && !/\|/.test(t.split("\n")[0])) {
      // could be yaml
      const firstLines = t.split("\n").slice(0, 5).join("\n");
      if (/^[a-zA-Z_][\w-]*\s*:/m.test(firstLines)) return "yaml";
    }
  }

  // Markdown — has headings, lists, fences, or links
  if (/^#{1,6}\s+\S/m.test(t)) return "markdown";
  if (/^[*-]\s+\S/m.test(t) && /^[*-]\s+\S/m.test(t.split("\n").slice(1).join("\n"))) return "markdown";
  if (/```[\s\S]*?```/.test(t)) return "markdown";
  if (/!\[[^\]]*\]\([^)]+\)/.test(t)) return "markdown";

  // CSV / TSV
  const lines = t.split("\n").slice(0, 10);
  if (lines.length >= 2) {
    const tabCount = (lines[0].match(/\t/g) || []).length;
    if (tabCount >= 1 && tabCount === ((lines[1].match(/\t/g) || []).length)) {
      return "tsv";
    }
    const commaCount = (lines[0].match(/,/g) || []).length;
    if (commaCount >= 1) {
      const allMatch = lines.slice(1, 5).every(
        (l) => Math.abs(((l.match(/,/g) || []).length) - commaCount) <= 1,
      );
      if (allMatch) return "csv";
    }
  }

  return "text";
}

export type ParsedSummary = {
  format: DetectedFormat;
  raw: string;
  /** Human-readable summary you can pass to the AI alongside raw, when raw is huge */
  preview: string;
  /** Optional structured data extracted */
  structured?: unknown;
};

const MAX_RAW_FOR_AGENT = 40_000;

export function summarizeForAgent(input: string): ParsedSummary {
  const format = detectFormat(input);
  const raw = input;
  let preview = "";
  let structured: unknown;

  switch (format) {
    case "csv":
    case "tsv": {
      try {
        const result = Papa.parse(input.trim(), {
          header: true,
          skipEmptyLines: true,
          delimiter: format === "tsv" ? "\t" : ",",
          dynamicTyping: true,
        });
        const rows = result.data as Record<string, unknown>[];
        const fields = result.meta.fields ?? [];
        structured = { fields, rows };
        const sampleRows = rows.slice(0, 20);
        preview = [
          `[${format.toUpperCase()}] ${rows.length} 行 × ${fields.length} 列`,
          `字段: ${fields.join(", ")}`,
          `前 ${sampleRows.length} 行 (JSON):`,
          JSON.stringify(sampleRows, null, 2),
        ].join("\n");
      } catch (err) {
        preview = `[${format}] (解析失败: ${err instanceof Error ? err.message : err})`;
      }
      break;
    }
    case "json": {
      try {
        const parsed = JSON.parse(input);
        structured = parsed;
        const pretty = JSON.stringify(parsed, null, 2);
        preview =
          pretty.length > 4000
            ? `[JSON] 截断预览 (完整 ${pretty.length} 字节):\n${pretty.slice(0, 4000)}\n…`
            : `[JSON]\n${pretty}`;
      } catch (err) {
        preview = `[JSON 但解析失败]\n${input.slice(0, 1000)}`;
      }
      break;
    }
    case "markdown":
      preview = `[Markdown 文档, ${input.length} 字符]`;
      break;
    case "html":
      preview = `[HTML 文档, ${input.length} 字符]`;
      break;
    case "sql":
      preview = `[SQL 查询/脚本]`;
      break;
    case "yaml":
      preview = `[YAML 配置]`;
      break;
    default:
      preview = `[纯文本, ${input.length} 字符]`;
  }

  // Truncate raw for agent if huge
  let agentRaw = raw;
  if (raw.length > MAX_RAW_FOR_AGENT) {
    agentRaw =
      raw.slice(0, MAX_RAW_FOR_AGENT) +
      `\n\n[...内容过长, 已截断 (${raw.length - MAX_RAW_FOR_AGENT} 字符省略)]`;
  }

  return { format, raw: agentRaw, preview, structured };
}
