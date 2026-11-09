import { createServer, type ServerResponse } from "node:http";

import { canonical, channel, type Digest, valid } from "@odsuite/protocol";

import type { Authority } from "./authority.js";

export interface Service {
  close(): Promise<void>;
  endpoint: string;
}

function identity(value: string): Digest {
  const result = `sha256:${value}`;
  if (!valid(result)) throw new TypeError("invalid identity");
  return result;
}

function send(response: ServerResponse, status: number, body: string | Uint8Array, type: string): void {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": type,
  });
  response.end(body);
}

export async function serve(authority: Authority, endpoint: string): Promise<Service> {
  const server = createServer((request, response) => {
    void Promise.resolve()
      .then(async () => {
        if (request.method !== "GET" || !request.url) {
          send(response, 405, "method not allowed", "text/plain");
          return;
        }
        const parts = new URL(request.url, "http://localhost").pathname.split("/").filter(Boolean);
        if (parts.length !== 2) throw new TypeError("invalid route");
        const [group, name] = parts as [string, string];
        if (group === "channels") {
          send(response, 200, `${canonical(await authority.read(channel(name)))}\n`, "application/json");
          return;
        }
        const value = identity(name);
        if (group === "generations") {
          send(response, 200, `${canonical(await authority.generation(value))}\n`, "application/json");
          return;
        }
        if (group === "proofs") {
          send(response, 200, `${canonical(await authority.proof(value))}\n`, "application/json");
          return;
        }
        if (group === "objects") {
          send(response, 200, await authority.object(value), "application/octet-stream");
          return;
        }
        throw new TypeError("invalid route");
      })
      .catch((fault: NodeJS.ErrnoException) => {
        const status = fault.code === "ENOENT" ? 404 : 400;
        send(response, status, status === 404 ? "not found" : fault.message, "text/plain");
      });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(endpoint, () => {
      server.off("error", reject);
      resolve();
    });
  });
  return {
    endpoint,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((fault) => (fault ? reject(fault) : resolve()));
      }),
  };
}
