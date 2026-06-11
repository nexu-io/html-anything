import { NextRequest } from "next/server";
import { invokeAgent } from "@/lib/agents/invoke";
import { loadSkill } from "@/lib/templates/loader";
import { assemblePrompt } from "@/lib/templates/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  agent: string;
  templateId: string;
  content: string;
  format?: string;
  model?: string;
  cwd?: string;
  /**
   * Optional absolute path to the agent binary. The Settings UI lets the
   * user override auto-detection when their CLI lives somewhere our PATH
   * scan doesn't cover (Scoop on Windows, custom installs, etc.).
   */
  binOverride?: string;
  /** When the task already has a generated HTML, the client sends both the
   *  prior HTML and the prior content. The agent is then asked for a
   *  minimal-diff edit (preserve design, only change what the content diff
   *  implies). Saves output tokens AND prevents creative drift between runs. */
  editFromHtml?: string;
  editFromContent?: string;
};

function buildEditPrompt(args: {
  templateName: string;
  templateAspect: string;
  newContent: string;
  oldContent: string;
  oldHtml: string;
  format: string;
}): string {
  return `You are performing a **minimal diff-edit**, not regenerating from scratch.

Template style: ${args.templateName} (${args.templateAspect})
Input format: ${args.format}

[Hard Rules]
1. Output only the complete, modified HTML. The first character must be \`<\`, the last must be \`</html>\`.
2. **Do NOT** wrap in markdown fences, no explanatory text.
3. **Do NOT use Write / Edit / MultiEdit / Bash or any file tools** — the HTML must be streamed directly in the assistant reply body; do not save to an \`.html\` file.
4. Preserve the original HTML's \`<head>\` (CDN / fonts / styles / meta), preserve all DOM structure that does not need changes — fonts, palette, layout, grid, component structure, and animations must not be altered.
5. Only replace or adjust the text / data nodes that differ between "old content vs new content".
6. If new content adds items, follow the existing card / row / slide / section structure to add them; if items are removed, remove the corresponding elements.
7. If old and new content differ by only a few characters, change only those characters — do not "optimize" or "rearrange" anything else.
8. Do not fabricate data. If it is not in the new content, do not write it.

[Old Content]
${args.oldContent}

[New Content]
${args.newContent}

[Existing HTML — modify this and output the complete modified version]
${args.oldHtml}
`;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("invalid JSON body", { status: 400 });
  }
  const {
    agent,
    templateId,
    content,
    format = "text",
    model,
    cwd,
    binOverride,
    editFromHtml,
    editFromContent,
  } = body;
  if (!agent || !templateId || !content) {
    return new Response("missing required fields: agent, templateId, content", {
      status: 400,
    });
  }
  const skill = loadSkill(templateId);
  if (!skill) {
    return new Response(`unknown template: ${templateId}`, { status: 400 });
  }

  let prompt: string;
  if (editFromHtml && editFromContent) {
    prompt = buildEditPrompt({
      templateName: skill.zhName,
      templateAspect: skill.aspectHint,
      newContent: content,
      oldContent: editFromContent,
      oldHtml: editFromHtml,
      format,
    });
  } else {
    prompt = assemblePrompt({ body: skill.body, content, format });
  }
  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });

  const stream = invokeAgent({
    agent,
    prompt,
    model,
    cwd,
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
