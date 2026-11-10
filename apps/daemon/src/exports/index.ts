import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import { type Connection, Peer } from "@odsuite/sidecar";
import { freeze } from "@open-motion/render";
import {
  type ExportInput,
  type ExportOperation,
  type ExportOutput,
  exportSchemas,
  type Job,
  type RenderMethods,
  type Reply,
} from "@open-motion/render/contract";
import { Fault, type Workspace } from "@open-motion/workspace";
import { Downloads } from "./download.js";

export interface Binding {
  root: string;
  connection: Connection;
}
/** Only this application adapter can turn workspace ownership into a scoped job command. */
export class Exports {
  readonly downloads: Downloads;
  private peer?: Peer<RenderMethods>;
  constructor(
    private workspace: Workspace,
    private binding?: Binding,
    endpoint?: string,
  ) {
    if (binding) {
      if (!endpoint) throw Error("export download endpoint must be sidecar-injected");
      this.peer = new Peer(binding.connection.endpoint, binding.connection.capability);
    }
    this.downloads = new Downloads(binding?.root, endpoint);
  }
  async execute<K extends ExportOperation>(operation: K, raw: unknown): Promise<ExportOutput<K>> {
    const parsed = exportSchemas[operation].safeParse(raw);
    if (!parsed.success) throw new Fault("invalid", "invalid export request");
    const input = parsed.data;
    this.workspace.execute("project_read", { sessionId: input.sessionId, artifactId: input.artifactId });
    if (!this.peer || !this.binding) {
      if (operation === "export_list") return { jobs: [], next: null } as unknown as ExportOutput<K>;
      throw new Fault("invalid", "Film export is not available on this platform");
    }
    if (operation === "export_download") {
      const job = await this.call("export_read", input as ExportInput<"export_read">);
      return this.downloads.issue(job) as ExportOutput<K>;
    }
    if (operation === "export_create") {
      const create = input as ExportInput<"export_create">,
        snapshot = freeze(this.workspace, create),
        bytes = Buffer.from(canonical(snapshot)),
        identity = digest(bytes),
        directory = join(this.binding.root, "inbox"),
        path = join(directory, `${identity.slice(7)}.json`);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      // Content identity makes retry independent of the active project or a previous HTTP response.
      const temporary = join(directory, `${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, bytes, { flag: "wx", mode: 0o600, flush: true });
        try {
          await link(temporary, path);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
          if (digest(await readFile(path)) !== identity) throw new Fault("integrity", "frozen input changed");
        }
      } finally {
        await rm(temporary, { force: true });
      }
      return this.call("export_create", {
        ...create,
        projection: { digest: identity, bytes: bytes.length },
      }) as Promise<ExportOutput<K>>;
    }
    return this.call(operation as Exclude<ExportOperation, "export_create" | "export_download">, input) as Promise<
      ExportOutput<K>
    >;
  }
  private async call<K extends Exclude<ExportOperation, "export_download">>(
    operation: K,
    input: RenderMethods[K]["input"],
  ): Promise<ExportOutput<K>> {
    const result = (await this.peer!.call(operation, input as never)) as unknown as Reply<ExportOutput<K>>;
    if (!result.ok) throw new Fault(result.error.code, result.error.message);
    return result.value as ExportOutput<K>;
  }
  close() {
    this.downloads.close();
  }
}
