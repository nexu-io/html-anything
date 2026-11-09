import { realpath } from "node:fs/promises";
import { sep } from "node:path";
import { pathToFileURL } from "node:url";
import { canonical, digest } from "@odsuite/protocol";
import { managerEndpoint, managerReady, serve } from "@odsuite/sidecar";
import { Builder } from "./build.js";
import type { Adapter, CarrierRuntime, Methods, Plan } from "./types.js";
import { fingerprint, Watcher } from "./watch.js";

const plan = JSON.parse(process.env.ODSUITE_DEV_PLAN ?? "null") as Plan;
if (!plan?.repo || !plan.root || !plan.scope || !plan.entry) throw new Error("development plan is required");
const manager = await serve(managerEndpoint(plan.root), { root: plan.root });
const factory = manager.factory(plan.scope);
let builder: Builder | undefined, watcher: Watcher | undefined, runtime: CarrierRuntime | undefined;
const stop = () => {
  void manager.close().catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exitCode = 1;
  });
};
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
try {
  const source = await fingerprint(plan.repo);
  await factory.expose<Methods>({
    identity: { service: "development", generation: digest(canonical({ plan, source })) },
    handlers: {
      status: async () => {
        if (!builder || !runtime) throw new Error("development is not initialized");
        return {
          plan,
          build: { ...builder.state },
          runtime: await runtime.status().catch((error) => ({ healthy: false, error: (error as Error).message })),
        };
      },
    },
    lifecycle: {
      initialize: async (context) => {
        builder = new Builder(factory, context, plan.repo);
        await builder.run(source);
        const entry = await realpath(plan.entry);
        if (!entry.startsWith(plan.repo + sep)) throw new Error("carrier adapter escapes workspace");
        const adapter = (await import(pathToFileURL(entry).href)) as Adapter;
        if (typeof adapter.open !== "function") throw new Error("carrier has no development adapter");
        runtime = await adapter.open({
          repo: plan.repo,
          scope: plan.scope,
          version: plan.version,
          headless: plan.headless,
          manager,
          factory,
        });
        if (!(await runtime.status()).healthy) throw new Error("carrier did not become healthy");
        if (plan.watch) {
          const active = new Watcher(plan.repo, builder, source);
          watcher = active;
          context.background(() => active.start());
        }
      },
      quiesce: async () => {
        if (watcher) await watcher.stop();
        else await builder?.stop();
      },
      stop: async () => {},
    },
  });
  await managerReady(manager, plan.root, plan.scope);
} catch (error) {
  await manager.close();
  throw error;
}
