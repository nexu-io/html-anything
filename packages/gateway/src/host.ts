import { Library } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { Connection, Factory } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { candidatePath, readCandidate } from "./candidates.js";
import { type GatewayMethods, generationSchemas, type Reply, type Status } from "./contract.js";
import { Controller } from "./controller.js";
import type { Provider } from "./provider.js";

export interface Binding {
  root: string;
  connection: Connection;
}
/** Optional injection is explicit: durable reads/results remain available with no adapter. */
export async function host(factory: Factory, options: { generation: Digest; provider?: Provider }) {
  let library!: Library,
    controller!: Controller,
    root = "";
  const reply = async <T>(work: () => T | Promise<T>): Promise<Reply<T>> => {
    try {
      return { ok: true, value: await work() };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: error instanceof Fault ? error.code : "invalid",
          message: error instanceof Fault ? error.message : "invalid generation operation",
        },
      };
    }
  };
  const parse = <K extends keyof typeof generationSchemas>(operation: K, value: unknown) => {
    const parsed = generationSchemas[operation].safeParse(value);
    if (!parsed.success) throw new Fault("invalid", "generation input does not match operation schema");
    return parsed.data as import("./contract.js").GenerationInput<K>;
  };
  const attachment = await factory.expose<GatewayMethods>({
    identity: { service: "gateway", generation: options.generation },
    handlers: {
      generation_status: (input) =>
        reply(() => {
          parse("generation_status", input);
          const status: Status = {
            configured: !!options.provider,
            providers: options.provider
              ? [{ id: options.provider.id, version: options.provider.version, models: options.provider.models }]
              : [],
            limits: { active: 32, page: 16, pngBytes: 6291456, pngDimension: 4096 },
          };
          return status;
        }),
      generation_create: (input) =>
        reply(() => {
          const data = parse("generation_create", input);
          const value = controller.store.create(data, () => controller.available(data));
          controller.signal();
          return value;
        }),
      generation_read: (input) => reply(() => controller.store.owned(parse("generation_read", input))),
      generation_list: (input) => reply(() => controller.store.list(parse("generation_list", input))),
      generation_cancel: (input) =>
        reply(() => {
          const value = controller.store.cancel(parse("generation_cancel", input));
          controller.cancel(value.id);
          return value;
        }),
      generation_result: (input) =>
        reply(async () => {
          const value = controller.store.owned(parse("generation_result", input));
          if (value.state !== "succeeded" || !value.candidate)
            throw new Fault("conflict", "generation has no adoptable result");
          await readCandidate(root, value.candidate);
          return { candidate: value.candidate, path: candidatePath(root, value.candidate) };
        }),
    },
    lifecycle: {
      initialize: async (context) => {
        root = context.roots.data;
        library = await Library.open({ factory, context, name: "gatewayblob" });
        controller = new Controller({ context, library, provider: options.provider });
        controller.start();
      },
      quiesce: async () => {
        await controller?.close();
      },
      stop: async () => {
        controller?.store.close();
        await library?.close();
      },
    },
  });
  const peer = await factory.connect<GatewayMethods>({ service: "gateway", generation: options.generation });
  controller.readyOwner();
  return { root, connection: peer.connection(), quiesce: () => controller.close(), close: () => attachment.close() };
}
