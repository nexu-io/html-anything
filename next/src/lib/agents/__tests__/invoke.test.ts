import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { invokeAgent, type InvokeEvent } from "../invoke";

async function readableToArray(stream: ReadableStream<InvokeEvent>): Promise<InvokeEvent[]> {
  const reader = stream.getReader();
  const out: InvokeEvent[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) out.push(value);
  }
  return out;
}

/**
 * Create a fake agent binary on disk that runs the given Node.js script.
 * Returns an absolute path suitable for `binOverride`; the wrapper's basename
 * is `claude` (with `.cmd` on Windows) so it passes invoke.ts's basename
 * allowlist.
 */
async function writeFakeAgent(binDir: string, script: string): Promise<string> {
  const jsFile = path.join(binDir, "fake-agent.js");
  await fs.writeFile(jsFile, script, "utf8");

  if (process.platform === "win32") {
    const cmdFile = path.join(binDir, "claude.cmd");
    await fs.writeFile(
      cmdFile,
      `@echo off\n"${process.execPath}" "${jsFile}" %*\n`,
      "utf8",
    );
    return cmdFile;
  }

  const wrapper = path.join(binDir, "claude");
  await fs.writeFile(wrapper, `#!/usr/bin/env node\nrequire("${jsFile.replace(/\\/g, "\\\\")}");\n`, "utf8");
  await fs.chmod(wrapper, 0o755);
  return wrapper;
}

describe("invokeAgent", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-invoke-"));
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("streams start + delta + done from a fake agent", async () => {
    const fakeBin = await writeFakeAgent(
      tmpRoot,
      `
process.stdout.write(JSON.stringify({ type: "system", subtype: "init", model: "fake-model", session_id: "s1" }) + "\\n");
process.stdout.write(JSON.stringify({ type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: "<html>" } } }) + "\\n");
process.stdout.write(JSON.stringify({ type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: "ok" } } }) + "\\n");
process.stdout.write(JSON.stringify({ type: "result", usage: { input_tokens: 1, output_tokens: 2 }, duration_ms: 42, subtype: "success" }) + "\\n");
      `.trim(),
    );

    const events = await readableToArray(invokeAgent({ agent: "claude", prompt: "make html", binOverride: fakeBin }));
    expect(events.find((e) => e.type === "start")).toMatchObject({
      type: "start",
      promptBytes: Buffer.byteLength("make html", "utf8"),
    });
    const deltas = events.filter((e) => e.type === "delta");
    expect(deltas.map((e) => (e as { text: string }).text).join("")).toBe("<html>ok");
    expect(events.find((e) => e.type === "done")).toMatchObject({ type: "done", code: 0 });
    expect(events.find((e) => e.type === "meta" && (e as { key: string }).key === "model")).toMatchObject({
      type: "meta",
      key: "model",
      value: "fake-model",
    });
  });

  it("emits error event when the binary exits non-zero", async () => {
    const fakeBin = await writeFakeAgent(
      tmpRoot,
      `
process.stderr.write("auth failed\\n");
process.exit(1);
      `.trim(),
    );

    const events = await readableToArray(invokeAgent({ agent: "claude", prompt: "x", binOverride: fakeBin }));
    expect(events.find((e) => e.type === "done")).toMatchObject({ type: "done", code: 1 });
    expect(events.some((e) => e.type === "stderr")).toBe(true);
  });

  it("terminates the child when the AbortSignal fires", async () => {
    const fakeBin = await writeFakeAgent(
      tmpRoot,
      `
let i = 0;
const id = setInterval(() => {
  process.stdout.write(JSON.stringify({ type: "stream_event", event: { type: "content_block_delta", delta: { type: "text_delta", text: String(i++) } } }) + "\\n");
}, 50);
process.on("SIGTERM", () => { clearInterval(id); process.exit(0); });
      `.trim(),
    );

    const ctl = new AbortController();
    const stream = invokeAgent({ agent: "claude", prompt: "x", signal: ctl.signal, binOverride: fakeBin });
    const reader = stream.getReader();
    let deltas = 0;
    const timer = setTimeout(() => ctl.abort(), 1500);
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value?.type === "delta") deltas++;
      }
    } finally {
      clearTimeout(timer);
    }
    expect(deltas).toBeGreaterThanOrEqual(1);
    // Process should exit without lingering into the 10-minute watchdog.
  });

  it("rejects binOverride whose basename does not match the agent", async () => {
    const result = await readableToArray(
      invokeAgent({ agent: "claude", prompt: "x", binOverride: "/evil/not-claude" }),
    );
    const err = result.find((e) => e.type === "error");
    expect(err).toBeTruthy();
    expect((err as { message: string }).message).toMatch(/expected binary named/);
  });

  it("rejects unknown agent", async () => {
    const events = await readableToArray(invokeAgent({ agent: "nonexistent", prompt: "x" }));
    expect(events[0]).toMatchObject({ type: "error", message: "unknown agent: nonexistent" });
  });
});
