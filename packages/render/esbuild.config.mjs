import { build } from "esbuild";

await build({
  bundle: true,
  splitting: true,
  entryPoints: { index: "src/index.ts", worker: "src/worker.ts" },
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
});
