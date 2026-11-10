import { readFile, realpath, rm } from "node:fs/promises";
import { join } from "node:path";
import { guard } from "@odsuite/guard";
import { parseDocument } from "yaml";
import { loadBuild, loadPackage } from "./build.js";
import { channelRoot, configuration } from "./config.js";
import { execute, inventory, json, located, owned, revision, run } from "./files.js";
import type { CheckReceipt, Gate } from "./types.js";
export const gates: Gate[] = ["policy", "tests", "artifacts"];
export async function check(root: string, lane: string, gate: Gate): Promise<CheckReceipt> {
  if (!gates.includes(gate)) throw Error("unknown quality gate");
  root = await realpath(root);
  const path = await owned(root, join(channelRoot(root, lane), "checks", `${gate}.json`));
  await rm(path, { force: true });
  const built = await loadBuild(root, lane);
  const confirmSource = async () => {
    if (
      !built.source ||
      (await revision(root)) !== built.source ||
      (await execute("git", ["status", "--porcelain"], { cwd: root })).stdout.trim()
    )
      throw Error("source gate requires the clean build commit");
    const config = await configuration(root, lane);
    for (const carrier of Object.keys(config.units))
      if (
        (await inventory(await located(root, config.units[carrier]))) !==
        (await inventory(await located(root, built.carriers[carrier])))
      )
        throw Error("source gate requires the built carrier outputs");
  };
  const receipt: CheckReceipt = {
    gate,
    channel: lane,
    result: "failed",
    source: built.source,
    fingerprint: built.fingerprint,
    details: null,
  };
  try {
    if (gate !== "artifacts") await confirmSource();
    if (gate === "policy") {
      await validateWorkflows(root);
      const report = await guard({ root });
      if (!report.ok) throw Error("guard findings block policy gate");
      await run(root, ["-r", "--if-present", "run", "lint"]);
      await run(root, ["exec", "biome", "check", "."]);
      receipt.details = { files: report.files };
    } else if (gate === "tests") {
      await run(root, ["-r", "--if-present", "run", "test"], { ...process.env, ODSUITE_BUILD: built.version });
      receipt.details = { command: "pnpm -r --if-present run test" };
    } else receipt.details = (await loadPackage(root, lane)).packages;
    if (gate !== "artifacts") await confirmSource();
    receipt.result = "passed";
    return receipt;
  } finally {
    await json(path, receipt);
  }
}

/** Shape validation is shared; workflow authors still choose all quality gates. */
export async function validateWorkflows(root: string): Promise<Record<string, string[]>> {
  const found: Record<string, string[]> = {};
  for (const name of ["stable.release.yml", "channel.release.yml"]) {
    let raw: string;
    try {
      raw = await readFile(join(root, ".github/workflows", name), "utf8");
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw fault;
    }
    const doc = parseDocument(raw, { uniqueKeys: true });
    if (doc.errors.length) throw new Error("invalid release workflow YAML");
    const workflow = doc.toJS({ maxAliasCount: 0 }) as {
      jobs?: Record<string, { steps?: { run?: unknown; uses?: unknown }[] }>;
    };
    if (!workflow.jobs || !Object.keys(workflow.jobs).length) throw new Error("release workflow needs jobs");
    found[name] = [];
    for (const job of Object.values(workflow.jobs)) {
      if (!Array.isArray(job.steps)) throw new Error("release jobs must declare explicit steps");
      for (const step of job.steps) {
        if (
          step.run !== undefined &&
          (typeof step.run !== "string" ||
            step.run.length > 256 ||
            !/^(?:pnpm exec odsuite [a-z]+(?: .*?)?|pnpm install --frozen-lockfile)$/.test(step.run) ||
            /[\r\n;|&`<>]|\$\(|\$\{\{/.test(step.run))
        )
          throw new Error("release workflow run must be one short odsuite invocation");
        if (typeof step.run === "string") found[name]?.push(step.run);
        if (typeof step.uses === "string" && step.uses.startsWith("./"))
          throw new Error("release workflow cannot hide implementation in local actions");
      }
    }
  }
  return found;
}
