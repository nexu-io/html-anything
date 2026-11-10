import { digest, factoryScope } from "@odsuite/protocol";
import { resolve as release } from "@odsuite/release";
import { managerEndpoint, serve } from "@odsuite/sidecar";
import { host } from "@open-motion/render/host";
import { nativeTools } from "@open-motion/render/tools";
import type { Options } from "./index.js";

declare const OPEN_MOTION_VERSION: string;
/** Same product factory/cache owner, with no application services or export queue activation. */
export async function openPreparation(options: Pick<Options, "root" | "scope" | "version" | "tools">) {
  const scope = factoryScope(options.scope),
    manifest = release({}, { channel: scope.channel, version: options.version ?? OPEN_MOTION_VERSION }),
    tools = options.tools ?? nativeTools();
  if (!tools) throw Error(`Native preparation is unsupported on ${process.platform}/${process.arch}`);
  const manager = await serve(managerEndpoint(options.root), { root: options.root });
  try {
    const renderer = await host(manager.factory(scope), {
      generation: digest(manifest.identity.version),
      tools,
      preparationOnly: true,
    });
    return {
      manager,
      prepare: () => renderer.prepare(),
      status: async () => ({ mode: "prepare" as const, manifest, native: renderer.prepareRead() }),
      close: () => manager.close(),
    };
  } catch (error) {
    try {
      await manager.close();
    } catch (cleanup) {
      throw new AggregateError([error, cleanup], "native preparation startup and drain failed");
    }
    throw error;
  }
}
