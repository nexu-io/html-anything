import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chmodSync, mkdtempSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { invokeAgent, createMessageFile, type InvokeEvent } from "../invoke";

const BIN_OVERRIDE = process.execPath;

describe("createMessageFile", () => {
  it("returns distinct files with intact contents for invocations created in the same millisecond", () => {
    const handles: ReturnType<typeof createMessageFile>[] = [];
    for (let i = 0; i < 25; i++) {
      handles.push(createMessageFile(`prompt-${i}`));
    }

    const paths = new Set(handles.map((h) => h.filePath));
    expect(paths.size).toBe(handles.length);

    handles.forEach((h, i) => {
      expect(readFileSync(h.filePath, "utf8")).toBe(`prompt-${i}`);
    });

    for (const h of handles) {
      h.cleanup();
      h.cleanup();
    }
    const remaining = handles.filter(
      (h) => statSync(path.dirname(h.filePath), { throwIfNoEntry: false }) !== undefined,
    );
    expect(remaining).toHaveLength(0);
  });

  it(
    "creates the prompt file with restrictive permissions (not relying on umask)",
    { skip: process.platform === "win32" },
    () => {
      const h = createMessageFile("secret");
      expect(statSync(path.dirname(h.filePath)).mode & 0o777).toBe(0o700);
      expect(statSync(h.filePath).mode & 0o777).toBe(0o600);
      h.cleanup();
    },
  );
});

describe("openclaw file-protocol prompt file concurrency", () => {
  let stubDir: string;
  let stubBin: string;

  beforeAll(() => {
    stubDir = mkdtempSync(path.join(os.tmpdir(), "html-anything-agent-stub-"));
    writeFileSync(
      path.join(stubDir, "stub.js"),
      [
        `const { readFileSync } = require("node:fs");`,
        `const argv = process.argv.slice(2);`,
        `const idx = argv.indexOf("--message-file");`,
        `let content = "";`,
        `let file = "";`,
        `if (idx !== -1) {`,
        `  file = argv[idx + 1];`,
        `  try {`,
        `    content = readFileSync(file, "utf8");`,
        `  } catch {`,
        `    content = "STUB_READ_ERROR";`,
        `  }`,
        `}`,
        `process.stdout.write(JSON.stringify({`,
        `  meta: { finalAssistantVisibleText: content, agentMeta: { sessionId: file } },`,
        `}));`,
        ``,
      ].join("\n"),
    );
    if (process.platform === "win32") {
      stubBin = path.join(stubDir, "stub.cmd");
      writeFileSync(stubBin, `@echo off\r\nnode "%~dp0stub.js" %*\r\n`);
    } else {
      stubBin = path.join(stubDir, "stub.sh");
      writeFileSync(stubBin, `#!/bin/sh\nexec node "$(dirname "$0")/stub.js" "$@"\n`);
      chmodSync(stubBin, 0o755);
    }
  });

  afterAll(() => {
    rmSync(stubDir, { recursive: true, force: true });
  });

  it("passes distinct prompt files to concurrent invocations and cleanup of one does not affect the other", async () => {
    const streamA = invokeAgent({
      agent: "openclaw",
      prompt: "PROMPT-A",
      binOverride: stubBin,
    });
    const streamB = invokeAgent({
      agent: "openclaw",
      prompt: "PROMPT-B",
      binOverride: stubBin,
    });

    const [eventsA, eventsB] = await Promise.all([
      collectStream(streamA),
      collectStream(streamB),
    ]);

    const deltaA = eventsA.find((e): e is Extract<InvokeEvent, { type: "delta" }> => e.type === "delta");
    const deltaB = eventsB.find((e): e is Extract<InvokeEvent, { type: "delta" }> => e.type === "delta");
    expect(deltaA).toBeDefined();
    expect(deltaB).toBeDefined();
    expect([deltaA!.text, deltaB!.text].sort()).toEqual(["PROMPT-A", "PROMPT-B"]);

    const sessionA = eventsA.find(
      (e): e is Extract<InvokeEvent, { type: "meta" }> => e.type === "meta" && e.key === "session",
    );
    const sessionB = eventsB.find(
      (e): e is Extract<InvokeEvent, { type: "meta" }> => e.type === "meta" && e.key === "session",
    );
    expect(sessionA).toBeDefined();
    expect(sessionB).toBeDefined();
    expect(sessionA!.value).not.toBe(sessionB!.value);

    expect(statSync(path.dirname(sessionA!.value as string), { throwIfNoEntry: false })).toBeUndefined();
    expect(statSync(path.dirname(sessionB!.value as string), { throwIfNoEntry: false })).toBeUndefined();
  });
});

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
