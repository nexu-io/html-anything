import { expect, test, type Page, type Request } from "@playwright/test";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const PROJECT_PATH = `/projects/${PROJECT_ID}`;
const PROJECT_API_PATTERN = `**/api/projects/${PROJECT_ID}`;
const STORE_KEY = "html-everything-store";
const LOCAL_TASK_ID = "task_local_project_regression";

const initialProjectHtml = `<!doctype html>
<html>
  <head><title>Generated project</title></head>
  <body><main><h1>Generated project</h1></main></body>
</html>`;

const localHtml = `<!doctype html>
<html>
  <head><title>Local draft</title></head>
  <body><main><h1>Local draft preview</h1></main></body>
</html>`;

type ProjectPatch = {
  content?: string;
  html?: string;
  templateId?: string;
};

type ProjectSnapshotFixture = ReturnType<typeof readySnapshot>;

function readySnapshot() {
  return {
    project: {
      schemaVersion: 1 as const,
      projectId: PROJECT_ID,
      slug: "generated-project",
      name: "Generated project",
      instruction: "Turn the source into a compact project page.",
      templateId: "article-magazine",
      format: "markdown",
      agent: "test-agent",
      sources: [
        {
          path: "notes.md",
          bytes: 14,
          sha256: "a".repeat(64),
        },
      ],
      status: "ready" as const,
      createdAt: "2026-07-21T10:00:00.000Z",
      updatedAt: "2026-07-21T10:00:00.000Z",
    },
    content: "# Generated project\n\nOriginal project content.",
    html: initialProjectHtml,
    url: `https://html-anything.example.test${PROJECT_PATH}`,
    artifactDirectory: "artifacts/html-anything/generated-project",
  };
}

function localTask(content = "Local draft content") {
  const now = 1_700_000_000_000;
  return {
    id: LOCAL_TASK_ID,
    name: "Local regression draft",
    content,
    format: "text",
    templateId: "article-magazine",
    html: localHtml,
    status: "done",
    log: [],
    stats: { outputBytes: localHtml.length, deltaCount: 1 },
    createdAt: now,
    updatedAt: now,
  };
}

async function seedLocalStore(page: Page, content?: string) {
  await page.addInitScript(
    ({ key, task }) => {
      if (window.localStorage.getItem(key) !== null) return;
      window.localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            tasks: [task],
            activeTaskId: task.id,
            selectedAgent: "test-agent",
            agentModels: {},
            agentBinOverrides: {},
            welcomeAck: true,
            sidebarCollapsed: false,
            historyPaneOpen: false,
            locale: "en",
            layoutMode: "split",
          },
          version: 7,
        }),
      );
    },
    { key: STORE_KEY, task: localTask(content) },
  );
}

function applyPatch(
  snapshot: ProjectSnapshotFixture,
  patch: ProjectPatch,
): ProjectSnapshotFixture {
  return {
    ...snapshot,
    content: patch.content ?? snapshot.content,
    html: patch.html ?? snapshot.html,
    project: {
      ...snapshot.project,
      templateId: patch.templateId ?? snapshot.project.templateId,
      updatedAt: "2026-07-21T10:01:00.000Z",
    },
  };
}

function patchFrom(request: Request): ProjectPatch {
  return request.postDataJSON() as ProjectPatch;
}

async function expectOnlyLocalState(page: Page, forbiddenValues: string[]) {
  await expect
    .poll(async () =>
      page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY),
    )
    .not.toBeNull();

  const stored = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as { state: { tasks: unknown[] } }) : null;
  }, STORE_KEY);

  expect(stored).not.toBeNull();
  expect(stored!.state.tasks).toHaveLength(1);
  expect(stored!.state.tasks[0]).toMatchObject({
    id: LOCAL_TASK_ID,
    name: "Local regression draft",
  });
  for (const value of forbiddenValues) {
    expect(JSON.stringify(stored)).not.toContain(value);
  }
}

test.describe("Server project editor", () => {
  test("opens, saves, refreshes, and keeps server state out of localStorage", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    const patches: ProjectPatch[] = [];

    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ json: snapshot });
        return;
      }
      if (request.method() === "PATCH") {
        const patch = patchFrom(request);
        patches.push(patch);
        snapshot = applyPatch(snapshot, patch);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await route.fulfill({ json: snapshot });
        return;
      }
      await route.abort();
    });

    await page.goto(PROJECT_PATH);

    await expect(
      page.getByText(
        "Edit in one browser at a time. The last successful save wins.",
      ),
    ).toBeVisible();
    const saveStatus = page.getByRole("status");
    await expect(saveStatus).toHaveAttribute("aria-live", "polite");
    await expect(saveStatus).toHaveText("Saved");
    const preview = page.locator('iframe[title="preview"]');
    await expect(preview).toBeVisible();
    await expect(
      preview.contentFrame().getByRole("heading", {
        name: "Generated project",
      }),
    ).toBeVisible();
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      snapshot.content,
      snapshot.html,
    ]);

    await expect(page.getByRole("button", { name: "New task" })).toHaveCount(0);
    await expect(page.getByRole("radiogroup", { name: "Workspace layout" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();

    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    await contentEditor.fill("updated server content");
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([
      { content: "updated server content" },
    ]);
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      "updated server content",
      initialProjectHtml,
    ]);

    await page.reload();
    await expect(contentEditor).toHaveValue("updated server content");
    await expect(saveStatus).toHaveText("Saved");
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      "updated server content",
      initialProjectHtml,
    ]);
  });

  test("edits generated HTML, patches it, and reads it back into preview", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    const patches: ProjectPatch[] = [];
    const updatedHtml = `<!doctype html><html><body><h1>Edited source</h1></body></html>`;

    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ json: snapshot });
        return;
      }
      if (request.method() === "PATCH") {
        const patch = patchFrom(request);
        patches.push(patch);
        snapshot = applyPatch(snapshot, patch);
        await new Promise((resolve) => setTimeout(resolve, 200));
        await route.fulfill({ json: snapshot });
        return;
      }
      await route.abort();
    });

    await page.goto(PROJECT_PATH);
    await page.getByRole("button", { name: /source/i }).click();

    const sourceEditor = page.getByRole("textbox", { name: /source/i });
    await expect(sourceEditor).toBeVisible();
    await expect(sourceEditor).toHaveValue(initialProjectHtml);
    await sourceEditor.fill(updatedHtml);
    await expect(page.getByRole("status")).toHaveText("Saving…");
    await expect(page.getByRole("status")).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([{ html: updatedHtml }]);

    await page.getByRole("button", { name: /preview/i }).click();
    const preview = page.locator('iframe[title="preview"]');
    await expect(
      preview.contentFrame().getByRole("heading", {
        name: "Edited source",
      }),
    ).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: /source/i }).click();
    await expect(
      page.getByRole("textbox", { name: /source/i }),
    ).toHaveValue(updatedHtml);
    await expectOnlyLocalState(page, [PROJECT_ID, updatedHtml]);
  });

  test("recovers from load and save failures without discarding browser edits", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    let failLoad = true;
    let failSave = true;
    const patches: ProjectPatch[] = [];

    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (request.method() === "GET") {
        if (failLoad) {
          failLoad = false;
          await route.fulfill({
            status: 500,
            json: { error: "storage_failed", message: "Could not read project." },
          });
          return;
        }
        await route.fulfill({ json: snapshot });
        return;
      }
      if (request.method() === "PATCH") {
        const patch = patchFrom(request);
        patches.push(patch);
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (failSave) {
          failSave = false;
          await route.fulfill({
            status: 500,
            json: { error: "storage_failed", message: "Could not save project." },
          });
          return;
        }
        snapshot = applyPatch(snapshot, patch);
        await route.fulfill({ json: snapshot });
        return;
      }
      await route.abort();
    });

    await page.goto(PROJECT_PATH);
    const loadAlert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn’t load this project." });
    await expect(loadAlert).toHaveText("Couldn’t load this project.");
    await expect(loadAlert).toHaveCount(1);
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");

    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    await contentEditor.fill("unsaved browser edit");
    await expect(page.getByRole("status")).toHaveText("Saving…");
    await expect(page.getByRole("status")).toHaveText("Save failed");
    await expect(contentEditor).toHaveValue("unsaved browser edit");

    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    expect(patches).toEqual([
      { content: "unsaved browser edit" },
      { content: "unsaved browser edit" },
    ]);
    await expectOnlyLocalState(page, [PROJECT_ID, "unsaved browser edit"]);

    await page.reload();
    await expect(contentEditor).toHaveValue("unsaved browser edit");
  });

  test("unregisters only the server link and restores the preserved local draft", async ({
    page,
  }) => {
    await seedLocalStore(page);
    const snapshot = readySnapshot();
    let deleteCount = 0;

    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (request.method() === "GET") {
        await route.fulfill({ json: snapshot });
        return;
      }
      if (request.method() === "DELETE") {
        deleteCount += 1;
        if (deleteCount === 1) {
          await route.fulfill({
            status: 500,
            json: {
              error: "storage_failed",
              message: "Could not unregister project.",
            },
          });
        } else {
          await route.fulfill({ status: 204 });
        }
        return;
      }
      await route.abort();
    });

    await page.goto(PROJECT_PATH);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Unregister “Generated project”? Workspace files will be kept, but this link will stop working.",
      );
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Unregister" }).click();

    const unregisterAlert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn’t unregister this project." });
    await expect(unregisterAlert).toHaveText(
      "Couldn’t unregister this project.",
    );
    await expect(unregisterAlert).toHaveCount(1);

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Unregister" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("textbox", { name: /paste anything/i }),
    ).toHaveValue("Local draft content");
    await expect(page.getByRole("button", { name: "New task" })).toBeVisible();
    expect(deleteCount).toBe(2);
    await expectOnlyLocalState(page, [PROJECT_ID, snapshot.content, snapshot.html]);
  });

  test("keeps the browser-local root workflow unchanged", async ({ page }) => {
    await seedLocalStore(page);
    const projectRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/projects/")) {
        projectRequests.push(request.url());
      }
    });

    await page.goto("/");

    await expect(page.getByRole("button", { name: "New task" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Workspace layout" })).toBeVisible();
    const preview = page.locator('iframe[title="preview"]');
    await expect(
      preview.contentFrame().getByRole("heading", {
        name: "Local draft preview",
      }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      page.getByText(
        "Edit in one browser at a time. The last successful save wins.",
      ),
    ).toHaveCount(0);

    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    await contentEditor.fill("locally edited content");
    await page.reload();
    await expect(contentEditor).toHaveValue("locally edited content");
    expect(projectRequests).toEqual([]);

    const stored = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { state: { tasks: Array<{ content: string }> } }) : null;
    }, STORE_KEY);
    expect(stored?.state.tasks).toHaveLength(1);
    expect(stored?.state.tasks[0]?.content).toBe("locally edited content");
  });
});
