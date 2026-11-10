import { list, read } from "@open-motion/templates";
import {
  type TemplateInput,
  type TemplateOperation,
  type TemplateOutput,
  templateSchemas,
} from "@open-motion/templates/contract";
import type { Workspace } from "@open-motion/workspace";
import { Fault } from "@open-motion/workspace/contract";

/** Template source is read-only; creation delegates to the existing workspace transaction. */
export class Templates {
  constructor(private workspace: Workspace) {}
  execute<K extends TemplateOperation>(operation: K, raw: unknown): TemplateOutput<K> {
    const parsed = templateSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid template request");
    if (operation === "template_list") return list() as TemplateOutput<K>;
    const input = parsed.data as TemplateInput<"template_create">;
    const selected = read(input);
    if (operation === "template_read") return selected as TemplateOutput<K>;
    return this.workspace.execute("artifact_create", {
      requestId: input.requestId,
      sessionId: input.sessionId,
      title: input.title,
      files: selected.files,
    }) as TemplateOutput<K>;
  }
}
