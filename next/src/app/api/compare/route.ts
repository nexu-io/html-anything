/**
 * POST /api/compare — multi-template compare (open-design's "5 direction"
 * parallel-candidate generator).
 *
 * Accepts up to `n` design directions (or defaults to the 5-direction library)
 * and spawns each as a parallel agent. The SSE stream returns per-direction
 * delta events tagged with a `direction` key so the client can slot each
 * candidate into its own panel.
 *
 * The stream fires a `ready` event per direction when that candidate's HTML
 * has been fully received, plus a top-level `done` when all candidates are
 * settled.
 */

import { NextRequest } from "next/server";
import { invokeAgent, type InvokeEvent } from "@/lib/agents/invoke";
import {
  tryAcquireSpawnSlots,
  releaseSpawnSlots,
  MAX_BODY_BYTES,
  MAX_PROMPT_BYTES,
  SPAWN_TIMEOUT_MS,
} from "@/lib/agents/spawn-guards";
import {
  DESIGN_DIRECTIONS,
  directionPrompt,
  type DesignDirection,
} from "@/lib/design-systems/directions";
import { loadSkill } from "@/lib/templates/loader";
import { SHARED_DESIGN_DIRECTIVES } from "@/lib/templates/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompareReq = {
  agent: string;
  templateId: string;
  content: string;
  format?: string;
  model?: string;
  binOverride?: string;
  /** Number of candidates to generate. Defaults to 3. */
  n?: number;
  /** Specific direction ids to use. Defaults to the built-in 5. */
  directions?: string[];
};

const MAX_CANDIDATES = 5;

function buildCandidatePrompt(dir: DesignDirection, skillBody: string, content: string, format: string): string {
  return `${directionPrompt(dir)}

---
${SHARED_DESIGN_DIRECTIVES}
${skillBody.trim()}

【输入格式】: ${format}
【用户内容】:
${content}
`;
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    return new Response("payload too large", { status: 413 });
  }

  let body: CompareReq;
  try {
    body = (await req.json()) as CompareReq;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const {
    agent,
    templateId,
    content,
    format = "text",
    model,
    binOverride,
    n = 3,
    directions,
  } = body;

  if (!agent || !templateId || !content) {
    return new Response("missing required fields: agent, templateId, content", { status: 400 });
  }
  const skill = loadSkill(templateId);
  if (!skill) return new Response(`unknown template: ${templateId}`, { status: 400 });

  // Pick the direction set.
  let dirs: DesignDirection[];
  if (directions?.length) {
    dirs = directions
      .map((id) => DESIGN_DIRECTIONS.find((d) => d.id === id))
      .filter(Boolean) as DesignDirection[];
  } else {
    dirs = DESIGN_DIRECTIONS.slice(0, Math.min(n, MAX_CANDIDATES, DESIGN_DIRECTIONS.length));
  }
  if (!dirs.length) {
    return new Response("no valid directions to compare", { status: 400 });
  }

  // Build prompts.
  const prompts = dirs.map((d) =>
    buildCandidatePrompt(d, skill.body, content, format),
  );

  // Check prompt caps.
  const maxBytes = Math.max(...prompts.map((p) => Buffer.byteLength(p, "utf8")));
  if (maxBytes > MAX_PROMPT_BYTES) {
    return new Response("prompt too large", { status: 413 });
  }

  // Acquire concurrent slots.
  const granted = tryAcquireSpawnSlots(prompts.length);
  if (granted === 0) {
    return new Response("server busy: too many concurrent conversions", { status: 503 });
  }

  let released = false;
  const cleanup = () => {
    if (!released) {
      releaseSpawnSlots(granted);
      released = true;
    }
  };

  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });
  const watchdog = setTimeout(() => abortCtl.abort(), SPAWN_TIMEOUT_MS);

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

      // Process only up to `granted` — remaining candidates are silently
      // dropped when we're at capacity.
      const toSpawn = prompts.slice(0, granted);

      const results = await Promise.allSettled(
        toSpawn.map((prompt, i) =>
          consumeAgentStream(
            invokeAgent({ agent, prompt, model, binOverride, signal: abortCtl.signal }),
            (type, payload) => {
              const p = payload as Record<string, unknown>;
              send(type, { ...p, direction: dirs[i].id, candidateIdx: i });
            },
            dirs[i].id,
          ),
        ),
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      send("done", { candidatesGenerated: ok, candidatesRequested: toSpawn.length });

      outClosed = true;
      cleanup();
      clearTimeout(watchdog);
      try {
        controller.close();
      } catch {}
    },
    cancel() {
      abortCtl.abort();
      cleanup();
      clearTimeout(watchdog);
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

async function consumeAgentStream(
  stream: ReadableStream<InvokeEvent>,
  onEvent: (type: string, payload: unknown) => void,
  directionId: string,
): Promise<void> {
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
          onEvent("delta", value);
        }
      } else if (value.type === "error") {
        onEvent("error", value);
      } else {
        onEvent(value.type, value);
      }
    }
  } finally {
    const html = chunks.join("");
    const trimmed = html.trim();
    onEvent("ready", {
      direction: directionId,
      html: trimmed,
      bytes: Buffer.byteLength(trimmed, "utf8"),
    });
  }
}
