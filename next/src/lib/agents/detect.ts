import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path, { delimiter, join } from "node:path";

/**
 * Per-agent invocation protocol. Determines what `invokeAgent` does with the
 * prompt and how it parses output:
 *   - "stdin"        : pipe prompt → child stdin, parse stdout via parseLine
 *   - "argv"         : pass prompt as positional argv (deepseek), parse stdout as plain
 *   - "argv-message" : prompt goes via `--message <text>` (openclaw); stdout is
 *                      a single multi-line JSON document (not ndjson), parsed
 *                      after the child closes.
 *   - "acp"          : ACP JSON-RPC over stdio (hermes/kimi/devin/kiro/kilo/vibe).
 *                      Not implemented in this build — surfaced in detection so
 *                      the user sees install instructions, but invoke emits a
 *                      clear error pointing them to a supported agent.
 *   - "pi-rpc"       : pi's custom JSON-RPC mode. Same status as "acp".
 */
export type AgentProtocol = "stdin" | "argv" | "argv-message" | "acp" | "pi-rpc";

export type ModelOption = { id: string; label: string };

/** Synthetic "let the CLI pick" entry — agent runs without `--model`. */
export const DEFAULT_MODEL: ModelOption = { id: "default", label: "Default (CLI config)" };

export type AgentDef = {
  id: string;
  label: string;
  bin: string;
  fallbackBins?: string[];
  envOverride?: string;
  vendor: string;
  /** Defaults to "stdin" when omitted. */
  protocol?: AgentProtocol;
  /**
   * Curated, evidence-based model list shown in the picker. Always begins
   * with `DEFAULT_MODEL` (= no `--model` flag → user's CLI config wins).
   * Mirrors open-design's `fallbackModels` for each adapter.
   */
  fallbackModels: ModelOption[];
};

export const AGENTS: AgentDef[] = [
  // Drop-in fork list (`fallbackBins`) covers CLIs that ship under a different
  // binary name but speak the exact same argv protocol. Today: openclaude is
  // listed as a fallback for Claude Code; OpenClaw is exposed as its own
  // first-class entry below so users on machines that have both can pick.
  {
    id: "claude",
    label: "Claude Code",
    bin: "claude",
    fallbackBins: ["openclaude"],
    envOverride: "CLAUDE_BIN",
    vendor: "Anthropic",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "sonnet", label: "Sonnet (alias)" },
      { id: "opus", label: "Opus (alias)" },
      { id: "haiku", label: "Haiku (alias)" },
      { id: "claude-opus-4-7", label: "claude-opus-4-7" },
      { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
      { id: "claude-haiku-4-5", label: "claude-haiku-4-5" },
    ],
  },
  {
    // OpenClaw is a multi-channel agent gateway, not a Claude-CLI fork —
    // its CLI surface is `openclaw agent --message <text>` and it returns a
    // single multi-line JSON blob (no streaming). The "argv-message"
    // protocol covers the prompt-via-flag and post-close JSON parse.
    id: "openclaw",
    label: "OpenClaw",
    bin: "openclaw",
    envOverride: "OPENCLAW_BIN",
    vendor: "OpenClaw multi-channel agent gateway",
    protocol: "argv-message",
    fallbackModels: [
      DEFAULT_MODEL,
      // Models surface as overrides for OpenClaw's routing; the CLI accepts
      // `--model <provider/model or model id>`. The list mirrors what
      // OpenClaw's main agent typically routes to (OpenRouter Claude family).
      { id: "openrouter/anthropic/claude-opus-4.7", label: "Opus 4.7 (OpenRouter)" },
      { id: "openrouter/anthropic/claude-sonnet-4.6", label: "Sonnet 4.6 (OpenRouter)" },
      { id: "openrouter/anthropic/claude-haiku-4.5", label: "Haiku 4.5 (OpenRouter)" },
    ],
  },
  {
    id: "codex",
    label: "OpenAI Codex",
    bin: "codex",
    envOverride: "CODEX_BIN",
    vendor: "OpenAI",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "gpt-5.5", label: "gpt-5.5" },
      { id: "gpt-5.4", label: "gpt-5.4" },
      { id: "gpt-5.4-mini", label: "gpt-5.4-mini" },
      { id: "gpt-5.3-codex", label: "gpt-5.3-codex" },
      { id: "gpt-5-codex", label: "gpt-5-codex" },
      { id: "gpt-5", label: "gpt-5" },
      { id: "o3", label: "o3" },
      { id: "o4-mini", label: "o4-mini" },
    ],
  },
  {
    id: "cursor-agent",
    label: "Cursor Agent",
    bin: "cursor-agent",
    envOverride: "CURSOR_AGENT_BIN",
    vendor: "Cursor",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "auto", label: "auto" },
      { id: "sonnet-4", label: "sonnet-4" },
      { id: "sonnet-4-thinking", label: "sonnet-4-thinking" },
      { id: "gpt-5", label: "gpt-5" },
    ],
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    bin: "gemini",
    envOverride: "GEMINI_BIN",
    vendor: "Google",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "gemini-2.5-pro", label: "gemini-2.5-pro" },
      { id: "gemini-2.5-flash", label: "gemini-2.5-flash" },
    ],
  },
  {
    id: "copilot",
    label: "GitHub Copilot CLI",
    bin: "copilot",
    envOverride: "COPILOT_BIN",
    vendor: "GitHub",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
      { id: "gpt-5.2", label: "GPT-5.2" },
    ],
  },
  {
    id: "opencode",
    label: "OpenCode",
    bin: "opencode-cli",
    fallbackBins: ["opencode"],
    envOverride: "OPENCODE_BIN",
    vendor: "Open",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "anthropic/claude-sonnet-4-5", label: "anthropic/claude-sonnet-4-5" },
      { id: "openai/gpt-5", label: "openai/gpt-5" },
      { id: "google/gemini-2.5-pro", label: "google/gemini-2.5-pro" },
    ],
  },
  {
    id: "qwen",
    label: "Qwen Coder",
    bin: "qwen",
    envOverride: "QWEN_BIN",
    vendor: "Alibaba",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "qwen3-coder-plus", label: "qwen3-coder-plus" },
      { id: "qwen3-coder-flash", label: "qwen3-coder-flash" },
    ],
  },
  {
    id: "qoder",
    label: "Qoder CLI",
    bin: "qodercli",
    envOverride: "QODER_BIN",
    vendor: "Qoder",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "lite", label: "Lite" },
      { id: "efficient", label: "Efficient" },
      { id: "auto", label: "Auto" },
      { id: "performance", label: "Performance" },
      { id: "ultimate", label: "Ultimate" },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek TUI",
    bin: "deepseek",
    envOverride: "DEEPSEEK_BIN",
    vendor: "DeepSeek",
    protocol: "argv",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "deepseek-v4-pro", label: "deepseek-v4-pro" },
      { id: "deepseek-v4-flash", label: "deepseek-v4-flash" },
    ],
  },
  {
    id: "aider",
    label: "Aider",
    bin: "aider",
    vendor: "Aider",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "claude-sonnet-4-5", label: "claude-sonnet-4-5" },
      { id: "gpt-5", label: "gpt-5" },
      { id: "deepseek/deepseek-chat", label: "deepseek/deepseek-chat" },
    ],
  },

  // ACP family — detection-only. Models still surfaced for UI completeness.
  {
    id: "hermes",
    label: "Hermes",
    bin: "hermes",
    envOverride: "HERMES_BIN",
    vendor: "Mature",
    protocol: "acp",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "openai-codex:gpt-5.5", label: "gpt-5.5 (openai-codex)" },
      { id: "openai-codex:gpt-5.4", label: "gpt-5.4 (openai-codex)" },
    ],
  },
  {
    id: "kimi",
    label: "Kimi CLI",
    bin: "kimi",
    envOverride: "KIMI_BIN",
    vendor: "Moonshot",
    protocol: "acp",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "kimi-k2-turbo-preview", label: "kimi-k2-turbo-preview" },
      { id: "moonshot-v1-8k", label: "moonshot-v1-8k" },
      { id: "moonshot-v1-32k", label: "moonshot-v1-32k" },
    ],
  },
  {
    id: "devin",
    label: "Devin for Terminal",
    bin: "devin",
    envOverride: "DEVIN_BIN",
    vendor: "Cognition",
    protocol: "acp",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "adaptive", label: "adaptive" },
      { id: "swe", label: "swe" },
      { id: "opus", label: "opus" },
      { id: "sonnet", label: "sonnet" },
      { id: "codex", label: "codex" },
      { id: "gpt", label: "gpt" },
      { id: "gemini", label: "gemini" },
    ],
  },
  {
    id: "kiro",
    label: "Kiro CLI",
    bin: "kiro-cli",
    envOverride: "KIRO_BIN",
    vendor: "AWS",
    protocol: "acp",
    fallbackModels: [DEFAULT_MODEL],
  },
  {
    id: "kilo",
    label: "Kilo",
    bin: "kilo",
    envOverride: "KILO_BIN",
    vendor: "Kilo",
    protocol: "acp",
    fallbackModels: [DEFAULT_MODEL],
  },
  {
    id: "vibe",
    label: "Mistral Vibe CLI",
    bin: "vibe-acp",
    envOverride: "VIBE_BIN",
    vendor: "Mistral",
    protocol: "acp",
    fallbackModels: [DEFAULT_MODEL],
  },
  {
    id: "pi",
    label: "Pi",
    bin: "pi",
    envOverride: "PI_BIN",
    vendor: "Inflection",
    protocol: "pi-rpc",
    fallbackModels: [
      DEFAULT_MODEL,
      { id: "anthropic/claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "anthropic/claude-opus-4-5", label: "Claude Opus 4.5" },
      { id: "openai/gpt-5", label: "GPT-5" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
  },
];

function userToolchainDirs(): string[] {
  const home = homedir();
  const env = process.env;
  const dirs: string[] = [];
  const vp = env.VP_HOME?.trim();
  if (vp) dirs.push(join(vp, "bin"));
  const npmPrefix = env.NPM_CONFIG_PREFIX?.trim();
  if (npmPrefix) {
    // npm on Windows installs CLI shims directly in <prefix>, not <prefix>/bin.
    dirs.push(join(npmPrefix, "bin"), npmPrefix);
  }
  dirs.push(
    join(home, ".local/bin"),
    join(home, ".vite-plus/bin"),
    join(home, ".opencode/bin"),
    join(home, ".bun/bin"),
    join(home, ".volta/bin"),
    join(home, ".asdf/shims"),
    join(home, "Library/pnpm"),
    join(home, ".cargo/bin"),
    join(home, ".npm-global/bin"),
    join(home, ".npm-packages/bin"),
    join(home, ".claude/local"),
  );
  if (process.platform === "win32") {
    // Scoop-managed Node.js drops global npm shims into the app dir directly,
    // not under a /bin/ subdirectory. Cover the common Scoop layouts plus the
    // default %AppData%/npm location used by the standalone Node installer.
    const scoopRoot = env.SCOOP?.trim() || join(home, "scoop");
    const globalScoopRoot = env.SCOOP_GLOBAL?.trim() || "C:\\ProgramData\\scoop";
    const appData = env.APPDATA?.trim();
    dirs.push(
      join(scoopRoot, "shims"),
      join(scoopRoot, "apps", "nodejs", "current"),
      join(scoopRoot, "apps", "nodejs-lts", "current"),
      join(globalScoopRoot, "shims"),
      join(globalScoopRoot, "apps", "nodejs", "current"),
    );
    if (appData) dirs.push(join(appData, "npm"));
  } else {
    dirs.push("/opt/homebrew/bin", "/usr/local/bin");
  }
  return dirs;
}

/**
 * Probe `<openclaw> agents list` and return the first agent id (typically
 * "main"). OpenClaw refuses `agent --message` invocations without one of
 * `--agent`, `--to`, or `--session-id`, so we resolve this once per-process
 * with a 5-minute TTL cache.
 *
 * Falls back to "main" on any error — that is the OpenClaw default agent
 * name on a fresh install, so it works for most users out of the box.
 */
let openclawAgentIdCache: { value: string; expiresAt: number } | null = null;
export async function resolveOpenclawAgentId(bin: string): Promise<string> {
  const now = Date.now();
  if (openclawAgentIdCache && openclawAgentIdCache.expiresAt > now) {
    return openclawAgentIdCache.value;
  }
  let resolved = "main";
  try {
    const { spawn } = await import("node:child_process");
    const out = await new Promise<string>((res, rej) => {
      const child = spawn(bin, ["agents", "list"], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
      });
      let buf = "";
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (c) => (buf += c));
      child.on("close", () => res(buf));
      child.on("error", rej);
      setTimeout(() => {
        try { child.kill("SIGTERM"); } catch {}
        rej(new Error("openclaw agents list timed out"));
      }, 5_000);
    });
    // First agent line looks like:  "- main (default)"  or  "- ops"
    const m = out.match(/^- (\S+)/m);
    if (m && m[1]) resolved = m[1];
  } catch {
    // keep fallback
  }
  openclawAgentIdCache = { value: resolved, expiresAt: now + 5 * 60_000 };
  return resolved;
}

export function resolveOnPath(bin: string): string | null {
  const exts =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";")
      : [""];
  const seen = new Set<string>();
  const dirs = [
    ...(process.env.PATH ?? "").split(delimiter),
    ...userToolchainDirs(),
  ].filter((d) => d && !seen.has(d) && (seen.add(d), true));
  for (const d of dirs) {
    for (const e of exts) {
      const full = path.join(d, bin + e);
      try {
        if (existsSync(full)) return full;
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export type DetectedAgent = {
  id: string;
  label: string;
  vendor: string;
  available: boolean;
  path?: string;
  resolvedBin?: string;
  protocol: AgentProtocol;
  /**
   * Curated model picker list. Sent to the client so the welcome modal can
   * render a dropdown without a follow-up round trip.
   */
  models: ModelOption[];
  /** True when the adapter cannot be invoked yet (acp / pi-rpc). */
  unsupported?: boolean;
};

export function detectAgents(): DetectedAgent[] {
  return AGENTS.map((a): DetectedAgent => {
    const protocol = a.protocol ?? "stdin";
    const unsupported = protocol === "acp" || protocol === "pi-rpc";
    const base = {
      id: a.id,
      label: a.label,
      vendor: a.vendor,
      protocol,
      models: a.fallbackModels,
      unsupported: unsupported || undefined,
    };
    const override = a.envOverride ? process.env[a.envOverride] : undefined;
    if (override && existsSync(override)) {
      return { ...base, available: true, path: override, resolvedBin: a.bin };
    }
    const candidates = [a.bin, ...(a.fallbackBins ?? [])];
    for (const c of candidates) {
      const p = resolveOnPath(c);
      if (p) {
        return { ...base, available: true, path: p, resolvedBin: c };
      }
    }
    return { ...base, available: false };
  });
}
