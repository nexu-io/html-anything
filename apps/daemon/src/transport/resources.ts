import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Fault, type Workspace } from "@open-motion/workspace";
import {
  resourceTransferLimits as limits,
  type ResourceDownload,
  type ResourceInput,
  type ResourceOperation,
  type ResourceOutput,
  type ResourceUpload,
  resourceSchemas,
} from "./resource.js";

interface Ticket {
  value: ResourceUpload | ResourceDownload;
  kind: "upload" | "download";
  key: string;
  signature: string;
  data?: Buffer;
  busy: boolean;
  retired: boolean;
}
/** Temporary business byte grants; workspace owns verified formats, receipts and persistent bytes. */
export class ResourceTransfers {
  private tickets = new Map<string, Ticket>();
  private transfers = new Set<() => void>();
  private closing = false;
  constructor(
    private workspace: Workspace,
    private endpoint?: string,
  ) {}
  private available(ticket?: Ticket): ticket is Ticket {
    return !!ticket && !ticket.retired && ticket.value.expiresAt > Date.now();
  }
  private prune() {
    for (const [id, ticket] of this.tickets) if (!ticket.busy && !this.available(ticket)) this.tickets.delete(id);
  }
  execute<K extends ResourceOperation>(operation: K, raw: unknown): ResourceOutput<K> {
    if (this.closing) throw new Fault("invalid", "resource transfers are closing");
    this.prune();
    const parsed = resourceSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid resource request");
    if (operation === "resource_release") {
      const ticket = this.tickets.get((parsed.data as ResourceInput<"resource_release">).id);
      if (ticket) ticket.retired = true;
      this.prune();
      return { released: true } as ResourceOutput<K>;
    }
    if (operation === "resource_import") {
      const { uploadId, ...intent } = parsed.data as ResourceInput<"resource_import">,
        prior = this.workspace.execute("resource_import", intent);
      if (prior.project) return prior as ResourceOutput<K>;
      if (!uploadId) return prior as ResourceOutput<K>;
      // Ownership and optimistic revision are checked again atomically by workspace at commit.
      const ticket = this.tickets.get(uploadId);
      if (!this.available(ticket) || ticket.kind !== "upload" || !ticket.data)
        throw new Fault("missing", "resource upload expired or is unavailable; stage identical bytes again");
      if (ticket.value.digest !== intent.digest || ticket.value.bytes !== intent.bytes)
        throw new Fault("idempotency", "upload does not match fixed resource intent");
      const project = this.workspace.importResource(intent, ticket.data);
      ticket.retired = true;
      this.prune();
      return { project } as ResourceOutput<K>;
    }
    if (operation === "resource_read") {
      if (!this.endpoint) throw new Fault("invalid", "resource endpoint must be sidecar-injected");
      if (this.tickets.size >= limits.tickets)
        throw new Fault("conflict", "resource transfer capacity reached; release a ticket or wait for expiry");
      const input = parsed.data as ResourceInput<"resource_read">,
        read = this.workspace.execute("resource_read", input),
        key = randomBytes(32).toString("hex"),
        id = randomUUID(),
        value: ResourceDownload = {
          id,
          url: `${this.endpoint}/resources/download/${key}`,
          resource: read.resource,
          digest: read.resource.digest,
          bytes: read.resource.bytes,
          filename: `open-motion-${read.resource.digest.slice(7, 23)}.${read.resource.path.split(".").at(-1)}`,
          expiresAt: Date.now() + limits.lifetime,
        };
      this.tickets.set(id, {
        kind: "download",
        key,
        value,
        data: Buffer.from(read.data, "base64"),
        signature: JSON.stringify(input),
        busy: false,
        retired: false,
      });
      return { ...value } as ResourceOutput<K>;
    }
    const input = parsed.data as ResourceInput<"resource_upload">,
      signature = JSON.stringify(input),
      prior = this.tickets.get(input.requestId);
    if (prior) {
      if (!this.available(prior)) throw new Fault("missing", "resource ticket is retired");
      if (prior.signature !== signature)
        throw new Fault("idempotency", "resource requestId was used for different intent");
      return { ...prior.value } as ResourceOutput<K>;
    }
    if (!this.endpoint) throw new Fault("invalid", "resource endpoint must be sidecar-injected");
    if (this.tickets.size >= limits.tickets)
      throw new Fault("conflict", "resource upload capacity reached; release a ticket or wait for expiry");
    const key = randomBytes(32).toString("hex"),
      value: ResourceUpload = {
        id: input.requestId,
        url: `${this.endpoint}/resources/upload/${key}`,
        digest: input.digest,
        bytes: input.bytes,
        expiresAt: Date.now() + limits.lifetime,
      };
    this.tickets.set(value.id, { value, key, signature, kind: "upload", busy: false, retired: false });
    return { ...value } as ResourceOutput<K>;
  }
  async transfer(request: IncomingMessage, response: ServerResponse, origin?: string) {
    if (this.closing) throw new Fault("invalid", "resource transfers are closing");
    this.prune();
    const match = /^\/resources\/(upload|download)\/([a-f0-9]{64})$/.exec(request.url ?? ""),
      ticket =
        match && [...this.tickets.values()].find((ticket) => ticket.key === match[2] && ticket.kind === match[1]);
    if (!ticket || !this.available(ticket)) throw new Fault("missing", "resource upload expired or is unavailable");
    if (ticket.busy || (ticket.kind === "upload" && ticket.data))
      throw new Fault("conflict", "resource upload is already active");
    if (
      ticket.kind === "upload"
        ? request.method !== "POST" || request.headers["content-type"] !== "application/octet-stream"
        : !["GET", "HEAD"].includes(request.method ?? "")
    )
      throw new Fault("invalid", "resource upload requires POST application/octet-stream");
    if (
      ticket.kind === "upload" &&
      request.headers["content-length"] !== undefined &&
      request.headers["content-length"] !== String(ticket.value.bytes)
    )
      throw new Fault("invalid", "resource upload content length differs from intent");
    ticket.busy = true;
    const abort = () => {
      request.destroy(Error("resource transfer is closing"));
      response.destroy();
    };
    this.transfers.add(abort);
    const timer = setTimeout(abort, limits.transfer);
    timer.unref();
    try {
      if (ticket.kind === "download") {
        const value = ticket.value as ResourceDownload,
          data = ticket.data;
        if (!data) throw new Fault("integrity", "resource download bytes are missing");
        response.writeHead(200, {
          "content-type": value.resource.type,
          "content-length": value.bytes,
          "content-disposition": `attachment; filename="${value.filename}"`,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
        });
        if (request.method === "HEAD") response.end();
        else
          await pipeline(
            Readable.from(
              (function* () {
                for (let at = 0; at < data.length; at += 65536) yield data.subarray(at, at + 65536);
              })(),
            ),
            response,
          );
        return;
      }
      const data = Buffer.alloc(ticket.value.bytes),
        hash = createHash("sha256");
      let size = 0;
      for await (const chunk of request) {
        if (size + chunk.length > data.length) throw new Fault("invalid", "resource upload exceeds fixed size");
        data.set(chunk, size);
        hash.update(chunk);
        size += chunk.length;
      }
      if (size !== data.length || `sha256:${hash.digest("hex")}` !== ticket.value.digest)
        throw new Fault("invalid", "resource upload does not match fixed bytes/digest");
      if (!this.available(ticket)) throw new Fault("missing", "resource upload retired during transfer");
      ticket.data = data;
      const body = JSON.stringify({ id: ticket.value.id, ready: true });
      response.writeHead(200, {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body),
        "cache-control": "no-store",
        ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
      });
      response.end(body);
    } finally {
      clearTimeout(timer);
      this.transfers.delete(abort);
      ticket.busy = false;
      this.prune();
    }
  }
  quiesce() {
    this.closing = true;
    for (const ticket of this.tickets.values()) ticket.retired = true;
    for (const abort of this.transfers) abort();
    this.prune();
  }
  close() {
    this.quiesce();
    if (this.tickets.size) throw new Fault("integrity", "resource transfers have not drained");
  }
}
