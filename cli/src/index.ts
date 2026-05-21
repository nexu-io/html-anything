import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSkill, listSkills, type SkillMeta, type LoadedSkill } from "./skills-loader.js";
import { detectAgents, type DetectedAgent } from "./agents-detect.js";
import { assemblePrompt } from "./prompt-assemble.js";
import { invokeAgent, type InvokeEvent } from "./agents-invoke.js";
import { extractHtml } from "./extract-html.js";
import { loadConfig, saveConfig, getConfigPath, type CliConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findWorkspaceRoot(): string {
  let dir = __dirname;
  while (true) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const WORKSPACE_ROOT = findWorkspaceRoot();
const SKILLS_DIR = path.join(WORKSPACE_ROOT, "next", "src", "lib", "templates", "skills");

export function getSkillsDir(): string {
  return SKILLS_DIR;
}

export function getAvailableTemplates(): SkillMeta[] {
  return listSkills(SKILLS_DIR);
}

export function getTemplate(id: string): LoadedSkill | null {
  return loadSkill(SKILLS_DIR, id);
}

export function getAvailableAgents(): DetectedAgent[] {
  return detectAgents();
}

function findAgent(agentId?: string): DetectedAgent | null {
  const agents = getAvailableAgents();
  if (agentId) {
    return agents.find((a) => a.id === agentId && a.available) ?? null;
  }
  const config = loadConfig();
  if (config.defaultAgent) {
    const found = agents.find((a) => a.id === config.defaultAgent && a.available);
    if (found) return found;
  }
  return agents.find((a) => a.available && !a.unsupported) ?? null;
}

function printHelp(): void {
  console.log(`html-anything — AI-powered Markdown to HTML converter (CLI)

USAGE:
  html-anything <command> [options]

COMMANDS:
  convert [input]     Convert Markdown to HTML
    input               Input file (markdown), or use stdin if omitted
    --template, -t <id>  Template ID (default: uses saved default)
    --agent, -a <id>     Agent ID (default: auto-detect)
    --output, -o <path>  Output file path (default: auto-save to <input>.html or stdout)
    --output-dir, -d <dir>  Output directory for auto-saved files (default: current dir)
    --model <id>         Model to use (optional)
    --format <type>      Input format: markdown, text, csv, json (default: markdown)

  templates           List all available templates

  agents              List detected AI agents

  config              Show current configuration
  config set-default-template <id>   Set the default template
  config set-default-agent <id>      Set the default AI agent
  config set-model <id>              Set the default model
  config reset                       Reset all configuration

EXAMPLES:
  html-anything convert article.md
  html-anything convert article.md -t doc-kami-parchment -o output.html
  html-anything convert article.md -t doc-kami-parchment -d ./dist
  html-anything convert article.md -a claude --model sonnet
  cat article.md | html-anything convert
  html-anything config set-default-template resume-modern
  html-anything templates
  html-anything agents
`);
}

function createSpinner(msg: string) {
  if (!process.stderr.isTTY) {
    const start = Date.now();
    let chunkCount = 0;
    return {
      tick: () => { chunkCount++; },
      start,
      stop: (_final?: string) => {},
    };
  }

  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  let chunkCount = 0;
  const start = Date.now();
  let lastLen = 0;

  const interval = setInterval(() => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const frame = frames[i % frames.length];
    const text = `\r  ${frame} ${msg}  ${chunkCount} chunks / ${elapsed}s \x1b[90m(Ctrl+C to stop)\x1b[0m`;
    process.stderr.write(text);
    lastLen = text.length;
    i++;
  }, 80);

  return {
    tick: () => { chunkCount++; },
    start,
    stop: (final?: string) => {
      clearInterval(interval);
      process.stderr.write("\r" + " ".repeat(lastLen) + "\r");
      if (final !== undefined) process.stderr.write(`${final}\n`);
    },
  };
}

async function handleConvert(args: string[]): Promise<void> {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--template" || arg === "-t") {
      flags.template = args[++i] ?? "";
    } else if (arg === "--agent" || arg === "-a") {
      flags.agent = args[++i] ?? "";
    } else if (arg === "--output" || arg === "-o") {
      flags.output = args[++i] ?? "";
    } else if (arg === "--output-dir" || arg === "-d") {
      flags.outputDir = args[++i] ?? "";
    } else if (arg === "--model") {
      flags.model = args[++i] ?? "";
    } else if (arg === "--format") {
      flags.format = args[++i] ?? "";
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      return;
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  const config = loadConfig();

  const templateId = flags.template ?? config.defaultTemplate;
  if (!templateId) {
    console.error("Error: No template specified. Use --template <id> or set a default with:");
    console.error("  html-anything config set-default-template <id>");
    console.error("\nAvailable templates:");
    for (const t of getAvailableTemplates()) {
      console.error(`  ${t.id} — ${t.zhName}`);
    }
    process.exit(1);
  }

  const skill = getTemplate(templateId);
  if (!skill) {
    console.error(`Error: Unknown template "${templateId}"`);
    console.error("Run 'html-anything templates' to list available templates.");
    process.exit(1);
  }

  const agent = findAgent(flags.agent);
  if (!agent) {
    const wantId = flags.agent ?? config.defaultAgent ?? "(auto-detect)";
    console.error(`Error: No available AI agent found${flags.agent ? ` for "${wantId}"` : ""}.`);
    console.error("\nDetected agents:");
    for (const a of getAvailableAgents()) {
      const status = a.available ? (a.unsupported ? "(unsupported)" : "✓") : "✗";
      console.error(`  ${status} ${a.id} — ${a.label}`);
    }
    console.error("\nInstall one of the supported agents (e.g. 'claude', 'codex', 'gemini') and try again.");
    process.exit(1);
  }

  const format = flags.format ?? "markdown";
  let content: string;
  let inputPath: string | null = null;

  if (positional.length > 0) {
    inputPath = positional[0];
    try {
      content = fs.readFileSync(inputPath, "utf-8");
    } catch (err) {
      console.error(`Error: Cannot read input file "${inputPath}": ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else {
    content = await readStdin();
    if (!content.trim()) {
      console.error("Error: No input provided. Pipe content via stdin or specify an input file.");
      process.exit(1);
    }
  }

  const prompt = assemblePrompt({ body: skill.body, content, format });

  const model = flags.model ?? config.model;

  console.error(`Template: ${skill.zhName} (${skill.id})`);
  console.error(`Agent: ${agent.label} (${agent.id})`);
  if (model) console.error(`Model: ${model}`);
  console.error("");

  const stream = invokeAgent({
    agent: agent.id,
    prompt,
    model,
  });

  const reader = stream.getReader();
  let htmlAccum = "";
  let hasHtmlFromTool = false;
  const spinner = createSpinner("Generating HTML...");

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      switch (value.type) {
        case "delta":
          htmlAccum += value.text;
          spinner.tick();
          break;
        case "html":
          htmlAccum = value.text;
          hasHtmlFromTool = true;
          spinner.tick();
          break;
        case "error":
          spinner.stop(`\x1b[31m✗\x1b[0m Error: ${value.message}`);
          process.exit(1);
        case "meta":
          break;
        case "stderr":
          break;
        case "done":
          break;
      }
    }
  } catch (err) {
    spinner.stop(`\x1b[31m✗\x1b[0m Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const elapsed = ((Date.now() - spinner.start) / 1000).toFixed(1);
  spinner.stop(`\x1b[32m✓\x1b[0m Done in ${elapsed}s`);

  const html = extractHtml(htmlAccum);

  if (!html) {
    console.error("Error: Agent did not produce valid HTML output.");
    console.error("Raw output:\n", htmlAccum.slice(0, 500));
    process.exit(1);
  }

  if (flags.output) {
    try {
      fs.mkdirSync(path.dirname(path.resolve(flags.output)), { recursive: true });
      fs.writeFileSync(flags.output, html, "utf-8");
      console.error(`Saved to: ${flags.output}`);
    } catch (err) {
      console.error(`Error: Cannot write to "${flags.output}": ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else if (inputPath) {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputDir = flags.outputDir || process.cwd();
    const outputPath = path.resolve(outputDir, `${basename}.html`);
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, "utf-8");
      console.error(`Saved to: ${outputPath}`);
    } catch (err) {
      console.error(`Error: Cannot write to "${outputPath}": ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else {
    process.stdout.write(html);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", () => resolve(""));
  });
}

function handleTemplates(): void {
  const templates = getAvailableTemplates();

  if (templates.length === 0) {
    console.log("No templates found.");
    return;
  }

  const config = loadConfig();
  console.log(`Available templates (${templates.length}):\n`);

  const byCategory: Record<string, SkillMeta[]> = {};
  for (const t of templates) {
    const cat = t.category || "other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(t);
  }

  for (const [category, skills] of Object.entries(byCategory)) {
    console.log(`[${category}]`);
    for (const s of skills) {
      const isDefault = s.id === config.defaultTemplate ? " (default)" : "";
      console.log(`  ${s.emoji} ${s.id} — ${s.zhName}${isDefault}`);
    }
    console.log();
  }
}

function handleAgents(): void {
  const agents = getAvailableAgents();
  const config = loadConfig();

  if (agents.length === 0) {
    console.log("No agents detected.");
    return;
  }

  console.log("Detected AI agents:\n");

  for (const a of agents) {
    const status = a.available
      ? a.unsupported
        ? "⚠ (unsupported)"
        : "✓"
      : "✗";
    const isDefault = a.id === config.defaultAgent ? " (default)" : "";
    console.log(`  ${status} ${a.id} — ${a.label} (${a.vendor})${isDefault}`);
  }
}

function handleConfig(args: string[]): void {
  if (args.length === 0) {
    const config = loadConfig();
    console.log("Current configuration:");
    if (Object.keys(config).length === 0) {
      console.log("  (no configuration set)");
    } else {
      if (config.defaultTemplate) {
        const t = getTemplate(config.defaultTemplate);
        console.log(`  default-template: ${config.defaultTemplate}${t ? ` (${t.zhName})` : ""}`);
      }
      if (config.defaultAgent) console.log(`  default-agent: ${config.defaultAgent}`);
      if (config.model) console.log(`  model: ${config.model}`);
    }
    console.log(`\nConfig file: ${getConfigPath()}`);
    return;
  }

  const sub = args[0];
  const val = args[1];

  switch (sub) {
    case "set-default-template": {
      if (!val) {
        console.error("Error: Specify a template ID.");
        process.exit(1);
      }
      const skill = getTemplate(val);
      if (!skill) {
        console.error(`Error: Unknown template "${val}"`);
        process.exit(1);
      }
      saveConfig({ defaultTemplate: val });
      console.log(`Default template set to: ${val} (${skill.zhName})`);
      break;
    }
    case "set-default-agent": {
      if (!val) {
        console.error("Error: Specify an agent ID.");
        process.exit(1);
      }
      const agents = getAvailableAgents();
      const agent = agents.find((a) => a.id === val);
      if (!agent) {
        console.error(`Error: Unknown agent "${val}"`);
        process.exit(1);
      }
      saveConfig({ defaultAgent: val });
      console.log(`Default agent set to: ${val} (${agent.label})`);
      break;
    }
    case "set-model": {
      if (!val) {
        console.error("Error: Specify a model ID.");
        process.exit(1);
      }
      saveConfig({ model: val });
      console.log(`Default model set to: ${val}`);
      break;
    }
    case "reset": {
      saveConfig({ defaultTemplate: undefined, defaultAgent: undefined, model: undefined });
      console.log("Configuration reset.");
      break;
    }
    default:
      console.error(`Unknown config command: ${sub}`);
      console.error("Available: set-default-template, set-default-agent, set-model, reset");
      process.exit(1);
  }
}

export async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return;
  }

  const command = args[0];
  const rest = args.slice(1);

  switch (command) {
    case "convert":
      await handleConvert(rest);
      break;
    case "templates":
      handleTemplates();
      break;
    case "agents":
      handleAgents();
      break;
    case "config":
      handleConfig(rest);
      break;
    case "--version":
    case "-v":
      console.log("html-anything CLI v0.1.0");
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run 'html-anything --help' for usage information.");
      process.exit(1);
  }
}