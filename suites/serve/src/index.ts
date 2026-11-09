import { realpath, stat } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import type { FactoryScope } from "@odsuite/protocol";
import { type Identity, managerEndpoint, type Service, serve } from "@odsuite/sidecar";
import type { Fault } from "./fault.js";
import { source } from "./source.js";

export { configuration } from "./config.js";
export type { Fault } from "./fault.js";
export { source } from "./source.js";
export type { Documents } from "./static.js";

export interface Source {
  directory: string;
}
export interface Endpoint extends Identity {
  incarnation: string;
  url: string;
  directory: string;
}
export interface Methods {
  status: { input: unknown; output: Endpoint };
  fault: { input: Fault | null; output: Fault | null };
}
async function canonicalPath(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return join(await canonicalPath(dirname(path)), basename(path));
  }
}
export class Sources {
  private constructor(
    private manager: Service,
    readonly endpoints: readonly Endpoint[],
  ) {}
  static async open(options: { data: string; scope: FactoryScope; sources: Record<string, Source> }): Promise<Sources> {
    const data = await canonicalPath(resolve(options.data));
    const sources = await Promise.all(
      Object.entries(options.sources).map(async ([name, source]) => {
        if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error("invalid source name");
        const directory = await realpath(source.directory);
        if (data === directory || data.startsWith(directory + sep) || directory.startsWith(data + sep))
          throw new Error("static content must be separate from manager data");
        if (!(await stat(directory)).isDirectory()) throw new Error("source must be a directory");
        return { name, directory };
      }),
    );
    if (!sources.length) throw new Error("at least one static source is required");
    const manager = await serve(managerEndpoint(data), { root: data });
    const endpoints: Endpoint[] = [];
    try {
      const factory = manager.factory(options.scope);
      for (const { name, directory } of sources) {
        const opened = await source(factory, { name, directory });
        endpoints.push(opened.endpoint);
      }
      return new Sources(manager, Object.freeze(endpoints));
    } catch (error) {
      try {
        await manager.close();
      } catch (cleanup) {
        throw new AggregateError([error, cleanup], "source startup and cleanup failed");
      }
      throw error;
    }
  }
  directory() {
    return this.manager.directory();
  }
  close() {
    return this.manager.close();
  }
  async fault(service: string, input: Fault | null) {
    const endpoint = this.endpoints.find((value) => value.service === service);
    if (!endpoint) throw new Error("static source not found");
    const peer = await this.manager.factory(endpoint).connect<Methods>(endpoint);
    return peer.call("fault", input);
  }
}
