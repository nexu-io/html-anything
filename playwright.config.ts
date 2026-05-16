import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3317",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- -p 3317",
    url: "http://localhost:3317",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
