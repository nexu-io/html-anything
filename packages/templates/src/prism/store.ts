import { randomUUID } from "node:crypto";
import { lstat, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Consumer, type Library, type LibrarySession, type Resource, source, type Use } from "@odsuite/blob";
import { canonical, type Digest, digest } from "@odsuite/protocol";
import type { Context, Factory } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { z } from "zod";
import type { Descriptor } from "../contract.js";
import type { DiscoveryCatalog, PrismConfig, Publication } from "./contract.js";
import { catalogAddress, decode, discover, materialize, parsePublication } from "./index.js";

export interface Projection {
  path: string;
  artifact: Resource["artifact"];
  useId: string;
  ackPath: string;
}
const sha = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/)
  .transform((value) => value as Digest);
const artifact = <T extends "publication" | "projection">(slot: T) =>
  z.strictObject({
    type: z.literal("file"),
    artifact: z.strictObject({
      kind: z.literal("blob"),
      slot: z.literal(slot),
      digest: sha,
      bytes: z
        .number()
        .int()
        .nonnegative()
        .max(16 * 1024 ** 2),
    }),
  });
const headSchema = z.strictObject({
  schema: z.literal(1),
  config: sha,
  publication: artifact("publication").refine((value) => value.artifact.bytes <= 4 * 1024 ** 2),
  etag: z.string().max(512).optional(),
  ready: z.record(sha, artifact("projection")).refine((value) => Object.keys(value).length <= 32),
});
type Head = z.infer<typeof headSchema>;
const resource = <T extends "publication" | "projection">(bytes: Uint8Array, slot: T) => ({
  type: "file" as const,
  artifact: { kind: "blob" as const, slot, digest: digest(bytes), bytes: bytes.byteLength },
});

/** Publication selection metadata only. All payload/cache bytes, Uses and GC belong to blob. */
export class Catalog {
  private head?: Head;
  private initialized = false;
  private document?: Publication;
  private loaded?: DiscoveryCatalog;
  private tail: Promise<unknown> = Promise.resolve();
  private receipts = new Map<string, { use: Use; resource: Resource; ackPath: string }>();
  private timer: ReturnType<typeof setInterval>;
  private scanQueued = false;
  private retired = false;
  private scanError?: Error;
  private stopping = false;
  private abort = new AbortController();
  constructor(
    private options: { config: PrismConfig; factory: Factory; library: Library; root: string; context: Context },
  ) {
    this.timer = options.context.background(() =>
      setInterval(() => {
        if (this.scanQueued || !this.receipts.size) return;
        this.scanQueued = true;
        void this.scan()
          .catch((error) => {
            this.scanError = error;
          })
          .finally(() => {
            this.scanQueued = false;
          });
      }, 50),
    );
    this.timer.unref();
  }
  private sequence<T>(operation: () => Promise<T>): Promise<T> {
    if (this.stopping) return Promise.reject(new Fault("invalid", "Prism catalog is stopping"));
    const pending = this.tail.then(operation);
    this.tail = pending.catch(() => {});
    return pending;
  }
  private async bytes(spec: Resource, loader: () => Promise<Uint8Array>) {
    const use = await this.options.library.acquire(spec, loader);
    try {
      return await readFile(use.path);
    } finally {
      await this.options.library.release(use);
    }
  }
  private async restore() {
    if (this.initialized) return;
    let input: unknown;
    try {
      input = JSON.parse(await readFile(join(this.options.root, "catalog.json"), "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        this.initialized = true;
        return;
      }
      throw new Fault("integrity", "Prism publication metadata is unreadable");
    }
    const parsed = headSchema.safeParse(input);
    if (!parsed.success) throw new Fault("integrity", "Invalid Prism publication metadata");
    const head = parsed.data;
    // An explicit provider configuration change does not reuse another provider's publication.
    if (head.config !== digest(canonical(this.options.config))) {
      this.initialized = true;
      return;
    }
    await this.options.library.retain("current", "prismcatalog", [head.publication, ...Object.values(head.ready)]);
    const data = await this.bytes(head.publication, async () => {
      throw new Fault("integrity", "Committed Prism publication bytes are missing");
    });
    this.document = parsePublication(decode(data), this.options.config);
    this.head = head;
    this.loaded = discover(this.options.config, this.document);
    await this.options.library.unretain("prepared", "prismcatalog");
    this.initialized = true;
  }
  private async commit(next: Head) {
    const values = [next.publication, ...Object.values(next.ready)];
    await this.options.library.retain("prepared", "prismcatalog", values);
    const temporary = join(this.options.root, `catalog-${randomUUID()}.tmp`);
    await writeFile(temporary, canonical(next), { flag: "wx", mode: 0o600, flush: true });
    await rename(temporary, join(this.options.root, "catalog.json"));
    this.head = next;
    await this.options.library.retain("current", "prismcatalog", values);
    await this.options.library.unretain("prepared", "prismcatalog");
  }
  private async download() {
    const response = await fetch(catalogAddress(this.options.config), {
      redirect: "error",
      signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(10000)]),
      headers: this.head?.etag ? { "if-none-match": this.head.etag } : {},
    });
    if (response.status === 304 && this.head && this.document) return;
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Fault("invalid", "Prism publication request failed");
    }
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = response.body.getReader();
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.length;
        if (size > 4 * 1024 ** 2) throw new Fault("invalid", "Prism publication exceeds 4 MiB");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    const bytes = Buffer.concat(chunks),
      document = parsePublication(decode(bytes), this.options.config),
      spec = resource(bytes, "publication");
    const held = await this.options.library.acquire(spec, async () => bytes);
    try {
      const same = this.document && canonical(this.document) === canonical(document);
      const etag = response.headers.get("etag");
      if (etag && etag.length > 512) throw new Fault("invalid", "Prism ETag exceeds its bound");
      await this.commit({
        schema: 1,
        config: digest(canonical(this.options.config)),
        publication: spec,
        ...(etag ? { etag } : {}),
        ready: same ? this.head!.ready : {},
      });
      this.document = document;
      this.loaded = discover(this.options.config, document);
    } finally {
      await this.options.library.release(held);
    }
  }
  private async refresh() {
    await this.restore();
    try {
      await this.download();
      if (this.loaded) {
        this.loaded.stale = false;
        delete this.loaded.warning;
      }
    } catch (error) {
      if (!this.loaded) throw error instanceof Fault ? error : new Fault("invalid", "Prism catalog is unavailable");
      this.loaded.stale = true;
      this.loaded.warning = "Prism catalog refresh failed; using the last verified publication";
    }
    return this.loaded!;
  }
  private async lease(spec: Resource): Promise<Projection> {
    if (this.stopping) throw new Fault("invalid", "Prism catalog is stopping");
    if (this.receipts.size >= 32) throw new Fault("invalid", "Too many outstanding Prism projection reads");
    const daemon = (await this.options.factory.directory()).instances.find(
      (item) => item.service === "daemon" && item.phase === "ready",
    );
    if (!daemon) throw new Fault("ownership", "Prism projection requires its ready Daemon consumer");
    const consumer: Consumer = {
      service: daemon.service,
      generation: daemon.generation,
      incarnation: daemon.incarnation,
    };
    const use = await this.options.library.acquire(
      spec,
      async () => {
        throw new Fault("integrity", "Verified Prism projection is missing");
      },
      consumer,
    );
    const ackPath = join(this.options.context.roots.runtime, "reads", `${use.id}.json`);
    this.receipts.set(use.id, { use, resource: spec, ackPath });
    return { path: use.path, artifact: spec.artifact, useId: use.id, ackPath };
  }
  private async projection(value: unknown) {
    const bytes = Buffer.from(canonical(value));
    if (bytes.byteLength > 16 * 1024 ** 2)
      throw new Fault("invalid", "Prism projection exceeds the 16 MiB transport contract");
    const spec = resource(bytes, "projection");
    const held = await this.options.library.acquire(spec, async () => bytes);
    return { spec, held };
  }
  list(): Promise<Projection> {
    return this.sequence(async () => {
      const catalog = await this.refresh(),
        templates: Descriptor[] = [];
      for (const [identity, spec] of Object.entries(this.head!.ready)) {
        if (!catalog.entries.some((entry) => entry.contentHash === identity)) continue;
        const bytes = await this.bytes(spec, async () => {
          throw new Fault("integrity", "Verified Prism source projection is missing");
        });
        templates.push(
          (JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as { template: Descriptor }).template,
        );
      }
      const staged = await this.projection({ templates, catalog });
      try {
        return await this.lease(staged.spec);
      } finally {
        await this.options.library.release(staged.held);
      }
    });
  }
  read(input: { id: string; contentHash: string }): Promise<Projection> {
    return this.sequence(async () => {
      await this.restore();
      if (!this.loaded) await this.refresh();
      const entry = this.loaded!.entries.find((entry) => entry.id === input.id);
      if (!entry) throw new Fault("missing", "Prism template is not in the selected publication");
      if (entry.contentHash !== input.contentHash)
        throw new Fault("conflict", "Prism template publication changed; read the catalog again");
      if (entry.availability === "unsupported")
        throw new Fault("invalid", entry.reason ?? "Unsupported Prism template");
      let spec = this.head!.ready[sha.parse(entry.contentHash)];
      if (!spec) {
        const item = this.document!.content[this.options.config.locale]!.templates.find(
          (item) => item.templateId === entry.upstreamId,
        )!;
        const contents: Uint8Array[] = new Array(item.files.length),
          deadline = AbortSignal.timeout(30000);
        let cursor = 0;
        const workers = await Promise.allSettled(
          Array.from({ length: Math.min(4, item.files.length) }, async () => {
            for (;;) {
              const index = cursor++;
              const file = item.files[index];
              if (!file) break;
              this.abort.signal.throwIfAborted();
              const claim: Resource = {
                type: "file",
                artifact: { kind: "blob", slot: "source", digest: `sha256:${file.sha256}`, bytes: file.bytes },
              };
              const fetch = source(file.url, claim);
              const use = await this.options.library.acquire(claim, (signal) =>
                fetch(AbortSignal.any([signal, this.abort.signal, deadline])),
              );
              try {
                contents[index] = await readFile(use.path);
              } finally {
                await this.options.library.release(use);
              }
            }
          }),
        );
        const failed = workers.find((work) => work.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
        const prepared = materialize(this.options.config, this.document!, item, entry, contents);
        const staged = await this.projection(prepared);
        spec = staged.spec;
        try {
          const ready = Object.fromEntries(
            [
              ...Object.entries(this.head!.ready).filter(([key]) => key !== entry.contentHash),
              [entry.contentHash, spec],
            ].slice(-32),
          );
          await this.commit({ ...this.head!, ready });
        } finally {
          await this.options.library.release(staged.held);
        }
      }
      return this.lease(spec);
    });
  }
  private scan(): Promise<void> {
    return this.options.context.cleanup(async () => {
      if (this.retired) return;
      await this.options.library.session((library) => this.scanWithin(library));
    });
  }
  private async scanWithin(library: LibrarySession) {
    for (const [id, found] of this.receipts) {
      let complete = false;
      try {
        const info = await lstat(found.ackPath);
        if (!info.isFile() || info.size > 1024) throw Error("Invalid Prism projection acknowledgement");
        const value = z
          .strictObject({ useId: z.uuid(), digest: sha })
          .parse(JSON.parse(await readFile(found.ackPath, "utf8")));
        if (value.useId !== id || value.digest !== found.resource.artifact.digest)
          throw Error("Prism projection acknowledgement mismatch");
        complete = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (!complete && this.stopping) {
        const directory = await this.options.factory.directory(),
          reader = directory.instances.find((item) => item.service === found.use.owner.service);
        if (reader && (reader.incarnation !== found.use.owner.incarnation || reader.phase === "retired"))
          complete = true;
        else if (!reader || reader.phase === "failed") throw Error("Prism projection reader retirement unresolved");
      }
      if (complete) {
        await library.release(found.use);
        this.receipts.delete(id);
        await unlink(found.ackPath).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    }
  }
  async quiesce() {
    this.stopping = true;
    this.abort.abort(Error("Prism catalog stopped"));
    await this.tail;
    while (this.receipts.size) {
      if (this.scanError) throw this.scanError;
      await this.scan();
      if (this.receipts.size) await new Promise((done) => setTimeout(done, 50));
    }
    this.retired = true;
    clearInterval(this.timer);
  }
}
