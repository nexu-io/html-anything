import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolveOnPath, AGENTS } from "./detect";
import { buildArgv, envFor, makeParser, UnsupportedAgentProtocolError } from "./argv";

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
  const candidates = [def.bin, ...(def.fallbackBins ?? [])];
  let bin: string | null = null;
  for (const c of candidates) {
    bin = resolveOnPath(c);
    if (bin) break;
  }
  if (!bin) {
    return errorStream(
      `${def.label} (\`${def.bin}\`) is not installed or not on PATH.`,
    );
  }

  let argv: string[];
  try {
    argv = buildArgv(opts.agent, { model: opts.model, prompt: opts.prompt });
  } catch (err) {
    return errorStream(
      err instanceof UnsupportedAgentProtocolError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err),
    );
  }
  // `protocol: "argv"` adapters (deepseek today) take the prompt as a
  // trailing positional arg rather than reading from stdin.
  const promptViaArgv = def.protocol === "argv";
  if (promptViaArgv) argv = [...argv, opts.prompt];
  const env = envFor(opts.agent);

  return new ReadableStream<InvokeEvent>({
    start(controller) {
      let closed = false;
      let child: ChildProcessWithoutNullStreams | null = null;

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

      try {
        child = spawn(bin!, argv, {
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
        bin: bin!,
        argv,
        promptBytes: Buffer.byteLength(opts.prompt, "utf8"),
      });

      child.stdin.on("error", () => {});
      try {
        if (!promptViaArgv) child.stdin.write(opts.prompt);
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
        let nl: number;
        while ((nl = stdoutBuf.indexOf("\n")) !== -1) {
          const line = stdoutBuf.slice(0, nl);
          stdoutBuf = stdoutBuf.slice(nl + 1);
          if (!line) continue;
          for (const part of parse(line)) {
            if (part.kind === "delta") safeEnqueue({ type: "delta", text: part.text });
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
        if (stdoutBuf) {
          for (const part of parse(stdoutBuf)) {
            if (part.kind === "delta") safeEnqueue({ type: "delta", text: part.text });
            else if (part.kind === "meta") safeEnqueue({ type: "meta", key: part.key, value: part.value });
          }
          if (opts.agent === "aider" || opts.agent === "deepseek") {
            safeEnqueue({ type: "delta", text: stdoutBuf });
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
