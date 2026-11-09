import { realpath, stat } from "node:fs/promises";
import { sep } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import type { Attachment, Factory } from "@odsuite/sidecar";
import type { Fault } from "./fault.js";
import { fault } from "./fault.js";
import type { Endpoint, Methods } from "./index.js";
import { type Documents, staticServer } from "./static.js";

export async function source(
  factory: Factory,
  options: { name: string; directory: string; documents?: Documents },
): Promise<{ endpoint: Endpoint; attachment: Attachment }> {
  const directory = await realpath(options.directory);
  if (!(await stat(directory)).isDirectory()) throw new Error("source must be a directory");
  let http: Awaited<ReturnType<typeof staticServer>> | undefined;
  let endpoint: Endpoint | undefined;
  let fixture: Fault | undefined;
  const attachment = await factory.expose<Methods>({
    identity: { service: options.name, generation: digest(canonical({ directory, name: options.name })) },
    handlers: {
      fault: (input) => {
        fixture = fault(input);
        return fixture ?? null;
      },
      status: () => {
        if (!endpoint) throw new Error("source not ready");
        return endpoint;
      },
    },
    lifecycle: {
      initialize: async (context) => {
        if (
          Object.values(context.roots).some(
            (root) => root === directory || root.startsWith(directory + sep) || directory.startsWith(root + sep),
          )
        )
          throw new Error("static content must be separate from managed resources");
        const socket = await context.allocate({ kind: "socket", name: "static" });
        const port = await context.allocate({ kind: "port", name: "static", scheme: "http" });
        http = await staticServer(directory, socket.value, () => fixture, options.documents);
        await context.forward(port.value, socket.value);
        endpoint = { ...context.identity, incarnation: context.incarnation, url: port.value, directory };
      },
      stop: async () => {
        await http?.close();
      },
    },
  });
  return { endpoint: endpoint as Endpoint, attachment };
}
