import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { Receipt, Session } from "@odsuite/installer";
import { connectRoot, type Factory, observeOwner, readAuthority, startManager, stopManager } from "@odsuite/sidecar";
import type { NativePreparation, RenderMethods } from "@open-motion/render/contract";
import type { Status } from "@open-motion/standalone";
import { admitRuntime } from "@open-motion/standalone/admission";
import type { PackageManifest, Selection } from "./contract.js";
import { readInstalled, usingSession } from "./install.js";

export async function inspect(description: PackageManifest, selection: Selection) {
  const link = await connectRoot(selection.data, selection.scope).catch(() => undefined);
  if (link) {
    const peer = await admitRuntime(link.factory, description.release);
    const runtime = await peer.call("status", null);
    if (!runtime.daemon.ok) throw Error("running application Daemon is unhealthy");
    return { state: "running", runtime, link } as const;
  }
  // Only offline authority can distinguish an unclaimed root from interruption.
  const authority = await readAuthority(selection.data);
  if (!authority) return { state: "uninitialized" } as const;
  return { state: authority.manager.phase === "closed" ? "stopped" : "interrupted" } as const;
}

export async function status(
  description: PackageManifest,
  selection: Selection,
): Promise<{ state: string; runtime?: Status }> {
  const current = await inspect(description, selection);
  return current.state === "running" ? { state: current.state, runtime: current.runtime } : current;
}
export async function start(description: PackageManifest, selection: Selection) {
  const current = await status(description, selection);
  if (current.state === "running") return current;
  if (!["stopped", "uninitialized"].includes(current.state))
    throw Error("application authority requires explicit recovery");
  await usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      const receipt = await readInstalled(session, description, selection, "standalone");
      await launch(receipt, selection, session);
    },
  );
  return status(description, selection);
}
export async function stop(description: PackageManifest, selection: Selection) {
  const current = await inspect(description, selection);
  if (current.state === "stopped" || current.state === "uninitialized") return current;
  if (current.state !== "running") throw Error("application authority requires explicit recovery");
  const owner = await observeOwner(selection.data, selection.scope);
  if (!owner || owner.incarnation !== current.link.manager.incarnation)
    throw Error("application manager changed before stop");
  await stopManager(owner);
  return status(description, selection);
}
async function prepare(factory: Factory, signal?: AbortSignal): Promise<NativePreparation> {
  signal?.throwIfAborted();
  const entry = (await factory.directory()).instances.find((i) => i.service === "renderer" && i.phase === "ready");
  if (!entry) throw Error("native preparation service is unavailable");
  const peer = await factory.connect<RenderMethods>(entry);
  let reply = await peer.call("native_prepare", {});
  if (!reply.ok) throw Error(reply.error.message);
  const attempt = reply.value.attempt;
  while (reply.value.state === "preparing") {
    await delay(100, undefined, { signal });
    signal?.throwIfAborted();
    reply = await peer.call("native_prepare_read", {});
    if (!reply.ok) throw Error(reply.error.message);
    if (reply.value.attempt !== attempt) throw Error("native preparation attempt changed");
  }
  signal?.throwIfAborted();
  return reply.value;
}
export async function native(description: PackageManifest, selection: Selection, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const prior = await inspect(description, selection);
  if (prior.state === "running") return prepare(prior.link.factory, signal);
  if (!["stopped", "uninitialized"].includes(prior.state))
    throw Error("application authority requires explicit recovery");
  const owner = await usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      const receipt = await readInstalled(session, description, selection, "standalone");
      signal?.throwIfAborted();
      return launch(receipt, selection, session, "prepare");
    },
  );
  const outcome = await connectRoot(owner.root, selection.scope)
    .then((link) => prepare(link.factory, signal))
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

export async function launch(receipt: Receipt, selection: Selection, session: Session, mode = "runtime") {
  if (await session.gc.read()) throw Error("unfinished collection must resume before runtime launch");
  const owner = await startManager({
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
      mode,
    ],
    log: join(receipt.data, "manager.log"),
    timeout: 30000,
  });
  try {
    await session.use({
      requestId: receipt.requestId,
      application: receipt.path,
      data: receipt.data,
      carrier: receipt.carrier,
      manager: owner,
    });
    return owner;
  } catch (error) {
    try {
      await stopManager(owner);
    } catch (cleanup) {
      throw new AggregateError([error, cleanup], "installation use failed and runtime drain is uncertain");
    }
    throw error;
  }
}
