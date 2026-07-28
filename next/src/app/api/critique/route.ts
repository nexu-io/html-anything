/**
 * POST /api/critique
 *
 * After the agent produces HTML, the client sends it here for a lightweight
 * 5-dimension quality gate (adapted from open-design's Step 8 — pre-emit
 * self-critique). The route spawns the agent with a minimal prompt that asks
 * it to score the HTML on five axes and suggest fixes. Returns SSE events
 * plus a structured verdict payload.
 *
 * Dimensions (open-design discovery.ts:224-230):
 *   1. Philosophy   — does the visual posture match the brief?
 *   2. Hierarchy    — is there one clear visual entry point per screen?
 *   3. Execution    — typography, spacing, alignment, contrast — correct or close?
 *   4. Specificity  — every word / image belongs to *this* brief, not filler?
 *   5. Restraint    — one accent used at most twice, one decisive flourish?
 *
 * Any dimension < 3 is a regression. The caller can display the score + retry.
 */

import { NextRequest } from "next/server";
import { invokeAgent } from "@/lib/agents/invoke";
import { rulesBySeverity, lintHtml } from "@/lib/quality/anti-slop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CritiqueReq = {
  agent: string;
  designSystemId?: string;
  /** The generated HTML to critique. */
  html: string;
  model?: string;
  binOverride?: string;
};

const CRITIQUE_PROMPT = `你是设计评审员。请对下面这段 HTML 做 **5 维度品质评分**，每个维度 0-10 分，严格按以下格式输出（每行一个评分，不要任何额外文字）：

PHILOSOPHY: <0-10> — 视觉姿态是否符合 brief 的设计语言？还是滑回了默认极简？
HIERARCHY: <0-10> — 每屏是否有清晰的视觉入口点？还是元素在互相竞争？
EXECUTION: <0-10> — 排版、间距、对齐、对比度 —— 正确还是勉强？
SPECIFICITY: <0-10> — 每个字、每个数字是否属于这个 brief？有无 filler / lorem / 通用统计？
RESTRAINT: <0-10> — 强调色使用是否克制（≤2 处）？是否只有一处决定性 flour？

然后列举 1-3 条具体、可执行的改进建议，以 "SUGGESTIONS:" 开头。建议用中文。
`;

function buildCritiquePrompt(html: string): string {
  // Truncate HTML to prevent token blow-up — the agent only needs the visual
  // structure and a representative sample, not the entire document.
  const sample = html.length > 48_000 ? html.slice(0, 48_000) : html;
  return `${CRITIQUE_PROMPT}

待评审 HTML:
${sample}`;
}

export type CritiqueVerdict = {
  scores: Record<string, number>;
  total: number;
  pass: boolean;
  suggestions: string[];
  /** P0 anti-slop violations found via regex lint. */
  slopViolations: Array<{ rule: string; match: string }>;
  /** Whether every single dimension scored ≥ 3. */
  allDimensionsPass: boolean;
};

export async function POST(req: NextRequest) {
  let body: CritiqueReq;
  try {
    body = (await req.json()) as CritiqueReq;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const { agent, html, model, binOverride } = body;
  if (!agent || !html) {
    return new Response("missing required fields: agent, html", { status: 400 });
  }

  // Cap critique prompt input at 50KB so we don't spam the agent.
  const prompt = buildCritiquePrompt(html);

  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });
  // Give the critique 3 minutes — it's a short read-only task.
  const watchdog = setTimeout(() => abortCtl.abort(), 3 * 60 * 1000);

  const stream = invokeAgent({
    agent,
    prompt,
    model,
    binOverride,
    signal: abortCtl.signal,
  });

  let released = false;
  const cleanup = () => {
    clearTimeout(watchdog);
    if (!released) {
      released = true;
    }
  };

  const sse = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let outClosed = false;
      const send = (event: string, data: unknown) => {
        if (outClosed) return;
        try {
          controller.enqueue(
            enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          outClosed = true;
        }
      };

      const reader = stream.getReader();
      const chunks: string[] = [];
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          if (value.type === "delta") {
            if (typeof (value as { text?: string }).text === "string") {
              chunks.push((value as { text: string }).text);
              send("delta", value);
            }
          } else if (value.type === "error") {
            send("error", value);
          } else {
            send(value.type, value);
          }
        }
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        // Parse the accumulated text into a structured verdict.
        const text = chunks.join("");
        const verdict = parseVerdict(text, html);
        send("verdict", verdict);
        outClosed = true;
        cleanup();
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      abortCtl.abort();
      cleanup();
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function parseVerdict(text: string, html: string): CritiqueVerdict {
  const scores: Record<string, number> = {};
  const dims = ["PHILOSOPHY", "HIERARCHY", "EXECUTION", "SPECIFICITY", "RESTRAINT"];
  for (const dim of dims) {
    const re = new RegExp(`${dim}:\\s*(\\d+(?:\\.\\d+)?)`, "i");
    const m = re.exec(text);
    scores[dim.toLowerCase()] = m ? Math.min(10, Math.max(0, parseFloat(m[1]))) : 5;
  }

  const values = Object.values(scores);
  const total = values.reduce((a, b) => a + b, 0);
  const allDimensionsPass = values.every((v) => v >= 3);

  // Extract suggestions (lines after "SUGGESTIONS:").
  const sugIdx = text.toUpperCase().indexOf("SUGGESTIONS");
  const sugText = sugIdx !== -1 ? text.slice(sugIdx).replace(/^SUGGESTIONS:?\s*/i, "") : "";
  const suggestions = sugText
    .split(/\n-|\n\d+\.\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Anti-slop lint (P0 rules only).
  const p0Rules = rulesBySeverity("P0");
  const slopViolations = lintHtml(html).filter((f) => f.rule.severity === "P0");

  return {
    scores,
    total,
    pass: allDimensionsPass,
    allDimensionsPass,
    suggestions: suggestions.slice(0, 4),
    slopViolations: slopViolations.map((f) => ({
      rule: f.rule.title,
      match: f.match.slice(0, 80),
    })),
  };
}
