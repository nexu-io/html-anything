import { NextRequest } from "next/server";
import { invokeAgent } from "@/lib/agents/invoke";
import { loadSkill } from "@/lib/templates/loader";
import { assemblePrompt } from "@/lib/templates/shared";
import {
  tryAcquireSpawnSlot,
  releaseSpawnSlot,
  MAX_BODY_BYTES,
  MAX_PROMPT_BYTES,
  SPAWN_TIMEOUT_MS,
} from "@/lib/agents/spawn-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  agent: string;
  templateId: string;
  content: string;
  format?: string;
  model?: string;
  /**
   * Optional design system id (from the open-design corpus). When set, the route
   * loads the DESIGN.md, builds a tokenCSS :root block + design-system-specific
   * prompt, and injects it above the shared directives and skill body.
   */
  designSystemId?: string;
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
  return `你正在执行一次**最小化差异编辑** (diff-edit), 不是从 0 重新生成。

模板风格: ${args.templateName} (${args.templateAspect})
输入格式: ${args.format}

【硬性规则】
1. 仅输出完整的、修改后的 HTML。第一个字符必须是 \`<\`, 最后必须是 \`</html>\`。
2. **不要**用 markdown 围栏包裹, 不要任何解释性文字。
3. **禁止使用 Write / Edit / MultiEdit / Bash 等文件工具** — HTML 必须直接在助手回复正文里流式输出, 不要存到 \`.html\` 文件再回复"已输出至 …"。
4. 保留原 HTML 的 \`<head>\` (CDN / 字体 / 样式 / meta), 保留所有不需要变化的 DOM 结构 — 字体、配色、布局、栅格、组件结构、动画都不许改。
5. 仅根据 "旧内容 vs 新内容" 的差异, 替换或调整对应的文字 / 数据节点。
6. 如果新内容增加了条目, 沿用原有的卡片 / 行 / slide / 章节结构添加; 如果删除了条目, 移除对应的元素。
7. 如果新旧内容只差几个字, 也只改那几个字 — 不要顺手 "优化" 或 "重排"。
8. 不要捏造数据。新内容里没有的就不要写。

【旧内容】
${args.oldContent}

【新内容】
${args.newContent}

【已有 HTML — 请基于此修改, 输出完整的修改后版本】
${args.oldHtml}
`;
}

export async function POST(req: NextRequest) {
  // Cap payload size before the body is buffered. Content-Length is advisory
  // (a client can lie), so we re-check the assembled prompt size below too.
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    return new Response("payload too large", { status: 413 });
  }

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
    designSystemId,
    binOverride,
    editFromHtml,
    editFromContent,
  } = body;
  // `cwd` is intentionally NOT read from the body. The agent CLI is spawned
  // with maximally-permissive flags (bypassPermissions / workspace-write /
  // --yolo), so letting a caller point cwd at an arbitrary directory would
  // hand the agent write access to anywhere on disk. The UI never sends cwd;
  // invokeAgent falls back to process.cwd(). If a configurable project root
  // becomes a real feature, it must go through an explicit Settings allowlist.
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
    let designSystemBlock: string | undefined;
    if (designSystemId) {
      try {
        const { loadDesignSystem } = await import("@/lib/design-systems/loader");
        const { adapt } = await import("@/lib/design-systems/adapter");
        const ds = loadDesignSystem(designSystemId);
        if (ds) designSystemBlock = adapt(ds).systemPrompt;
      } catch {
        // design-systems dir may not exist (CI / deploy without open-design).
      }
    }
    prompt = assemblePrompt({ body: skill.body, content, format, designSystemBlock });
  }
  if (Buffer.byteLength(prompt, "utf8") > MAX_PROMPT_BYTES) {
    return new Response("prompt too large", { status: 413 });
  }

  if (!tryAcquireSpawnSlot()) {
    return new Response("server busy: too many concurrent conversions", { status: 503 });
  }
  const abortCtl = new AbortController();
  req.signal?.addEventListener("abort", () => abortCtl.abort(), { once: true });
  // Hard wall-clock cap so a hung agent CLI (interactive login prompt, stalled
  // network) can't keep the SSE connection and the child resident forever.
  const watchdog = setTimeout(() => abortCtl.abort(), SPAWN_TIMEOUT_MS);
  let released = false;
  const cleanup = () => {
    clearTimeout(watchdog);
    if (!released) {
      releaseSpawnSlot();
      released = true;
    }
  };

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
