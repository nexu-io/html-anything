import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Library } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { Connection, Factory } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { z } from "zod";
import { configuration, type PrismConfig } from "./index.js";
import { Catalog, type Projection } from "./store.js";
export interface Binding {
  connection: Connection;
}
export type Reply<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "invalid" | "missing" | "ownership" | "conflict" | "integrity"; message: string } };
export interface Methods {
  list: { input: null; output: Reply<Projection> };
  read: { input: { id: string; contentHash: string }; output: Reply<Projection> };
}
export type { Projection } from "./store.js";
/** Real hosted subject; no independent PID/port/cache registry or editable source store. */
export async function host(factory: Factory, options: { generation: Digest; config: PrismConfig }) {
  const config = configuration(options.config);
  let library: Library | undefined, catalog: Catalog | undefined;
  const reply = async <T>(work: () => Promise<T>): Promise<Reply<T>> => {
    try {
      return { ok: true, value: await work() };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: error instanceof Fault && error.code !== "idempotency" ? error.code : "invalid",
          message: error instanceof Fault ? error.message : "Prism catalog operation failed",
        },
      };
    }
  };
  const attachment = await factory.expose<Methods>({
    identity: { service: "templates", generation: options.generation },
    handlers: {
      list: () => reply(() => catalog!.list()),
      read: (input) =>
        reply(() =>
          catalog!.read(
            z
              .strictObject({
                id: z.string().regex(/^prism-[a-f0-9]{64}$/),
                contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
              })
              .parse(input),
          ),
        ),
    },
    lifecycle: {
      initialize: async (context) => {
        library = await Library.open({ factory, context, name: "templates" });
        await mkdir(join(context.roots.runtime, "reads"), { recursive: true, mode: 0o700 });
        catalog = new Catalog({ config, factory, library, root: context.roots.data, context });
      },
      quiesce: async () => catalog?.quiesce(),
      stop: async () => library?.close(),
    },
  });
  const peer = await factory.connect<Methods>({ service: "templates", generation: options.generation });
  return { connection: peer.connection(), quiesce: () => catalog!.quiesce(), close: () => attachment.close() };
}
