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

import { fontAssets, stylesheet } from "@odsuite/style";

await stylesheet({ entry: "src/index.less", output: "dist/style.css" });

await fontAssets({ manifest: "src/fonts/manifest.json", output: "dist" });
