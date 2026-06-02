import { vi, describe, it, expect, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { PassThrough, Writable } from "node:stream";

const { mockSpawn, existsSyncDelegate } = vi.hoisted(() => ({
  mockSpawn: vi.fn(),
  existsSyncDelegate: vi.fn((p: string) => p === "/bin/sh"),
}));

vi.mock("node:child_process", () => ({
  spawn: mockSpawn,
}));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return { ...actual, existsSync: existsSyncDelegate };
});

import { invokeAgent, type InvokeEvent } from "../agents-invoke.js";

function makeFakeChild() {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const stdin = new Writable({
    write(_chunk: unknown, _enc: unknown, cb: () => void) {
      cb();
    },
  });

  const child = Object.assign(new EventEmitter(), {
    stdin,
    stdout,
    stderr,
    pid: 99999,
  });

  return { child, stdout, stderr, stdin };
}

async function collectStream(
  stream: ReadableStream<InvokeEvent>,
): Promise<InvokeEvent[]> {
  const events: InvokeEvent[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) events.push(value);
  }
  return events;
}

async function driveInvoke(
  opts: Parameters<typeof invokeAgent>[0],
  stdoutContent: string | null,
  exitCode: number | null = 0,
): Promise<InvokeEvent[]> {
  const { child, stdout } = makeFakeChild();
  mockSpawn.mockReturnValue(child);

  const stream = invokeAgent(opts);

  await new Promise((r) => setTimeout(r, 0));

  const eventsPromise = collectStream(stream);

  if (stdoutContent != null) {
    stdout.write(stdoutContent);
  }
  stdout.end();

  await new Promise((r) => setImmediate(r));
  child.emit("close", exitCode);

  return eventsPromise;
}

const BIN_OVERRIDE = "/bin/sh";

describe("invokeAgent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("error cases", () => {
    it("returns error stream for unknown agent", async () => {
      const stream = invokeAgent({
        agent: "nonexistent",
        prompt: "test",
        binOverride: BIN_OVERRIDE,
      });

      const events = await collectStream(stream);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "error",
        message: expect.stringContaining("unknown agent"),
      });
    });

    it("returns error stream when binOverride points to missing file", async () => {
      const stream = invokeAgent({
        agent: "claude",
        prompt: "test",
        binOverride: "/nonexistent/path/to/bin",
      });

      const events = await collectStream(stream);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "error",
        message: expect.stringContaining("does not exist"),
      });
    });

    it("returns error stream for unsupported (acp) agent protocol", async () => {
      const stream = invokeAgent({
        agent: "hermes",
        prompt: "test",
        binOverride: BIN_OVERRIDE,
      });

      const events = await collectStream(stream);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "error",
        message: expect.stringContaining("not yet wired up"),
      });
    });
  });

  describe("relative binOverride resolution", () => {
    it("resolves ./mock-agent via path.resolve + existsSync", async () => {
      existsSyncDelegate.mockImplementation((p: string) => {
        if (p.endsWith("/mock-agent")) return true;
        return p === "/bin/sh";
      });

      const html = "<html><body>ok</body></html>";
      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "test", binOverride: "./mock-agent" },
        html,
        0,
      );

      const start = events.find((e) => e.type === "start");
      expect(start).toBeDefined();
      expect(start).toMatchObject({
        type: "start",
        bin: expect.stringContaining("/mock-agent"),
      });
    });

    it("resolves ../bin/claude wrapper relative path", async () => {
      existsSyncDelegate.mockImplementation((p: string) => {
        if (p.endsWith("/bin/claude")) return true;
        return p === "/bin/sh";
      });

      const html = "<html><body>ok</body></html>";
      const events = await driveInvoke(
        { agent: "claude", prompt: "test", binOverride: "../bin/claude" },
        html,
        0,
      );

      const start = events.find((e) => e.type === "start");
      expect(start).toBeDefined();
      expect(start).toMatchObject({
        type: "start",
        bin: expect.stringContaining("/bin/claude"),
      });
    });
  });

  describe("close-path: codewhale, deepseek-tui and aider agents", () => {
    it("deepseek-tui: enqueues remaining stdoutBuf as single delta on close (HTML, no trailing newline)", async () => {
      const html = "<html><body>hello</body></html>";

      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "make a page", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });

      const start = events.filter((e) => e.type === "start");
      expect(start).toHaveLength(1);
      expect(events).toHaveLength(3);
    });

    it("deepseek-tui: produces only ONE delta for partial line after complete lines", async () => {
      const content = "line1\nline2";

      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "make a page", binOverride: BIN_OVERRIDE },
        content,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(2);
      expect(deltas[0]).toMatchObject({ type: "delta", text: "line1\n" });
      expect(deltas[1]).toMatchObject({ type: "delta", text: "line2" });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });
    });

    it("deepseek-tui: no residual on close when line ends with newline (no double-enqueue)", async () => {
      const content = "hello\n";

      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "make a page", binOverride: BIN_OVERRIDE },
        content,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: "hello\n" });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });
    });

    it("codewhale: enqueues remaining stdoutBuf as single delta on close (HTML, no trailing newline)", async () => {
      const html = "<html><body>hello from codewhale</body></html>";

      const events = await driveInvoke(
        { agent: "codewhale", prompt: "make a page", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });
    });

    it("aider: enqueues remaining stdoutBuf as single delta on close (HTML, no trailing newline)", async () => {
      const html = "<html><body>hello from aider</body></html>";

      const events = await driveInvoke(
        { agent: "aider", prompt: "make a page", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });

      expect(events).toHaveLength(3);
    });

    it("aider: does NOT double-enqueue partial line after complete lines", async () => {
      const content = "aider-line\npartial";

      const events = await driveInvoke(
        { agent: "aider", prompt: "test", binOverride: BIN_OVERRIDE },
        content,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");

      expect(deltas).toHaveLength(2);
      expect(deltas[0]).toMatchObject({ type: "delta", text: "aider-line\n" });
      expect(deltas[1]).toMatchObject({ type: "delta", text: "partial" });
    });
  });

  describe("close-path: non-deepseek-tui/aider agents", () => {
    it("codex: parses remaining stdoutBuf on close (valid JSON delta)", async () => {
      const json = '{"type":"item.delta","text":"parsed on close"}';

      const events = await driveInvoke(
        { agent: "codex", prompt: "test", binOverride: BIN_OVERRIDE },
        json,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: "parsed on close" });
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });
    });

    it("codex: HTML content on close is not JSON-parsed (skipped)", async () => {
      const html = "<html><body>not json</body></html>";

      const events = await driveInvoke(
        { agent: "codex", prompt: "test", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      const done = events.filter((e) => e.type === "done");

      expect(deltas).toHaveLength(0);
      expect(done).toHaveLength(1);
      expect(done[0]).toMatchObject({ type: "done", code: 0 });
    });

    it("claude: parses remaining stdoutBuf on close (result usage meta)", async () => {
      const json = '{"type":"result","usage":{"input_tokens":10,"output_tokens":20}}';

      const events = await driveInvoke(
        { agent: "claude", prompt: "test", binOverride: BIN_OVERRIDE },
        json,
        0,
      );

      const metas = events.filter((e) => e.type === "meta");
      const done = events.filter((e) => e.type === "done");

      const usageMeta = metas.find(
        (e) => e.type === "meta" && e.key === "usage",
      );
      expect(usageMeta).toBeDefined();
      expect(done).toHaveLength(1);
    });
  });

  describe("exit code propagation", () => {
    it("done event reflects exit code 0", async () => {
      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "test", binOverride: BIN_OVERRIDE },
        "ok",
        0,
      );

      const done = events.find((e) => e.type === "done");
      expect(done).toMatchObject({ type: "done", code: 0 });
    });

    it("done event reflects exit code 1", async () => {
      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "test", binOverride: BIN_OVERRIDE },
        "fail",
        1,
      );

      const done = events.find((e) => e.type === "done");
      expect(done).toMatchObject({ type: "done", code: 1 });
    });

    it("done event with null code (signal exit)", async () => {
      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "test", binOverride: BIN_OVERRIDE },
        "killed",
        null,
      );

      const done = events.find((e) => e.type === "done");
      expect(done).toMatchObject({ type: "done", code: null });
    });
  });

  describe("child process error", () => {
    it("produces error event when child emits error", async () => {
      const { child, stdout } = makeFakeChild();
      mockSpawn.mockReturnValue(child);

      const stream = invokeAgent({
        agent: "deepseek-tui",
        prompt: "test",
        binOverride: BIN_OVERRIDE,
      });

      await new Promise((r) => setTimeout(r, 0));

      const eventsPromise = collectStream(stream);

      stdout.end();
      await new Promise((r) => setImmediate(r));
      child.emit("error", new Error("spawn ENOENT"));

      const events = await eventsPromise;

      const errors = events.filter((e) => e.type === "error");
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        type: "error",
        message: "spawn ENOENT",
      });
    });
  });

  describe("stderr propagation", () => {
    it("produces stderr events for stderr output", async () => {
      const { child, stdout, stderr } = makeFakeChild();
      mockSpawn.mockReturnValue(child);

      const stream = invokeAgent({
        agent: "deepseek-tui",
        prompt: "test",
        binOverride: BIN_OVERRIDE,
      });

      await new Promise((r) => setTimeout(r, 0));

      const eventsPromise = collectStream(stream);

      stderr.write("warning: deprecated\n");
      stdout.end();
      await new Promise((r) => setImmediate(r));
      child.emit("close", 0);

      const events = await eventsPromise;

      const stderrEvents = events.filter((e) => e.type === "stderr");
      expect(stderrEvents.length).toBeGreaterThanOrEqual(1);
      expect(stderrEvents[0]).toMatchObject({
        type: "stderr",
        text: "warning: deprecated\n",
      });
    });
  });

  describe("start event", () => {
    it("includes bin, argv, and promptBytes", async () => {
      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "hello world", binOverride: BIN_OVERRIDE },
        null,
        0,
      );

      const start = events.find((e) => e.type === "start");
      expect(start).toBeDefined();
      if (start && start.type === "start") {
        expect(start.bin).toBe(BIN_OVERRIDE);
        expect(start.argv).toEqual(
          expect.arrayContaining(["exec", "--auto"]),
        );
        expect(start.promptBytes).toBe(
          Buffer.byteLength("hello world", "utf8"),
        );
      }
    });
  });

  describe("deepseek-tui vs non-deepseek-tui close-path distinction", () => {
    it("deepseek-tui close-path bypasses parse() entirely — HTML not double-parsed", async () => {
      const html = "<html><body>distinct</body></html>";

      const events = await driveInvoke(
        { agent: "deepseek-tui", prompt: "test", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });

      const raws = events.filter((e) => e.type === "raw");
      expect(raws).toHaveLength(0);

      const htmls = events.filter((e) => e.type === "html");
      expect(htmls).toHaveLength(0);
    });

    it("codewhale close-path bypasses parse() entirely — HTML not double-parsed", async () => {
      const html = "<html><body>codewhale-distinct</body></html>";

      const events = await driveInvoke(
        { agent: "codewhale", prompt: "test", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });

      const raws = events.filter((e) => e.type === "raw");
      expect(raws).toHaveLength(0);

      const htmls = events.filter((e) => e.type === "html");
      expect(htmls).toHaveLength(0);
    });

    it("aider close-path bypasses parse() entirely — HTML not double-parsed", async () => {
      const html = "<html><body>aider-distinct</body></html>";

      const events = await driveInvoke(
        { agent: "aider", prompt: "test", binOverride: BIN_OVERRIDE },
        html,
        0,
      );

      const deltas = events.filter((e) => e.type === "delta");
      expect(deltas).toHaveLength(1);
      expect(deltas[0]).toMatchObject({ type: "delta", text: html });

      const raws = events.filter((e) => e.type === "raw");
      expect(raws).toHaveLength(0);

      const htmls = events.filter((e) => e.type === "html");
      expect(htmls).toHaveLength(0);
    });

  });
});
