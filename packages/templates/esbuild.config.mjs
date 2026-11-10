import { build } from "esbuild";

await build({
  bundle: true,
  splitting: true,
  entryPoints: {
    index: "src/index.ts",
    contract: "src/contract.ts",
    prism: "src/prism/index.ts",
    host: "src/prism/host.ts",
  },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
});
