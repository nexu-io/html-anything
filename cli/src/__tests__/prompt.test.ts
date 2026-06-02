import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockCreateInterface, setAnswer } = vi.hoisted(() => {
  let answer = "n";
  return {
    setAnswer: (a: string) => {
      answer = a;
    },
    mockCreateInterface: vi.fn(() => ({
      question: (_q: string, cb: (a: string) => void) => cb(answer),
      close: vi.fn(),
    })),
  };
});

vi.mock("node:readline", () => ({
  default: { createInterface: mockCreateInterface },
}));

import { promptYesNo, promptOverwrite } from "../prompt.js";

function setStdinTTY(value: boolean) {
  Object.defineProperty(process.stdin, "isTTY", {
    value,
    configurable: true,
    writable: true,
  });
}

function setStderrTTY(value: boolean) {
  Object.defineProperty(process.stderr, "isTTY", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("promptYesNo", () => {
  beforeEach(() => {
    setStdinTTY(false);
    setStderrTTY(false);
    setAnswer("n");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves false when stdin.isTTY is false and stderr.isTTY is true", async () => {
    setStdinTTY(false);
    setStderrTTY(true);
    const result = await promptYesNo("Continue?");
    expect(result).toBe(false);
  });

  it("resolves false when stdin.isTTY is true and stderr.isTTY is false", async () => {
    setStdinTTY(true);
    setStderrTTY(false);
    const result = await promptYesNo("Continue?");
    expect(result).toBe(false);
  });

  it("resolves false when both stdin and stderr are not TTY", async () => {
    const result = await promptYesNo("Continue?");
    expect(result).toBe(false);
  });

  it("does not throw when both are TTY", () => {
    setStdinTTY(true);
    setStderrTTY(true);
    expect(() => {
      promptYesNo("Continue?");
    }).not.toThrow();
  });

  it('resolves true when answer is "y" in TTY mode', async () => {
    setStdinTTY(true);
    setStderrTTY(true);
    setAnswer("y");
    const result = await promptYesNo("Continue?");
    expect(result).toBe(true);
  });

  it('resolves false when answer is "n" in TTY mode', async () => {
    setStdinTTY(true);
    setStderrTTY(true);
    setAnswer("n");
    const result = await promptYesNo("Continue?");
    expect(result).toBe(false);
  });
});

describe("promptOverwrite", () => {
  beforeEach(() => {
    setStdinTTY(false);
    setStderrTTY(false);
    setAnswer("n");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves true (auto-overwrite) when stdin.isTTY is false and stderr.isTTY is true", async () => {
    setStdinTTY(false);
    setStderrTTY(true);
    const result = await promptOverwrite("/some/file.txt");
    expect(result).toBe(true);
  });

  it("resolves true (auto-overwrite) when stdin.isTTY is true and stderr.isTTY is false", async () => {
    setStdinTTY(true);
    setStderrTTY(false);
    const result = await promptOverwrite("/some/file.txt");
    expect(result).toBe(true);
  });

  it("resolves true (auto-overwrite) when both stdin and stderr are not TTY", async () => {
    const result = await promptOverwrite("/some/file.txt");
    expect(result).toBe(true);
  });

  it('resolves true when answer is "y" in TTY mode', async () => {
    setStdinTTY(true);
    setStderrTTY(true);
    setAnswer("y");
    const result = await promptOverwrite("/some/file.txt");
    expect(result).toBe(true);
  });

  it('resolves false when answer is "n" in TTY mode', async () => {
    setStdinTTY(true);
    setStderrTTY(true);
    setAnswer("n");
    const result = await promptOverwrite("/some/file.txt");
    expect(result).toBe(false);
  });
});
