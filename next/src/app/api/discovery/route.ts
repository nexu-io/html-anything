/**
 * POST /api/discovery — design advisor (Phase 5)
 *
 * Slimmed-down equivalent of open-design's discovery question-form (Turn 1).
 * Instead of an interactive multi-turn Q&A UI, we do it in one lightweight
 * round: the server sends the user's content + available design-system
 * catalogue to the agent, and the agent answers with a structured
 * recommendation — which 1-3 DESIGN.md systems + 5-direction option best
 * match the brief, and why.
 *
 * The SSE stream returns:
 *   - delta events (agent thinking / reasoning)
 *   - a `verdict` event with a structured { top, reasoning } payload
 *
 * The caller can render the recommendation in the picker or auto-apply the
 * top choice.
 */

import { NextRequest } from "next/server";
import { invokeAgent } from "@/lib/agents/invoke";
import { listDesignSystemIds } from "@/lib/design-systems/loader";
import { DESIGN_DIRECTIONS, type DesignDirection } from "@/lib/design-systems/directions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiscoveryReq = {
  agent: string;
  content: string;
  model?: string;
  binOverride?: string;
};

type DiscoveryRecommendation = {
  category: string;
  id: string;
  name: string;
  why: string;
};

export type DiscoveryVerdict = {
  recommendations: DiscoveryRecommendation[];
  /** Raw reasoning from the agent. */
  reasoning: string;
};

function buildDiscoveryPrompt(content: string): string {
  // Catalogue of available design systems for the agent to pick from.
  const systemIds = listDesignSystemIds();
  const systemList = systemIds.slice(0, 60).map((id) => `  - ${id}`).join("\n");
  const directionList = DESIGN_DIRECTIONS.map((d) => `  - ${d.id}: ${d.label}`).join("\n");

  return `你是一个设计顾问。用户给了以下内容，需要你帮你推荐最匹配的设计系统（DESIGN.md）或视觉方向（design direction）。

首先阅读用户内容，分析它的类型（文章/PPT/产品原型/数据报告/落地页/社交媒体…）、受众（C端/B端/开发者/投资人/学术…）、情感基调（专业/温暖/极简/大胆/技术感…）。

然后从以下可用选项中推荐 **1-3 个最匹配的选项**，每个推荐说明**为什么**它适合这个内容。一个推荐可以是 DESIGN.md 系统（来自下方 catalogue）或设计方向 direction（来自 5-direction library）。

严格按以下格式输出（每行一个字段，不要任何额外文字）：

TYPE: <内容类型>
AUDIENCE: <目标受众>
MOOD: <情感基调，用英文形容词>

RECOMMENDATIONS:
- category:DESIGN_SYSTEM id:linear-app name:Design System Inspired by Linear why:适合极简技术产品展示
- category:DIRECTION id:modern-minimal name:Modern minimal — Linear / Vercel why:安静精确的软件原生美学
- …

可用 DESIGN.md 系统（部分）:
${systemList}

可用 5-direction 视觉方向:
${directionList}

【用户内容】:
${content}`;
}

function parseDiscoveryVerdict(text: string): DiscoveryVerdict {
  const recommendations: DiscoveryRecommendation[] = [];
  const lines = text.split("\n");

  let inRecs = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^recommendations:/i.test(trimmed)) {
      inRecs = true;
      continue;
    }
    if (!inRecs) continue;
    if (!trimmed.startsWith("-")) break;

    const m =
      /category:\s*(DESIGN_SYSTEM|DIRECTION)\s+id:(\S+)\s+name:(.+?)\s+why:(.+)/i.exec(
        trimmed.slice(1).trim(),
      );
    if (m) {
      recommendations.push({
        category: m[1] === "DIRECTION" ? "direction" : "design_system",
        id: m[2],
        name: m[3].trim(),
        why: m[4].trim(),
      });
    }
  }

  return {
    recommendations: recommendations.slice(0, 3),
    reasoning: text.slice(0, 2000),
  };
}

export async function POST(req: NextRequest) {
  let body: DiscoveryReq;
  try {
    body = (await req.json()) as DiscoveryReq;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const { agent, content, model, binOverride } = body;
  if (!agent || !content) {
    return new Response("missing required fields: agent, content", { status: 400 });
  }

  const prompt = buildDiscoveryPrompt(content);

  if (Buffer.byteLength(prompt, "utf8") > 128 * 1024) {
    // Discovery prompt is tiny; this is a sanity cap.
    return new Response("content too large for discovery", { status: 413 });
  }

  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });
  const watchdog = setTimeout(() => abortCtl.abort(), 2 * 60 * 1000); // 2 min

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
    if (!released) released = true;
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
            const text = (value as { text?: string }).text;
            if (text) {
              chunks.push(text);
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
        const text = chunks.join("");
        const verdict = parseDiscoveryVerdict(text);
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
