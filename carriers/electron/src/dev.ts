import { request } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { Environment } from "@odsuite/carrier";
import type { CarrierContext } from "@odsuite/dev";
import { canonical, digest } from "@odsuite/protocol";
import type { Lease } from "@odsuite/sidecar";
import { attach } from "@open-motion/standalone";

interface Health {
  pid: number;
  environment: Environment;
  ready: boolean;
  automation: unknown;
}
function call<T>(socket: string, path: string, value?: unknown): Promise<T> {
  return new Promise((done, reject) => {
    const body = value === undefined ? undefined : JSON.stringify(value);
    const req = request(
      {
        socketPath: socket,
        path,
        method: body ? "POST" : "GET",
        agent: false,
        headers: body ? { "content-type": "application/json", "content-length": Buffer.byteLength(body) } : {},
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.once("end", () => {
          try {
            const value = JSON.parse(Buffer.concat(chunks).toString());
            if (response.statusCode !== 200) throw new Error(value.error ?? "Electron control failed");
            done(value);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.once("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("Electron host call timeout")));
    req.end(body);
  });
}
export async function open(context: CarrierContext) {
  const executable = createRequire(import.meta.url)("electron") as unknown;
  if (typeof executable !== "string") throw new Error("Electron development adapter requires Node");
  let lease: Lease | undefined,
    socket = "",
    composition: Awaited<ReturnType<typeof attach>> | undefined;
  await context.factory.expose({
    identity: {
      service: "electron",
      generation: digest(canonical({ version: context.version, headless: context.headless })),
    },
    handlers: {},
    lifecycle: {
      initialize: async (owned) => {
        socket = (await owned.allocate({ kind: "socket", name: "health" })).value;
        lease = await context.factory.start({
          service: "electronhost",
          generation: digest(context.version),
          command: executable,
          args: [fileURLToPath(new URL("./development.mjs", import.meta.url))],
          ready: "ready",
          grace: 3000,
          timeout: 15000,
          env: {
            ELECTRON_RUN_AS_NODE: null,
            ODSUITE_DEV_HOST_SOCKET: socket,
            ODSUITE_DEV_HOST_DATA: owned.roots.data,
            ODSUITE_DEV_HOST_LOGS: owned.roots.logs,
            ODSUITE_DEV_HOST_CACHE: owned.roots.resource,
            ODSUITE_DEV_HOST_TEMP: owned.roots.runtime,
            ODSUITE_DEV_HEADLESS: context.headless ? "1" : "0",
            ODSUITE_DEV_VERSION: context.version,
          },
        });
        const initial = await call<Health>(socket, "/health");
        if (initial.pid !== lease.pid || initial.environment.carrier !== "electron")
          throw new Error("Electron host readiness identity mismatch");
        composition = await attach(context.manager, {
          scope: context.scope,
          version: context.version,
          environment: initial.environment,
        });
        await call(socket, "/launch", { url: (await composition.status()).web });
        const until = Date.now() + 10000;
        while (!(await call<Health>(socket, "/health")).ready) {
          if (Date.now() > until) throw new Error("Electron Web did not become ready");
          await new Promise((r) => setTimeout(r, 50));
        }
      },
      stop: async () => {
        if (lease) {
          const result = await context.factory.release(lease);
          if (result.status !== "stopped" || result.survivors.length) throw new Error("Electron host did not retire");
          lease = undefined;
        }
      },
    },
  });
  return {
    status: async () => {
      const host = await call<Health>(socket, "/health");
      if (!composition) throw new Error("Electron composition is not initialized");
      return { healthy: host.ready && host.pid === lease?.pid, host, ...(await composition.status()) };
    },
  };
}
