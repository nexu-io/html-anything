export type AgentArgvOpts = {
  model?: string;
  cwd?: string;
  /** When the adapter takes the prompt as a positional argv (deepseek). */
  prompt?: string;
};

export class UnsupportedAgentProtocolError extends Error {
  constructor(public readonly agent: string, public readonly protocol: string) {
    super(
      `${agent} uses the ${protocol} protocol, which is not yet wired up in this build. ` +
        `Pick one of: claude / codex / cursor-agent / gemini / copilot / opencode / qwen / qoder / deepseek / aider.`,
    );
  }
}

export function buildArgv(agent: string, _opts: AgentArgvOpts = {}): string[] {
  const { model } = _opts;
  switch (agent) {
    case "claude":
      return [
        "-p",
        "--output-format",
        "stream-json",
        "--verbose",
        "--include-partial-messages",
        "--permission-mode",
        "bypassPermissions",
        ...(model ? ["--model", model] : []),
      ];
    case "codex":
      return [
        "exec",
        "--json",
        "--skip-git-repo-check",
        "--sandbox",
        "workspace-write",
        "-c",
        "sandbox_workspace_write.network_access=true",
        ...(model ? ["--model", model] : []),
      ];
    case "cursor-agent":
      return [
        "--print",
        "--output-format",
        "stream-json",
        "--stream-partial-output",
        "--force",
        "--trust",
        ...(model ? ["--model", model] : []),
      ];
    case "gemini":
      return [
        "--output-format",
        "stream-json",
        "--yolo",
        ...(model ? ["--model", model] : []),
      ];
    case "copilot":
      return [
        "--allow-all-tools",
        "--output-format",
        "json",
        ...(model ? ["--model", model] : []),
      ];
    case "opencode":
      return [
        "run",
        "--format",
        "json",
        "--dangerously-skip-permissions",
        ...(model ? ["--model", model] : []),
        "-",
      ];
    case "qwen":
      return ["--yolo", ...(model ? ["--model", model] : []), "-"];
    case "aider":
      return [
        "--no-pretty",
        "--no-stream",
        "--yes-always",
        "--message-file",
        "-",
        ...(model ? ["--model", model] : []),
      ];
    case "qoder":
      // Qoder CLI mirrors `claude -p`'s shape: print mode + stream-json + yolo
      // for non-interactive approval. Prompt arrives via stdin (handled in
      // invoke.ts). See open-design's apps/daemon/src/agents.ts.
      return [
        "-p",
        "--output-format",
        "stream-json",
        "--yolo",
        ...(model ? ["--model", model] : []),
      ];
    case "deepseek":
      // DeepSeek's `exec --auto` requires the prompt as a positional arg;
      // there's no `-` stdin sentinel. invoke.ts appends opts.prompt at
      // spawn time, so we leave the trailing slot empty here.
      return ["exec", "--auto", ...(model ? ["--model", model] : [])];
    case "hermes":
    case "kimi":
    case "devin":
    case "kiro":
    case "kilo":
    case "vibe":
      throw new UnsupportedAgentProtocolError(agent, "ACP JSON-RPC");
    case "pi":
      throw new UnsupportedAgentProtocolError(agent, "pi-rpc");
    default:
      throw new Error(`unknown agent: ${agent}`);
  }
}

export function envFor(agent: string): NodeJS.ProcessEnv {
  const base = { ...process.env };
  if (agent === "gemini") base.GEMINI_CLI_TRUST_WORKSPACE = "true";
  return base;
}

export type AgentParse =
  | { kind: "delta"; text: string }
  | { kind: "meta"; key: string; value: unknown }
  | { kind: "noise" };

/**
 * Cross-line state that the parser carries between calls. Currently used to
 * dedupe text deltas: when an agent emits both fine-grained `stream_event`
 * `text_delta` blocks AND a final `assistant` message containing the same
 * text concatenated, we keep the streamed tokens and skip the assistant
 * message body. Without this dedupe, every Claude/Cursor/Gemini/Qoder run
 * with `--include-partial-messages` (or the equivalent) writes its output
 * twice.
 */
export type ParseState = { sawStreamEventText?: boolean };

/**
 * Build a stateful per-invocation parser. Feed every stdout line through the
 * returned function — it carries the cross-line state needed for dedupe.
 */
export function makeParser(agent: string): (line: string) => AgentParse[] {
  const state: ParseState = {};
  return (line: string) => parseLineWithState(agent, line, state);
}

/**
 * Parse a single line of agent stdout. Stateless wrapper kept for callers
 * that only need one-shot parsing (e.g. `extractTextFromLine`). Streaming
 * callers should use `makeParser` so dedupe state survives across lines.
 */
export function parseLine(agent: string, line: string): AgentParse[] {
  return parseLineWithState(agent, line, {});
}

function parseLineWithState(agent: string, line: string, state: ParseState): AgentParse[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // Aider / DeepSeek — plain text streaming on stdout (DeepSeek tool calls
  // go to stderr, which is forwarded as `stderr` events, not parsed here).
  if (agent === "aider" || agent === "deepseek") {
    return [{ kind: "delta", text: trimmed.endsWith("\n") ? trimmed : trimmed + "\n" }];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [{ kind: "noise" }];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const obj = parsed as Record<string, unknown>;
  const out: AgentParse[] = [];

  if (agent === "claude") {
    // Init / system metadata
    if (obj.type === "system" && obj.subtype === "init") {
      out.push({ kind: "meta", key: "model", value: obj.model });
      out.push({ kind: "meta", key: "session", value: obj.session_id });
      if (obj.cwd) out.push({ kind: "meta", key: "cwd", value: obj.cwd });
    }
    // Stream events (--include-partial-messages → fine-grained text_delta)
    if (obj.type === "stream_event" && obj.event && typeof obj.event === "object") {
      const ev = obj.event as { type?: string; delta?: { type?: string; text?: string; thinking?: string } };
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && typeof ev.delta.text === "string") {
        state.sawStreamEventText = true;
        out.push({ kind: "delta", text: ev.delta.text });
      } else if (ev.type === "content_block_delta" && ev.delta?.type === "thinking_delta") {
        out.push({ kind: "meta", key: "thinking", value: ev.delta.thinking });
      }
    }
    // Full assistant messages — fallback only when stream_event text deltas
    // were absent (e.g. older claude without --include-partial-messages).
    if (obj.type === "assistant" && obj.message && typeof obj.message === "object") {
      const msg = obj.message as {
        content?: Array<{ type?: string; text?: string }>;
        usage?: Record<string, number>;
        model?: string;
      };
      if (!state.sawStreamEventText) {
        const text = (msg.content ?? [])
          .filter((c) => c?.type === "text" && typeof c.text === "string")
          .map((c) => c.text!)
          .join("");
        if (text) out.push({ kind: "delta", text });
      }
      if (msg.usage) out.push({ kind: "meta", key: "usage_partial", value: msg.usage });
    }
    if (obj.type === "result") {
      if (obj.usage) out.push({ kind: "meta", key: "usage", value: obj.usage });
      if (typeof obj.duration_ms === "number") out.push({ kind: "meta", key: "duration_ms", value: obj.duration_ms });
      if (typeof obj.total_cost_usd === "number") out.push({ kind: "meta", key: "cost_usd", value: obj.total_cost_usd });
      if (typeof obj.subtype === "string") out.push({ kind: "meta", key: "result", value: obj.subtype });
    }
    if (obj.type === "rate_limit_event" && obj.rate_limit_info) {
      out.push({ kind: "meta", key: "rate_limit", value: obj.rate_limit_info });
    }
  }

  if (agent === "codex") {
    if (obj.type === "item.completed" && obj.item && typeof obj.item === "object") {
      const item = obj.item as { item_type?: string; text?: string };
      if (item.item_type === "assistant_message" && typeof item.text === "string") {
        out.push({ kind: "delta", text: item.text });
      }
    }
    if (obj.type === "item.delta" && typeof obj.text === "string") {
      out.push({ kind: "delta", text: obj.text });
    }
    if (obj.msg && typeof obj.msg === "object") {
      const msg = obj.msg as { type?: string; message?: string };
      if (msg.type === "agent_message" && typeof msg.message === "string") {
        out.push({ kind: "delta", text: msg.message });
      }
    }
    if (obj.type === "task_complete" && obj.usage) {
      out.push({ kind: "meta", key: "usage", value: obj.usage });
    }
  }

  if (agent === "cursor-agent" || agent === "gemini") {
    if (obj.type === "stream_event" && obj.event && typeof obj.event === "object") {
      const ev = obj.event as { type?: string; delta?: { type?: string; text?: string } };
      if (ev.delta?.type === "text_delta" && typeof ev.delta.text === "string") {
        state.sawStreamEventText = true;
        out.push({ kind: "delta", text: ev.delta.text });
      }
    }
    if (obj.type === "assistant" && obj.message && typeof obj.message === "object" && !state.sawStreamEventText) {
      const msg = obj.message as { content?: Array<{ type?: string; text?: string }> };
      const text = (msg.content ?? [])
        .filter((c) => c?.type === "text" && typeof c.text === "string")
        .map((c) => c.text!)
        .join("");
      if (text) out.push({ kind: "delta", text });
    }
    // Bare `text` field — only honor it when we haven't already emitted a
    // streamed delta or an assistant body, otherwise it duplicates the same
    // payload (cursor-agent / gemini both ship this redundancy on some
    // versions).
    if (typeof obj.text === "string" && !state.sawStreamEventText && obj.type !== "assistant") {
      out.push({ kind: "delta", text: obj.text as string });
    }
  }

  if (agent === "copilot") {
    if (typeof obj.response === "string") out.push({ kind: "delta", text: obj.response });
    if (typeof obj.text === "string") out.push({ kind: "delta", text: obj.text });
  }

  if (agent === "opencode" || agent === "qwen") {
    if (typeof obj.text === "string") out.push({ kind: "delta", text: obj.text });
    if (typeof obj.content === "string") out.push({ kind: "delta", text: obj.content });
    if (typeof obj.message === "string") out.push({ kind: "delta", text: obj.message });
  }

  if (agent === "qoder") {
    // Qoder's stream-json output mirrors claude's envelope shape (init/system,
    // stream_event with content_block_delta/text_delta, assistant message,
    // result with usage). Parse generously across both fine-grained deltas and
    // full assistant turns. Falls back to a bare `text` field for
    // forward-compatibility with future Qoder JSON variants.
    if (obj.type === "system" && obj.subtype === "init") {
      if (obj.model) out.push({ kind: "meta", key: "model", value: obj.model });
      if (obj.session_id) out.push({ kind: "meta", key: "session", value: obj.session_id });
    }
    if (obj.type === "stream_event" && obj.event && typeof obj.event === "object") {
      const ev = obj.event as { type?: string; delta?: { type?: string; text?: string } };
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && typeof ev.delta.text === "string") {
        state.sawStreamEventText = true;
        out.push({ kind: "delta", text: ev.delta.text });
      }
    }
    if (obj.type === "assistant" && obj.message && typeof obj.message === "object" && !state.sawStreamEventText) {
      const msg = obj.message as { content?: Array<{ type?: string; text?: string }> };
      const text = (msg.content ?? [])
        .filter((c) => c?.type === "text" && typeof c.text === "string")
        .map((c) => c.text!)
        .join("");
      if (text) out.push({ kind: "delta", text });
    }
    if (obj.type === "result") {
      if (obj.usage) out.push({ kind: "meta", key: "usage", value: obj.usage });
      if (typeof obj.duration_ms === "number") out.push({ kind: "meta", key: "duration_ms", value: obj.duration_ms });
    }
    if (typeof obj.text === "string" && !state.sawStreamEventText && obj.type !== "assistant") {
      out.push({ kind: "delta", text: obj.text });
    }
  }

  return out;
}

/** Back-compat shim for callers that just want plain text. */
export function extractTextFromLine(agent: string, line: string): string {
  return parseLine(agent, line)
    .filter((p): p is Extract<AgentParse, { kind: "delta" }> => p.kind === "delta")
    .map((p) => p.text)
    .join("");
}
