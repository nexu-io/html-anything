import { nodeBanner } from "@odsuite/electron/assets";
import { build } from "esbuild";

const shared = {
  bundle: true,
  external: ["electron"],
  platform: "node",
  target: "node24",
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ["src/index.ts"],
    format: "esm",
    banner: { js: nodeBanner },
    outfile: "dist/index.mjs",
  }),
  build({
    ...shared,
    entryPoints: ["src/main.ts"],
    format: "esm",
    banner: { js: nodeBanner },
    outfile: "dist/main.mjs",
  }),
  build({ ...shared, entryPoints: ["src/preload.ts"], format: "cjs", outfile: "dist/preload.cjs" }),
]);

await build({
  bundle: true,
  entryPoints: ["src/capsule/index.ts"],
  format: "esm",
  platform: "node",
  target: "node24",
  outfile: "dist/capsule/index.mjs",
  packages: "external",
});

await build({
  bundle: true,
  entryPoints: ["src/dev.ts"],
  outfile: "dist/dev.mjs",
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
});
await build({
  ...shared,
  entryPoints: ["src/development.ts"],
  outfile: "dist/development.mjs",
  format: "esm",
  banner: { js: nodeBanner },
});
