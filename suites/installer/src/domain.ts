import { lstat, mkdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { canonical, channel, digest, namespace } from "@odsuite/protocol";
import { type Context, connectRoot, managerEndpoint, observeOwner, type Service, serve } from "@odsuite/sidecar";
import { bundle, inside, json, save } from "./files.js";
import type { Methods, Registration, Runtime } from "./types.js";

export function location(target: string, product: string, lane: string) {
  if (!/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(product)) throw Error("invalid installation product");
  return join(dirname(resolve(target)), ".odsuite", product, channel(lane));
}
export const scope = (lane: string) => ({ channel: channel(lane), namespace: namespace("installation") });
export async function peer(root: string, lane: string) {
  const link = await connectRoot(root, scope(lane)),
    entry = (await link.factory.directory()).instances.find((i) => i.service === "installer" && i.phase === "ready");
  if (!entry) throw Error("installation service is not ready");
  return { ...link, peer: await link.factory.connect<Methods>({ service: "installer", generation: entry.generation }) };
}
export async function rpc<K extends keyof Methods>(
  root: string,
  lane: string,
  method: K,
  input: Methods[K]["input"],
): Promise<Methods[K]["output"]> {
  const link = await peer(root, lane);
  return link.factory.session(async () => link.peer.call(method, input as never)) as Promise<Methods[K]["output"]>;
}
export async function registration(context: Context, value: Registration, product: string, lane: string) {
  const current = await observeOwner(value.root, { channel: channel(lane), namespace: namespace(value.namespace) });
  if (!current || canonical(current) !== canonical(value.owner)) throw Error("runtime owner witness mismatch");
  await bundle(value.target, { appid: lane === "stable" ? product : `${product}.${lane}`, version: value.version });
  const path = join(context.roots.data, "runtimes.json"),
    list = (await json<Registration[]>(path)) ?? [];
  const index = list.findIndex((r) => r.root === value.root);
  if (index < 0) list.push(value);
  else list[index] = value;
  await save(path, list);
  return true;
}
export async function participants(context: Context, lane: string): Promise<Runtime[]> {
  const list = (await json<Registration[]>(join(context.roots.data, "runtimes.json"))) ?? [],
    live: Runtime[] = [];
  for (const entry of list) {
    const owner = await observeOwner(entry.root, { channel: channel(lane), namespace: namespace(entry.namespace) });
    if (owner) live.push({ ...entry, owner });
  }
  return live;
}
export async function open(
  root: string,
  target: string,
  product: string,
  lane: string,
  handlers?: Partial<{ [K in keyof Methods]: (value: Methods[K]["input"]) => Promise<Methods[K]["output"]> }>,
  stop?: () => Promise<void>,
) {
  root = resolve(root);
  target = resolve(target);
  if (root !== location(target, product, lane)) throw Error("installation domain must be shared by product/channel");
  if (inside(target, root)) throw Error("installation authority cannot live inside its target");
  await mkdir(root, { recursive: true, mode: 0o700 });
  root = await realpath(root);
  if (root !== location(target, product, lane)) throw Error("installation root must be canonical");
  const deadline = Date.now() + 1000;
  let service: Service;
  for (;;) {
    try {
      service = await serve(managerEndpoint(root), { root });
      break;
    } catch (error) {
      // A normally closing registration claim may briefly contend. Every retry
      // still requires the sidecar's exclusive claim; interrupted owners never retry.
      if (
        !(error instanceof Error) ||
        error.message !== "ownership is held by another manager" ||
        Date.now() >= deadline
      )
        throw error;
      await new Promise((done) => setTimeout(done, 25));
    }
  }
  const factory = service.factory(scope(lane));
  let closing = false;
  try {
    const old = (await factory.resources()).grants.find((g) => g.kind === "installation");
    if (old && old.value !== target) throw Error("installation target changed");
    await factory.grant({ kind: "installation", name: "application", scope: "factory", target });
    let context: Context | undefined;
    const attachment = await factory.expose<Methods>({
      identity: { service: "installer", generation: digest("installation-domain") },
      handlers: {
        status: handlers?.status ?? (async () => undefined),
        register: async (value) => {
          if (value.target !== target) throw Error("foreign installation target");
          if (handlers?.register) return handlers.register(value);
          if (!context) throw Error("installation context is not ready");
          return registration(context, value, product, lane);
        },
        arm:
          handlers?.arm ??
          (async () => {
            throw Error("installation executor unavailable");
          }),
        confirm:
          handlers?.confirm ??
          (async () => {
            throw Error("installation executor unavailable");
          }),
      },
      lifecycle: {
        initialize: async (c) => {
          context = c;
        },
        stop: async () => {
          if (!closing) {
            if (stop) await stop();
            else throw Error("installation domain is in use");
          }
        },
      },
    });
    if (!context) throw Error("installation context is not ready");
    if ((await lstat(context.roots.data)).dev !== (await lstat(resolve(target, ".."))).dev)
      throw Error("installation staging must be on target filesystem");
    return {
      root,
      target,
      service,
      factory,
      context: context!,
      close: async () => {
        closing = true;
        await attachment.close();
        await service.close();
      },
    };
  } catch (e) {
    closing = true;
    await service.close();
    throw e;
  }
}
