import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/index.ts", "src/s3.ts"],
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  platform: "node",
  target: "node24",
});
