import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface CliConfig {
  defaultTemplate?: string;
  defaultAgent?: string;
  model?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".config", "html-anything");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): CliConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw) as CliConfig;
    }
  } catch {
  }
  return {};
}

export function saveConfig(config: CliConfig): void {
  ensureConfigDir();
  const merged = { ...loadConfig(), ...config };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), "utf-8");
  } catch (err) {
    throw new Error(
      `Cannot write config to ${CONFIG_PATH}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}