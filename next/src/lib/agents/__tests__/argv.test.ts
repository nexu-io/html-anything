import { describe, expect, it } from "vitest";
import { buildArgv, parseLine } from "../argv";

describe("buildArgv", () => {
  it("runs Codex without user config so stale MCP auth cannot pollute stderr", () => {
    const argv = buildArgv("codex", { model: "gpt-5.5" });

    expect(argv).toContain("--ignore-user-config");
    expect(argv).toEqual([
      "exec",
      "--ignore-user-config",
      "--json",
      "--skip-git-repo-check",
      "--sandbox",
      "workspace-write",
      "-c",
      "sandbox_workspace_write.network_access=true",
      "--model",
      "gpt-5.5",
    ]);
  });
});

describe("parseLine", () => {
  it("surfaces Codex lifecycle events so long runs do not look idle", () => {
    expect(parseLine("codex", '{"type":"thread.started","thread_id":"t_123"}')).toEqual([
      { kind: "meta", key: "session", value: "t_123" },
    ]);
    expect(parseLine("codex", '{"type":"turn.started"}')).toEqual([
      { kind: "meta", key: "turn", value: "started" },
    ]);
  });
});
