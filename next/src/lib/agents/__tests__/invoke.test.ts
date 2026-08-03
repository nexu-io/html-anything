import { describe, expect, it } from "vitest";
import { AGENTS } from "../detect";
import { buildSpawnSpec, invokeAgent, isSupportedModel } from "../invoke";

describe("buildSpawnSpec", () => {
  it("keeps a Windows argv prompt literal by launching a native executable without a shell", () => {
    const prompt = "Create a landing page & echo injected > C:\\temp\\pwned.txt";
    const spec = buildSpawnSpec({
      bin: "C:\\Program Files\\Antigravity\\agy.exe",
      argv: ["--dangerously-skip-permissions", "--print", prompt],
      promptOnCommandLine: true,
      platform: "win32",
    });

    expect(spec).toEqual({
      command: "C:\\Program Files\\Antigravity\\agy.exe",
      argv: ["--dangerously-skip-permissions", "--print", prompt],
      shell: false,
    });
  });

  it("rejects Windows command shims when the prompt would be shell-parsed", () => {
    expect(() =>
      buildSpawnSpec({
        bin: "C:\\Users\\me\\AppData\\Roaming\\npm\\agy.cmd",
        argv: ["--print", "hello & echo injected"],
        promptOnCommandLine: true,
        platform: "win32",
      }),
    ).toThrow(/native executable/i);
  });
});

describe("isSupportedModel", () => {
  const claude = AGENTS.find((agent) => agent.id === "claude")!;

  it("accepts a model from the agent's declared picker", () => {
    expect(isSupportedModel(claude, "sonnet")).toBe(true);
  });

  it("rejects a model value containing Windows shell syntax", () => {
    expect(isSupportedModel(claude, "sonnet & echo injected")).toBe(false);
  });

  it("rejects an undeclared model before resolving or spawning the agent", async () => {
    const reader = invokeAgent({
      agent: "claude",
      prompt: "ignored",
      model: "sonnet & echo injected",
    }).getReader();

    await expect(reader.read()).resolves.toEqual({
      value: { type: "error", message: "Claude Code: selected model is not supported by this adapter." },
      done: false,
    });
    await expect(reader.read()).resolves.toEqual({ value: undefined, done: true });
  });
});
