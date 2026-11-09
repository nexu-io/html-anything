import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const product = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8"));
const shared = {
  bundle: true,
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
  define: { OPEN_MOTION_VERSION: JSON.stringify(product.version) },
};
await Promise.all([
  build({ ...shared, entryPoints: ["src/index.ts"], outfile: "dist/index.mjs" }),
  build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.mjs" }),
]);

await build({ ...shared, entryPoints: ["src/dev.ts"], outfile: "dist/dev.mjs" });
