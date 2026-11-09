import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type LaunchResult,
  ObservationError,
  ObservationUnavailable,
  Observer,
  runElectron,
  waitGone,
} from "@odsuite/automation";
import { guard } from "@odsuite/guard";
import { inspect } from "@odsuite/pack";
import { identify } from "@odsuite/protocol";
import { readProduct, writeProduct } from "@odsuite/release";
import { parseDocument } from "yaml";
import { loadBuild, loadPackage } from "./build.js";
import { channelRoot, configuration } from "./config.js";
import { json, located, run } from "./files.js";
import type { BuildReceipt, CheckReceipt, Gate, PackReceipt } from "./types.js";

export const gates: Gate[] = ["policy", "tests", "artifacts", "installed", "desktop"];
interface HostProbe {
  pid: number;
  automation: unknown;
  generation: string;
  nonce: string;
  capsule: string;
  renderer: string;
  daemon: { pid: number; generation: string; nonce: string };
}
function identity(build: BuildReceipt, result: LaunchResult<HostProbe>): HostProbe {
  const observed = result.observed;
  if (
    !observed ||
    observed.generation !== build.generation ||
    observed.daemon?.generation !== build.generation ||
    !observed.nonce ||
    observed.nonce !== observed.daemon?.nonce ||
    !observed.capsule ||
    !observed.renderer
  )
    throw new Error("installed lifecycle evidence mismatch");
  return observed;
}
async function desktop(root: string, lane: string, build: BuildReceipt, packaged: PackReceipt) {
  const base = join(channelRoot(root, lane), "checks", `desktop-${Date.now()}`);
  const product = await readProduct(await located(root, build.content));
  const generation = { ...product.envelope.generation, carrier: build.carrierABI + 1 };
  const candidate = join(base, "incompatible");
  await writeProduct(candidate, {
    ...product,
    envelope: { ...product.envelope, generation, digest: identify(generation) },
  });
  const observer = await Observer.open({
    directory: join(base, "observations"),
    bundle: build.manifest.identity.appid,
    requireFullscreen: true,
  });
  const cases: unknown[] = [];
  try {
    for (const [name, mode] of [
      ["normal-exit", "exit"],
      ["failed-startup", "failure"],
      ["sigkill", "kill"],
    ] as const) {
      const result = await runElectron<HostProbe>({
        name,
        mode,
        observer,
        cwd: root,
        executable: await located(root, packaged.package.executable),
        receipt: join(base, `${name}.json`),
        env: {
          ODSUITE_DATA: join(base, `${name}-state`),
          ODSUITE_CANDIDATE: mode === "failure" ? candidate : undefined,
        },
        ...(mode === "failure" ? { message: "incompatible carrier ABI" } : {}),
      });
      if (mode !== "failure") await waitGone(identity(build, result).daemon.pid);
      cases.push({ name, pid: result.pid, exit: result.exit, desktop: result.desktop });
    }
    return { cases, signing: "unqualified", remoteUpdates: "unqualified" };
  } finally {
    await observer.close();
  }
}
export async function check(
  root: string,
  lane: string,
  gate: Gate,
  platform?: string,
  arch?: string,
): Promise<CheckReceipt> {
  if (!gates.includes(gate)) throw new Error("unknown quality gate");
  const config = await configuration(root, lane);
  root = config.root;
  const build = await loadBuild(root, lane);
  const receipt: CheckReceipt = {
    schema: 1,
    gate,
    channel: lane,
    result: "failed",
    source: build.source,
    fingerprint: build.fingerprint,
    details: null,
  };
  try {
    if (gate === "policy") {
      await validateWorkflows(root);
      const report = await guard({ root });
      if (!report.ok) throw new Error("guard findings block policy gate");
      await run(root, ["-r", "--if-present", "run", "lint"]);
      await run(root, ["exec", "biome", "check", "."]);
      receipt.details = { files: report.files };
    } else if (gate === "tests") {
      await run(root, ["-r", "--if-present", "run", "test"]);
      receipt.details = { command: "pnpm -r --if-present run test" };
    } else {
      const packaged = await loadPackage(root, lane, platform, arch);
      receipt.artifact = packaged.artifact.sha256;
      if (gate === "artifacts") receipt.details = { archive: packaged.artifact.sha256, inventory: packaged.inventory };
      else {
        if (packaged.platform !== "mac" || process.platform !== "darwin")
          throw new ObservationUnavailable("installed SDK probe currently requires macOS");
        const native = await inspect(await located(root, packaged.package.app));
        if (native.appid !== build.manifest.identity.appid || native.version !== build.version)
          throw new Error("native installed identity mismatch");
        if (gate === "desktop") receipt.details = { native, ...(await desktop(root, lane, build, packaged)) };
        else {
          const base = join(channelRoot(root, lane), "checks", `installed-${Date.now()}`);
          const launches: unknown[] = [];
          for (const name of ["initial", "cold"]) {
            const result = await runElectron<HostProbe>({
              name,
              mode: "exit",
              cwd: root,
              executable: await located(root, packaged.package.executable),
              receipt: join(base, `${name}.json`),
              env: { ODSUITE_DATA: join(base, "state"), ODSUITE_CANDIDATE: undefined },
            });
            const observed = identity(build, result);
            await waitGone(observed.daemon.pid);
            launches.push({
              name,
              pid: result.pid,
              daemonPid: observed.daemon.pid,
              generation: observed.generation,
              nonce: observed.nonce,
              stopped: true,
              automation: observed.automation,
            });
          }
          receipt.details = { native, launches, signing: "unqualified", remoteUpdates: "unqualified" };
        }
      }
    }
    receipt.result = "passed";
    return receipt;
  } catch (fault) {
    if (gate === "desktop")
      receipt.details = {
        result:
          fault instanceof ObservationError
            ? fault.receipt.result
            : fault instanceof ObservationUnavailable
              ? "unqualified"
              : "failed",
        error: String(fault),
      };
    throw fault;
  } finally {
    await json(join(channelRoot(root, lane), "checks", `${gate}.json`), receipt);
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
