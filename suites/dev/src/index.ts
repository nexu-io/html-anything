import { lstat, realpath } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { type FactoryScope, factoryScope } from "@odsuite/protocol";
import { connectRoot, managerAlive, observeOwner, readAuthority, startManager, stopManager } from "@odsuite/sidecar";
import { managerRoot, plan as prepare } from "./config.js";
import type { Adapter, Methods, Plan, View } from "./types.js";

export { managerRoot, plan, repository } from "./config.js";
export type { Adapter, CarrierContext, CarrierRuntime, Plan } from "./types.js";
export interface Target {
  repo: string;
  scope: FactoryScope;
  carrier?: string;
}
export async function status(target: Target) {
  const scope = factoryScope(target.scope),
    repo = await realpath(target.repo),
    root = managerRoot(repo, scope);
  try {
    await lstat(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { state: "stopped" as const, root, scope };
    throw error;
  }
  let connected: Awaited<ReturnType<typeof connectRoot>>;
  try {
    connected = await connectRoot(root, scope, 15000);
  } catch {
    const directory = await readAuthority(root);
    if (!directory) return { state: "uninitialized" as const, root, scope };
    if (directory.manager.phase !== "closed")
      return { state: "interrupted" as const, root, scope, manager: directory.manager };
    if (await observeOwner(root, scope)) throw new Error("closed directory still has a live owner");
    return { state: "stopped" as const, root, scope };
  }
  const owner = await observeOwner(root, scope);
  if (!owner || !(await managerAlive(owner)))
    throw new Error("sidecar owner is not live; explicit recovery is required");
  const readControl = async () => {
    const directory = await connected.factory.directory();
    const control = directory.instances.find(
      (i) => i.service === "development" && i.kind === "hosted" && i.phase !== "retired",
    );
    if (!control) throw new Error("factory is not a development composition");
    return control;
  };
  const control = await readControl();
  const pending = (phase: typeof control.phase) => {
    if (target.carrier) throw new Error("carrier identity is not ready; query or stop the factory without --carrier");
    return {
      state:
        phase === "failed" ? ("failed" as const) : phase === "stopping" ? ("stopping" as const) : ("starting" as const),
      root,
      scope,
      manager: connected.manager,
    };
  };
  if (control.phase !== "ready") return pending(control.phase);
  let view: View;
  try {
    const peer = await connected.factory.connect<Methods>(control);
    view = await peer.call("status", null);
  } catch (error) {
    // Quiesce may begin between directory observation and the handler call.
    const current = await readControl();
    if (current.phase !== "ready") return pending(current.phase);
    throw error;
  }
  if (view.plan.repo !== repo) throw new Error("development workspace identity mismatch");
  if (target.carrier && target.carrier !== view.plan.carrier)
    throw new Error("carrier does not match the active factory");
  const processes = await connected.factory.inspect();
  return {
    processes: processes.map((p) => ({ service: p.service, pid: p.pid, state: p.state, generation: p.generation })),
    state:
      view.runtime.healthy && processes.every((p) => p.state === "running")
        ? ("running" as const)
        : ("failed" as const),
    root,
    scope,
    manager: connected.manager,
    ...view,
  };
}
export async function start(input: Plan) {
  const current = await status(input);
  if (!["stopped", "uninitialized"].includes(current.state))
    throw new Error(`factory is ${current.state}; use status, stop/restart or explicit recovery`);
  await startManager({
    root: input.root,
    scope: input.scope,
    command: process.execPath,
    args: [fileURLToPath(import.meta.resolve("@odsuite/dev/main"))],
    env: { ODSUITE_DEV_PLAN: JSON.stringify(input) },
    log: `${input.root}/manager.log`,
    timeout: 200000,
  });
  return status(input);
}
export async function stop(target: Target) {
  const current = await status(target);
  if (current.state === "stopped" || current.state === "uninitialized") return current;
  if (current.state === "interrupted")
    throw new Error(`development is interrupted; inspect/recover ${current.root} explicitly`);
  const owner = await observeOwner(current.root, target.scope);
  if (!owner) throw new Error("manager ownership changed");
  await stopManager(owner, { timeout: 200000 });
  return status(target);
}
export async function restart(input: Plan) {
  await stop({ repo: input.repo, scope: input.scope });
  return start(input);
}
export async function connect(target: Target) {
  const current = await status(target);
  if (current.state !== "running") throw new Error("development is not running");
  const adapter = (await import(pathToFileURL(current.plan.entry).href)) as Adapter;
  if (typeof adapter.connect !== "function") throw new Error("carrier has no development transport attachment");
  const { factory } = await connectRoot(current.root, target.scope);
  await adapter.connect({ factory, repo: current.plan.repo, scope: current.plan.scope, version: current.plan.version });
}
export async function configure(target: Target & { watch?: boolean }) {
  if (!target.carrier) throw new Error("--carrier is required for start/restart");
  return prepare({ ...target, carrier: target.carrier });
}
