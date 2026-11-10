import { join } from "node:path";
import { canonical } from "@odsuite/protocol";
import {
  connectRoot,
  type Factory,
  type Manager,
  observeOwner,
  readAuthority,
  startManager,
  stopManager,
} from "@odsuite/sidecar";
import type { NativePreparation, RenderMethods } from "@open-motion/render/contract";
import type { Methods, Status } from "@open-motion/standalone";
import type { PackageManifest, Selection } from "./contract.js";
import { installed } from "./install.js";

async function connection(description: PackageManifest, selection: Selection) {
  const link = await connectRoot(selection.data, selection.scope),
    directory = await link.factory.directory();
  const target = directory.instances.find(
    (i) => i.service === "standalone" && i.kind === "hosted" && i.phase === "ready",
  );
  if (!target) throw Error("managed application is not ready");
  const peer = await link.factory.connect<Methods>(target),
    status = await peer.call("status", null);
  if (canonical(status.manifest) !== canonical(description.release))
    throw Error("running application release differs from this package");
  if (!status.daemon.ok) throw Error("running application Daemon is unhealthy");
  return { factory: link.factory, manager: link.manager, status };
}
export async function status(
  description: PackageManifest,
  selection: Selection,
): Promise<{ state: string; runtime?: Status }> {
  let connected = false;
  try {
    await connectRoot(selection.data, selection.scope);
    connected = true;
  } catch {
    // Only offline authority can distinguish an unclaimed root from interruption.
  }
  if (connected) return { state: "running", runtime: (await connection(description, selection)).status };
  const authority = await readAuthority(selection.data);
  if (!authority) return { state: "uninitialized" };
  return { state: authority.manager.phase === "closed" ? "stopped" : "interrupted" };
}
export async function start(description: PackageManifest, selection: Selection) {
  const current = await status(description, selection);
  if (current.state === "running") return current;
  if (!["stopped", "uninitialized"].includes(current.state))
    throw Error("application authority requires explicit recovery");
  const receipt = await installed(description, selection, "standalone");
  await startManager({
    root: receipt.data,
    scope: selection.scope,
    command: process.execPath,
    args: [
      join(receipt.path, "main.mjs"),
      "--root",
      receipt.data,
      "--channel",
      selection.scope.channel,
      "--namespace",
      selection.scope.namespace,
    ],
    log: join(receipt.data, "manager.log"),
    timeout: 30000,
  });
  return status(description, selection);
}
export async function stop(description: PackageManifest, selection: Selection) {
  const current = await status(description, selection);
  if (["stopped", "uninitialized"].includes(current.state)) return current;
  if (current.state !== "running") throw Error("application authority requires explicit recovery");
  const link = await connection(description, selection),
    owner = await observeOwner(selection.data, selection.scope);
  if (!owner || owner.incarnation !== link.manager.incarnation) throw Error("application manager changed before stop");
  await stopManager(owner);
  return status(description, selection);
}
async function prepare(factory: Factory): Promise<NativePreparation> {
  const entry = (await factory.directory()).instances.find((i) => i.service === "renderer" && i.phase === "ready");
  if (!entry) throw Error("native preparation service is unavailable");
  const peer = await factory.connect<RenderMethods>(entry);
  let reply = await peer.call("native_prepare", {});
  if (!reply.ok) throw Error(reply.error.message);
  const attempt = reply.value.attempt;
  while (reply.value.state === "preparing") {
    await new Promise((done) => setTimeout(done, 100));
    reply = await peer.call("native_prepare_read", {});
    if (!reply.ok) throw Error(reply.error.message);
    if (reply.value.attempt !== attempt) throw Error("native preparation attempt changed");
  }
  return reply.value;
}
export async function native(description: PackageManifest, selection: Selection) {
  const prior = await status(description, selection);
  if (prior.state === "running") return prepare((await connection(description, selection)).factory);
  if (!["stopped", "uninitialized"].includes(prior.state))
    throw Error("application authority requires explicit recovery");
  const receipt = await installed(description, selection, "standalone");
  const owner: Manager = await startManager({
    root: receipt.data,
    scope: selection.scope,
    command: process.execPath,
    args: [
      join(receipt.path, "main.mjs"),
      "--root",
      receipt.data,
      "--channel",
      selection.scope.channel,
      "--namespace",
      selection.scope.namespace,
      "--mode",
      "prepare",
    ],
    log: join(receipt.data, "manager.log"),
    timeout: 30000,
  });
  const outcome = await connectRoot(receipt.data, selection.scope)
    .then((link) => prepare(link.factory))
    .then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
  try {
    await stopManager(owner);
  } catch (cleanup) {
    if (!outcome.ok)
      throw new AggregateError(
        [outcome.error, cleanup],
        `${String(outcome.error)}; preparation drain failed: ${String(cleanup)}`,
      );
    throw cleanup;
  }
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}
