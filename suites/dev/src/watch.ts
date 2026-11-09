import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import type { Builder } from "./build.js";

const metadata = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "odsuite.yaml",
  "tsconfig.json",
  "tsconfig.tests.json",
  "esbuild.config.mjs",
  "build.mjs",
]);
export async function fingerprint(repo: string): Promise<string> {
  const entries: [string, string][] = [];
  const add = async (path: string) => {
    entries.push([path, digest(await readFile(join(repo, path)))]);
  };
  const walk = async (path: string) => {
    for (const e of await readdir(join(repo, path), { withFileTypes: true })) {
      const name = join(path, e.name);
      if (e.isDirectory()) await walk(name);
      else if (e.isFile()) await add(name);
    }
  };
  for (const e of await readdir(repo, { withFileTypes: true }))
    if (e.isFile() && metadata.has(e.name)) await add(e.name);
  for (const group of ["suites", "carriers", "apps", "packages"]) {
    let modules: Dirent[];
    try {
      modules = await readdir(join(repo, group), { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    for (const module of modules) {
      if (!module.isDirectory()) continue;
      const base = join(group, module.name);
      for (const e of await readdir(join(repo, base), { withFileTypes: true })) {
        if (e.isDirectory() && e.name === "src") await walk(join(base, "src"));
        else if (e.isFile() && metadata.has(e.name)) await add(join(base, e.name));
      }
    }
  }
  return digest(canonical(entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));
}
export class Watcher {
  private stopped = false;
  private flight?: Promise<void>;
  constructor(
    private repo: string,
    private builder: Builder,
    private source: string,
  ) {}
  start() {
    this.flight = this.loop();
  }
  private async loop() {
    while (!this.stopped) {
      await new Promise((r) => setTimeout(r, 500));
      if (this.stopped) return;
      try {
        const source = await fingerprint(this.repo);
        if (source === this.source) continue;
        this.source = source;
        await this.builder.run(source);
        this.builder.state.restartRequired = true;
      } catch (error) {
        this.builder.state.error = (error as Error).message;
        this.builder.state.phase = "failed";
      }
    }
  }
  async stop() {
    this.stopped = true;
    await this.builder.stop();
    await this.flight;
  }
}
