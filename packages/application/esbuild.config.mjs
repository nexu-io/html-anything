import { copyFile, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "@odsuite/pack/compile";
import { build } from "esbuild";

await rm("dist", { recursive: true, force: true });
await compile({
  directory: "dist",
  entries: { "main.mjs": "src/main.ts" },
  copies: { LICENSE: fileURLToPath(new URL("../../LICENSE", import.meta.url)) },
  notice: await readFile(new URL("../../NOTICE", import.meta.url), "utf8"),
});
await copyFile(fileURLToPath(import.meta.resolve("@open-motion/codexplugin/installworker")), "dist/codex-worker.mjs");
await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.mjs",
  bundle: true,
  packages: "external",
  format: "esm",
  platform: "node",
  target: "node24",
});
