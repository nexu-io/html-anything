import type { CarrierContext } from "@odsuite/dev";
import { attach } from "./index.js";
export async function open(context: CarrierContext) {
  const runtime = await attach(context.manager, { scope: context.scope, version: context.version });
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
