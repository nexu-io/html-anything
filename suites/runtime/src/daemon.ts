import { timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";

export interface Options {
  data: string;
  origin: string;
  socket: string;
  token: string;
  generation?: string;
  nonce?: string;
  witness?: string;
  unit?: string;
  version?: string;
}

export interface Service {
  close(): Promise<void>;
  socket: string;
}

const limit = 64 * 1024;

function reply(response: ServerResponse, status: number, value: unknown, origin?: string): void {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
    "content-length": Buffer.byteLength(body),
    "content-type": "application/json",
  });
  response.end(body);
}

function equal(left: string, right: string): boolean {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

function origin(options: Options, request: IncomingMessage): string | undefined {
  return request.headers.origin === options.origin ? options.origin : undefined;
}

function body(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("body exceeds limit"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.once("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (fault) {
        reject(fault);
      }
    });
    request.once("error", reject);
  });
}

async function state(options: Options, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const file = join(options.data, "state.json");
  if (request.method === "GET") {
    try {
      reply(response, 200, JSON.parse(await readFile(file, "utf8")), origin(options, request));
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
      reply(response, 404, { error: "missing" }, origin(options, request));
    }
    return;
  }
  if (request.method !== "PUT") {
    reply(response, 405, { error: "method" }, origin(options, request));
    return;
  }
  const value = await body(request);
  const temporary = join(options.data, "state.tmp");
  await writeFile(temporary, `${JSON.stringify(value)}\n`);
  await rename(temporary, file);
  reply(response, 200, value, origin(options, request));
}

async function handle(options: Options, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const allowed = origin(options, request);
  if (request.method === "OPTIONS") {
    if (!allowed) {
      reply(response, 403, { error: "origin" });
      return;
    }
    response.writeHead(204, {
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,PUT,OPTIONS",
      "access-control-allow-origin": allowed,
      vary: "origin",
    });
    response.end();
    return;
  }
  if (!equal(request.headers.authorization ?? "", `Bearer ${options.token}`)) {
    reply(response, 401, { error: "authority" }, allowed);
    return;
  }
  if (request.url === "/health" && request.method === "GET") {
    reply(
      response,
      200,
      {
        ok: true,
        pid: process.pid,
        generation: options.generation,
        nonce: options.nonce,
        witness: options.witness,
        unit: options.unit,
        version: options.version,
      },
      allowed,
    );
    return;
  }
  if (request.url === "/state") {
    await state(options, request, response);
    return;
  }
  reply(response, 404, { error: "route" }, allowed);
}

function handler(options: Options) {
  return (request: IncomingMessage, response: ServerResponse) => {
    void handle(options, request, response).catch((fault: Error) =>
      reply(response, 400, { error: fault.message }, origin(options, request)),
    );
  };
}

function listen(server: Server, socket: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(socket, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

export async function serve(options: Options): Promise<Service> {
  await mkdir(options.data, { recursive: true });
  const server = createServer(handler(options));
  await listen(server, options.socket);
  return {
    socket: options.socket,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((fault) => (fault ? reject(fault) : resolve()));
      }),
  };
}

export async function serveDaemon(witness: string): Promise<Service> {
  const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is required`);
    return value;
  };
  const generation = required("ODSUITE_RUNTIME_GENERATION");
  const nonce = required("ODSUITE_RUNTIME_NONCE");
  const service = await serve({
    data: required("ODSUITE_RUNTIME_DATA"),
    origin: required("ODSUITE_RUNTIME_ORIGIN"),
    socket: required("ODSUITE_RUNTIME_SOCKET"),
    token: required("ODSUITE_RUNTIME_TOKEN"),
    generation,
    nonce,
    witness,
    unit: process.env.ODSUITE_RUNTIME_UNIT,
    version: process.env.ODSUITE_RUNTIME_VERSION,
  });
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= service.close();
    return stopping;
  };
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
  if (process.env.ODSUITE_RUNTIME_LIFELINE === "1") {
    process.stdin.resume();
    process.stdin.once("end", () => void stop().finally(() => process.stdin.pause()));
  }
  process.stdout.write(`ready:${generation}:${nonce}\n`);
  return service;
}
