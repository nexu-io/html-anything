import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { Use } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { Factory, Lease } from "@odsuite/sidecar";
import type { ContentResources } from "./control/content.js";
import { unitFile } from "./control/units.js";
import type { Mount } from "./generations.js";

export class Agent {
  private lease?: Lease;
  private guards: Use[] = [];
  private uses: Use[] = [];
  private token?: Awaited<ReturnType<Factory["issue"]>>;
  private transient: string[] = [];
  private endpoint = "";
  private requests = new Set<Promise<unknown>>();
  phase: "starting" | "ready" | "stopping" | "stopped" = "starting";
  readonly nonce: string;
  readonly generation: Digest;
  readonly unit: Digest;
  version?: string;
  private constructor(
    private factory: Factory,
    mount: Mount,
    digest: Digest,
    private resources: ContentResources,
    nonce?: string,
  ) {
    this.generation = mount.target;
    this.unit = digest;
    this.nonce = nonce ?? randomUUID();
  }
  static async start(
    factory: Factory,
    mount: Mount,
    digest: Digest,
    executable: string,
    origin: string,
    resources: ContentResources,
    nonce?: string,
  ) {
    const agent = new Agent(factory, mount, digest, resources, nonce);
    try {
      agent.guards = await resources.use(mount.target, ["daemon"]);
      const meta = await unitFile(mount.daemon, "daemon");
      agent.version = meta?.version;
      const owner = `n${agent.nonce.replaceAll("-", "")}`;
      agent.token = await factory.issue({ owner, service: "daemon" });
      const data = await factory.grant({ kind: "data", name: "daemon", scope: "factory" });
      const socket = await factory.grant({ kind: "socket", name: "daemon", owner, scope: "attempt" });
      agent.transient.push(socket.lease);
      const port = await factory.grant({ kind: "port", name: "daemon", owner, scope: "attempt", scheme: "http" });
      agent.transient.push(port.lease);
      agent.lease = await factory.start({
        command: executable,
        args: [join(mount.daemon, "main.mjs")],
        generation: digest,
        service: "daemon",
        ready: `ready:${mount.target}:${agent.nonce}`,
        env: {
          ELECTRON_RUN_AS_NODE: "1",
          ODSUITE_RUNTIME_DATA: data.value,
          ODSUITE_RUNTIME_ORIGIN: origin,
          ODSUITE_RUNTIME_SOCKET: socket.value,
          ODSUITE_RUNTIME_TOKEN: agent.token.token,
          ODSUITE_RUNTIME_GENERATION: mount.target,
          ODSUITE_RUNTIME_NONCE: agent.nonce,
          ODSUITE_RUNTIME_LIFELINE: "1",
          ODSUITE_RUNTIME_UNIT: digest,
          ...(meta ? { ODSUITE_RUNTIME_VERSION: meta.version } : {}),
        },
      });
      agent.uses = await resources.use(mount.target, ["daemon"], agent.lease);
      await resources.release(agent.guards);
      agent.guards = [];
      await factory.forward(port.lease, socket.lease);
      agent.endpoint = port.value;
      const health = await agent.send("health");
      agent.exact(health);
      agent.phase = "ready";
      return agent;
    } catch (error) {
      await agent.close();
      throw error;
    }
  }
  get pid() {
    return this.lease?.pid;
  }
  exact(value: Record<string, unknown>) {
    if (
      value.pid !== this.pid ||
      value.generation !== this.generation ||
      value.nonce !== this.nonce ||
      (this.version !== undefined && (value.unit !== this.unit || value.version !== this.version))
    )
      throw new Error("daemon readiness identity mismatch");
  }
  private async send(operation: "health" | "read" | "write", value?: unknown): Promise<Record<string, unknown>> {
    if (!this.token) throw new Error("daemon is not started");
    const response = await fetch(`${this.endpoint}/${operation === "health" ? "health" : "state"}`, {
      method: operation === "write" ? "PUT" : "GET",
      headers: { authorization: `Bearer ${this.token.token}`, "content-type": "application/json" },
      body: operation === "write" ? JSON.stringify(value) : undefined,
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404 && operation === "read") return {};
    if (!response.ok) throw new Error(`daemon request ${response.status}`);
    return (await response.json()) as Record<string, unknown>;
  }
  async request(operation: "health" | "read" | "write", value?: unknown) {
    if (this.phase !== "ready") throw new Error("daemon is not ready");
    const work = this.send(operation, value);
    this.requests.add(work);
    try {
      const result = await work;
      if (operation === "health") this.exact(result);
      return result;
    } finally {
      this.requests.delete(work);
    }
  }
  async close() {
    if (this.phase === "stopped") return;
    this.phase = "stopping";
    await Promise.allSettled([...this.requests]);
    if (this.lease) {
      const stopped = await this.factory.release(this.lease);
      if (stopped.status !== "stopped" || stopped.survivors.length) throw new Error("daemon retirement incomplete");
    }
    if (!this.lease && this.guards.length) {
      const subject = (await this.factory.directory()).instances.find((i) => i.service === "daemon");
      if (subject && subject.phase !== "retired") throw Error("daemon startup retirement unresolved");
    }
    await this.resources.release([...this.uses, ...this.guards]);
    this.uses = [];
    this.guards = [];
    if (this.token) await this.factory.retire(this.token);
    for (const lease of this.transient) await this.factory.revoke(lease);
    this.phase = "stopped";
  }
}
