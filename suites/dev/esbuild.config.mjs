import { build } from "esbuild";

await build({
  bundle: true,
  splitting: true,
  entryPoints: { index: "src/index.ts", main: "src/main.ts", worker: "src/worker.ts" },
  format: "esm",
  platform: "node",
  target: "node24",
  packages: "external",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
});
