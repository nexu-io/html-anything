import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const product = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
await rm("dist", { recursive: true, force: true });
const shared = {
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
await Promise.all([
  copyFile(new URL("../../LICENSE", import.meta.url), "dist/LICENSE"),
  copyFile(new URL("../../NOTICE", import.meta.url), "dist/NOTICE"),
  build({ ...shared, entryPoints: ["src/index.ts"], outfile: "dist/index.mjs" }),
  build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.mjs" }),
  cp(fileURLToPath(new URL(".", import.meta.resolve("@open-motion/web/document"))), "dist/web", { recursive: true }),
  // Daemon also carries its tiny environment parser, so the copied entry has no workspace dependency.
  build({
    ...shared,
    entryPoints: [fileURLToPath(import.meta.resolve("@open-motion/daemon/main"))],
    outfile: "dist/daemon/main.mjs",
  }),
]);
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
