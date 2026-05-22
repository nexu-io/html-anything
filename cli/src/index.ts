import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { loadSkill, listSkills, type SkillMeta, type LoadedSkill } from "./skills-loader.js";
import { detectAgents, type DetectedAgent } from "./agents-detect.js";
import { assemblePrompt } from "./prompt-assemble.js";
import { invokeAgent, type InvokeEvent } from "./agents-invoke.js";
import { extractHtml } from "./extract-html.js";
import { loadConfig, saveConfig, getConfigPath, type CliConfig } from "./config.js";
import { matchTemplate, type MatchResult } from "./skills-matcher.js";

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
    const found = agents.find((a) => a.id === config.defaultAgent && a.available && !a.unsupported);
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

  auto [input]        Auto-detect best template and convert
    input               Input file, or use stdin if omitted
    --agent, -a <id>     Agent ID (default: auto-detect)
    --output, -o <path>  Output file path
    --output-dir, -d <dir>  Output directory for auto-saved files
    --model <id>         Model to use (optional)
    --format <type>      Input format: markdown, text, csv, json (default: markdown)
    --force-ai                Force AI summary for matching
    --show-match-only          Show match result, skip conversion

  templates           List all available templates

  agents              List detected AI agents

  config              Show current configuration
  config set-default-template <id>   Set the default template
  config set-default-agent <id>      Set the default AI agent
  config set-model <id>              Set the default model
  config reset                       Reset all configuration

EXAMPLES:
  html-anything auto article.md
  html-anything auto article.md -o output.html
  html-anything auto article.md --show-match-only
  html-anything auto article.md --force-ai
  cat article.md | html-anything auto
  html-anything convert article.md
  html-anything convert article.md -t doc-kami-parchment -o output.html
  html-anything convert article.md -t doc-kami-parchment -d ./dist
  html-anything convert article.md -a claude --model sonnet
  html-anything convert file1.md file2.md file3.md -d ./dist
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
      stop: (final?: string) => {
        if (final !== undefined) process.stderr.write(`${final}\n`);
      },
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

  if (flags.output && flags.outputDir) {
    console.error("Error: --output (-o) and --output-dir (-d) cannot be used together.");
    process.exit(1);
  }

  if (flags.output && positional.length > 1) {
    console.error("Error: --output (-o) cannot be used with multiple input files. Use --output-dir (-d) instead.");
    process.exit(1);
  }

  const VALID_FORMATS = ["markdown", "text", "csv", "json"];
  const format = flags.format ?? "markdown";
  if (!VALID_FORMATS.includes(format)) {
    console.error(`Error: Unknown format "${format}". Supported: ${VALID_FORMATS.join(", ")}`);
    process.exit(1);
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

  const model = flags.model ?? config.model;

  const inputPaths = positional.length > 0 ? positional : [];

  if (inputPaths.length === 0) {
    const content = await readStdin();
    if (!content.trim()) {
      console.error("Error: No input provided. Pipe content via stdin or specify an input file.");
      process.exit(1);
    }
    process.stdout.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "EPIPE") process.exit(0);
    });
    const ok = await convertOne({ inputPath: null, content, skill, agent, model, format, flags });
    if (!ok) process.exit(1);
  } else {
    const outputDir = flags.outputDir || process.cwd();

    if (inputPaths.length > 1) {
      const flatBasenames = inputPaths.map((p) => path.basename(p, path.extname(p)));
      const basenameCounts = new Map<string, string[]>();
      for (let i = 0; i < flatBasenames.length; i++) {
        const key = flatBasenames[i];
        if (!basenameCounts.has(key)) basenameCounts.set(key, []);
        basenameCounts.get(key)!.push(inputPaths[i]);
      }
      const collisions = [...basenameCounts].filter(([, paths]) => paths.length > 1);

      if (collisions.length > 0) {
        console.error(`\x1b[33m⚠\x1b[0m Multiple inputs would produce the same output basename:`);
        for (const [basename, paths] of collisions) {
          console.error(`  ${basename}:`);
          for (const p of paths) console.error(`    → ${p}`);
        }
        const useRelative = await promptYesNo(
          "\x1b[33m⚠\x1b[0m Save with relative directory paths (e.g. dir1/readme.html)? (y/N): ",
        );
        if (!useRelative) {
          console.error(
            "Aborted. Rename your input files to use different basenames, or use --output (-o) for each file.",
          );
          process.exit(1);
        }
      }

      const collisionPaths = collisions.flatMap(([, paths]) => paths);
      const commonRoot = findCommonPath(collisionPaths);

      const outputPlan = inputPaths.map((p) => ({
        inputPath: p,
        outputPath: collisions.length > 0
          ? resolveCollisionOutput(p, outputDir, commonRoot)
          : path.resolve(outputDir, `${path.basename(p, path.extname(p))}.html`),
      }));

      const existingFiles = outputPlan.filter((p) => fs.existsSync(p.outputPath));
      if (existingFiles.length > 0) {
        if (process.stdin.isTTY && process.stderr.isTTY) {
          console.error(`\x1b[33m⚠\x1b[0m The following output files already exist:`);
          for (const p of existingFiles) console.error(`  ${p.outputPath}`);
          const ok = await promptYesNo("\x1b[33m⚠\x1b[0m Overwrite? (y/N): ");
          if (!ok) {
            console.error("Aborted.");
            process.exit(1);
          }
        }
      }

      let failed = 0;
      for (const plan of outputPlan) {
        let content: string;
        try {
          content = fs.readFileSync(plan.inputPath, "utf-8");
        } catch (err) {
          console.error(`Error: Cannot read "${plan.inputPath}": ${err instanceof Error ? err.message : err}`);
          failed++;
          continue;
        }
        const ok = await convertOne({
          inputPath: plan.inputPath,
          content,
          skill,
          agent,
          model,
          format,
          flags,
          resolvedOutputPath: plan.outputPath,
        });
        if (!ok) failed++;
      }
      if (failed > 0) {
        console.error(`\n${failed}/${inputPaths.length} file(s) failed.`);
        process.exit(1);
      }
    } else {
      let failed = 0;
      for (const inputPath of inputPaths) {
        let content: string;
        try {
          content = fs.readFileSync(inputPath, "utf-8");
        } catch (err) {
          console.error(`Error: Cannot read "${inputPath}": ${err instanceof Error ? err.message : err}`);
          failed++;
          continue;
        }
        const ok = await convertOne({ inputPath, content, skill, agent, model, format, flags });
        if (!ok) failed++;
      }
      if (failed > 0) {
        console.error(`\n${failed}/${inputPaths.length} file(s) failed.`);
        process.exit(1);
      }
    }
  }
}

async function convertOne(opts: {
  inputPath: string | null;
  content: string;
  skill: LoadedSkill;
  agent: DetectedAgent;
  model: string | undefined;
  format: string;
  flags: Record<string, string>;
  resolvedOutputPath?: string;
}): Promise<boolean> {
  const { inputPath, content, skill, agent: selectedAgent, model, format, flags } = opts;

  const prompt = assemblePrompt({ body: skill.body, content, format });

  const label = inputPath ? path.basename(inputPath) : "stdin";
  console.error(`Template: ${skill.zhName} (${skill.id})`);
  console.error(`Agent: ${selectedAgent.label} (${selectedAgent.id})`);
  if (model) console.error(`Model: ${model}`);
  if (inputPath) console.error(`Input: ${label}`);
  console.error("");

  const stream = invokeAgent({
    agent: selectedAgent.id,
    prompt,
    model,
  });

  const reader = stream.getReader();
  let htmlAccum = "";
  const spinner = createSpinner(`Generating HTML for ${label}...`);
  let stderrBuf = "";
  let exitCode: number | null = null;

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
          spinner.tick();
          break;
        case "error":
          spinner.stop(`\x1b[31m✗\x1b[0m Error: ${value.message}`);
          return false;
        case "stderr":
          stderrBuf += value.text;
          break;
        case "done":
          exitCode = value.code;
          break;
        case "meta":
        case "raw":
        case "start":
          break;
      }
    }
  } catch (err) {
    spinner.stop(`\x1b[31m✗\x1b[0m Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }

  if (exitCode !== null && exitCode !== 0) {
    const elapsed = ((Date.now() - spinner.start) / 1000).toFixed(1);
    spinner.stop(`\x1b[31m✗\x1b[0m Agent exited with code ${exitCode} after ${elapsed}s`);
    if (stderrBuf.trim()) {
      console.error("Agent stderr:", stderrBuf.trim());
    }
    return false;
  }

  const elapsed = ((Date.now() - spinner.start) / 1000).toFixed(1);
  spinner.stop(`\x1b[32m✓\x1b[0m Done in ${elapsed}s`);

  const html = extractHtml(htmlAccum);

  if (!html) {
    console.error("Error: Agent did not produce valid HTML output.");
    if (htmlAccum) console.error("Raw output:\n", htmlAccum.slice(0, 500));
    return false;
  }

  let outputPath: string | undefined;

  if (opts.resolvedOutputPath) {
    outputPath = opts.resolvedOutputPath;
  } else if (flags.output) {
    outputPath = path.resolve(flags.output);
  } else if (inputPath) {
    const basename = path.basename(inputPath, path.extname(inputPath));
    const outputDir = flags.outputDir || process.cwd();
    outputPath = path.resolve(outputDir, `${basename}.html`);
  }

  if (outputPath) {
    if (!opts.resolvedOutputPath && fs.existsSync(outputPath)) {
      const overwrite = await promptOverwrite(outputPath);
      if (!overwrite) {
        console.error(`Skipped: ${outputPath}`);
        return true;
      }
    }

    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, html, "utf-8");
      console.error(`Saved to: ${outputPath}`);
      return true;
    } catch (err) {
      console.error(`Error: Cannot write to "${outputPath}": ${err instanceof Error ? err.message : err}`);
      return false;
    }
  } else {
    process.stdout.write(html);
    return true;
  }
}

function findCommonPath(dirs: string[]): string {
  if (dirs.length === 0) return "";
  const resolved = dirs.map((d) => path.resolve(d));
  const segments = resolved.map((d) => d.split(path.sep).filter(Boolean));
  const minLen = Math.min(...segments.map((s) => s.length));
  let common = 0;
  for (let i = 0; i < minLen; i++) {
    const seg = segments[0][i];
    if (segments.every((s) => s[i] === seg)) common++;
    else break;
  }
  return segments[0].slice(0, common).join(path.sep) || path.sep;
}

function resolveCollisionOutput(inputPath: string, outputDir: string, commonRoot: string): string {
  const basename = path.basename(inputPath, path.extname(inputPath));
  const inputDir = path.resolve(path.dirname(inputPath));
  let relativeDir = path.relative(commonRoot, inputDir);
  relativeDir = relativeDir
    .split(path.sep)
    .filter((s) => s !== ".." && s !== ".")
    .join(path.sep);
  if (relativeDir) {
    return path.resolve(outputDir, relativeDir, `${basename}.html`);
  }
  return path.resolve(outputDir, `${basename}.html`);
}

function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

function promptOverwrite(filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      resolve(true);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    rl.question(`\x1b[33m⚠\x1b[0m ${filepath} already exists. Overwrite? (y/N): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
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

async function handleAuto(args: string[]): Promise<void> {
  const flags: Record<string, string> = {};
  let forceAi = false;
  let showMatchOnly = false;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--force-ai") {
      forceAi = true;
    } else if (arg === "--show-match-only") {
      showMatchOnly = true;
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

  if (flags.output && flags.outputDir) {
    console.error("Error: --output (-o) and --output-dir (-d) cannot be used together.");
    process.exit(1);
  }

  if (showMatchOnly && flags.output) {
    console.error("Error: --show-match-only cannot be used with --output (-o).");
    process.exit(1);
  }

  const VALID_FORMATS = ["markdown", "text", "csv", "json"];
  const format = flags.format ?? "markdown";
  if (!VALID_FORMATS.includes(format)) {
    console.error(`Error: Unknown format "${format}". Supported: ${VALID_FORMATS.join(", ")}`);
    process.exit(1);
  }

  const config = loadConfig();

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

  const model = flags.model ?? config.model;

  const inputPath = positional.length > 0 ? positional[0] : null;
  let content: string;
  if (inputPath) {
    try {
      content = fs.readFileSync(inputPath, "utf-8");
    } catch (err) {
      console.error(`Error: Cannot read "${inputPath}": ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else {
    content = await readStdin();
    if (!content.trim()) {
      console.error("Error: No input provided. Pipe content via stdin or specify an input file.");
      process.exit(1);
    }
    process.stdout.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "EPIPE") process.exit(0);
    });
  }

  const templates = getAvailableTemplates();
  if (templates.length === 0) {
    console.error("Error: No templates found.");
    process.exit(1);
  }

  const label = inputPath ? path.basename(inputPath) : "stdin";
  console.error(`Matching template for: ${label}`);
  console.error(`Agent: ${agent.label} (${agent.id})`);
  if (model) console.error(`Model: ${model}`);
  console.error("");

  const result = await matchTemplate(
    content,
    templates,
    SKILLS_DIR,
    agent.id,
    forceAi,
  );

  console.error(`Matched: ${result.zhName} (${result.templateId})`);
  console.error(`Confidence: ${result.confidence}/10`);
  console.error(`Reason: ${result.reason}`);

  if (showMatchOnly) return;

  console.error("");

  const skill = getTemplate(result.templateId);
  if (!skill) {
    console.error(`Error: Unknown template "${result.templateId}"`);
    process.exit(1);
  }

  const ok = await convertOne({ inputPath, content, skill, agent, model, format, flags });
  if (!ok) process.exit(1);
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
      try {
        saveConfig({ defaultTemplate: val });
        console.log(`Default template set to: ${val} (${skill.zhName})`);
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
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
      if (!agent.available) {
        console.error(`Error: Agent "${val}" (${agent.label}) is not installed.`);
        process.exit(1);
      }
      if (agent.unsupported) {
        console.error(
          `Error: Agent "${val}" (${agent.label}) uses an unsupported protocol.`,
        );
        console.error("Available supported agents:");
        for (const a of agents.filter((a) => a.available && !a.unsupported)) {
          console.error(`  ${a.id} — ${a.label}`);
        }
        process.exit(1);
      }
      try {
        saveConfig({ defaultAgent: val });
        console.log(`Default agent set to: ${val} (${agent.label})`);
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
      break;
    }
    case "set-model": {
      if (!val) {
        console.error("Error: Specify a model ID.");
        process.exit(1);
      }
      try {
        saveConfig({ model: val });
        console.log(`Default model set to: ${val}`);
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
      break;
    }
    case "reset": {
      try {
        saveConfig({ defaultTemplate: undefined, defaultAgent: undefined, model: undefined });
        console.log("Configuration reset.");
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
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
    case "auto":
      await handleAuto(rest);
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