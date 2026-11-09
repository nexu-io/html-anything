import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const gsap = await readFile(new URL(import.meta.resolve("gsap/dist/gsap.js")), "utf8");
await build({
  bundle: true,
  splitting: true,
  entryPoints: {
    index: "src/index.ts",
    contract: "src/contract.ts",
    runtime: "src/runtime.ts",
    protocol: "src/protocol.ts",
  },
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  define: { OPEN_MOTION_GSAP: JSON.stringify(gsap) },
});
