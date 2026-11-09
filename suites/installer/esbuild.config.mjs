import { rm } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist", { recursive: true, force: true });
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  platform: "node",
  target: "node24",
});
await build({
  entryPoints: ["src/worker.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/worker.mjs",
  platform: "node",
  target: "node24",
  banner: {
    js: 'import {createRequire as workerRequire} from "node:module";const require=workerRequire(import.meta.url);',
  },
});
