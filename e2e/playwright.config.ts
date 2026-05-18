import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.HTML_ANYTHING_E2E_PORT) || 3317;
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./ui",
  outputDir: "./ui/reports/test-results",
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
  },
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        ["html", { open: "never", outputFolder: "./ui/reports/playwright-html-report" }],
        ["json", { outputFile: "./ui/reports/results.json" }],
        ["junit", { outputFile: "./ui/reports/junit.xml" }],
      ]
    : [
        ["list"],
        ["html", { open: "never", outputFolder: "./ui/reports/playwright-html-report" }],
      ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm -F @html-anything/next build && pnpm -F @html-anything/next exec next start -p ${webPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
