import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Library } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { Factory } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { z } from "zod";
import type { Tools } from "./index.js";
import { exportSchemas, type RenderMethods, type Reply } from "./jobs/contract.js";
import { Queue } from "./jobs/queue.js";

/** Durable product jobs, independent of a Web request or an Agent transport. */
export async function host(factory: Factory, options: { generation: Digest; tools: Tools; worker?: string }) {
  let library!: Library,
    queue!: Queue,
    root = "";
  const reply = <T>(work: () => T): Reply<T> => {
    try {
      return { ok: true, value: work() };
    } catch (e) {
      return {
        ok: false,
        error: {
          code: e instanceof Fault ? e.code : "invalid",
          message: e instanceof Fault ? e.message : "invalid export journal operation",
        },
      };
    }
  };
  const attachment = await factory.expose<RenderMethods>({
    identity: { service: "renderer", generation: options.generation },
    handlers: {
      export_create: (input) =>
        reply(() => {
          const data = exportSchemas.export_create
            .extend({
              projection: z.strictObject({
                digest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
                bytes: z
                  .number()
                  .int()
                  .positive()
                  .max(128 * 1024 ** 2),
              }),
            })
            .parse(input);
          const job = queue.store.create(data);
          queue.signal();
          return job;
        }),
      export_list: (input) => reply(() => queue.store.list(exportSchemas.export_list.parse(input))),
      export_read: (input) => reply(() => queue.store.owned(exportSchemas.export_read.parse(input)).job),
      export_cancel: (input) =>
        reply(() => {
          const job = queue.store.control("export_cancel", exportSchemas.export_cancel.parse(input));
          queue.cancel(job.id);
          return job;
        }),
      export_retry: (input) =>
        reply(() => {
          const job = queue.store.control("export_retry", exportSchemas.export_retry.parse(input));
          queue.signal();
          return job;
        }),
    },
    lifecycle: {
      initialize: async (context) => {
        root = context.roots.data;
        await mkdir(join(root, "inbox"), { recursive: true, mode: 0o700 });
        library = await Library.open({ factory, context });
        queue = new Queue({ ...options, factory, context, library });
        await queue.initialize();
        queue.start();
      },
      quiesce: async () => {
        await queue?.close();
      },
      stop: async () => {
        await library?.close();
      },
    },
  });
  const peer = await factory.connect<RenderMethods>({ service: "renderer", generation: options.generation });
  return { root, connection: peer.connection(), close: () => attachment.close() };
}
