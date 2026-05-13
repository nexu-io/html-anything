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
};

function buildDraftPrompt(args: { instruction: string; context: string }): string {
  const ctx = args.context.trim();
  return `你正在为用户起草一段 **markdown** 内容（不是 HTML，不是 JSON，不是代码）。

【硬性规则】
1. 只输出 markdown 正文，不要任何前后解释、不要 \`\`\`md 围栏、不要"以下是…"开头。
2. 第一个字符就是正文。最后一个字符是正文末尾。
3. 不要捏造数据、不要凭空添加引用链接。
4. 标题、列表、强调、引用、代码块按 markdown 语法书写。
5. 如果用户没有指定语言，使用与"已有内容"一致的语言；都没有就用中文。
6. 长度控制：除非用户明确要求长文，控制在 300 字以内。

【用户当前编辑器里的内容（可能为空）】
${ctx ? ctx : "（空）"}

【用户的需求】
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
  const { agent, instruction, context = "", model } = body;
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
