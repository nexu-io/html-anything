import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/index.ts", "src/compile.ts", "src/npm.ts"],
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  platform: "node",
  target: "node24",
});
