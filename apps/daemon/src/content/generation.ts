import { Peer } from "@odsuite/sidecar";
import { readCandidate } from "@open-motion/gateway";
import {
  type GatewayMethods,
  type GenerationInput,
  type GenerationOperation,
  type GenerationOutput,
  generationSchemas,
  type Reply,
} from "@open-motion/gateway/contract";
import type { Binding } from "@open-motion/gateway/host";
import { Fault, type Workspace } from "@open-motion/workspace";

/** Product ownership and adoption; the hosted gateway owns jobs and durable candidate bytes. */
export class Generations {
  private peer?: Peer<GatewayMethods>;
  constructor(
    private workspace: Workspace,
    private binding?: Binding,
  ) {
    if (binding) this.peer = new Peer(binding.connection.endpoint, binding.connection.capability);
  }
  async execute<K extends GenerationOperation>(operation: K, raw: unknown): Promise<GenerationOutput<K>> {
    const parsed = generationSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid generation request");
    if (operation === "generation_status") {
      if (!this.peer)
        return {
          configured: false,
          providers: [],
          limits: { active: 32, page: 16, pngBytes: 6291456, pngDimension: 4096 },
        } as unknown as GenerationOutput<K>;
      return this.call("generation_status", {}) as Promise<GenerationOutput<K>>;
    }
    if (operation === "generation_adopt") {
      const input = parsed.data as GenerationInput<"generation_adopt">,
        intent = {
          requestId: input.requestId,
          sessionId: input.sessionId,
          artifactId: input.artifactId,
          expectedRevision: input.expectedRevision,
          path: input.path,
          name: input.name,
          source: { id: input.id, contentHash: input.contentHash },
        },
        prior = this.workspace.resourceSourceReceipt(intent);
      if (prior) return prior as GenerationOutput<K>;
      this.workspace.execute("project_read", { sessionId: input.sessionId, artifactId: input.artifactId });
      const result = await this.call("generation_result", {
        sessionId: input.sessionId,
        artifactId: input.artifactId,
        id: input.id,
      });
      if (result.candidate.contentHash !== input.contentHash || result.candidate.jobId !== input.id)
        throw new Fault("conflict", "selected generation candidate changed");
      const bytes = await readCandidate(this.binding!.root, result.candidate);
      return this.workspace.importResourceSource(intent, bytes) as GenerationOutput<K>;
    }
    const input = parsed.data as GenerationInput<"generation_read">;
    this.workspace.execute("project_read", { sessionId: input.sessionId, artifactId: input.artifactId });
    if (operation === "generation_create") {
      const create = parsed.data as GenerationInput<"generation_create">;
      this.workspace.execute("project_snapshot", {
        sessionId: create.sessionId,
        artifactId: create.artifactId,
        revision: create.revision,
      });
    }
    if (!this.peer || !this.binding) {
      if (operation === "generation_list") return { jobs: [], next: null } as unknown as GenerationOutput<K>;
      throw new Fault("invalid", "PNG generation is not configured");
    }
    if (operation === "generation_result") {
      const result = await this.call("generation_result", input),
        bytes = await readCandidate(this.binding.root, result.candidate);
      return {
        candidate: result.candidate,
        data: Buffer.from(bytes).toString("base64"),
      } as unknown as GenerationOutput<K>;
    }
    return this.call(
      operation as Exclude<GenerationOperation, "generation_adopt" | "generation_result" | "generation_status">,
      parsed.data as never,
    ) as Promise<GenerationOutput<K>>;
  }
  private async call<K extends keyof GatewayMethods>(
    operation: K,
    input: GatewayMethods[K]["input"],
  ): Promise<GatewayMethods[K]["output"] extends Reply<infer T> ? T : never> {
    if (!this.peer) throw new Fault("invalid", "PNG generation is not configured");
    const reply = (await this.peer.call(operation, input as never)) as Reply<unknown>;
    if (!reply.ok) throw new Fault(reply.error.code, reply.error.message);
    return reply.value as GatewayMethods[K]["output"] extends Reply<infer T> ? T : never;
  }
}
