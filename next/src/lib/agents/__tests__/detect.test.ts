/** @vitest-environment node */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn((_path?: string) => false),
}));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return { ...actual, existsSync: existsSyncMock };
});

import { detectAgents } from "../detect";

function findAgent(
  agents: ReturnType<typeof detectAgents>,
  id: string,
) {
  const agent = agents.find((a) => a.id === id);
  if (!agent) throw new Error(`Agent with id "${id}" not found`);
  return agent;
}

beforeEach(() => {
  existsSyncMock.mockReset();
  existsSyncMock.mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("detectAgents", () => {
  it("includes the configured MiniMax Claude-compatible models in the Claude picker", () => {
    const agents = detectAgents();
    const claude = findAgent(agents, "claude");

    expect(claude.models).toEqual(
      expect.arrayContaining([
        { id: "MiniMax-M3", label: "MiniMax-M3" },
        { id: "MiniMax-M2.7", label: "MiniMax-M2.7" },
      ]),
    );
  });
});

describe("detectAgents grok", () => {
  it("detects grok on PATH", () => {
    existsSyncMock.mockImplementation((p) => p === "/usr/local/bin/grok");

    const grok = findAgent(detectAgents(), "grok");
    expect(grok.available).toBe(true);
    expect(grok.path).toBe("/usr/local/bin/grok");
    expect(grok.resolvedBin).toBe("grok");
    expect(grok.protocol).toBe("prompt-file");
    expect(grok.unsupported).toBeUndefined();
    expect(grok.label).toBe("Grok Build");
  });

  it("honors an absolute GROK_BIN override", () => {
    vi.stubEnv("GROK_BIN", "/opt/xai/grok");
    existsSyncMock.mockImplementation((p) => p === "/opt/xai/grok");

    const grok = findAgent(detectAgents(), "grok");
    expect(grok.available).toBe(true);
    expect(grok.path).toBe("/opt/xai/grok");
    expect(grok.resolvedBin).toBe("grok");
  });

  it("stays unavailable when grok is missing", () => {
    const grok = findAgent(detectAgents(), "grok");
    expect(grok.available).toBe(false);
    expect(grok.protocol).toBe("prompt-file");
  });
});
