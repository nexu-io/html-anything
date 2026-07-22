import {
  expect,
  test,
  type Page,
  type Request,
  type Route,
} from "@playwright/test";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const PROJECT_PATH = `/projects/${PROJECT_ID}`;
const PROJECT_API_PATTERN = `**/api/projects/${PROJECT_ID}`;
const PROJECT_ASSET_COLLECTION_PATTERN = `${PROJECT_API_PATTERN}/assets?*`;
const PROJECT_ASSET_ITEM_PATTERN = `${PROJECT_API_PATTERN}/assets/*`;
const PROJECT_API_DESCENDANT_PATTERN = `${PROJECT_API_PATTERN}/**`;
const STORE_KEY = "html-everything-store";
const LOCAL_TASK_ID = "task_local_project_regression";
const PROJECT_IMAGE_UPLOAD_ERROR = "Image upload failed. Try again.";

type ProjectMethod = "GET" | "POST" | "PATCH" | "DELETE";

function projectMethodCounts(): Record<ProjectMethod, number> {
  return { GET: 0, POST: 0, PATCH: 0, DELETE: 0 };
}

function recordProjectMethod(
  counts: Record<ProjectMethod, number>,
  request: Request,
): boolean {
  const method = request.method();
  if (
    method !== "GET" &&
    method !== "POST" &&
    method !== "PATCH" &&
    method !== "DELETE"
  ) {
    return false;
  }
  counts[method] += 1;
  return true;
}

async function rejectUnexpectedProjectRequest(
  route: Route,
  request: Request,
  unexpected: string[],
) {
  const url = new URL(request.url());
  unexpected.push(`${request.method()} ${url.pathname}${url.search}`);
  await route.abort();
}

function onePixelPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
}

function onePixelBmp(): Buffer {
  const bytes = Buffer.alloc(58);
  bytes.write("BM", 0, "ascii");
  bytes.writeUInt32LE(bytes.length, 2);
  bytes.writeUInt32LE(54, 10);
  bytes.writeUInt32LE(40, 14);
  bytes.writeInt32LE(1, 18);
  bytes.writeInt32LE(1, 22);
  bytes.writeUInt16LE(1, 26);
  bytes.writeUInt16LE(24, 28);
  bytes.writeUInt32LE(4, 34);
  return bytes;
}

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

  test("uploads a project image, previews it, reloads it, and suffixes a duplicate", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    const png = onePixelPng();
    const firstReference = "![Product Photo.png](assets/product-photo.png)";
    const secondReference = "![Product Photo.png](assets/product-photo-2.png)";
    const firstContent = `${snapshot.content}\n\n${firstReference}`;
    const secondContent = `${firstContent}\n\n${secondReference}`;
    const assetHtml = `<!doctype html>
<html>
  <head><title>Generated project</title></head>
  <body><main><img src="assets/product-photo.png" alt="Product Photo"></main></body>
</html>`;
    const patches: ProjectPatch[] = [];
    const assets = new Map<string, Buffer>();
    const counts = projectMethodCounts();
    const unexpected: string[] = [];
    let firstPublishedFixture: Buffer | undefined;
    let releaseFirstUpload!: () => void;
    const firstUploadGate = new Promise<void>((resolve) => {
      releaseFirstUpload = resolve;
    });

    await page.route(PROJECT_API_DESCENDANT_PATTERN, async (route, request) => {
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });
    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (!recordProjectMethod(counts, request)) {
        await rejectUnexpectedProjectRequest(route, request, unexpected);
        return;
      }
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
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });
    await page.route(
      PROJECT_ASSET_COLLECTION_PATTERN,
      async (route, request) => {
        if (!recordProjectMethod(counts, request) || request.method() !== "POST") {
          await rejectUnexpectedProjectRequest(route, request, unexpected);
          return;
        }
        const url = new URL(request.url());
        expect(url.pathname).toBe(`/api/projects/${PROJECT_ID}/assets`);
        expect([...url.searchParams.entries()]).toEqual([
          ["name", "Product Photo.png"],
        ]);
        const body = request.postDataBuffer();
        expect(body).not.toBeNull();
        expect(body!.equals(png)).toBe(true);

        const ordinal = counts.POST;
        if (ordinal === 1) await firstUploadGate;
        const filename =
          ordinal === 1 ? "product-photo.png" : "product-photo-2.png";
        const stored = Buffer.from(body!);
        if (ordinal === 1) firstPublishedFixture = stored;
        assets.set(filename, stored);
        await route.fulfill({
          status: 201,
          headers: { "Cache-Control": "no-store" },
          json: {
            path: `assets/${filename}`,
            filename,
            originalName: "Product Photo.png",
            bytes: stored.length,
            mediaType: "image/png",
          },
        });
      },
    );
    await page.route(PROJECT_ASSET_ITEM_PATTERN, async (route, request) => {
      if (!recordProjectMethod(counts, request) || request.method() !== "GET") {
        await rejectUnexpectedProjectRequest(route, request, unexpected);
        return;
      }
      const url = new URL(request.url());
      const filename = url.pathname.split("/").at(-1) ?? "";
      const body = assets.get(filename);
      if (body === undefined) {
        await route.fulfill({
          status: 404,
          json: { error: "project_not_found", message: "Project not found." },
        });
        return;
      }
      await route.fulfill({
        status: 200,
        body,
        headers: {
          "Cache-Control": "private, max-age=31536000, immutable",
          "Content-Length": String(body.length),
          "Content-Type": "image/png",
          "X-Content-Type-Options": "nosniff",
        },
      });
    });

    await page.goto(PROJECT_PATH);
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    const fileInput = page.locator('input[type="file"]');
    const saveStatus = page.getByRole("status");

    await fileInput.setInputFiles({
      name: "Product Photo.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect.poll(() => counts.POST).toBe(1);
    await expect(page.getByText("Uploading image…", { exact: true })).toBeVisible();
    releaseFirstUpload();

    await expect(contentEditor).toHaveValue(firstContent);
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([{ content: firstContent }]);

    await page.getByRole("button", { name: /source/i }).click();
    await page.getByRole("textbox", { name: /source/i }).fill(assetHtml);
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([
      { content: firstContent },
      { html: assetHtml },
    ]);
    await page.getByRole("button", { name: /preview/i }).click();
    await expect.poll(() => counts.GET).toBe(2);
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      firstReference,
      "asset:",
      "data:image/",
    ]);

    await page.reload();
    await expect(contentEditor).toHaveValue(firstContent);
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => counts.GET).toBe(4);
    await page.getByRole("button", { name: /source/i }).click();
    await expect(page.getByRole("textbox", { name: /source/i })).toHaveValue(
      assetHtml,
    );

    await fileInput.setInputFiles({
      name: "Product Photo.png",
      mimeType: "image/png",
      buffer: png,
    });
    await expect(contentEditor).toHaveValue(secondContent);
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([
      { content: firstContent },
      { html: assetHtml },
      { content: secondContent },
    ]);

    expect(assets.get("product-photo.png")).toBe(firstPublishedFixture);
    expect(firstPublishedFixture?.equals(png)).toBe(true);
    expect(assets.get("product-photo-2.png")?.equals(png)).toBe(true);
    expect(counts).toEqual({ GET: 4, POST: 2, PATCH: 3, DELETE: 0 });
    expect(unexpected).toEqual([]);
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      firstReference,
      secondReference,
      assetHtml,
      "asset:",
      "data:image/",
    ]);
  });

  test("project image mode keeps text uploads on the existing parser path", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    const counts = projectMethodCounts();
    const patches: ProjectPatch[] = [];
    const unexpected: string[] = [];
    const uploadedText = "Uploaded project notes";
    const expectedContent = `${snapshot.content}\n\n${uploadedText}`;

    await page.route(PROJECT_API_DESCENDANT_PATTERN, async (route, request) => {
      recordProjectMethod(counts, request);
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });
    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (!recordProjectMethod(counts, request)) {
        await rejectUnexpectedProjectRequest(route, request, unexpected);
        return;
      }
      if (request.method() === "GET") {
        await route.fulfill({ json: snapshot });
        return;
      }
      if (request.method() === "PATCH") {
        const patch = patchFrom(request);
        patches.push(patch);
        snapshot = applyPatch(snapshot, patch);
        await route.fulfill({ json: snapshot });
        return;
      }
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });

    await page.goto(PROJECT_PATH);
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    await page.locator('input[type="file"]').setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(uploadedText),
    });

    await expect(contentEditor).toHaveValue(expectedContent);
    await expect(page.getByRole("status")).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([{ content: expectedContent }]);
    expect(counts).toEqual({ GET: 1, POST: 0, PATCH: 1, DELETE: 0 });
    expect(unexpected).toEqual([]);
  });

  test("rejects unsupported, oversize, and failed project image uploads without saving", async ({
    page,
  }) => {
    await seedLocalStore(page);
    const snapshot = readySnapshot();
    const counts = projectMethodCounts();
    const unexpected: string[] = [];
    const postedNames: string[] = [];

    await page.route(PROJECT_API_DESCENDANT_PATTERN, async (route, request) => {
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });
    await page.route(PROJECT_API_PATTERN, async (route, request) => {
      if (!recordProjectMethod(counts, request) || request.method() !== "GET") {
        await rejectUnexpectedProjectRequest(route, request, unexpected);
        return;
      }
      await route.fulfill({ json: snapshot });
    });
    await page.route(
      PROJECT_ASSET_COLLECTION_PATTERN,
      async (route, request) => {
        if (!recordProjectMethod(counts, request) || request.method() !== "POST") {
          await rejectUnexpectedProjectRequest(route, request, unexpected);
          return;
        }
        const name = new URL(request.url()).searchParams.get("name") ?? "";
        postedNames.push(name);
        if (name === "Unsupported.bmp") {
          await route.fulfill({
            status: 400,
            json: {
              error: "invalid_request",
              message: "Unsupported project image",
            },
          });
          return;
        }
        if (name === "Oversize.png") {
          await route.fulfill({
            status: 413,
            json: {
              error: "limit_exceeded",
              message: "Project image is too large.",
            },
          });
          return;
        }
        if (name === "Broken.png") {
          await route.fulfill({
            status: 500,
            json: {
              error: "storage_failed",
              message: "SECRET /workspace/private/path",
            },
          });
          return;
        }
        await rejectUnexpectedProjectRequest(route, request, unexpected);
      },
    );

    await page.goto(PROJECT_PATH);
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    const fileInput = page.locator('input[type="file"]');
    const bmp = onePixelBmp();
    const dataTransfer = await page.evaluateHandle(
      ({ bytes }) => {
        const transfer = new DataTransfer();
        transfer.items.add(
          new File([new Uint8Array(bytes)], "Unsupported.bmp", {
            type: "image/bmp",
          }),
        );
        return transfer;
      },
      { bytes: [...bmp] },
    );
    await contentEditor.dispatchEvent("drop", { dataTransfer });
    await dataTransfer.dispose();

    await expect(page.getByText(PROJECT_IMAGE_UPLOAD_ERROR, { exact: true })).toBeVisible();
    await expect(contentEditor).toHaveValue(snapshot.content);
    await expect(page.getByRole("button", { name: "Attach" })).toBeEnabled();

    const oversize = Buffer.alloc(10_485_761);
    onePixelPng().copy(oversize);
    await fileInput.setInputFiles({
      name: "Oversize.png",
      mimeType: "image/png",
      buffer: oversize,
    });
    await expect(page.getByText(PROJECT_IMAGE_UPLOAD_ERROR, { exact: true })).toBeVisible();
    await expect(contentEditor).toHaveValue(snapshot.content);
    await expect(page.getByRole("button", { name: "Attach" })).toBeEnabled();

    await fileInput.setInputFiles({
      name: "Broken.png",
      mimeType: "image/png",
      buffer: onePixelPng(),
    });
    await expect(page.getByText(PROJECT_IMAGE_UPLOAD_ERROR, { exact: true })).toBeVisible();
    await expect(page.getByText(/SECRET|workspace|private\/path/)).toHaveCount(0);
    await expect(contentEditor).toHaveValue(snapshot.content);

    expect(postedNames).toEqual([
      "Unsupported.bmp",
      "Oversize.png",
      "Broken.png",
    ]);
    expect(counts).toEqual({ GET: 1, POST: 3, PATCH: 0, DELETE: 0 });
    expect(unexpected).toEqual([]);
  });

  test("recovers from load and save failures without discarding browser edits", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    let failLoad = true;
    let failSave = true;
    let deleteCount = 0;
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
      if (request.method() === "DELETE") {
        deleteCount += 1;
        await route.fulfill({ status: 204 });
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
    const unregisterButton = page.getByRole("button", { name: "Unregister" });
    await contentEditor.fill("unsaved browser edit");
    await expect(page.getByRole("status")).toHaveText("Saving…");
    await expect(unregisterButton).toBeDisabled();
    await expect(page.getByRole("status")).toHaveText("Save failed");
    await expect(unregisterButton).toBeDisabled();
    await expect(contentEditor).toHaveValue("unsaved browser edit");
    expect(deleteCount).toBe(0);

    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    await expect(unregisterButton).toBeEnabled();
    expect(patches).toEqual([
      { content: "unsaved browser edit" },
      { content: "unsaved browser edit" },
    ]);
    expect(deleteCount).toBe(0);
    await expectOnlyLocalState(page, [PROJECT_ID, "unsaved browser edit"]);

    await page.reload();
    await expect(contentEditor).toHaveValue("unsaved browser edit");
  });

  test("blocks unregister until a pending edit is saved", async ({ page }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    let deleteCount = 0;
    let dialogCount = 0;
    const patches: ProjectPatch[] = [];

    page.on("dialog", async (dialog) => {
      dialogCount += 1;
      await dialog.dismiss();
    });
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
      if (request.method() === "DELETE") {
        deleteCount += 1;
        await route.fulfill({ status: 204 });
        return;
      }
      await route.abort();
    });

    await page.goto(PROJECT_PATH);
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    const unregisterButton = page.getByRole("button", { name: "Unregister" });
    await expect(unregisterButton).toBeEnabled();

    await contentEditor.fill("pending browser edit");
    await expect(page.getByRole("status")).toHaveText("Saving…");
    await expect(unregisterButton).toBeDisabled();

    await unregisterButton.evaluate((button) => button.removeAttribute("disabled"));
    await unregisterButton.click();
    expect(dialogCount).toBe(0);
    expect(deleteCount).toBe(0);
    await expect(contentEditor).toHaveValue("pending browser edit");

    await expect(page.getByRole("status")).toHaveText("Saved");
    await expect(unregisterButton).toBeEnabled();
    await expect.poll(() => patches).toEqual([
      { content: "pending browser edit" },
    ]);
    expect(deleteCount).toBe(0);
  });

  test("unregisters only the server link and restores the preserved local draft", async ({
    page,
  }) => {
    await seedLocalStore(page);
    let snapshot = readySnapshot();
    let deleteCount = 0;
    let assetDeleteCount = 0;
    const unexpected: string[] = [];
    const patches: ProjectPatch[] = [];
    let releaseFailedDelete!: () => void;
    const failedDeleteGate = new Promise<void>((resolve) => {
      releaseFailedDelete = resolve;
    });
    const preservedContent = "Preserved server editor content";
    const preservedHtml =
      "<!doctype html><html><body><h1>Preserved server source</h1></body></html>";

    await page.route(PROJECT_API_DESCENDANT_PATTERN, async (route, request) => {
      if (request.method() === "DELETE") assetDeleteCount += 1;
      await rejectUnexpectedProjectRequest(route, request, unexpected);
    });

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
      if (request.method() === "DELETE") {
        deleteCount += 1;
        if (deleteCount === 1) {
          await failedDeleteGate;
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
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    const saveStatus = page.getByRole("status");
    await contentEditor.fill(preservedContent);
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await page.getByRole("button", { name: /source/i }).click();
    const sourceEditor = page.getByRole("textbox", { name: /source/i });
    await sourceEditor.fill(preservedHtml);
    await expect(saveStatus).toHaveText("Saving…");
    await expect(saveStatus).toHaveText("Saved");
    await expect.poll(() => patches).toEqual([
      { content: preservedContent },
      { html: preservedHtml },
    ]);
    const snapshotBeforeUnregister = snapshot;

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toBe(
        "Unregister “Generated project”? Workspace files will be kept, but this link will stop working.",
      );
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Unregister" }).click();

    try {
      await expect.poll(() => deleteCount).toBe(1);
      await expect(page.getByText("Unregistering…", { exact: true })).toBeVisible();
      await expect(contentEditor).toHaveCount(0);
      await expect(sourceEditor).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Generate HTML" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Attach" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Unregister" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Settings" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Magazine Article/ })).toHaveCount(0);
      await expect(page.getByRole("radiogroup", { name: "Workspace layout" })).toHaveCount(0);
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      await page.keyboard.type("MUST NOT CHANGE PROJECT VALUES");
      await page.keyboard.press("Control+Enter");
      expect(deleteCount).toBe(1);
    } finally {
      releaseFailedDelete();
    }
    const unregisterAlert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn’t unregister this project." });
    await expect(unregisterAlert).toHaveText(
      "Couldn’t unregister this project.",
    );
    await expect(unregisterAlert).toHaveCount(1);
    await expect(contentEditor).toHaveValue(preservedContent);
    await page.getByRole("button", { name: /source/i }).click();
    await expect(sourceEditor).toHaveValue(preservedHtml);
    expect(patches).toEqual([
      { content: preservedContent },
      { html: preservedHtml },
    ]);
    expect(snapshot).toEqual(snapshotBeforeUnregister);
    expect(deleteCount).toBe(1);

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
    expect(assetDeleteCount).toBe(0);
    expect(unexpected).toEqual([]);
    await expectOnlyLocalState(page, [
      PROJECT_ID,
      preservedContent,
      preservedHtml,
    ]);
  });

  test("keeps a local image in the browser asset map and inlines it for conversion", async ({
    page,
  }) => {
    await seedLocalStore(page, "");
    const png = onePixelPng();
    const projectRequests: string[] = [];
    const convertRequests: Array<Record<string, unknown>> = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/projects/")) {
        projectRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.route("**/api/convert", async (route, request) => {
      expect(request.method()).toBe("POST");
      convertRequests.push(request.postDataJSON() as Record<string, unknown>);
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          "event: delta",
          'data: {"text":"<!doctype html><html><body><h1>Local image converted</h1></body></html>"}',
          "",
          "event: done",
          'data: {"code":0}',
          "",
          "",
        ].join("\n"),
      });
    });

    await page.goto("/");
    const contentEditor = page.getByRole("textbox", { name: /paste anything/i });
    await page.locator('input[type="file"]').setInputFiles({
      name: "Local Photo.png",
      mimeType: "image/png",
      buffer: png,
    });

    await expect(contentEditor).toHaveValue(
      /^!\[Local Photo\.png\]\(asset:a_[a-z0-9_]+\)$/u,
    );
    const localReference = await contentEditor.inputValue();
    const assetId = /\(asset:([^)]+)\)$/u.exec(localReference)?.[1];
    expect(assetId).toBeTruthy();
    await expect
      .poll(() =>
        page.evaluate(
          ({ key, id }) => {
            const raw = window.localStorage.getItem(key);
            if (raw === null) return undefined;
            const value = JSON.parse(raw) as {
              state: { tasks: Array<{ assets?: Record<string, string> }> };
            };
            return value.state.tasks[0]?.assets?.[id];
          },
          { key: STORE_KEY, id: assetId! },
        ),
      )
      .toBe(`data:image/png;base64,${png.toString("base64")}`);

    await page.getByRole("button", { name: "Generate HTML" }).click();
    await expect.poll(() => convertRequests).toHaveLength(1);
    expect(convertRequests[0]?.content).toContain(
      `data:image/png;base64,${png.toString("base64")}`,
    );
    expect(convertRequests[0]?.content).not.toContain("asset:");
    await expect(
      page
        .locator('iframe[title="preview"]')
        .contentFrame()
        .getByRole("heading", { name: "Local image converted" }),
    ).toBeVisible();
    expect(projectRequests).toEqual([]);
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
