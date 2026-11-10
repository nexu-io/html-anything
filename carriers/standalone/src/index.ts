import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { type Environment, environment as facts } from "@odsuite/carrier";
import { canonical, digest, type FactoryScope, factoryScope } from "@odsuite/protocol";
import { type Manifest, resolve as release } from "@odsuite/release";
import { source } from "@odsuite/serve";
import { managerEndpoint, type Service, serve } from "@odsuite/sidecar";
import type { Input, Operation, Output } from "@open-motion/daemon/contract";
import type { Provider } from "@open-motion/gateway";
import { host as hostGateway } from "@open-motion/gateway/host";
import type { Tools } from "@open-motion/render";
import { host } from "@open-motion/render/host";
import { nativeTools } from "@open-motion/render/tools";
import { host as hostTemplates } from "@open-motion/templates/host";
import { configuration, type PrismConfig } from "@open-motion/templates/prism";
import { Daemon } from "./daemon.js";
import { collect } from "./environment.js";

declare const OPEN_MOTION_VERSION: string;
export interface Options {
  environment?: Readonly<Environment>;
  root: string;
  scope: FactoryScope;
  version?: string;
  web?: string;
  daemon?: string;
  worker?: string;
  tools?: Tools;
  prism?: PrismConfig;
  gateway?: Provider;
}
export interface Status {
  environment: Environment;
  manifest: Manifest;
  web: string;
  daemon: { ok: boolean; pid: number; environment: Environment };
}
export interface Methods {
  status: { input: unknown; output: Status };
  connection: { input: null; output: { daemon: string; token: string } };
}
export interface Standalone {
  execute<K extends Operation>(operation: K, input: Input<K>): Promise<Output<K>>;
  manager: Service;
  status(): Promise<Status>;
  close(): Promise<void>;
}

export async function attach(manager: Service, options: Omit<Options, "root">) {
  const scope = factoryScope(options.scope);
  const manifest = release({}, { channel: scope.channel, version: options.version ?? OPEN_MOTION_VERSION });
  const environment = facts(options.environment ?? collect());
  const web = await realpath(
    options.web ?? fileURLToPath(new URL(".", import.meta.resolve("@open-motion/web/document"))),
  );
  const entry = await realpath(options.daemon ?? fileURLToPath(import.meta.resolve("@open-motion/daemon/main")));
  const factory = manager.factory(scope),
    daemon = new Daemon(factory);
  const prism = options.prism
    ? await hostTemplates(factory, {
        generation: digest(canonical(configuration(options.prism))),
        config: options.prism,
      })
    : undefined;
  const gateway = await hostGateway(factory, {
    generation: digest(manifest.identity.version),
    provider: options.gateway,
  });
  const tools = options.tools ?? nativeTools();
  const renderer = tools
    ? await host(factory, { generation: digest(manifest.identity.version), tools, worker: options.worker })
    : undefined;
  const opened = await source(factory, {
    name: "web",
    directory: web,
    documents: {
      "/bootstrap.json": () => ({
        type: "application/json",
        body: JSON.stringify({ ...daemon.bootstrap(), environment }),
      }),
    },
  });
  const status = async (): Promise<Status> => ({
    environment,
    manifest,
    web: opened.endpoint.url,
    daemon: await daemon.health(),
  });
  const attachment = await factory.expose<Methods>({
    identity: {
      service: "standalone",
      generation: digest(canonical({ manifest, environment, web, daemon: digest(await readFile(entry)) })),
    },
    handlers: { status: () => status(), connection: () => daemon.bootstrap() },
    lifecycle: {
      initialize: (context) =>
        daemon.start(context, {
          entry,
          origin: opened.endpoint.url,
          generation: digest(manifest.identity.version),
          environment,
          renderer,
          prism,
          gateway: { root: gateway.root, connection: gateway.connection },
        }),
      quiesce: async () => {
        await Promise.all([prism?.quiesce(), gateway.quiesce()]);
        await daemon.quiesce();
      },
      stop: () => daemon.close(),
    },
  });
  return {
    status,
    execute: <K extends Operation>(operation: K, input: Input<K>) => daemon.execute(operation, input),
    closed: attachment.closed,
  };
}
export async function open(options: Options): Promise<Standalone> {
  const manager = await serve(managerEndpoint(options.root), { root: options.root });
  try {
    const runtime = await attach(manager, options);
    void runtime.closed.then(() => manager.close()).catch((error) => process.stderr.write(`${error}\n`));
    return { manager, status: runtime.status, execute: runtime.execute, close: () => manager.close() };
  } catch (error) {
    try {
      await manager.close();
    } catch (cleanup) {
      throw new AggregateError([error, cleanup], "standalone startup and drain failed");
    }
    throw error;
  }
}

export { prismConfiguration } from "./prism.js";
