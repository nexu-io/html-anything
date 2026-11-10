import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    fileParallelism: false,
    environment: "node",
    env: { PLAYWRIGHT_BROWSERS_PATH: "0" },
    include: ["tests/**/*.test.ts"],
  },
});
