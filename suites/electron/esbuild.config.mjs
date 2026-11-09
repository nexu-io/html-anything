import { rm } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist", { recursive: true, force: true });

await build({
  entryPoints: { index: "src/index.ts", bridge: "src/bridge.ts", assets: "src/assets.ts" },
  bundle: true,
  format: "esm",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  packages: "external",
  platform: "node",
  target: "node24",
});
await build({
  entryPoints: ["src/preload.ts"],
  bundle: true,
  format: "cjs",
  outfile: "dist/preload.cjs",
  external: ["electron"],
  platform: "node",
  target: "node24",
});
