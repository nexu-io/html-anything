import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";

const {
  agentStore,
  skillStore,
  configStore,
  invokeStore,
  fsStore,
  saveStore,
  setAgents,
  setSkills,
  setConfig,
  setInvokeStream,
  getFileContents,
  getSaveConfigCalls,
  resetStores,
} = vi.hoisted(() => {
  const agentStore = {
    list: [
      {
        id: "claude",
        label: "Claude Code",
        vendor: "Anthropic",
        available: true,
        protocol: "stdin" as const,
        models: [] as { id: string; label: string }[],
        unsupported: undefined as boolean | undefined,
      },
      {
        id: "hermes",
        label: "Hermes",
        vendor: "Mature",
        available: true,
        protocol: "acp" as const,
        models: [] as { id: string; label: string }[],
        unsupported: true,
      },
      {
        id: "pi",
        label: "Pi",
        vendor: "Inflection",
        available: true,
        protocol: "pi-rpc" as const,
        models: [] as { id: string; label: string }[],
        unsupported: true,
      },
      {
        id: "gemini",
        label: "Gemini CLI",
        vendor: "Google",
        available: false,
        protocol: "stdin" as const,
        models: [] as { id: string; label: string }[],
        unsupported: undefined as boolean | undefined,
      },
    ],
  };

  const skillStore = {
    list: [
      {
        id: "valid-template",
        zhName: "Valid Template",
        enName: "Valid",
        emoji: "📄",
        description: "A valid template",
        category: "doc",
        scenario: "general",
        aspectHint: "",
        tags: [] as string[],
      },
    ],
    loaded: new Map<string, any>([
      [
        "valid-template",
        {
          id: "valid-template",
          zhName: "Valid Template",
          enName: "Valid",
          emoji: "📄",
          description: "A valid template",
          category: "doc",
          scenario: "general",
          aspectHint: "",
          tags: [],
          body: "You are a world-class HTML designer. Output complete HTML.",
        },
      ],
    ]),
  };

  const configStore = {
    data: {} as Record<string, any>,
    saveError: null as Error | null,
  };

  const invokeStore = {
    htmlOutput: "<!DOCTYPE html><html><head></head><body><h1>Test</h1></body></html>",
    errorMessage: null as string | null,
    exitCode: 0,
  };

  const fsStore = {
    files: new Map<string, string>(),
    existing: new Set<string>(),
    mkdirCalls: [] as string[],
  };

  const saveStore = {
    calls: [] as Array<Record<string, any>>,
  };

  const defaults = {
    agents: JSON.parse(JSON.stringify(agentStore.list)),
    skills: JSON.parse(JSON.stringify(skillStore.list)),
    config: {},
  };

  return {
    agentStore,
    skillStore,
    configStore,
    invokeStore,
    fsStore,
    saveStore,
    setAgents: (a: typeof agentStore.list) => {
      agentStore.list = a;
    },
    setSkills: (s: typeof skillStore.list) => {
      skillStore.list = s;
    },
    setConfig: (c: Record<string, any>) => {
      configStore.data = c;
    },
    setInvokeStream: (html: string, err?: string | null, code?: number) => {
      invokeStore.htmlOutput = html;
      invokeStore.errorMessage = err ?? null;
      invokeStore.exitCode = code ?? 0;
    },
    getFileContents: () => fsStore.files,
    getSaveConfigCalls: () => saveStore.calls,
    resetStores: () => {
      agentStore.list = JSON.parse(JSON.stringify(defaults.agents));
      skillStore.list = JSON.parse(JSON.stringify(defaults.skills));
      configStore.data = { ...defaults.config };
      configStore.saveError = null;
      invokeStore.htmlOutput = "<!DOCTYPE html><html><head></head><body><h1>Test</h1></body></html>";
      invokeStore.errorMessage = null;
      invokeStore.exitCode = 0;
      fsStore.files.clear();
      fsStore.existing.clear();
      fsStore.mkdirCalls = [];
      saveStore.calls = [];
    },
  };
});

vi.mock("../agents-detect.js", () => ({
  detectAgents: vi.fn(() => [...agentStore.list]),
}));

vi.mock("../skills-loader.js", () => ({
  listSkills: vi.fn(() => [...skillStore.list]),
  loadSkill: vi.fn((_dir: string, id: string) => skillStore.loaded.get(id) ?? null),
}));

function makeMockStream(): any {
  const chunks: any[] = [];
  if (invokeStore.errorMessage) {
    chunks.push({ type: "error", message: invokeStore.errorMessage });
  } else {
    chunks.push({ type: "delta", text: invokeStore.htmlOutput });
    chunks.push({ type: "done", code: invokeStore.exitCode });
  }

  let index = 0;
  return {
    getReader() {
      return {
        read() {
          if (index < chunks.length) {
            return Promise.resolve({ value: chunks[index++], done: false });
          }
          return Promise.resolve({ value: undefined, done: true });
        },
        cancel() {},
        releaseLock() {},
        get closed() {
          return index >= chunks.length;
        },
      };
    },
  };
}

vi.mock("../agents-invoke.js", () => ({
  invokeAgent: vi.fn(() => makeMockStream()),
}));

vi.mock("../config.js", () => ({
  loadConfig: vi.fn(() => ({ ...configStore.data })),
  saveConfig: vi.fn((c: Record<string, any>) => {
    if (configStore.saveError) throw configStore.saveError;
    configStore.data = { ...configStore.data, ...c };
    saveStore.calls.push({ ...c });
  }),
  getConfigPath: vi.fn(() => "/fake/config.json"),
}));

vi.mock("node:fs", () => {
  const mockReadFileSync = vi.fn((p: string, _enc?: string) => {
    if (fsStore.files.has(p)) return fsStore.files.get(p);
    return "# Test markdown content";
  });
  const mockWriteFileSync = vi.fn((p: string, content: string) => {
    fsStore.files.set(p, content);
  });
  const mockExistsSync = vi.fn((p: string) => {
    if (fsStore.files.has(p)) return true;
    if (typeof p === "string" && p.endsWith("pnpm-workspace.yaml")) return true;
    return false;
  });
  const mockMkdirSync = vi.fn((p: string) => {
    fsStore.mkdirCalls.push(p);
  });
  const mockReaddirSync = vi.fn(() => [] as any[]);

  const fsNs = {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readdirSync: mockReaddirSync,
  };

  return {
    default: fsNs,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    readdirSync: mockReaddirSync,
  };
});

vi.mock("../prompt.js", () => ({
  promptYesNo: vi.fn(async () => false),
  promptOverwrite: vi.fn(async () => true),
}));

let main: (args: string[]) => Promise<void>;
let exitCode: number | null;
let stderrLines: string[];
let stdoutLines: string[];

beforeAll(async () => {
  const mod = await import("../index.js");
  main = mod.main;
});

beforeEach(() => {
  exitCode = null;
  stderrLines = [];
  stdoutLines = [];
  resetStores();

  vi.spyOn(process, "exit").mockImplementation(
    (code?: number | string | null): never => {
      const c = typeof code === "number" ? code : 0;
      exitCode = c;
      throw new Error(`__EXIT_${c}__`);
    },
  );
  vi.spyOn(console, "error").mockImplementation((...args: any[]) => {
    stderrLines.push(args.join(" "));
  });
  vi.spyOn(console, "log").mockImplementation((...args: any[]) => {
    stdoutLines.push(args.join(" "));
  });
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stderrContains(substring: string): boolean {
  return stderrLines.some((l) => l.includes(substring));
}

function stdoutContains(substring: string): boolean {
  return stdoutLines.some((l) => l.includes(substring));
}

describe("main() parameter validation", () => {
  it("rejects -o and -d used together", async () => {
    await expect(main(["convert", "-o", "out.html", "-d", "out"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("cannot be used together")).toBe(true);
  });

  it("rejects -o with multiple input files", async () => {
    await expect(main(["convert", "a.md", "b.md", "-o", "out.html"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("cannot be used with multiple input files")).toBe(true);
  });

  it('rejects unknown format "xml"', async () => {
    await expect(main(["convert", "file.md", "--format", "xml"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Unknown format")).toBe(true);
  });

  it("rejects unknown option", async () => {
    await expect(main(["convert", "file.md", "--unknown"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Unknown option")).toBe(true);
  });

  it("rejects unknown command", async () => {
    await expect(main(["unknown-command"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Unknown command")).toBe(true);
  });
});

describe("main() config set-default-agent", () => {
  it('rejects unknown agent id "unknown"', async () => {
    await expect(main(["config", "set-default-agent", "unknown"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Unknown agent")).toBe(true);
  });

  it('rejects agent that is not installed (gemini)', async () => {
    await expect(main(["config", "set-default-agent", "gemini"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("not installed")).toBe(true);
  });

  it('rejects agent with unsupported protocol (hermes — acp)', async () => {
    await expect(main(["config", "set-default-agent", "hermes"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("unsupported protocol")).toBe(true);
  });

  it('rejects agent with unsupported protocol (pi — pi-rpc)', async () => {
    await expect(main(["config", "set-default-agent", "pi"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("unsupported protocol")).toBe(true);
  });

  it("successfully sets claude as default agent", async () => {
    await expect(main(["config", "set-default-agent", "claude"])).resolves.toBeUndefined();
    expect(exitCode).toBeNull();
    const calls = getSaveConfigCalls();
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls.some((c) => c.defaultAgent === "claude")).toBe(true);
  });

  it("rejects missing agent id", async () => {
    await expect(main(["config", "set-default-agent"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Specify an agent ID")).toBe(true);
  });
});

describe("main() template validation", () => {
  it('rejects unknown template "nonexistent"', async () => {
    await expect(main(["convert", "file.md", "-t", "nonexistent"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("Unknown template")).toBe(true);
  });

  it("rejects when no template specified and no default set", async () => {
    setConfig({});
    await expect(main(["convert", "file.md"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("No template specified")).toBe(true);
  });
});

describe("main() agent not found", () => {
  it('rejects when specified agent "nonexistent" is not available', async () => {
    await expect(main(["convert", "file.md", "-t", "valid-template", "-a", "nonexistent"])).rejects.toThrow(
      "__EXIT_1__",
    );
    expect(exitCode).toBe(1);
    expect(stderrContains("No available AI agent found")).toBe(true);
  });
});

describe("main() config save error handling", () => {
  it("exits with error when saveConfig throws", async () => {
    configStore.saveError = new Error("disk full");
    await expect(main(["config", "set-default-agent", "claude"])).rejects.toThrow("__EXIT_1__");
    expect(exitCode).toBe(1);
    expect(stderrContains("disk full")).toBe(true);
  });
});

describe("main() convert success path with mocked agent", () => {
  it("invokes agent and writes output file", async () => {
    setInvokeStream("<!DOCTYPE html><html><head></head><body><h1>Hello World</h1></body></html>");

    await expect(main(["convert", "file.md", "-t", "valid-template", "-a", "claude"])).resolves.toBeUndefined();
    expect(exitCode).toBeNull();

    const files = getFileContents();
    const outputFile = [...files.keys()].find((k) => k.endsWith(".html"));
    expect(outputFile).toBeTruthy();
    expect(files.get(outputFile!)).toContain("<h1>Hello World</h1>");
  });
});

describe("main() --help and --version", () => {
  it("prints help with --help flag", async () => {
    await expect(main(["--help"])).resolves.toBeUndefined();
    expect(stdoutContains("html-anything — AI-powered Markdown to HTML converter")).toBe(true);
  });

  it("prints help with -h flag", async () => {
    await expect(main(["-h"])).resolves.toBeUndefined();
    expect(stdoutContains("USAGE:")).toBe(true);
  });

  it("prints help with no arguments", async () => {
    await expect(main([])).resolves.toBeUndefined();
    expect(stdoutContains("COMMANDS:")).toBe(true);
  });

  it("prints version with --version", async () => {
    await expect(main(["--version"])).resolves.toBeUndefined();
    expect(stdoutContains("html-anything CLI v")).toBe(true);
  });

  it("prints version with -v", async () => {
    await expect(main(["-v"])).resolves.toBeUndefined();
    expect(stdoutContains("html-anything CLI v")).toBe(true);
  });

  it("prints help from convert --help", async () => {
    await expect(main(["convert", "--help"])).resolves.toBeUndefined();
    expect(stdoutContains("COMMANDS:")).toBe(true);
  });
});
