import type { CarrierContext } from "@odsuite/dev";
import { resolve } from "@odsuite/release";
import { attach, prismConfiguration } from "@open-motion/standalone";
import { attachment } from "./attachment.js";
import { collect } from "./environment.js";
import { listen } from "./stdio.js";
export async function open(context: CarrierContext) {
  const runtime = await attach(context.manager, {
    scope: context.scope,
    version: context.version,
    prism: await prismConfiguration(context.repo),
    environment: collect(),
  });
  return {
    status: async () => {
      const status = await runtime.status(),
        processes = await context.factory.inspect();
      return {
        healthy:
          status.daemon.ok &&
          processes.some((p) => p.service === "daemon" && p.pid === status.daemon.pid && p.state === "running"),
        ...status,
      };
    },
  };
}
export async function connect({ factory, scope, version }: Pick<CarrierContext, "factory" | "scope" | "version">) {
  const runtime = await attachment(factory, resolve({}, { channel: scope.channel, version }));
  const transport = await listen(runtime, async () => {});
  await transport.closed;
}
