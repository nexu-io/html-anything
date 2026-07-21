import { constants as fsConstants } from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROJECT_DIAGNOSTIC_MAX_BYTES,
  PROJECT_HTML_MAX_BYTES,
  type CreateProjectInput,
} from "../contracts";
import { createProjectStore } from "../storage";

type OpenedFile = Awaited<ReturnType<typeof open>>;

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const HTML = "<!doctype html><html><body>ok</body></html>";

describe("project storage", () => {
  let temporaryDirectory: string;
  let workspaceRoot: string;
  let registryRoot: string;
  let clock: Date;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), "ha-store-"));
    workspaceRoot = path.join(temporaryDirectory, "workspace");
    registryRoot = path.join(temporaryDirectory, "registry");
    clock = new Date("2026-07-21T00:00:00.000Z");
    await mkdir(workspaceRoot);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await chmod(temporaryDirectory, 0o700).catch(() => undefined);
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("publishes the registry only after a complete ready project", async () => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    const prepared = await store.prepare(input, "exact prompt");

    await expect(store.get(input.projectId)).rejects.toMatchObject({
      code: "project_not_found",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });

    const ready = await store.markReady(prepared, HTML);

    expect(ready).toEqual({
      status: "ready",
      projectId: PROJECT_ID,
      url: `https://host.ts.net:43233/projects/${PROJECT_ID}`,
      artifactDirectory: "artifacts/html-anything/q2-report",
      sourcePaths: [],
    });
    expect(await readFile(artifactPath("PROMPT.md"), "utf8")).toBe("exact prompt");
    expect(await readFile(artifactPath("content.md"), "utf8")).toBe("# Q2");
    expect(await readFile(artifactPath("index.html"), "utf8")).toBe(HTML);
    expect(
      JSON.parse(await readFile(artifactPath("project.json"), "utf8")),
    ).toMatchObject({
      schemaVersion: 1,
      projectId: PROJECT_ID,
      status: "ready",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    });
    expect(
      JSON.parse(await readFile(registryPath(), "utf8")),
    ).toMatchObject({
      schemaVersion: 1,
      projectId: PROJECT_ID,
      workspaceRoot,
      artifactDirectory: path.join(
        workspaceRoot,
        "artifacts/html-anything/q2-report",
      ),
    });

    for (const directory of [
      path.join(workspaceRoot, "artifacts"),
      path.join(workspaceRoot, "artifacts/html-anything"),
      artifactPath(),
      registryRoot,
    ]) {
      expect((await stat(directory)).mode & 0o777).toBe(0o700);
    }
    for (const file of [
      artifactPath("PROMPT.md"),
      artifactPath("content.md"),
      artifactPath("project.json"),
      artifactPath("index.html"),
      registryPath(),
    ]) {
      expect((await stat(file)).mode & 0o777).toBe(0o600);
    }
    expect(await operationTemporaryFiles()).toEqual([]);
  });

  it("rejects an existing artifact directory without changing it", async () => {
    const existing = artifactPath();
    await mkdir(existing, { recursive: true });
    await writeFile(path.join(existing, "sentinel"), "preserve");

    await expect(
      makeStore().prepare(validInput(workspaceRoot), "exact prompt"),
    ).rejects.toMatchObject({ code: "project_exists" });

    await expect(readFile(path.join(existing, "sentinel"), "utf8")).resolves.toBe(
      "preserve",
    );
    await expect(lstat(artifactPath("PROMPT.md"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("rejects an artifact-directory symlink swap before a write", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    const parked = path.join(temporaryDirectory, "parked-project");
    const outside = path.join(temporaryDirectory, "outside-project");
    await mkdir(outside);
    await rename(artifactPath(), parked);
    await symlink(outside, artifactPath(), "dir");

    await expect(store.markReady(prepared, HTML)).rejects.toMatchObject({
      code: "storage_failed",
    });
    await expect(lstat(path.join(outside, "index.html"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not publish a registry record when exact file readback differs", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    const prototype = await fileHandlePrototype(artifactPath("project.json"));
    const originalReadFile = prototype.readFile;
    vi.spyOn(prototype, "readFile").mockImplementation(async function (
      this: OpenedFile,
      ...arguments_: Parameters<OpenedFile["readFile"]>
    ) {
      const result = await Reflect.apply(originalReadFile, this, arguments_);
      if (Buffer.isBuffer(result) && result.equals(Buffer.from(HTML))) {
        return Buffer.from(`${HTML}tampered`);
      }
      return result;
    });

    await expect(store.markReady(prepared, HTML)).rejects.toMatchObject({
      code: "storage_failed",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });
    expect(await operationTemporaryFiles()).toEqual([]);
  });

  it("records failed generation with a bounded diagnostic and no registry", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");

    await store.markFailed(prepared, "🙂".repeat(2_000));

    const project = JSON.parse(await readFile(artifactPath("project.json"), "utf8"));
    expect(project.status).toBe("failed");
    expect(Buffer.byteLength(project.diagnostic, "utf8")).toBeLessThanOrEqual(
      PROJECT_DIAGNOSTIC_MAX_BYTES,
    );
    expect(project.diagnostic.endsWith("🙂")).toBe(true);
    await expect(lstat(artifactPath("index.html"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });
    await expect(store.get(PROJECT_ID)).rejects.toMatchObject({
      code: "project_not_found",
    });
  });

  it("patches only supplied mutable fields and enforces their bounds", async () => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    const prepared = await store.prepare(input, "exact prompt");
    await store.markReady(prepared, HTML);
    const beforeProject = JSON.parse(
      await readFile(artifactPath("project.json"), "utf8"),
    );
    const beforePrompt = await readFile(artifactPath("PROMPT.md"), "utf8");
    const beforeRegistry = await readFile(registryPath(), "utf8");

    await expect(
      store.patch(PROJECT_ID, { html: "🙂".repeat(PROJECT_HTML_MAX_BYTES / 4 + 1) }),
    ).rejects.toMatchObject({ code: "limit_exceeded" });
    expect(await readFile(artifactPath("index.html"), "utf8")).toBe(HTML);

    clock = new Date("2026-07-21T00:01:00.000Z");
    const snapshot = await store.patch(PROJECT_ID, {
      content: "edited content",
      html: "<html><body>edited</body></html>",
      templateId: "blog-post",
    });

    expect(snapshot).toMatchObject({
      content: "edited content",
      html: "<html><body>edited</body></html>",
      url: `https://host.ts.net:43233/projects/${PROJECT_ID}`,
      artifactDirectory: "artifacts/html-anything/q2-report",
      project: {
        templateId: "blog-post",
        updatedAt: "2026-07-21T00:01:00.000Z",
      },
    });
    expect(snapshot.project).toEqual({
      ...beforeProject,
      templateId: "blog-post",
      updatedAt: "2026-07-21T00:01:00.000Z",
    });
    expect(await readFile(artifactPath("PROMPT.md"), "utf8")).toBe(beforePrompt);
    expect(await readFile(registryPath(), "utf8")).toBe(beforeRegistry);
  });

  it("returns not found when a registered project directory is missing or moved", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    await rename(artifactPath(), path.join(workspaceRoot, "moved-project"));

    await expect(store.get(PROJECT_ID)).rejects.toMatchObject({
      code: "project_not_found",
    });
    await expect(
      store.patch(PROJECT_ID, { content: "do not repair" }),
    ).rejects.toMatchObject({ code: "project_not_found" });
    await expect(lstat(artifactPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects registry records whose stored paths are not canonical", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    const registry = JSON.parse(await readFile(registryPath(), "utf8"));
    registry.workspaceRoot = `${workspaceRoot}${path.sep}.`;
    await writeFile(registryPath(), `${JSON.stringify(registry)}\n`, { mode: 0o600 });

    await expect(store.get(PROJECT_ID)).rejects.toMatchObject({
      code: "storage_failed",
    });
  });

  it("unregisters the capability while preserving every workspace artifact", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    const before = await Promise.all(
      ["PROMPT.md", "content.md", "project.json", "index.html"].map((name) =>
        readFile(artifactPath(name)),
      ),
    );

    await store.unregister(PROJECT_ID);

    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });
    const after = await Promise.all(
      ["PROMPT.md", "content.md", "project.json", "index.html"].map((name) =>
        readFile(artifactPath(name)),
      ),
    );
    expect(after).toEqual(before);
    await expect(store.unregister(PROJECT_ID)).rejects.toMatchObject({
      code: "project_not_found",
    });
  });

  it("reconciles only matching immutable creation fields across restarts", async () => {
    const input = validInput(workspaceRoot);
    const firstStore = makeStore();
    await expect(firstStore.findReadyCreation(input)).resolves.toBeNull();
    const prepared = await firstStore.prepare(input, "exact prompt");
    await firstStore.markReady(prepared, HTML);
    await firstStore.patch(PROJECT_ID, {
      content: "later edit",
      templateId: "blog-post",
    });

    const restartedStore = createProjectStore({
      registryRoot,
      publicBaseUrl: "https://new-host.ts.net",
      now: () => clock,
    });
    await expect(restartedStore.findReadyCreation(input)).resolves.toEqual({
      status: "ready",
      projectId: PROJECT_ID,
      url: `https://new-host.ts.net/projects/${PROJECT_ID}`,
      artifactDirectory: "artifacts/html-anything/q2-report",
      sourcePaths: [],
    });
    await expect(
      restartedStore.findReadyCreation({ ...input, name: "Different project" }),
    ).rejects.toMatchObject({ code: "project_exists" });
  });

  it("rejects non-root, non-HTTPS, or credentialed public base URLs", () => {
    for (const publicBaseUrl of [
      "http://host.ts.net",
      "https://host.ts.net/projects",
      "https://user:pass@host.ts.net",
      "https://host.ts.net/?query=yes",
      "https://host.ts.net/#fragment",
      " https://host.ts.net",
    ]) {
      expect(() =>
        createProjectStore({ registryRoot, publicBaseUrl, now: () => clock }),
      ).toThrowError(expect.objectContaining({ code: "configuration_missing" }));
    }
  });

  function makeStore() {
    return createProjectStore({
      registryRoot,
      publicBaseUrl: "https://host.ts.net:43233",
      now: () => clock,
    });
  }

  function artifactPath(name?: string): string {
    const directory = path.join(
      workspaceRoot,
      "artifacts",
      "html-anything",
      "q2-report",
    );
    return name === undefined ? directory : path.join(directory, name);
  }

  function registryPath(): string {
    return path.join(registryRoot, `${PROJECT_ID}.json`);
  }

  async function operationTemporaryFiles(): Promise<string[]> {
    const directories = [artifactPath(), registryRoot];
    const entries: string[] = [];
    for (const directory of directories) {
      for (const name of await readdir(directory).catch(() => [] as string[])) {
        if (name.includes(".tmp-")) entries.push(path.join(directory, name));
      }
    }
    return entries;
  }
});

function validInput(workspaceRoot: string): CreateProjectInput {
  return {
    projectId: PROJECT_ID,
    workspaceRoot,
    slug: "q2-report",
    name: "Q2 report",
    instruction: "Create a report.",
    content: "# Q2",
    sourceFiles: [],
    templateId: "data-report",
    format: "markdown",
    agent: "codex",
  };
}

async function fileHandlePrototype(filePath: string) {
  const handle = await open(filePath, fsConstants.O_RDONLY);
  const prototype = Object.getPrototypeOf(handle) as OpenedFile;
  await handle.close();
  return prototype;
}
