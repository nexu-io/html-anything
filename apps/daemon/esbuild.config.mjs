import { build } from "esbuild";

await build({
  bundle: true,
  splitting: true,
  entryPoints: {
    index: "src/index.ts",
    main: "src/main.ts",
    client: "src/transport/client.ts",
    mcp: "src/transport/mcp.ts",
    contract: "src/contract.ts",
  },
  outdir: "dist",
  outExtension: { ".js": ".mjs" },
  format: "esm",
  packages: "external",
  platform: "node",
  target: "node24",
});
