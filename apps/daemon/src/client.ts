import type { Environment } from "@odsuite/carrier";
import type { Clip } from "@open-motion/motion";
import type { AnimationInput, EditInput, NativeValues } from "@open-motion/motion/contract";
import type { ContextModel, HostChange, Source } from "@open-motion/motion/project";
import type { ExportInput, ExportOperation, ExportOutput } from "@open-motion/render/contract";
import type {
  Project,
  Input as WorkspaceInput,
  Operation as WorkspaceOperation,
  Output as WorkspaceOutput,
} from "@open-motion/workspace/contract";
import {
  type ArchiveDownload,
  type ArchiveUpload,
  archiveLimits,
  Fault,
  type Input,
  type Operation,
  type Output,
} from "./contract.js";
export type Transport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export interface Health {
  ok: boolean;
  pid: number;
  environment?: Environment;
}
export class Client {
  private origin: string;
  private previews = new Map<string, string>();
  constructor(
    origin: string,
    private token: string,
    private transport: Transport = (input, init) => fetch(input, init),
  ) {
    const url = new URL(origin);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      !url.port ||
      url.pathname !== "/" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("daemon endpoint must be a loopback HTTP origin");
    if (!token) throw new Error("daemon capability is required");
    this.origin = url.origin;
  }
  async inspectMotion(html: string): Promise<{ html: string; clips: Clip[] }> {
    return (await this.send("/motion/inspect", { html })) as { html: string; clips: Clip[] };
  }
  async contextMotion(files: Source[], instance: string | null): Promise<ContextModel> {
    return (await this.send("/motion/context", { files, instance })) as ContextModel;
  }
  async retimeHost(
    files: Source[],
    instance: string | null,
    id: string,
    start: number,
    duration: number,
  ): Promise<HostChange> {
    return (await this.send("/motion/host", { files, instance, id, start, duration })) as HostChange;
  }
  async patchMotion(html: string, id: string, values: NativeValues): Promise<{ html: string; clips: Clip[] }> {
    return (await this.send("/motion/patch", { html, id, ...values })) as { html: string; clips: Clip[] };
  }
  async animateMotion(input: AnimationInput): Promise<{ html: string; clips: Clip[] }> {
    return (await this.send("/motion/animate", input)) as { html: string; clips: Clip[] };
  }
  async editMotion(input: EditInput): Promise<{ html: string; clips: Clip[] }> {
    return (await this.send("/motion/edit", input)) as { html: string; clips: Clip[] };
  }
  async preview(
    project: Pick<Project, "sessionId" | "artifactId" | "revision">,
  ): Promise<{ id: string; revision: string; url: string }> {
    const key = JSON.stringify([project.sessionId, project.artifactId, project.revision]);
    const id = this.previews.get(key) ?? crypto.randomUUID();
    this.previews.set(key, id);
    const result = (await this.send("/preview/open", {
      id,
      sessionId: project.sessionId,
      artifactId: project.artifactId,
      expectedRevision: project.revision,
    })) as { id: string; revision: string };
    return { ...result, url: `${this.origin}/preview/${result.id}/index.html` };
  }
  async closePreview(id: string): Promise<void> {
    await this.send("/preview/close", { id }, true);
    for (const [key, value] of this.previews) if (value === id) this.previews.delete(key);
  }
  async closePreviews(): Promise<void> {
    await Promise.all([...this.previews.values()].map((id) => this.closePreview(id)));
  }
  async health(): Promise<Health> {
    return (await this.send("/health")) as Health;
  }
  execute<K extends WorkspaceOperation>(
    operation: K,
    input: WorkspaceInput<K>,
    signal?: AbortSignal,
  ): Promise<WorkspaceOutput<K>>;
  execute<K extends ExportOperation>(
    operation: K,
    input: ExportInput<K>,
    signal?: AbortSignal,
  ): Promise<ExportOutput<K>>;
  execute<K extends Operation>(operation: K, input: Input<K>, signal?: AbortSignal): Promise<Output<K>>;
  async execute(operation: Operation, input: unknown, signal?: AbortSignal): Promise<Output<Operation>> {
    return (await this.send(`/api/${operation}`, input, false, signal)) as Output<Operation>;
  }
  private archiveUrl(value: string, kind: "upload" | "download") {
    const url = new URL(value);
    if (
      url.origin !== this.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !new RegExp(`^/archives/${kind}/[a-f0-9]{64}$`).test(url.pathname)
    )
      throw new Error("archive transfer must use this daemon's business grant");
    return url.href;
  }
  async uploadArchive(ticket: ArchiveUpload, file: Blob, signal?: AbortSignal): Promise<void> {
    if (file.size !== ticket.bytes || file.size > archiveLimits.bytes) throw new Error("archive size changed");
    const response = await this.transport(this.archiveUrl(ticket.url, "upload"), {
      method: "POST",
      body: file,
      credentials: "omit",
      cache: "no-store",
      mode: "cors",
      headers: { "content-type": "application/zip" },
      signal: AbortSignal.any([AbortSignal.timeout(archiveLimits.transfer), ...(signal ? [signal] : [])]),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Fault(result.error?.code ?? "integrity", result.error?.message ?? "archive upload failed");
    if (result.id !== ticket.id || result.ready !== true) throw new Error("archive upload receipt changed");
  }
  async downloadArchive(ticket: ArchiveDownload, signal?: AbortSignal): Promise<Blob> {
    if (!Number.isSafeInteger(ticket.bytes) || ticket.bytes < 22 || ticket.bytes > archiveLimits.bytes)
      throw new Error("archive size outside supported bounds");
    const response = await this.transport(this.archiveUrl(ticket.url, "download"), {
      credentials: "omit",
      cache: "no-store",
      mode: "cors",
      signal: AbortSignal.any([AbortSignal.timeout(archiveLimits.transfer), ...(signal ? [signal] : [])]),
    });
    if (!response.ok || !response.body) throw new Error("archive download unavailable");
    const bytes = new Uint8Array(ticket.bytes),
      reader = response.body.getReader();
    let length = 0;
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        if (length + next.value.length > bytes.length) throw new Error("archive download exceeds fixed size");
        bytes.set(next.value, length);
        length += next.value.length;
      }
      if (length !== bytes.length) throw new Error("archive download is incomplete");
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        digest = `sha256:${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      if (digest !== ticket.digest) throw new Error("archive download digest changed");
      return new Blob([bytes], { type: "application/zip" });
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
  }
  private async send(path: string, input?: unknown, keepalive = false, signal?: AbortSignal): Promise<unknown> {
    const response = await this.transport(`${this.origin}${path}`, {
      signal: AbortSignal.any([AbortSignal.timeout(path === "/health" ? 3000 : 10000), ...(signal ? [signal] : [])]),
      method: input === undefined ? "GET" : "POST",
      credentials: "omit",
      keepalive,
      cache: "no-store",
      mode: "cors",
      headers: {
        authorization: `Bearer ${this.token}`,
        ...(input === undefined ? {} : { "content-type": "application/json" }),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    });
    const result = await response.json();
    if (!response.ok) {
      if (
        result.error &&
        ["invalid", "missing", "ownership", "conflict", "idempotency", "integrity"].includes(result.error.code)
      )
        throw new Fault(result.error.code, result.error.message);
      throw new Error(`daemon request failed: ${response.status}`);
    }
    return result;
  }
}
