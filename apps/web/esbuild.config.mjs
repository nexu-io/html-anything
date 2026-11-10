import { copyFile, mkdir, rm } from "node:fs/promises";

import { documentStyles } from "@odsuite/style";
import { build } from "esbuild";

const shared = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2024",
};

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await Promise.all([
  copyFile(new URL("../../LICENSE", import.meta.url), "dist/LICENSE"),
  copyFile(new URL("../../NOTICE", import.meta.url), "dist/NOTICE"),
  build({ ...shared, entryPoints: ["src/index.ts"], outfile: "dist/index.mjs" }),
  build({ ...shared, entryPoints: ["src/main.ts"], outfile: "dist/main.js" }),
  documentStyles({
    source: "src/index.html",
    output: "dist/index.html",
    fonts: [new URL(import.meta.resolve("@open-motion/theme/fonts.json"))],
    styles: [
      new URL(import.meta.resolve("@open-motion/theme/style.css")),
      new URL(import.meta.resolve("@open-motion/components/style.css")),
    ],
  }),
]);
