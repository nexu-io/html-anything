import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolveAgentBin, resolveOpenclawAgentId, AGENTS } from "./detect";
import {
  buildArgv,
  envFor,
  makeParser,
  UnsupportedAgentProtocolError,
  type AgentParse,
} from "./argv";

export type InvokeOpts = {
  agent: string;
  prompt: string;
  cwd?: string;
  model?: string;
  signal?: AbortSignal;
};

export type InvokeEvent =
  | { type: "start"; bin: string; argv: string[]; promptBytes: number }
  | { type: "delta"; text: string }
  /**
   * Canonical HTML rescued from a file-write tool call. The client REPLACES
   * the task's accumulated html with this payload (not appends) — see
   * [[rescueHtmlFromToolUse]] in argv.ts for why this exists.
   */
  | { type: "html"; text: string }
  | { type: "meta"; key: string; value: unknown }
  | { type: "stderr"; text: string }
  | { type: "raw"; text: string }
  | { type: "done"; code: number | null }
  | { type: "error"; message: string };

export function invokeAgent(opts: InvokeOpts): ReadableStream<InvokeEvent> {
  const def = AGENTS.find((a) => a.id === opts.agent);
  if (!def) {
    return errorStream(`unknown agent: ${opts.agent}`);
  }
  const adapter = def.adapter ?? def.id;
  const resolved = resolveAgentBin(def);
  if (!resolved) {
    return errorStream(
      `${def.label} (\`${def.bin}\`) is not installed or not on PATH.`,
    );
  }
  const bin = resolved.path;

  // For openclaw we need an async detection step (resolveOpenclawAgentId)
  // before buildArgv. Do all of the argv assembly inside the stream's async
  // start so we can `await` and surface failures as `error` events.
  const env = envFor(adapter, def.id);
  const promptViaArgv = def.protocol === "argv";
  const promptViaMessageFlag = def.protocol === "argv-message";

  return new ReadableStream<InvokeEvent>({
    async start(controller) {
      let closed = false;
      let child: ChildProcessWithoutNullStreams | null = null;
      let hasContent = false;
      let lastUnparsedLine = "";
      let firstContentTimer: ReturnType<typeof setTimeout> | null = null;

      const safeEnqueue = (ev: InvokeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(ev);
        } catch {
          closed = true;
        }
      };
      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (firstContentTimer) clearTimeout(firstContentTimer);
        try {
          controller.close();
        } catch {}
      };
      const emitParsed = (part: AgentParse, rawLine?: string) => {
        if (part.kind === "delta") {
          hasContent = true;
          safeEnqueue({ type: "delta", text: part.text });
        } else if (part.kind === "html") {
          hasContent = true;
          safeEnqueue({ type: "html", text: part.text });
        } else if (part.kind === "meta") {
          safeEnqueue({ type: "meta", key: part.key, value: part.value });
        } else if (part.kind === "error") {
          safeEnqueue({ type: "error", message: part.message });
        } else if (rawLine) {
          lastUnparsedLine = rawLine;
          safeEnqueue({ type: "raw", text: rawLine.slice(0, 240) });
        }
      };

      // Resolve agent-specific argv. For openclaw we first probe `agents
      // list` to learn the actual agent id (commonly "main") so the CLI's
      // required `--agent <id>` is satisfied.
      let argv: string[];
      try {
        const argvOpts: Parameters<typeof buildArgv>[1] = {
          model: opts.model,
          prompt: opts.prompt,
        };
        if (adapter === "openclaw") {
          argvOpts.openclawAgentId = await resolveOpenclawAgentId(bin);
        }
        argv = buildArgv(adapter, argvOpts);
      } catch (err) {
        safeEnqueue({
          type: "error",
          message:
            err instanceof UnsupportedAgentProtocolError
              ? err.message
              : err instanceof Error
                ? err.message
                : String(err),
        });
        safeClose();
        return;
      }
      // `protocol: "argv"` adapters (deepseek today) take the prompt as a
      // trailing positional arg rather than reading from stdin.
      if (promptViaArgv) argv = [...argv, opts.prompt];
      // `protocol: "argv-message"` (openclaw today) wants the prompt under
      // an explicit `--message <text>` flag.
      if (promptViaMessageFlag) argv = [...argv, "--message", opts.prompt];

      try {
        child = spawn(bin, argv, {
          cwd: opts.cwd ?? process.cwd(),
          env,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err) {
        safeEnqueue({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
        safeClose();
        return;
      }

      safeEnqueue({
        type: "start",
        bin,
        argv,
        promptBytes: Buffer.byteLength(opts.prompt, "utf8"),
      });
      firstContentTimer = setTimeout(() => {
        if (closed || hasContent) return;
        safeEnqueue({
          type: "error",
          message:
            "No HTML/text was produced after 10 minutes. The selected agent is probably stuck, offline, or waiting for login.",
        });
        try {
          child?.kill("SIGTERM");
        } catch {}
      }, 600_000);

      child.stdin.on("error", () => {});
      try {
        // stdin-protocol agents read the prompt from stdin; argv / argv-message
        // agents already have it on the command line.
        if (!promptViaArgv && !promptViaMessageFlag) child.stdin.write(opts.prompt);
        child.stdin.end();
      } catch {}

      // One parser per spawn so cross-line dedupe state (sawStreamEventText)
      // is scoped to this single invocation and doesn't leak across runs.
      const parse = makeParser(adapter);

      let stdoutBuf = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        if (closed) return;
        stdoutBuf += chunk;
        // OpenClaw emits one big multi-line JSON document — accumulate and
        // parse it once on close instead of trying to parse each line.
        if (adapter === "openclaw") return;
        let nl: number;
        while ((nl = stdoutBuf.indexOf("\n")) !== -1) {
          const line = stdoutBuf.slice(0, nl);
          stdoutBuf = stdoutBuf.slice(nl + 1);
          if (!line) continue;
          for (const part of parse(line)) {
            emitParsed(part, line);
          }
        }
      });

      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk: string) => {
        const text = normalizeStderr(chunk);
        if (text) safeEnqueue({ type: "stderr", text });
      });

      child.on("error", (err) => {
        safeEnqueue({ type: "error", message: err.message });
        safeClose();
      });

      child.on("close", (code) => {
        if (adapter === "openclaw") {
          // OpenClaw's `agent --local --json` emits one pretty-printed JSON
          // document on stdout. The visible reply is at
          // `data.finalAssistantVisibleText`; usage / model show up in
          // `data.executionTrace`. Emit the visible text as a single delta.
          if (stdoutBuf.trim()) {
            try {
              const obj = JSON.parse(stdoutBuf) as {
                payloads?: Array<{ text?: string }>;
                meta?: {
                  finalAssistantVisibleText?: string;
                  finalAssistantRawText?: string;
                  executionTrace?: { winnerProvider?: string; winnerModel?: string };
                  completion?: { stopReason?: string };
                  agentMeta?: { sessionId?: string };
                };
              };
              const text = obj?.meta?.finalAssistantVisibleText
                ?? obj?.meta?.finalAssistantRawText
                ?? obj?.payloads?.[0]?.text
                ?? "";
              if (text) safeEnqueue({ type: "delta", text });
              const trace = obj?.meta?.executionTrace;
              if (trace?.winnerModel) {
                safeEnqueue({
                  type: "meta",
                  key: "model",
                  value: trace.winnerProvider
                    ? `${trace.winnerProvider}/${trace.winnerModel}`
                    : trace.winnerModel,
                });
              }
              if (obj?.meta?.agentMeta?.sessionId) {
                safeEnqueue({ type: "meta", key: "session", value: obj.meta.agentMeta.sessionId });
              }
              if (obj?.meta?.completion?.stopReason) {
                safeEnqueue({ type: "meta", key: "result", value: obj.meta.completion.stopReason });
              }
              if (!text) {
                safeEnqueue({
                  type: "error",
                  message: "OpenClaw returned an empty assistant message",
                });
              }
            } catch (err) {
              safeEnqueue({
                type: "error",
                message: `OpenClaw JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
              });
            }
          }
        } else if (stdoutBuf) {
          for (const part of parse(stdoutBuf)) {
            emitParsed(part);
          }
          if (adapter === "aider" || adapter === "deepseek") {
            hasContent = true;
            safeEnqueue({ type: "delta", text: stdoutBuf });
          }
        }
        if (!hasContent) {
          const hint = summarizeJsonLine(lastUnparsedLine || stdoutBuf);
          safeEnqueue({
            type: "error",
            message: `Agent exited without producing HTML/text (exit=${code ?? "?"}).${hint ? ` Last event: ${hint}` : ""}`,
          });
        }
        safeEnqueue({ type: "done", code });
        safeClose();
      });

      const onAbort = () => {
        try {
          child?.kill("SIGTERM");
        } catch {}
        safeClose();
      };
      opts.signal?.addEventListener("abort", onAbort, { once: true });
    },
    cancel() {},
  });
}

function summarizeJsonLine(line: string): string {
  if (!line.trim()) return "";
  try {
    const obj = JSON.parse(line) as Record<string, unknown>;
    const item = obj.item && typeof obj.item === "object" ? (obj.item as Record<string, unknown>) : null;
    const keys = item ? Object.keys(item).slice(0, 10).join(",") : Object.keys(obj).slice(0, 10).join(",");
    const itemType = item ? String(item.type ?? item.item_type ?? "") : "";
    return [String(obj.type ?? "unknown"), itemType, keys].filter(Boolean).join(" / ");
  } catch {
    return line.slice(0, 180);
  }
}

function normalizeStderr(text: string): string {
  const benignCodexNoise = [
    "Reading prompt from stdin",
    "ignoring interface.defaultPrompt",
    "ignoring interface.icon_small",
    "ignoring interface.icon_large",
    "configured curated plugin no longer exists",
    "failed to warm featured plugin ids cache",
    "git sync failed for curated plugin sync",
    "state db discrepancy during find_thread_path_by_id_str_in_subdir",
    "failed to send events request",
    "Failed to delete shell snapshot",
  ];
  if (benignCodexNoise.some((needle) => text.includes(needle))) {
    return "";
  }
  const max = 2000;
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... stderr truncated (${text.length.toLocaleString()} chars)\n`;
}

function errorStream(message: string): ReadableStream<InvokeEvent> {
  return new ReadableStream<InvokeEvent>({
    start(controller) {
      controller.enqueue({ type: "error", message });
      controller.close();
    },
  });
}
