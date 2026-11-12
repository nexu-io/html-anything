import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { type Archive, prepare, read } from "@open-motion/portable";
import { Fault, type SourcePayload, type Workspace } from "@open-motion/workspace";
import {
  type ArchiveInput,
  type ArchiveOperation,
  type ArchiveOutput,
  archiveLimits,
  archiveSchemas,
  type Download,
  type Upload,
} from "./archive.js";

interface Ticket {
  id: string;
  key: string;
  signature: string;
  kind: "upload" | "download";
  value: Upload | Download;
  archive?: Archive;
  payload?: SourcePayload;
  busy: boolean;
  retired: boolean;
}
/** Bounded business byte grants only. No filesystem, process, listener or editable store. */
export class Archives {
  private tickets = new Map<string, Ticket>();
  private transfers = new Set<() => void>();
  private closing = false;
  constructor(
    private workspace: Workspace,
    private endpoint?: string,
  ) {}
  private prune() {
    for (const [id, ticket] of this.tickets)
      if (!ticket.busy && (ticket.retired || ticket.value.expiresAt <= Date.now())) this.tickets.delete(id);
  }
  private available(ticket?: Ticket): ticket is Ticket {
    return !!ticket && !ticket.retired && ticket.value.expiresAt > Date.now();
  }
  execute<K extends ArchiveOperation>(operation: K, raw: unknown): ArchiveOutput<K> {
    if (this.closing) throw new Fault("invalid", "archive transfers are closing");
    this.prune();
    const parsed = archiveSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid archive request");
    if (operation === "archive_release") {
      const ticket = this.tickets.get((parsed.data as ArchiveInput<"archive_release">).id);
      if (ticket) ticket.retired = true;
      this.prune();
      return { released: true } as ArchiveOutput<K>;
    }
    if (operation === "archive_import") {
      const input = parsed.data as ArchiveInput<"archive_import">,
        intent = {
          requestId: input.requestId,
          sessionId: input.sessionId,
          title: input.title,
          source: { id: "portable-project", contentHash: input.digest },
        },
        prior = this.workspace.sourceReceipt(intent);
      if (prior) return { artifact: prior } as ArchiveOutput<K>;
      this.workspace.execute("session_get", { sessionId: input.sessionId });
      if (!input.uploadId) return { artifact: null } as ArchiveOutput<K>;
      const ticket = this.tickets.get(input.uploadId);
      if (!this.available(ticket) || ticket.kind !== "upload" || !ticket.payload)
        throw new Fault("missing", "verified archive upload expired or is unavailable; stage the same bytes again");
      if (ticket.value.digest !== input.digest)
        throw new Fault("idempotency", "upload does not match fixed archive intent");
      const artifact = this.workspace.createSource(intent, ticket.payload);
      ticket.retired = true;
      this.prune();
      return { artifact } as ArchiveOutput<K>;
    }
    const input = parsed.data as ArchiveInput<"archive_export"> | ArchiveInput<"archive_upload">,
      signature = JSON.stringify([operation, input]);
    if (operation === "archive_export")
      this.workspace.execute("project_read", {
        sessionId: (input as ArchiveInput<"archive_export">).sessionId,
        artifactId: (input as ArchiveInput<"archive_export">).artifactId,
      });
    const prior = this.tickets.get(input.requestId);
    if (prior) {
      if (!this.available(prior)) throw new Fault("missing", "archive ticket is retired");
      if (prior.signature !== signature)
        throw new Fault("idempotency", "archive requestId was used for different intent");
      return { ...prior.value } as ArchiveOutput<K>;
    }
    if (!this.endpoint) throw new Fault("invalid", "archive endpoint must be sidecar-injected");
    if (this.tickets.size >= archiveLimits.tickets)
      throw new Fault("conflict", "archive capacity reached; release a ticket or wait for its expiry");
    const key = randomBytes(32).toString("hex"),
      expiresAt = Date.now() + archiveLimits.lifetime,
      kind = operation === "archive_export" ? "download" : "upload";
    let archive: Archive | undefined, value: Upload | Download;
    if (operation === "archive_export") {
      const selected = input as ArchiveInput<"archive_export">,
        snapshot = this.workspace.execute("project_snapshot", {
          sessionId: selected.sessionId,
          artifactId: selected.artifactId,
          revision: selected.revision,
        });
      archive = prepare({
        files: snapshot.files,
        resources: snapshot.resources.map((resource) => ({
          path: resource.path,
          name: resource.name,
          bytes: Buffer.from(
            this.workspace.execute("resource_read", {
              sessionId: selected.sessionId,
              artifactId: selected.artifactId,
              revision: selected.revision,
              path: resource.path,
            }).data,
            "base64",
          ),
        })),
      });
      value = {
        id: input.requestId,
        url: `${this.endpoint}/archives/download/${key}`,
        digest: archive.digest,
        bytes: archive.bytes,
        filename: `open-motion-${selected.artifactId}.zip`,
        revision: selected.revision,
        expiresAt,
      };
    } else {
      const selected = input as ArchiveInput<"archive_upload">;
      value = {
        id: selected.requestId,
        url: `${this.endpoint}/archives/upload/${key}`,
        digest: selected.digest,
        bytes: selected.bytes,
        expiresAt,
      };
    }
    this.tickets.set(value.id, { id: value.id, key, kind, signature, archive, value, busy: false, retired: false });
    return { ...value } as ArchiveOutput<K>;
  }
  async transfer(request: IncomingMessage, response: ServerResponse, origin?: string) {
    if (this.closing) throw new Fault("invalid", "archive transfers are closing");
    this.prune();
    const match = /^\/archives\/(upload|download)\/([a-f0-9]{64})$/.exec(request.url ?? ""),
      ticket = match && [...this.tickets.values()].find((value) => value.key === match[2] && value.kind === match[1]);
    if (!ticket || !this.available(ticket))
      throw new Fault("missing", "archive transfer ticket expired or is unavailable");
    if (ticket.busy) throw new Fault("conflict", "archive transfer is already active");
    if (ticket.kind === "upload" ? request.method !== "POST" : !["GET", "HEAD"].includes(request.method ?? ""))
      throw new Fault("invalid", "unsupported archive transfer method");
    if (ticket.kind === "upload" && request.headers["content-type"] !== "application/zip")
      throw new Fault("invalid", "archive upload requires application/zip");
    ticket.busy = true;
    const abort = () => {
      request.destroy(Error("archive transfer is closing"));
      response.destroy();
    };
    this.transfers.add(abort);
    const deadline = setTimeout(() => {
      request.destroy(Error("archive transfer deadline exceeded"));
      response.destroy();
    }, archiveLimits.transfer);
    deadline.unref();
    try {
      if (ticket.kind === "upload") {
        let size = 0;
        const source = async function* () {
          for await (const chunk of request) {
            size += chunk.length;
            if (size > ticket.value.bytes) throw new Fault("invalid", "archive upload exceeds fixed size");
            yield chunk;
          }
          if (size !== ticket.value.bytes) throw new Fault("invalid", "archive upload size differs from fixed intent");
        };
        const payload = await read(source(), ticket.value.digest);
        if (!this.available(ticket)) throw new Fault("missing", "archive upload expired during transfer");
        ticket.payload = payload;
        const body = JSON.stringify({ id: ticket.id, ready: true });
        response.writeHead(200, {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          "cache-control": "no-store",
          ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
        });
        response.end(body);
      } else {
        const value = ticket.value as Download;
        response.writeHead(200, {
          "content-type": "application/zip",
          "content-length": value.bytes,
          "content-disposition": `attachment; filename="${value.filename}"`,
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
        });
        if (request.method === "HEAD") response.end();
        else await pipeline(Readable.from(ticket.archive!.chunks()), response);
      }
    } finally {
      clearTimeout(deadline);
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
    for (const ticket of this.tickets.values()) ticket.retired = true;
    this.prune();
    if (this.tickets.size) throw new Fault("integrity", "archive readers have not drained");
  }
}
