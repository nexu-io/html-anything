import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Environment } from "@odsuite/carrier";
import { animationInput, editInput, inspectInput, Motion, patchInput } from "@open-motion/motion";
import { inspectContext, retimeHost } from "@open-motion/motion/project";
import { type ExportOperation, exportSchemas } from "@open-motion/render/contract";
import { type TemplateOperation, templateSchemas } from "@open-motion/templates/contract";
import type { Binding as PrismBinding } from "@open-motion/templates/host";
import { Fault, type Input, type Operation, Workspace } from "@open-motion/workspace";
import { listGuidance, readGuidance } from "./content/guidance.js";
import { Previews } from "./content/preview.js";
import { PrismTemplates } from "./content/prism.js";
import { Templates } from "./content/templates.js";
import { schemas } from "./contract.js";
import { type Binding, Exports } from "./exports/index.js";
export interface Options {
  data: string;
  origin: string;
  socket: string;
  token: string;
  environment?: Readonly<Environment>;
  renderer?: Binding;
  prism?: PrismBinding;
  /** In-process diagnostic checkpoint only; never serialized or exposed through a product API. */
  onPrismRead?: () => Promise<void>;
  endpoint?: string;
}
export interface Service {
  close(): Promise<void>;
  socket: string;
}
function reply(response: ServerResponse, status: number, value: unknown, origin?: string) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body),
    ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
  });
  response.end(body);
}
function equal(left: string, right: string) {
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32 * 1024 * 1024) throw new Fault("invalid", "request exceeds limit");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Fault("invalid", "invalid JSON request");
  }
}
export async function serve(options: Options): Promise<Service> {
  const workspace = new Workspace(options.data);
  const previews = new Previews(workspace);
  const templates = options.prism
    ? new PrismTemplates(workspace, options.prism, options.onPrismRead)
    : new Templates(workspace);
  const exports = new Exports(workspace, options.renderer, options.endpoint);
  const server = createServer((request, response) => {
    const origin = request.headers.origin === options.origin ? options.origin : undefined;
    const handle = async () => {
      if (["GET", "HEAD"].includes(request.method ?? "") && request.url?.startsWith("/exports/files/")) {
        await exports.downloads.serve(request.url, response, request.method === "HEAD");
        return;
      }
      if (["GET", "HEAD"].includes(request.method ?? "") && request.url?.startsWith("/preview/")) {
        previews.serve(request.url, response, request.headers.host, request.headers.range, request.method === "HEAD");
        return;
      }
      if (request.method === "OPTIONS") {
        if (!origin) return reply(response, 403, { error: { code: "invalid", message: "origin rejected" } });
        response.writeHead(204, {
          "access-control-allow-origin": origin,
          "access-control-allow-headers": "authorization,content-type",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          vary: "origin",
        });
        response.end();
        return;
      }
      if (!equal(request.headers.authorization ?? "", `Bearer ${options.token}`))
        return reply(response, 401, { error: { code: "invalid", message: "authority rejected" } }, origin);
      if (request.method === "GET" && request.url?.startsWith("/guidance")) {
        const result =
          request.url === "/guidance"
            ? listGuidance()
            : readGuidance(`open-motion://guidance/${request.url.slice("/guidance/".length)}`);
        return reply(response, 200, result, origin);
      }
      if (request.url === "/health" && request.method === "GET")
        return reply(
          response,
          200,
          { ok: true, pid: process.pid, ...(options.environment ? { environment: options.environment } : {}) },
          origin,
        );
      if (request.method === "POST" && ["/preview/open", "/preview/close"].includes(request.url ?? "")) {
        const input = await body(request);
        reply(response, 200, request.url === "/preview/open" ? previews.open(input) : previews.release(input), origin);
        return;
      }
      if (request.method === "POST" && ["/motion/context", "/motion/host"].includes(request.url ?? "")) {
        try {
          reply(
            response,
            200,
            request.url === "/motion/host"
              ? await retimeHost(await body(request))
              : await inspectContext(await body(request)),
            origin,
          );
        } catch (error) {
          throw new Fault("invalid", error instanceof Error ? error.message : "invalid editing context");
        }
        return;
      }
      if (
        request.method === "POST" &&
        ["/motion/inspect", "/motion/patch", "/motion/edit", "/motion/animate"].includes(request.url ?? "")
      ) {
        const parsed = (
          request.url === "/motion/animate"
            ? animationInput
            : request.url === "/motion/inspect"
              ? inspectInput
              : request.url === "/motion/edit"
                ? editInput
                : patchInput
        ).safeParse(await body(request));
        if (!parsed.success) throw new Fault("invalid", "invalid native editing request");
        const model = await Motion.open(parsed.data.html);
        try {
          const data = request.url === "/motion/patch" ? patchInput.parse(parsed.data) : null;
          const html =
            request.url === "/motion/animate"
              ? model.animate(animationInput.parse(parsed.data))
              : request.url === "/motion/edit"
                ? model.edit(editInput.parse(parsed.data))
                : data
                  ? model.patch(data.id, data)
                  : parsed.data.html;
          reply(response, 200, { html, clips: model.clips }, origin);
        } catch (error) {
          throw new Fault("invalid", (error as Error).message);
        } finally {
          model.dispose();
        }
        return;
      }
      const operation = request.url?.startsWith("/api/") ? request.url.slice(5) : "";
      if (request.method !== "POST" || !Object.hasOwn(schemas, operation))
        return reply(response, 404, { error: { code: "invalid", message: "unknown operation" } }, origin);
      const input = await body(request);
      const result = Object.hasOwn(templateSchemas, operation)
        ? await templates.execute(operation as TemplateOperation, input)
        : Object.hasOwn(exportSchemas, operation)
          ? await exports.execute(operation as ExportOperation, input)
          : workspace.execute(operation as Operation, input as Input<Operation>);
      reply(response, 200, result, origin);
    };
    void handle().catch((error) => {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const fault = error instanceof Fault ? error : new Fault("integrity", "workspace operation failed");
      const status = { invalid: 400, missing: 404, ownership: 403, conflict: 409, idempotency: 409, integrity: 500 }[
        fault.code
      ];
      reply(response, status, { error: { code: fault.code, message: fault.message } }, origin);
    });
  });
  try {
    await new Promise<void>((done, reject) => {
      server.once("error", reject);
      server.listen(options.socket, () => {
        server.off("error", reject);
        done();
      });
    });
  } catch (error) {
    workspace.close();
    throw error;
  }
  let closing: Promise<void> | undefined;
  return {
    socket: options.socket,
    close: () =>
      (closing ??= new Promise<void>((done, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          exports.close();
          previews.close();
          workspace.close();
          done();
        });
      })),
  };
}
