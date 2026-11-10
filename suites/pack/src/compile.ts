import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { build, type Plugin } from "esbuild";
import type { Identity } from "./index.js";

export interface Compilation {
  identity: Identity;
  directory: string;
  entries: Record<string, string>;
  copies: Record<string, string>;
  define?: Record<string, string>;
  plugins?: Plugin[];
  notice: string;
}
/** Carrier authors choose the finite closure; this mechanism knows no product or host. */
export async function compile(input: Compilation): Promise<void> {
  const destination = (name: string) => {
    if (!/^[a-zA-Z0-9.][a-zA-Z0-9./-]*$/.test(name) || name.split("/").some((p) => !p || p === "." || p === ".."))
      throw Error("invalid closure destination");
    return join(input.directory, name);
  };
  const results = await Promise.all(
    Object.entries(input.entries).map(([name, source]) =>
      build({
        bundle: true,
        metafile: true,
        format: "esm",
        platform: "node",
        target: "node24",
        define: input.define,
        plugins: input.plugins,
        banner: {
          js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
        },
        entryPoints: [source],
        outfile: destination(name),
      }),
    ),
  );
  for (const [name, source] of Object.entries(input.copies)) {
    const file = destination(name);
    await mkdir(dirname(file), { recursive: true });
    await cp(source, file, { recursive: true });
  }
  const dependencies = new Map<string, { directory: string; license?: unknown }>();
  for (const result of results)
    for (const name of Object.keys(result.metafile.inputs)) {
      let directory = dirname(resolve(name));
      if (!directory.includes(`${sep}node_modules${sep}`)) continue;
      for (;;) {
        try {
          const pkg = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
          if (pkg.name && pkg.version) {
            dependencies.set(`${pkg.name}@${pkg.version}`, { directory, license: pkg.license });
            break;
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
        const parent = dirname(directory);
        if (parent === directory) break;
        directory = parent;
      }
    }
  let notices = input.notice;
  for (const [name, { directory, license }] of [...dependencies].sort(([a], [b]) => a.localeCompare(b))) {
    notices += `\n\nBundled dependency: ${name} (${typeof license === "string" ? license : "license metadata not supplied"})\n`;
    for (const filename of (await readdir(directory)).filter((n) => /^(licen[sc]e|notice)(\..*)?$/i.test(n)).sort())
      notices += `\n${filename}\n${await readFile(join(directory, filename), "utf8")}\n`;
  }
  await writeFile(destination("NOTICE"), notices);
  await writeFile(destination("runtime.json"), JSON.stringify(input.identity));
}
