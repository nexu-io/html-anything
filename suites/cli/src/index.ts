import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { format, guard } from "@odsuite/guard";
import { development, devHelp } from "./dev.js";
import { inspect, inspectHelp } from "./inspect.js";
import { pipeline, pipelineHelp } from "./pipeline.js";
import { recoverHelp, recovery } from "./recover.js";
import { serve, serveHelp } from "./serve.js";

const version = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string })
  .version;
const help =
  "odsuite guard [--root <repo>] [--json]\n\nRead <repo>/odsuite.yaml and check directory and file policies.\nExit: 0 clean, 1 findings, 2 operational error. Full scan; no staged mode.";

export interface Output {
  stdout(value: string): void;
  stderr(value: string): void;
}

export async function run(args: string[], cwd: string, output: Output): Promise<number> {
  const json = args.includes("--json");
  try {
    if (args.length === 1 && ["--help", "-h"].includes(args[0] ?? "")) {
      output.stdout(`${help}\n\n${devHelp}\n\n${pipelineHelp}\n\n${inspectHelp}\n\n${serveHelp}\n\n${recoverHelp}\n`);
      return 0;
    }
    if (args.length === 1 && args[0] === "--version") {
      output.stdout(`${version}\n`);
      return 0;
    }
    if (args[0] === "dev") return await development(args, cwd, output);
    if (args[0] === "recover") return await recovery(args, cwd, output);
    if (args[0] === "inspect") return await inspect(args, cwd, output);
    if (args[0] === "serve") return await serve(args, cwd, output);
    if (["version", "build", "check", "pack", "candidate"].includes(args[0] ?? ""))
      return await pipeline(args, cwd, output);
    if (args[0] !== "guard")
      throw new Error(
        "expected subcommand: odsuite guard|dev|inspect|recover|serve|version|build|check|pack|candidate",
      );
    if (args.length === 2 && ["--help", "-h"].includes(args[1] ?? "")) {
      output.stdout(`${help}\n`);
      return 0;
    }
    let root: string | undefined;
    const seen = new Set<string>();
    for (let index = 1; index < args.length; index += 1) {
      const arg = args[index] ?? "";
      if (seen.has(arg)) throw new Error(`duplicate option: ${arg}`);
      seen.add(arg);
      if (arg === "--json") continue;
      const next = args[index + 1];
      if (arg !== "--root" || !next || next.startsWith("--")) throw new Error(`unknown or incomplete option: ${arg}`);
      root = resolve(cwd, next);
      index += 1;
    }
    if (!root) {
      try {
        root = (await promisify(execFile)("git", ["rev-parse", "--show-toplevel"], { cwd })).stdout.trim();
      } catch {
        root = cwd;
      }
    }
    const report = await guard({ root });
    output.stdout(`${format(report, json)}\n`);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args[0] === "dev" && args[1] === "connect") output.stderr(`odsuite dev connect: ${message}\n`);
    else if (json || args[0] === "dev" || args[0] === "inspect" || args[0] === "recover" || args[0] === "serve")
      output.stdout(`${JSON.stringify({ schemaVersion: 1, ok: false, error: { kind: "operational", message } })}\n`);
    else output.stderr(`odsuite ${args[0] ?? ""}: ${message}\n`);
    return 2;
  }
}
