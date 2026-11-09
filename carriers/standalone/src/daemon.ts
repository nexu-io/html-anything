import { type Environment, encode } from "@odsuite/carrier";
import type { Digest } from "@odsuite/protocol";
import type { Context, Factory, Lease } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import type { Input, Operation, Output } from "@open-motion/workspace/contract";

export class Daemon {
  private lease?: Lease;
  private capability?: Awaited<ReturnType<Factory["issue"]>>;
  private endpoint = "";
  private client?: Client;
  private requests = new Set<Promise<unknown>>();
  private ready = false;
  private attempted?: Digest;
  constructor(private factory: Factory) {}
  async start(
    context: Context,
    options: { entry: string; origin: string; generation: Digest; environment: Environment },
  ) {
    const socket = await context.allocate({ kind: "socket", name: "daemon" });
    const port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
    this.capability = await this.factory.issue({
      owner: `n${context.incarnation.replaceAll("-", "")}`,
      service: "daemon",
    });
    this.attempted = options.generation;
    this.lease = await this.factory.start({
      command: process.execPath,
      args: [options.entry],
      generation: options.generation,
      service: "daemon",
      ready: "ready",
      env: {
        HYPERFRAMES_NO_TELEMETRY: "1",
        ODSUITE_RUNTIME_SOCKET: socket.value,
        ODSUITE_RUNTIME_DATA: context.roots.data,
        ODSUITE_RUNTIME_ORIGIN: options.origin,
        ODSUITE_RUNTIME_TOKEN: this.capability.token,
        ODSUITE_RUNTIME_CARRIER: encode(options.environment),
      },
    });
    await context.forward(port.value, socket.value);
    this.endpoint = port.value;
    this.client = new Client(port.value, this.capability.token);
    const health = await this.health();
    if (
      !health.ok ||
      health.pid !== this.lease.pid ||
      JSON.stringify(health.environment) !== encode(options.environment)
    )
      throw new Error("daemon readiness environment or process identity mismatch");
    this.ready = true;
  }
  bootstrap() {
    if (!this.ready || !this.capability) throw new Error("daemon is not ready");
    return { daemon: this.endpoint, token: this.capability.token };
  }
  async health(): Promise<{ ok: boolean; pid: number; environment: Environment }> {
    if (!this.capability || !this.endpoint) throw new Error("daemon is not started");
    const result = await this.client?.health();
    if (!result?.environment) throw new Error("daemon environment is missing");
    return { ...result, environment: result.environment };
  }
  async execute<K extends Operation>(operation: K, input: Input<K>): Promise<Output<K>> {
    if (!this.ready || !this.client) throw new Error("daemon is not ready");
    const request = this.client.execute(operation, input);
    this.requests.add(request);
    try {
      return await request;
    } finally {
      this.requests.delete(request);
    }
  }

  async close() {
    this.ready = false;
    await Promise.allSettled([...this.requests]);
    if (this.lease) {
      const result = await this.factory.release(this.lease);
      if (result.status !== "stopped" || result.survivors.length) throw new Error("daemon did not retire");
      this.lease = undefined;
    }
    if (!this.lease && this.attempted) {
      const entry = (await this.factory.directory()).instances.find(
        (item) => item.service === "daemon" && item.generation === this.attempted,
      );
      if (entry && entry.phase !== "retired") throw new Error("daemon startup retirement unresolved");
    }
    if (this.capability) {
      await this.factory.retire(this.capability);
      this.capability = undefined;
    }
  }
}
