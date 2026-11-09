import { mkdir, rm, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const shared = {
  bundle: true,
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
};

await rm("dist", { recursive: true, force: true });
await mkdir("dist");
const program = await build({
  ...shared,
  packages: "bundle",
  entryPoints: ["src/process/supervisor.ts"],
  outfile: "dist/supervisor.mjs",
  write: false,
});

await writeFile("dist/supervisor.mjs", program.outputFiles[0].text);
shared.define = { ODSUITE_SUPERVISOR_SOURCE: JSON.stringify(program.outputFiles[0].text) };
await Promise.all([
  build({ ...shared, entryPoints: ["src/index.ts"], outfile: "dist/index.mjs" }),
  build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.mjs" }),
]);
