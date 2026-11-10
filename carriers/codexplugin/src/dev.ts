import type { CarrierContext } from "@odsuite/dev";
import type { Factory } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import { attach, type Methods } from "@open-motion/standalone";
import { collect } from "./environment.js";
import { listen } from "./stdio.js";
export async function open(context: CarrierContext) {
  const runtime = await attach(context.manager, {
    scope: context.scope,
    version: context.version,
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
export async function connect({ factory }: { factory: Factory }) {
  const target = (await factory.directory()).instances.find(
    (i) => i.service === "standalone" && i.kind === "hosted" && i.phase === "ready",
  );
  if (!target) throw new Error("Codex development composition is not ready");
  const peer = await factory.connect<Methods>(target);
  const connection = await peer.call("connection", null);
  const client = new Client(connection.daemon, connection.token);
  const runtime = {
    status: () => peer.call("status", null),
    execute: client.execute.bind(client),
  };
  const transport = await listen(runtime, async () => {});
  await transport.closed;
}
