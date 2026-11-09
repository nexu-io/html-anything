import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, posix, resolve } from "node:path";
import less from "less";

export { documentStyles } from "./document.js";
export { fontAssets, fontCatalog } from "./fonts.js";
export { components, theme } from "./policy.js";
export interface Compiled {
  css: string;
  imports: string[];
}

/** Only caller-supplied regular files can be imported; no filesystem/network fallback. */
export async function compile(entry: string, sources: ReadonlyMap<string, string>): Promise<Compiled> {
  const source = sources.get(entry);
  if (source === undefined) throw new Error(`missing Less entry: ${entry}`);
  class Memory extends less.FileManager {
    override supports() {
      return true;
    }
    override supportsSync() {
      return true;
    }
    override async loadFile(filename: string, directory: string) {
      return this.loadFileSync(filename, directory);
    }
    override loadFileSync(filename: string, directory: string) {
      if (/[:\\?#]/.test(filename) || filename.startsWith("/")) throw new Error("external Less import forbidden");
      const path = posix.normalize(posix.join(directory, filename.endsWith(".less") ? filename : `${filename}.less`));
      const contents = sources.get(path);
      if (contents === undefined) throw new Error(`Less import outside authorized source set: ${path}`);
      return { contents, filename: path };
    }
  }
  const options: Less.Options & { disablePluginRule: boolean } = {
    filename: entry,
    javascriptEnabled: false,
    disablePluginRule: true,
    plugins: [
      {
        install(_less, manager) {
          manager.addFileManager(new Memory());
        },
      },
    ],
  };
  const result = await less.render(source, options);
  return { css: result.css, imports: result.imports };
}

/** Build-time IO stays separate from the read-only compiler used by guard. */
export async function stylesheet(options: { entry: string; output: string }): Promise<void> {
  const sources = new Map<string, string>();
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`stylesheet symlink forbidden: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (path.endsWith(".less")) sources.set(path, await readFile(path, "utf8"));
    }
  }
  await walk(dirname(options.entry));
  const result = await compile(options.entry, sources);
  await writeFile(resolve(options.output), result.css);
}
