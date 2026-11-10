import { copyFile, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const product = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
await rm("dist", { recursive: true, force: true });
const renderer = fileURLToPath(import.meta.resolve("@open-motion/render/worker")),
  engineRequire = createRequire(renderer),
  engine = JSON.parse(await readFile(engineRequire.resolve("@hyperframes/engine/package.json"), "utf8"));
if (engine.name !== "@hyperframes/engine" || engine.version !== "0.9.7")
  throw Error("unexpected native engine build input");
const versionMetadata = {
  name: "native-engine-version",
  setup(context) {
    context.onLoad({ filter: /renderProvenance\.js$/ }, async ({ path }) => {
      if (!path.includes("/@hyperframes/engine/")) return;
      const text = await readFile(path, "utf8"),
        needle = "PROVENANCE_VERSION = readEngineVersion()";
      if (text.split(needle).length !== 2) throw Error("native provenance contract changed");
      return {
        contents: text.replace(needle, `PROVENANCE_VERSION = ${JSON.stringify(engine.version)}`),
        loader: "js",
        resolveDir: dirname(path),
      };
    });
  },
};
const shared = {
  metafile: true,
  plugins: [versionMetadata],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  define: { OPEN_MOTION_VERSION: JSON.stringify(product.version) },
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
};
await mkdir("dist", { recursive: true });
const results = await Promise.all([
  copyFile(new URL("../../LICENSE", import.meta.url), "dist/LICENSE"),
  copyFile(new URL("../../NOTICE", import.meta.url), "dist/NOTICE"),
  build({ ...shared, entryPoints: ["src/index.ts"], outfile: "dist/index.mjs" }),
  build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.mjs" }),
  cp(fileURLToPath(new URL(".", import.meta.resolve("@open-motion/web/document"))), "dist/web", { recursive: true }),
  build({
    ...shared,
    entryPoints: [fileURLToPath(import.meta.resolve("@open-motion/render/worker"))],
    outfile: "dist/render/worker.mjs",
  }),
  // Daemon also carries its tiny environment parser, so the copied entry has no workspace dependency.
  build({
    ...shared,
    entryPoints: [fileURLToPath(import.meta.resolve("@open-motion/daemon/main"))],
    outfile: "dist/daemon/main.mjs",
  }),
]);
// Preserve notices from the finite set of dependency files actually included in these bundles.
const dependencies = new Map();
for (const result of results)
  for (const input of Object.keys(result?.metafile?.inputs ?? {})) {
    let directory = dirname(resolve(input));
    if (!directory.includes(`${sep}node_modules${sep}`)) continue;
    for (;;) {
      try {
        const pkg = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
        if (pkg.name && pkg.version) {
          dependencies.set(`${pkg.name}@${pkg.version}`, { directory, pkg });
          break;
        }
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
let notices = await readFile(new URL("../../NOTICE", import.meta.url), "utf8");
for (const [name, { directory, pkg }] of [...dependencies].sort(([a], [b]) => a.localeCompare(b))) {
  notices += `\n\nBundled dependency: ${name} (${typeof pkg.license === "string" ? pkg.license : "license metadata not supplied"})\n`;
  for (const filename of (await readdir(directory)).filter((n) => /^(licen[sc]e|notice)(\..*)?$/i.test(n)).sort()) {
    notices += `\n${filename}\n${await readFile(join(directory, filename), "utf8")}\n`;
  }
}
await writeFile("dist/NOTICE", notices);
const { metadata } = await import("./dist/index.mjs");
const manifests = metadata(product.version);
await mkdir("dist/.codex-plugin", { recursive: true });
await writeFile("dist/.codex-plugin/plugin.json", `${JSON.stringify(manifests.plugin, null, 2)}\n`);
await writeFile("dist/mcp.json", `${JSON.stringify(manifests.mcp, null, 2)}\n`);

await build({
  bundle: true,
  entryPoints: ["src/dev.ts"],
  outfile: "dist/dev.mjs",
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
});
