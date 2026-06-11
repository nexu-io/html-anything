import { NextRequest } from "next/server";
import { invokeAgent } from "@/lib/agents/invoke";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  agent: string;
  /** User's natural-language request, e.g. "write a tweet about X". */
  instruction: string;
  /** Existing markdown in the editor — given as context so the agent can
   *  continue the user's voice instead of writing in isolation. */
  context?: string;
  model?: string;
  /** Optional absolute path to the agent binary; see /api/convert. */
  binOverride?: string;
};

function buildDraftPrompt(args: { instruction: string; context: string }): string {
  const ctx = args.context.trim();
  return `You are drafting **markdown** content for the user (not HTML, not JSON, not code).

[Hard Rules]
1. Output only the markdown body — no preamble, no \`\`\`md fences, no "Here is…" opening.
2. The first character is the body text. The last character is the end of the body.
3. Do not fabricate data or invent reference links.
4. Use proper markdown syntax for headings, lists, emphasis, blockquotes, and code blocks.
5. If the user does not specify a language, match the language of the "existing content"; if both are empty, use English.
6. Length: unless the user explicitly requests a long piece, keep it under 300 words.

[Current content in the user's editor (may be empty)]
${ctx ? ctx : "(empty)"}

[User's request]
${args.instruction}
`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const { agent, instruction, context = "", model, binOverride } = body;
  if (!agent || !instruction?.trim()) {
    return new Response("missing required fields: agent, instruction", {
      status: 400,
    });
  }

  const prompt = buildDraftPrompt({ instruction, context });

  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });

  const stream = invokeAgent({
    agent,
    prompt,
    model,
    binOverride,
    signal: abortCtl.signal,
  });

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
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          send(value.type, value);
        }
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        outClosed = true;
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      abortCtl.abort();
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
