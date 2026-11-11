import { readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "@odsuite/pack/compile";
import { parseReleaseVersion } from "@odsuite/release";
import { provenance } from "@open-motion/render/tools";
import { build } from "esbuild";

const product = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
await rm("dist", { recursive: true, force: true });
const shared = {
  bundle: true,
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
  define: { OPEN_MOTION_VERSION: JSON.stringify(process.env.ODSUITE_BUILD ?? product.version) },
};
await build({
  ...shared,
  entryPoints: ["src/index.ts", "src/admission.ts"],
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
});

await build({ ...shared, entryPoints: ["src/dev.ts"], outfile: "dist/dev.mjs" });

const worker = fileURLToPath(import.meta.resolve("@open-motion/render/worker"));
await compile({
  required: ["main.mjs", "LICENSE", "NOTICE", "web/index.html", "daemon/main.mjs", "render/worker.mjs"],
  identity: {
    carrier: "standalone",
    version: process.env.ODSUITE_BUILD ?? product.version,
    channel: parseReleaseVersion(process.env.ODSUITE_BUILD ?? product.version).channel,
  },
  directory: "dist/runtime",
  entries: {
    "main.mjs": "src/main.ts",
    "render/worker.mjs": worker,
    "daemon/main.mjs": fileURLToPath(import.meta.resolve("@open-motion/daemon/main")),
  },
  copies: {
    LICENSE: fileURLToPath(new URL("../../LICENSE", import.meta.url)),
    web: fileURLToPath(new URL(".", import.meta.resolve("@open-motion/web/document"))),
  },
  notice: await readFile(new URL("../../NOTICE", import.meta.url), "utf8"),
  plugins: [await provenance(worker)],
  define: shared.define,
});
