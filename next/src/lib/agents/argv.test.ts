import { describe, expect, it } from "vitest";
import { buildArgv, makeParser } from "./argv";

describe("Codex argv", () => {
  it("uses hermetic exec flags that are supported by the current CLI", () => {
    const argv = buildArgv("codex");

    expect(argv).toContain("--ignore-user-config");
    expect(argv).toContain("--ignore-rules");
    expect(argv).toContain("--ephemeral");
  });
});

describe("Codex parser", () => {
  it("parses current Codex agent_message item.completed payloads", () => {
    const parse = makeParser("codex");
    const html = "<!DOCTYPE html><html><body>Ready</body></html>";

    expect(
      parse(
        JSON.stringify({
          type: "item.completed",
          item: { type: "agent_message", text: html },
        }),
      ),
    ).toEqual([{ kind: "delta", text: html }]);
  });

  it("keeps compatibility with older Codex assistant_message payloads", () => {
    const parse = makeParser("codex");

    expect(
      parse(
        JSON.stringify({
          type: "item.completed",
          item: { item_type: "assistant_message", text: "done" },
        }),
      ),
    ).toEqual([{ kind: "delta", text: "done" }]);
  });

  it("parses lifecycle and usage metadata", () => {
    const parse = makeParser("codex");
    const usage = { input_tokens: 12, output_tokens: 5 };

    expect(parse(JSON.stringify({ type: "thread.started", thread_id: "abc123" }))).toEqual([
      { kind: "meta", key: "session", value: "abc123" },
    ]);
    expect(parse(JSON.stringify({ type: "turn.started" }))).toEqual([
      { kind: "meta", key: "status", value: "turn.started" },
    ]);
    expect(parse(JSON.stringify({ type: "turn.completed", usage }))).toEqual([
      { kind: "meta", key: "usage", value: usage },
    ]);
  });
});
