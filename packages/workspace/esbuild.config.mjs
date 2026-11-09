import { build } from "esbuild";

await build({
  bundle: true,
  splitting: true,
  entryPoints: { index: "src/index.ts", contract: "src/contract.ts" },
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  platform: "node",
  target: "node24",
});
