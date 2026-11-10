import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@odsuite/pack/compile";
import { parseReleaseVersion } from "@odsuite/release";
import { provenance } from "@open-motion/render/tools";
import { build } from "esbuild";

const product = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
await rm("dist", { recursive: true, force: true });
const worker = fileURLToPath(import.meta.resolve("@open-motion/render/worker"));
await compile({
  required: [
    "main.mjs",
    "LICENSE",
    "NOTICE",
    "web/index.html",
    "daemon/main.mjs",
    "render/worker.mjs",
    ".codex-plugin/plugin.json",
    "mcp.json",
    "skills/motion-production/SKILL.md",
  ],
  identity: {
    carrier: "codexplugin",
    version: process.env.ODSUITE_BUILD ?? product.version,
    channel: parseReleaseVersion(process.env.ODSUITE_BUILD ?? product.version).channel,
  },
  directory: "dist",
  entries: {
    "index.mjs": "src/index.ts",
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
  define: { OPEN_MOTION_VERSION: JSON.stringify(process.env.ODSUITE_BUILD ?? product.version) },
});
const { localGuidance } = await import("@open-motion/daemon/mcp");
for (const file of localGuidance()) {
  await mkdir(dirname(join("dist", file.path)), { recursive: true });
  await writeFile(join("dist", file.path), file.content);
}
const { metadata } = await import("./dist/index.mjs");
const manifests = metadata(process.env.ODSUITE_BUILD ?? product.version);
await mkdir("dist/.codex-plugin", { recursive: true });
await writeFile("dist/.codex-plugin/plugin.json", `${JSON.stringify(manifests.plugin, null, 2)}\n`);
await writeFile("dist/mcp.json", `${JSON.stringify(manifests.mcp, null, 2)}\n`);

await build({
  bundle: true,
  entryPoints: ["src/dev.ts"],
  outfile: "dist/dev.mjs",
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
});
