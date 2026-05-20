import { expect, test, type Page } from "@playwright/test";

const STORE_KEY = "html-everything-store";

const generatedHtml = `<!doctype html>
<html>
  <head><title>Deploy Fixture</title></head>
  <body><main><h1>Deploy Fixture</h1></main></body>
</html>`;

async function seedStore(page: Page) {
  const now = 1_700_000_000_000;
  const task = {
    id: "task_deploy_ui",
    name: "Deploy UI fixture",
    content: "Deploy UI fixture",
    format: "html",
    templateId: "article-magazine",
    html: generatedHtml,
    status: "done",
    log: [],
    stats: { outputBytes: generatedHtml.length, deltaCount: 1 },
    createdAt: now,
    updatedAt: now,
  };

  await page.addInitScript(
    ({ key, taskFixture }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            tasks: [taskFixture],
            activeTaskId: taskFixture.id,
            selectedAgent: "test-agent",
            agentModels: {},
            agentBinOverrides: {},
            welcomeAck: true,
            sidebarCollapsed: false,
            locale: "en",
            layoutMode: "split",
          },
          version: 7,
        }),
      );
    },
    {
      key: STORE_KEY,
      taskFixture: task,
    },
  );
}

test.describe("Deploy control", () => {
  test("dismisses the latest deploy result without deleting history", async ({
    page,
  }) => {
    await seedStore(page);

    await page.route("**/api/deploy/config?provider=vercel", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ configured: true }),
      }),
    );
    await page.route("**/api/deploy", async (route, request) => {
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          providerId: "vercel",
          url: "https://deploy-fixture.vercel.app",
          deploymentId: "dpl_fixture",
          target: "production",
          status: "ready",
        }),
      });
    });

    await page.goto("/");

    const publishButton = page.getByRole("button", { name: /publish/i });
    await expect(publishButton).toBeEnabled();

    await publishButton.click();

    await expect(page.getByText("Live at")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "https://deploy-fixture.vercel.app" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Dismiss" }).click();

    await expect(page.getByText("Live at")).toHaveCount(0);
    await page.getByTitle("Past deployments").click();
    await expect(
      page.getByRole("link", { name: "https://deploy-fixture.vercel.app" }),
    ).toBeVisible();
  });
});
