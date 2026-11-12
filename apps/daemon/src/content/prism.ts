import { lstat, readFile, rename, writeFile } from "node:fs/promises";
import { digest } from "@odsuite/protocol";
import { Peer } from "@odsuite/sidecar";
import { list } from "@open-motion/templates";
import {
  type Descriptor,
  type TemplateInput,
  type TemplateOperation,
  type TemplateOutput,
  templateSchemas,
} from "@open-motion/templates/contract";
import type { Binding, Methods, Projection, Reply } from "@open-motion/templates/host";
import type { DiscoveryCatalog } from "@open-motion/templates/prism";
import { Fault, type Workspace } from "@open-motion/workspace";
import { Templates } from "./templates.js";

/** Bulk source travels through a private immutable blob projection, never through sidecar frames. */
export class PrismTemplates {
  private peer: Peer<Methods>;
  private builtins: Templates;
  constructor(
    private workspace: Workspace,
    binding: Binding,
    private onRead?: () => Promise<void>,
  ) {
    this.peer = new Peer(binding.connection.endpoint, binding.connection.capability, 45000);
    this.builtins = new Templates(workspace);
  }
  private value<T>(reply: Reply<T>): T {
    if (!reply.ok) throw new Fault(reply.error.code, reply.error.message);
    return reply.value;
  }
  private async consume<T>(projection: Projection): Promise<T> {
    try {
      const info = await lstat(projection.path);
      if (!info.isFile() || info.size !== projection.artifact.bytes || info.size > 16 * 1024 ** 2)
        throw new Fault("integrity", "Invalid Prism source projection");
      await this.onRead?.();
      const bytes = await readFile(projection.path);
      if (digest(bytes) !== projection.artifact.digest)
        throw new Fault("integrity", "Prism projection digest mismatch");
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as T;
    } finally {
      const temporary = `${projection.ackPath}.tmp`;
      await writeFile(temporary, JSON.stringify({ useId: projection.useId, digest: projection.artifact.digest }), {
        flag: "wx",
        mode: 0o600,
        flush: true,
      });
      await rename(temporary, projection.ackPath);
    }
  }
  async execute<K extends TemplateOperation>(operation: K, raw: unknown): Promise<TemplateOutput<K>> {
    const parsed = templateSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid template request");
    if (operation === "template_list") {
      try {
        const remote = await this.consume<{ templates: Descriptor[]; catalog: DiscoveryCatalog }>(
          this.value(await this.peer.call("list", null)),
        );
        return { templates: [...list().templates, ...remote.templates], catalog: remote.catalog } as TemplateOutput<K>;
      } catch (error) {
        return {
          ...list(),
          catalogError: error instanceof Fault ? error.message : "Prism catalog is unavailable",
        } as TemplateOutput<K>;
      }
    }
    const input = parsed.data as TemplateInput<"template_create">;
    const intent = {
      requestId: input.requestId,
      sessionId: input.sessionId,
      title: input.title,
      source: { id: input.id, contentHash: input.contentHash },
    };
    if (operation === "template_create") {
      const prior = this.workspace.sourceReceipt(intent);
      if (prior) return prior as TemplateOutput<K>;
    }
    if (!input.id.startsWith("prism-")) return this.builtins.execute(operation, input);
    const selected = await this.consume<TemplateOutput<"template_read">>(
      this.value(await this.peer.call("read", { id: input.id, contentHash: input.contentHash })),
    );
    if (selected.template.id !== input.id || selected.template.contentHash !== input.contentHash)
      throw new Fault("integrity", "Prism projection identity mismatch");
    if (operation === "template_read") return selected as TemplateOutput<K>;
    return this.workspace.createSource(intent, { files: selected.files, resources: [] }) as TemplateOutput<K>;
  }
}
