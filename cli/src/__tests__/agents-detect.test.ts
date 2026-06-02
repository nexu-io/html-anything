import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { existsSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn((_path?: string) => false),
}));

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return { ...actual, existsSync: existsSyncMock };
});

import { detectAgents } from "../agents-detect.js";

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
  describe("*_BIN env override with absolute path that exists", () => {
    it("finds claude via absolute CLAUDE_BIN path", () => {
      vi.stubEnv("CLAUDE_BIN", "/usr/local/bin/claude");
      existsSyncMock.mockImplementation(
        (p) => p === "/usr/local/bin/claude",
      );

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(true);
      expect(claude.path).toBe("/usr/local/bin/claude");
      expect(claude.resolvedBin).toBe("claude");
      expect(claude.protocol).toBe("stdin");
      expect(claude.unsupported).toBeUndefined();
    });
  });

  describe("*_BIN with command name resolved on PATH", () => {
    it("finds gemini via GEMINI_BIN command name on PATH", () => {
      vi.stubEnv("GEMINI_BIN", "fake-gemini");
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/fake-gemini") return true;
        return false;
      });

      const agents = detectAgents();
      const gemini = findAgent(agents, "gemini");

      expect(gemini.available).toBe(true);
      expect(gemini.resolvedBin).toBe("fake-gemini");
      expect(gemini.path).toBe("/usr/local/bin/fake-gemini");
    });
  });

  describe("*_BIN pointing to non-existent path", () => {
    it("returns unavailable when CLAUDE_BIN path does not exist", () => {
      vi.stubEnv("CLAUDE_BIN", "/nonexistent/claude");
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(false);
      expect(claude.path).toBeUndefined();
      expect(claude.resolvedBin).toBeUndefined();
    });
  });

  describe("no env override, binary found on PATH", () => {
    it("detects claude when binary is on PATH without env override", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/claude") return true;
        return false;
      });

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(true);
      expect(claude.path).toBe("/usr/local/bin/claude");
      expect(claude.resolvedBin).toBe("claude");
    });

    it("detects aider which has no envOverride via bin on PATH", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/aider") return true;
        return false;
      });

      const agents = detectAgents();
      const aider = findAgent(agents, "aider");

      expect(aider.available).toBe(true);
      expect(aider.path).toBe("/usr/local/bin/aider");
      expect(aider.resolvedBin).toBe("aider");
    });

    it("detects opencode via fallbackBins when primary bin not found", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/opencode") return true;
        return false;
      });

      const agents = detectAgents();
      const opencode = findAgent(agents, "opencode");

      expect(opencode.available).toBe(true);
      expect(opencode.path).toBe("/usr/local/bin/opencode");
      expect(opencode.resolvedBin).toBe("opencode");
    });

    it("returns unavailable when no binary is on PATH and no env override", () => {
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(false);
    });
  });

  describe("unsupported protocol agents", () => {
    it("marks hermes with acp protocol as unsupported even when found", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/hermes") return true;
        return false;
      });

      const agents = detectAgents();
      const hermes = findAgent(agents, "hermes");

      expect(hermes.available).toBe(true);
      expect(hermes.protocol).toBe("acp");
      expect(hermes.unsupported).toBe(true);
    });

    it("marks pi with pi-rpc protocol as unsupported even when found", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/pi") return true;
        return false;
      });

      const agents = detectAgents();
      const pi = findAgent(agents, "pi");

      expect(pi.available).toBe(true);
      expect(pi.protocol).toBe("pi-rpc");
      expect(pi.unsupported).toBe(true);
    });

    it("marks unsupported as undefined for stdin protocol agents", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/claude") return true;
        return false;
      });

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.protocol).toBe("stdin");
      expect(claude.unsupported).toBeUndefined();
    });

    it("marks kimi with acp protocol as unsupported even when not found", () => {
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();
      const kimi = findAgent(agents, "kimi");

      expect(kimi.available).toBe(false);
      expect(kimi.protocol).toBe("acp");
      expect(kimi.unsupported).toBe(true);
    });
  });

  describe("agent protocol assignment", () => {
    it("defaults protocol to stdin for agents without explicit protocol", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/codex") return true;
        return false;
      });

      const agents = detectAgents();
      const codex = findAgent(agents, "codex");

      expect(codex.protocol).toBe("stdin");
    });

    it("preserves explicit protocol from agent definition (argv)", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/codewhale") return true;
        return false;
      });

      const agents = detectAgents();
      const codewhale = findAgent(agents, "codewhale");

      expect(codewhale.protocol).toBe("argv");
    });

    it("preserves explicit protocol from agent definition (argv) for deepseek-tui", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/deepseek-tui") return true;
        return false;
      });

      const agents = detectAgents();
      const deepseek = findAgent(agents, "deepseek-tui");

      expect(deepseek.protocol).toBe("argv");
    });

    it("preserves explicit protocol from agent definition (argv-message)", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/openclaw") return true;
        return false;
      });

      const agents = detectAgents();
      const openclaw = findAgent(agents, "openclaw");

      expect(openclaw.protocol).toBe("argv-message");
    });
  });

  describe("env override precedence", () => {
    it("prefers env override over PATH binary", () => {
      vi.stubEnv("CLAUDE_BIN", "/custom/path/claude");
      existsSyncMock.mockImplementation((p) => {
        if (p === "/custom/path/claude") return true;
        if (p === "/usr/local/bin/claude") return true;
        return false;
      });

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(true);
      expect(claude.path).toBe("/custom/path/claude");
      expect(claude.resolvedBin).toBe("claude");
    });

    it("falls back to PATH when env override is a command name that exists on PATH", () => {
      vi.stubEnv("CLAUDE_BIN", "my-custom-claude");
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/my-custom-claude") return true;
        return false;
      });

      const agents = detectAgents();
      const claude = findAgent(agents, "claude");

      expect(claude.available).toBe(true);
      expect(claude.path).toBe("/usr/local/bin/my-custom-claude");
      expect(claude.resolvedBin).toBe("my-custom-claude");
    });
  });

  describe("returned agent shape", () => {
    it("returns all agents from AGENTS array", () => {
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();

      expect(agents.length).toBeGreaterThanOrEqual(10);
    });

    it("each agent includes id, label, vendor, available, protocol, and models", () => {
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();

      for (const agent of agents) {
        expect(agent).toHaveProperty("id");
        expect(typeof agent.id).toBe("string");
        expect(agent).toHaveProperty("label");
        expect(typeof agent.label).toBe("string");
        expect(agent).toHaveProperty("vendor");
        expect(typeof agent.vendor).toBe("string");
        expect(agent).toHaveProperty("available");
        expect(typeof agent.available).toBe("boolean");
        expect(agent).toHaveProperty("protocol");
        expect(agent).toHaveProperty("models");
        expect(Array.isArray(agent.models)).toBe(true);
      }
    });

    it("each available agent has path and resolvedBin", () => {
      existsSyncMock.mockImplementation((p) => {
        if (p === "/usr/local/bin/claude") return true;
        if (p === "/usr/local/bin/aider") return true;
        return false;
      });

      const agents = detectAgents();
      const availableAgents = agents.filter((a) => a.available);

      for (const agent of availableAgents) {
        expect(agent).toHaveProperty("path");
        expect(typeof agent.path).toBe("string");
        expect(agent).toHaveProperty("resolvedBin");
        expect(typeof agent.resolvedBin).toBe("string");
      }
    });

    it("models array is non-empty for each agent", () => {
      existsSyncMock.mockReturnValue(false);

      const agents = detectAgents();

      for (const agent of agents) {
        expect(agent.models.length).toBeGreaterThan(0);
      }
    });
  });
});
