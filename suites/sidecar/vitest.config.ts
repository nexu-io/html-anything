import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    ODSUITE_SUPERVISOR_SOURCE: JSON.stringify(readFileSync(new URL("./dist/supervisor.mjs", import.meta.url), "utf8")),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
