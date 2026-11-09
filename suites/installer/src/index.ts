import { createRequire } from "node:module";
import { join } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { observeOwner, startManager } from "@odsuite/sidecar";
import { open, registration, rpc, scope } from "./domain.js";
import { bundle, hash, jobPaths, json, save } from "./files.js";
import type { Confirmation, Handle, Job, Journal, Options } from "./types.js";

export { location } from "./domain.js";
export const workerAsset = () => createRequire(import.meta.url).resolve("@odsuite/installer/worker");
export { prepare } from "./prepare.js";
export type { Confirmation, Handle, Journal, Options } from "./types.js";
export async function register(options: Pick<Options, "root" | "target" | "runtime" | "catalog">) {
  const owner = await observeOwner(options.runtime.root, {
    channel: channel(options.catalog.channel),
    namespace: namespace(options.runtime.namespace),
  });
  if (!owner) throw Error("runtime owner unavailable");
  const value = { ...options.runtime, owner, target: options.target };
  let domain: Awaited<ReturnType<typeof open>>;
  try {
    domain = await open(options.root, options.target, options.catalog.product, options.catalog.channel);
  } catch (error) {
    try {
      return await rpc(options.root, options.catalog.channel, "register", value);
    } catch {
      throw error;
    }
  }
  try {
    return await domain.factory.session(() =>
      registration(domain.context, value, options.catalog.product, options.catalog.channel),
    );
  } finally {
    await domain.close();
  }
}
export const arm = (handle: Handle) => rpc(handle.root, handle.channel, "arm", { id: handle.id, nonce: handle.nonce });
export const status = (root: string, lane: string) => rpc(root, lane, "status", null);
export const confirm = (root: string, lane: string, value: Confirmation) => rpc(root, lane, "confirm", value);
export async function inspect(options: { root: string; target: string; product: string; channel: string }) {
  try {
    return await status(options.root, options.channel);
  } catch {
    /* A closed manager can be inspected under a new authority claim. */
  }
  const domain = await open(options.root, options.target, options.product, options.channel);
  try {
    const current = await json<{ id: string }>(join(domain.context.roots.data, "current.json"));
    return current
      ? await json<Journal>(join(domain.context.roots.data, "transactions", current.id, "record.json"))
      : undefined;
  } finally {
    await domain.close();
  }
}
export async function resume(options: {
  root: string;
  target: string;
  product: string;
  channel: string;
  checkpoint?: Options["checkpoint"];
}): Promise<Handle> {
  const domain = await open(options.root, options.target, options.product, options.channel);
  let job: Job;
  try {
    const current = await json<{ id: string }>(join(domain.context.roots.data, "current.json"));
    if (!current) throw Error("no retained installation");
    const saved = await json<Job>(join(domain.context.roots.data, "transactions", current.id, "job.json"));
    if (
      !saved ||
      saved.root !== domain.root ||
      saved.target !== domain.target ||
      saved.metadata.product !== options.product ||
      saved.metadata.channel !== options.channel
    )
      throw Error("retained installation identity mismatch");
    job = saved;
    jobPaths(job, domain.context);
    const record = await json<Journal>(join(job.home, "record.json"));
    if (!record || record.id !== job.id || record.phase === "confirmed") throw Error("no resumable installation");
    if ((await hash(job.executor)) !== record.oldHash) throw Error("retained installation executor changed");
    job.checkpoint = options.checkpoint;
    await save(join(job.home, "job.json"), job);
  } finally {
    await domain.close();
  }
  const identity = await bundle(job.executor, {
    appid: options.channel === "stable" ? options.product : `${options.product}.${options.channel}`,
    version: job.runtime.version,
  });
  const manager = await startManager({
    root: job.root,
    scope: scope(options.channel),
    command: identity.executable,
    args: [job.worker, "--job", join(job.home, "job.json")],
    env: { ELECTRON_RUN_AS_NODE: "1" },
    timeout: 30000,
    log: join(job.home, "manager.log"),
  });
  return { root: job.root, channel: options.channel, id: job.id, nonce: job.nonce, manager };
}
