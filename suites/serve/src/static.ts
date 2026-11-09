import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, sep } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Fault } from "./fault.js";

export type Documents = Readonly<Record<string, () => Readonly<{ type: string; body: string }>>>;

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".wasm": "application/wasm",
};
function status(response: ServerResponse, code: number) {
  response.writeHead(code, { "content-length": 0 });
  response.end();
}
async function handle(
  root: string,
  request: IncomingMessage,
  response: ServerResponse,
  fixture?: Fault,
  documents?: Documents,
) {
  if (request.method !== "GET" && request.method !== "HEAD") return status(response, 405);
  const path = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");
  const mode = fixture?.path === path ? fixture.mode : undefined;
  if (mode === "missing") return status(response, 404);
  if (!path.startsWith("/") || path.includes("\0") || path.includes("\\") || path.split("/").includes(".."))
    return status(response, 403);
  const document = Object.hasOwn(documents ?? {}, path) ? documents?.[path]?.() : undefined;
  if (document) {
    const bytes = Buffer.from(document.body);
    response.writeHead(200, {
      "content-type": document.type,
      "content-length": bytes.length,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
    return;
  }
  const target = await realpath(join(root, path.endsWith("/") ? `${path}index.html` : path));
  if (!target.startsWith(root + sep)) return status(response, 403);
  const file = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await file.stat();
    if (!info.isFile()) return status(response, 404);
    const tag = `W/"${info.size}-${info.mtimeMs}"`;
    const headers = {
      "accept-ranges": "bytes",
      etag: tag,
      "cache-control": "no-cache",
      "content-type": types[extname(target)] ?? "application/octet-stream",
    };
    if (request.headers["if-none-match"] === tag) {
      response.writeHead(304, headers);
      response.end();
      return;
    }
    let start = 0,
      end = info.size - 1,
      code = 200;
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        response.setHeader("content-range", `bytes */${info.size}`);
        return status(response, 416);
      }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= info.size) {
        response.setHeader("content-range", `bytes */${info.size}`);
        return status(response, 416);
      }
      code = 206;
      response.setHeader("content-range", `bytes ${start}-${end}/${info.size}`);
    }
    response.writeHead(code, { ...headers, "content-length": Math.max(0, end - start + 1) });
    if (request.method === "HEAD" || info.size === 0) {
      response.end();
      return;
    }
    if (mode === "stall") {
      response.flushHeaders();
      return;
    }
    if (mode === "truncate") {
      response.flushHeaders();
      const chunk = Buffer.alloc(Math.min(65536, Math.max(1, Math.floor((end - start + 1) / 2))));
      const read = await file.read(chunk, 0, chunk.length, start);
      response.write(chunk.subarray(0, read.bytesRead), () => response.destroy());
      return;
    }
    if (mode === "corrupt") {
      let first = true;
      const corrupt = new Transform({
        transform(chunk: Buffer, _encoding, done) {
          if (first && chunk.length) {
            chunk[0] = (chunk[0] ?? 0) ^ 1;
            first = false;
          }
          done(null, chunk);
        },
      });
      await pipeline(file.createReadStream({ start, end, autoClose: false }), corrupt, response);
    } else await pipeline(file.createReadStream({ start, end, autoClose: false }), response);
  } finally {
    await file.close();
  }
}
export async function staticServer(
  root: string,
  socket: string,
  fixture: () => Fault | undefined = () => undefined,
  documents?: Documents,
) {
  root = await realpath(root);
  const requests = new Set<Promise<void>>();
  let stopping: Promise<void> | undefined;
  const server = createServer((request, response) => {
    if (stopping) {
      response.setHeader("connection", "close");
      status(response, 503);
      return;
    }
    const pending = handle(root, request, response, fixture(), documents).catch((error: NodeJS.ErrnoException) => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      status(
        response,
        error.code === "ENOENT" || error.code === "ENOTDIR" ? 404 : error instanceof URIError ? 400 : 500,
      );
    });
    requests.add(pending);
    void pending.then(
      () => requests.delete(pending),
      () => requests.delete(pending),
    );
  });
  await new Promise<void>((done, reject) => {
    server.once("error", reject);
    server.listen(socket, () => {
      server.off("error", reject);
      done();
    });
  });
  return {
    close: () =>
      (stopping ??= (async () => {
        const closed = new Promise<void>((done, reject) => {
          server.close((error) => (error ? reject(error) : done()));
        });
        await Promise.allSettled([...requests]);
        server.closeAllConnections();
        await closed;
      })()),
  };
}
