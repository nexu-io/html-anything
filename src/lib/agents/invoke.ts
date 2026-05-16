import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { resolveOnPath, resolveOpenclawAgentId, AGENTS } from "./detect";
import { buildArgv, envFor, makeParser, UnsupportedAgentProtocolError } from "./argv";
import { HtmlStreamExtractor } from "./html-stream";

export type InvokeOpts = {
  agent: string;
  prompt: string;
  cwd?: string;
  model?: string;
  output?: "text" | "html";
  signal?: AbortSignal;
  /**
   * Absolute path to the agent binary. Wins over `process.env[envOverride]`
   * and the PATH scan when set. Surfaced from the Settings UI for users
   * whose CLI lives outside the heuristic toolchain dirs.
   */
  binOverride?: string;
};

type BinResolution =
  | { kind: "ok"; bin: string }
  | { kind: "override-missing"; tried: string }
  | { kind: "not-found" };

/**
 * Resolve the binary to spawn, in priority order:
 *   1. `opts.binOverride` (user-set absolute path from Settings UI)
 *   2. `process.env[def.envOverride]` (e.g. CLAUDE_BIN, OPENCLAW_BIN)
 *   3. PATH scan over `def.bin` then `def.fallbackBins`
 *
 * If a `binOverride` is set but doesn't resolve, return `override-missing`
 * (do not silently fall through) — the user picked an explicit path and
 * deserves to see the typo / wrong path instead of mysteriously running a
 * different binary.
 */
function resolveBinForAgent(
  def: (typeof AGENTS)[number],
  binOverride: string | undefined,
): BinResolution {
  const tryPath = (p: string | undefined): string | null => {
    if (!p) return null;
    const trimmed = p.trim();
    if (!trimmed) return null;
    // Absolute path → must exist; relative names → fall back to PATH scan.
    if (/^([a-zA-Z]:[\\/]|[\\/])/.test(trimmed)) {
      return existsSync(trimmed) ? trimmed : null;
    }
    return resolveOnPath(trimmed);
  };
  if (binOverride && binOverride.trim()) {
    const fromOverride = tryPath(binOverride);
    if (fromOverride) return { kind: "ok", bin: fromOverride };
    return { kind: "override-missing", tried: binOverride.trim() };
  }
  if (def.envOverride) {
    const fromEnv = tryPath(process.env[def.envOverride]);
    if (fromEnv) return { kind: "ok", bin: fromEnv };
  }
  for (const c of [def.bin, ...(def.fallbackBins ?? [])]) {
    const found = resolveOnPath(c);
    if (found) return { kind: "ok", bin: found };
  }
  return { kind: "not-found" };
}

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
  const resolved = resolveBinForAgent(def, opts.binOverride);
  if (resolved.kind === "override-missing") {
    return errorStream(
      `${def.label}: custom path \`${resolved.tried}\` does not exist. Update or clear it in Settings → Custom path.`,
    );
  }
  if (resolved.kind === "not-found") {
    return errorStream(
      `${def.label} (\`${def.bin}\`) is not installed or not on PATH.`,
    );
  }
  const bin: string = resolved.bin;

  // For openclaw we need an async detection step (resolveOpenclawAgentId)
  // before buildArgv. Do all of the argv assembly inside the stream's async
  // start so we can `await` and surface failures as `error` events.
  const env = envFor(opts.agent);
  const promptViaArgv = def.protocol === "argv";
  const promptViaMessageFlag = def.protocol === "argv-message";

  return new ReadableStream<InvokeEvent>({
    async start(controller) {
      let closed = false;
      let child: ChildProcessWithoutNullStreams | null = null;
      const htmlStream = opts.output === "html" ? new HtmlStreamExtractor() : null;

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
        try {
          controller.close();
        } catch {}
      };
      const safeEnqueueDelta = (text: string) => {
        if (!htmlStream) {
          safeEnqueue({ type: "delta", text });
          return;
        }
        const html = htmlStream.push(text);
        if (html) safeEnqueue({ type: "delta", text: html });
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
        if (opts.agent === "openclaw") {
          argvOpts.openclawAgentId = await resolveOpenclawAgentId(bin!);
        }
        argv = buildArgv(opts.agent, argvOpts);
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
        child = spawn(bin!, argv, {
          cwd: opts.cwd ?? process.cwd(),
          env,
          stdio: ["pipe", "pipe", "pipe"],
          // On Windows, `spawn` cannot launch a `.cmd` / `.bat` shim (which is
          // what npm installs for most CLI agents) without going through the
          // shell. Without this, every agent invocation fails with
          // EINVAL / "spawn 无效的参数". macOS/Linux use direct exec.
          // Safety: prompt content is delivered via stdin or `--message
          // <text>` (argv-message), not interpolated into a shell command,
          // so this does not introduce a shell-injection vector.
          shell: process.platform === "win32",
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
        bin: bin!,
        argv,
        promptBytes: Buffer.byteLength(opts.prompt, "utf8"),
      });

      child.stdin.on("error", () => {});
      try {
        // stdin-protocol agents read the prompt from stdin; argv / argv-message
        // agents already have it on the command line.
        if (!promptViaArgv && !promptViaMessageFlag) child.stdin.write(opts.prompt);
        child.stdin.end();
      } catch {}

      // One parser per spawn so cross-line dedupe state (sawStreamEventText)
      // is scoped to this single invocation and doesn't leak across runs.
      const parse = makeParser(opts.agent);

      let stdoutBuf = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        if (closed) return;
        stdoutBuf += chunk;
        // OpenClaw emits one big multi-line JSON document — accumulate and
        // parse it once on close instead of trying to parse each line.
        if (opts.agent === "openclaw") return;
        let nl: number;
        while ((nl = stdoutBuf.indexOf("\n")) !== -1) {
          const line = stdoutBuf.slice(0, nl);
          stdoutBuf = stdoutBuf.slice(nl + 1);
          if (!line) continue;
          for (const part of parse(line)) {
            if (part.kind === "delta") safeEnqueueDelta(part.text);
            else if (part.kind === "html") safeEnqueue({ type: "html", text: part.text });
            else if (part.kind === "meta") safeEnqueue({ type: "meta", key: part.key, value: part.value });
            else safeEnqueue({ type: "raw", text: line.slice(0, 240) });
          }
        }
      });

      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk: string) => {
        safeEnqueue({ type: "stderr", text: chunk });
      });

      child.on("error", (err) => {
        safeEnqueue({ type: "error", message: err.message });
        safeClose();
      });

      child.on("close", (code) => {
        if (opts.agent === "openclaw") {
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
              if (text) safeEnqueueDelta(text);
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
            if (part.kind === "delta") safeEnqueueDelta(part.text);
            else if (part.kind === "html") safeEnqueue({ type: "html", text: part.text });
            else if (part.kind === "meta") safeEnqueue({ type: "meta", key: part.key, value: part.value });
          }
          if (opts.agent === "aider" || opts.agent === "deepseek") {
            safeEnqueueDelta(stdoutBuf);
          }
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

function errorStream(message: string): ReadableStream<InvokeEvent> {
  return new ReadableStream<InvokeEvent>({
    start(controller) {
      controller.enqueue({ type: "error", message });
      controller.close();
    },
  });
}
