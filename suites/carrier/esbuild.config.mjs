import { rm } from "node:fs/promises";
import { build } from "esbuild";

await rm("dist", { recursive: true, force: true });

await build({
  bundle: true,
  entryPoints: ["src/index.ts"],
  format: "esm",
  outfile: "dist/index.mjs",
  packages: "external",
  platform: "node",
  target: "node24",
});
