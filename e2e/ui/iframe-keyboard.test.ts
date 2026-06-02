import { expect, test, type Page } from "@playwright/test";

const STORE_KEY = "html-everything-store";

const fixtureHtml = `<!doctype html>
<html>
<body>
  <p id="plain">Hello</p>
  <input id="text-input" type="text" placeholder="type here" />
  <div id="editable" contenteditable="true">Editable</div>
</body>
</html>`;

const deckWithNotes = `<!doctype html>
<html>
<body class="deck-shell">
  <section class="slide">
    <h1 id="heading">Slide 1</h1>
    <input id="deck-input" type="text" placeholder="Type here" />
    <aside class="notes">Speaker notes for slide 1</aside>
  </section>
</body>
</html>`;

async function seedStore(page: Page, html: string) {
  const now = 1_700_000_000_000;
  const task = {
    id: "task_keyboard_test",
    name: "Keyboard test",
    content: "keyboard test",
    format: "html",
    templateId: "prototype-web",
    html,
    status: "done",
    log: [],
    stats: { outputBytes: html.length, deltaCount: 1 },
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
            welcomeAck: true,
            sidebarCollapsed: false,
            locale: "en",
            layoutMode: "split",
          },
          version: 5,
        }),
      );
    },
    { key: STORE_KEY, taskFixture: task },
  );
}

type W = typeof window & { __arrowCount: number; __fCount: number };

test.describe("iframe keyboard forwarding (PreviewPane)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as W).__arrowCount = 0;
      (window as W).__fCount = 0;
      window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") (window as W).__arrowCount++;
        if (e.key === "f" || e.key === "F") (window as W).__fCount++;
      });
    });
  });

  test("forwards ArrowRight from plain iframe element to parent window", async ({ page }) => {
    await seedStore(page, fixtureHtml);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title="preview"]');
    await frame.locator("#plain").press("ArrowRight");

    const count = await page.evaluate(() => (window as W).__arrowCount);
    expect(count).toBe(1);
  });

  test("does not forward ArrowRight from iframe input to parent window", async ({ page }) => {
    await seedStore(page, fixtureHtml);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title="preview"]');
    await frame.locator("#text-input").press("ArrowRight");

    const count = await page.evaluate(() => (window as W).__arrowCount);
    expect(count).toBe(0);
  });

  test("does not forward ArrowRight from iframe contenteditable to parent window", async ({ page }) => {
    await seedStore(page, fixtureHtml);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title="preview"]');
    await frame.locator("#editable").press("ArrowRight");

    const count = await page.evaluate(() => (window as W).__arrowCount);
    expect(count).toBe(0);
  });

  test("forwards f key from plain iframe element to parent window", async ({ page }) => {
    await seedStore(page, fixtureHtml);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title="preview"]');
    await frame.locator("#plain").press("f");

    const count = await page.evaluate(() => (window as W).__fCount);
    expect(count).toBe(1);
  });

  test("does not forward f key from iframe input to parent window", async ({ page }) => {
    await seedStore(page, fixtureHtml);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title="preview"]');
    await frame.locator("#text-input").press("f");

    const count = await page.evaluate(() => (window as W).__fCount);
    expect(count).toBe(0);
  });
});

test.describe("DeckViewer N key — notes panel", () => {
  test("pressing N in iframe body shows notes; pressing N in iframe input leaves them visible", async ({
    page,
  }) => {
    await seedStore(page, deckWithNotes);
    await page.goto("/");

    const frame = page.frameLocator('iframe[title^="slide-"]');

    await expect(page.getByText("Speaker notes for slide 1")).not.toBeVisible();

    // N in body → notes appear (forwarding works)
    await frame.locator("#heading").press("n");
    await expect(page.getByText("Speaker notes for slide 1")).toBeVisible();

    // N in input → notes stay visible (guard blocks the toggle-back)
    await frame.locator("#deck-input").press("n");
    await expect(page.getByText("Speaker notes for slide 1")).toBeVisible();
  });
});
