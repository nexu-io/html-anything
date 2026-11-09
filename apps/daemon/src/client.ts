import type { Environment } from "@odsuite/carrier";
import type { Clip } from "@open-motion/motion";
import type { AnimationInput, EditInput, NativeValues } from "@open-motion/motion/contract";
import type { ContextModel, HostChange, Source } from "@open-motion/motion/project";
import { Fault, type Input, type Operation, type Output, type Project } from "@open-motion/workspace/contract";
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
  async execute<K extends Operation>(operation: K, input: Input<K>): Promise<Output<K>> {
    return (await this.send(`/api/${operation}`, input)) as Output<K>;
  }
  private async send(path: string, input?: unknown, keepalive = false): Promise<unknown> {
    const response = await this.transport(`${this.origin}${path}`, {
      signal: AbortSignal.timeout(path === "/health" ? 3000 : 10000),
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
