import { constants as fsConstants } from "node:fs";
import { execFile } from "node:child_process";
import { createRequire, syncBuiltinESMExports } from "node:module";
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
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PROJECT_ASSET_MAX_BYTES,
  PROJECT_DIAGNOSTIC_MAX_BYTES,
  PROJECT_GENERATION_DEADLINE_MS,
  PROJECT_HTML_MAX_BYTES,
  type CreateProjectInput,
} from "../contracts";
import {
  createProjectStore,
  type ProjectStoreOptions,
} from "../storage";

type OpenedFile = Awaited<ReturnType<typeof open>>;

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const MISSING_PROJECT_ID = "ZbCdEfGhIjKlMnOpQrStUg";
const HTML = "<!doctype html><html><body>ok</body></html>";
const execFileAsync = promisify(execFile);
const PNG_SIGNATURE = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const PNG_TRAILER = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

function pngBytes(...payload: number[]): Uint8Array {
  return Uint8Array.from([...PNG_SIGNATURE, ...payload, ...PNG_TRAILER]);
}

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0xff, 0xd9]);
const GIF = Uint8Array.from([
  ...new TextEncoder().encode("GIF89a"),
  0x00,
  0x3b,
]);
const WEBP = Uint8Array.from([
  ...new TextEncoder().encode("RIFF"),
  0x08, 0x00, 0x00, 0x00,
  ...new TextEncoder().encode("WEBPVP8 "),
]);

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

    await expect(store.resolveConversionContext(PROJECT_ID)).resolves.toEqual({
      cwd: workspaceRoot,
      instruction: input.instruction,
      artifactDirectory: artifactPath(),
    });

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

  it("bootstraps a missing managed registry parent chain on first run", async () => {
    const managedStateRoot = path.join(temporaryDirectory, "managed-state");
    const applicationStateRoot = path.join(managedStateRoot, "html-anything");
    registryRoot = path.join(applicationStateRoot, "project-registry");
    const store = makeStore(applicationStateRoot);
    const input = validInput(workspaceRoot);

    const prepared = await store.prepare(input, "exact prompt");

    expect((await readdir(temporaryDirectory)).sort()).toEqual([
      "managed-state",
      "workspace",
    ]);
    expect(await readdir(managedStateRoot)).toEqual(["html-anything"]);
    expect(await readdir(applicationStateRoot)).toEqual(["project-registry"]);
    expect(await readdir(registryRoot)).toEqual([]);
    for (const directory of [
      managedStateRoot,
      applicationStateRoot,
      registryRoot,
    ]) {
      expect((await stat(directory)).mode & 0o777).toBe(0o700);
    }
    expect((await readdir(artifactPath())).sort()).toEqual([
      "PROMPT.md",
      "content.md",
      "project.json",
    ]);
    expect(
      JSON.parse(await readFile(artifactPath("project.json"), "utf8")),
    ).toMatchObject({ projectId: PROJECT_ID, status: "generating" });
    await expect(store.get(input.projectId)).rejects.toMatchObject({
      code: "project_not_found",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });

    await store.markReady(prepared, HTML);

    expect((await lstat(registryPath())).isFile()).toBe(true);
  });

  it("keeps seed files invisible until the project directory is complete", async () => {
    let observed = false;
    const store = makeStore(undefined, undefined, {
      beforeProjectDirectoryPublish: async () => {
        observed = true;
        await expect(lstat(artifactPath())).rejects.toMatchObject({
          code: "ENOENT",
        });
        throw new Error("simulated process interruption");
      },
    });

    await expect(
      store.prepare(validInput(workspaceRoot), "exact prompt"),
    ).rejects.toMatchObject({ code: "storage_failed" });

    expect(observed).toBe(true);
    await expect(lstat(artifactPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects an existing artifact directory without changing it", async () => {
    const existing = artifactPath();
    await mkdir(existing, { recursive: true, mode: 0o700 });
    await chmod(path.join(workspaceRoot, "artifacts"), 0o700);
    await chmod(path.join(workspaceRoot, "artifacts", "html-anything"), 0o700);
    await chmod(existing, 0o700);
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

  it("accepts an existing registry root beneath a permissive trusted parent", async () => {
    const trustedParent = path.join(temporaryDirectory, "trusted-state");
    await mkdir(trustedParent, { mode: 0o755 });
    await chmod(trustedParent, 0o755);
    registryRoot = path.join(trustedParent, "configured-registry");
    await mkdir(registryRoot, { mode: 0o700 });
    await chmod(registryRoot, 0o700);

    const prepared = await makeStore().prepare(
      validInput(workspaceRoot),
      "exact prompt",
    );

    expect(prepared.project.status).toBe("generating");
    expect((await stat(trustedParent)).mode & 0o777).toBe(0o755);
    expect((await stat(registryRoot)).mode & 0o777).toBe(0o700);
    expect((await readdir(artifactPath())).sort()).toEqual([
      "PROMPT.md",
      "content.md",
      "project.json",
    ]);
  });

  it("creates a missing custom registry root beneath a permissive trusted parent", async () => {
    const trustedParent = path.join(temporaryDirectory, "trusted-state");
    await mkdir(trustedParent, { mode: 0o755 });
    await chmod(trustedParent, 0o755);
    registryRoot = path.join(trustedParent, "configured-registry");

    const prepared = await makeStore().prepare(
      validInput(workspaceRoot),
      "exact prompt",
    );

    expect(prepared.project.status).toBe("generating");
    expect((await stat(trustedParent)).mode & 0o777).toBe(0o755);
    expect((await stat(registryRoot)).mode & 0o777).toBe(0o700);
    expect((await readdir(artifactPath())).sort()).toEqual([
      "PROMPT.md",
      "content.md",
      "project.json",
    ]);
  });

  it("preflights registry configuration before creating artifact directories", async () => {
    await mkdir(registryRoot, { mode: 0o755 });
    await chmod(registryRoot, 0o755);

    await expect(
      makeStore().prepare(validInput(workspaceRoot), "exact prompt"),
    ).rejects.toMatchObject({ code: "storage_failed" });

    await expect(
      lstat(path.join(workspaceRoot, "artifacts")),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(lstat(artifactPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a symlink in a would-be registry parent chain", async () => {
    const managedStateRoot = path.join(temporaryDirectory, "managed-state");
    const outside = path.join(temporaryDirectory, "outside");
    const applicationStateRoot = path.join(managedStateRoot, "html-anything");
    await mkdir(managedStateRoot, { mode: 0o700 });
    await mkdir(outside, { mode: 0o700 });
    await symlink(outside, applicationStateRoot, "dir");
    registryRoot = path.join(applicationStateRoot, "project-registry");

    await expect(
      makeStore(applicationStateRoot).prepare(
        validInput(workspaceRoot),
        "exact prompt",
      ),
    ).rejects.toMatchObject({ code: "storage_failed" });

    expect(await readdir(outside)).toEqual([]);
    await expect(
      lstat(path.join(workspaceRoot, "artifacts")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a permissive existing managed registry parent", async () => {
    const applicationStateRoot = path.join(
      temporaryDirectory,
      "html-anything",
    );
    await mkdir(applicationStateRoot, { mode: 0o755 });
    await chmod(applicationStateRoot, 0o755);
    registryRoot = path.join(applicationStateRoot, "project-registry");

    await expect(
      makeStore(applicationStateRoot).prepare(
        validInput(workspaceRoot),
        "exact prompt",
      ),
    ).rejects.toMatchObject({ code: "storage_failed" });

    await expect(lstat(registryRoot)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      lstat(path.join(workspaceRoot, "artifacts")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects an existing registry root beneath a permissive managed boundary", async () => {
    const applicationStateRoot = path.join(
      temporaryDirectory,
      "html-anything",
    );
    await mkdir(applicationStateRoot, { mode: 0o755 });
    await chmod(applicationStateRoot, 0o755);
    registryRoot = path.join(applicationStateRoot, "project-registry");
    await mkdir(registryRoot, { mode: 0o700 });
    await chmod(registryRoot, 0o700);

    await expect(
      makeStore(applicationStateRoot).prepare(
        validInput(workspaceRoot),
        "exact prompt",
      ),
    ).rejects.toMatchObject({ code: "storage_failed" });

    await expect(
      lstat(path.join(workspaceRoot, "artifacts")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects permissive existing canonical artifact parents", async () => {
    const artifactParent = path.join(
      workspaceRoot,
      "artifacts",
      "html-anything",
    );
    await mkdir(artifactParent, { recursive: true, mode: 0o755 });
    await chmod(path.join(workspaceRoot, "artifacts"), 0o755);
    await chmod(artifactParent, 0o755);

    await expect(
      makeStore().prepare(validInput(workspaceRoot), "exact prompt"),
    ).rejects.toMatchObject({ code: "storage_failed" });

    await expect(lstat(artifactPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("durably syncs each newly created directory", async () => {
    const managedStateRoot = path.join(temporaryDirectory, "managed-state");
    const applicationStateRoot = path.join(managedStateRoot, "html-anything");
    registryRoot = path.join(applicationStateRoot, "project-registry");
    const probePath = path.join(temporaryDirectory, "sync-probe");
    await writeFile(probePath, "probe");
    const prototype = await fileHandlePrototype(probePath);
    const originalSync = prototype.sync;
    const syncedDirectories: string[] = [];
    vi.spyOn(prototype, "sync").mockImplementation(async function (
      this: OpenedFile,
    ) {
      const metadata = await this.stat({ bigint: true });
      if (metadata.isDirectory()) syncedDirectories.push(fileIdentity(metadata));
      return Reflect.apply(originalSync, this, []);
    });
    const store = makeStore(applicationStateRoot);
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);

    const expectedOrder = await Promise.all(
      [
        temporaryDirectory,
        managedStateRoot,
        applicationStateRoot,
        workspaceRoot,
        path.join(workspaceRoot, "artifacts"),
        path.join(workspaceRoot, "artifacts", "html-anything"),
        artifactPath(),
        registryRoot,
      ].map(directoryIdentity),
    );
    for (const identity of expectedOrder) {
      expect(syncedDirectories).toContain(identity);
    }
  });

  it("syncs an accepted raced registry parent before creating its child", async () => {
    const managedStateRoot = path.join(temporaryDirectory, "managed-state");
    const applicationStateRoot = path.join(managedStateRoot, "html-anything");
    registryRoot = path.join(applicationStateRoot, "project-registry");
    const probePath = path.join(temporaryDirectory, "sync-probe");
    await writeFile(probePath, "probe");
    const prototype = await fileHandlePrototype(probePath);
    const originalSync = prototype.sync;
    const mutableFsPromises = createRequire(import.meta.url)(
      "node:fs/promises",
    ) as {
      mkdir: (
        ...arguments_: Parameters<typeof mkdir>
      ) => Promise<string | undefined>;
    };
    const originalMkdir = mutableFsPromises.mkdir;
    const ancestorIdentity = await directoryIdentity(temporaryDirectory);
    let ancestorSynced = false;
    let raceInjected = false;
    let childObservedSyncedParent: boolean | undefined;
    vi.spyOn(prototype, "sync").mockImplementation(async function (
      this: OpenedFile,
    ) {
      const metadata = await this.stat({ bigint: true });
      if (fileIdentity(metadata) === ancestorIdentity) ancestorSynced = true;
      return Reflect.apply(originalSync, this, []);
    });
    mutableFsPromises.mkdir = async (
      ...arguments_: Parameters<typeof mkdir>
    ): Promise<string | undefined> => {
      const directory = String(arguments_[0]);
      if (directory === applicationStateRoot) {
        childObservedSyncedParent = ancestorSynced;
      }
      if (directory === managedStateRoot && !raceInjected) {
        raceInjected = true;
        await Reflect.apply(originalMkdir, mutableFsPromises, arguments_);
        throw Object.assign(new Error("Simulated mkdir race."), {
          code: "EEXIST",
        });
      }
      return Reflect.apply(originalMkdir, mutableFsPromises, arguments_);
    };
    syncBuiltinESMExports();

    try {
      vi.resetModules();
      const { createProjectStore: createRacedProjectStore } = await import(
        "../storage"
      );
      const racedStore = createRacedProjectStore({
        registryRoot,
        managedRegistryBoundary: applicationStateRoot,
        publicBaseUrl: "https://host.ts.net:43233",
        now: () => clock,
      });
      await racedStore.prepare(validInput(workspaceRoot), "exact prompt");
    } finally {
      mutableFsPromises.mkdir = originalMkdir;
      syncBuiltinESMExports();
    }

    expect(raceInjected).toBe(true);
    expect(childObservedSyncedParent).toBe(true);
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

  it("publishes a project ID with atomic no-clobber semantics", async () => {
    const secondWorkspace = path.join(temporaryDirectory, "workspaze");
    await mkdir(secondWorkspace);
    const firstInput = validInput(workspaceRoot);
    const secondInput = validInput(secondWorkspace);
    const firstStore = makeStore();
    const secondStore = makeStore();
    const firstPrepared = await firstStore.prepare(firstInput, "first prompt");
    const secondPrepared = await secondStore.prepare(secondInput, "second prompt");
    const registryByteLength = serializedRegistryByteLength(firstInput);
    expect(serializedRegistryByteLength(secondInput)).toBe(registryByteLength);

    const prototype = await fileHandlePrototype(artifactPath("project.json"));
    const originalSync = prototype.sync;
    let registrySyncCount = 0;
    let releaseRegistrySyncs: (() => void) | undefined;
    const bothRegistryTempsSynced = new Promise<void>((resolve) => {
      releaseRegistrySyncs = resolve;
    });
    vi.spyOn(prototype, "sync").mockImplementation(async function (
      this: OpenedFile,
    ) {
      const metadata = await this.stat();
      if (metadata.isFile() && metadata.size === registryByteLength) {
        registrySyncCount += 1;
        if (registrySyncCount === 2) releaseRegistrySyncs?.();
        await bothRegistryTempsSynced;
      }
      return Reflect.apply(originalSync, this, []);
    });

    const results = await Promise.allSettled([
      firstStore.markReady(firstPrepared, HTML),
      secondStore.markReady(secondPrepared, HTML),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: expect.objectContaining({ code: "project_exists" }),
    });
    const registry = JSON.parse(await readFile(registryPath(), "utf8"));
    expect([workspaceRoot, secondWorkspace]).toContain(registry.workspaceRoot);
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

  it("resumes exact failed creation inputs with a fresh project ID", async () => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    const prepared = await store.prepare(input, "exact prompt");
    await store.markFailed(prepared, "bounded diagnostic");

    clock = new Date("2026-07-21T00:01:00.000Z");
    const retryInput = { ...input, projectId: MISSING_PROJECT_ID };
    const retry = await store.prepare(retryInput, "exact prompt");

    expect(retry.project).toMatchObject({
      projectId: MISSING_PROJECT_ID,
      status: "generating",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:01:00.000Z",
    });
    expect(retry.project).not.toHaveProperty("diagnostic");
    await store.markReady(retry, HTML);
    await expect(store.get(MISSING_PROJECT_ID)).resolves.toMatchObject({
      project: { projectId: MISSING_PROJECT_ID, status: "ready" },
      content: input.content,
      html: HTML,
    });
  });

  it("resumes an exact generating project after its deadline", async () => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    await store.prepare(input, "exact prompt");

    clock = new Date(
      new Date("2026-07-21T00:00:00.000Z").getTime() +
        PROJECT_GENERATION_DEADLINE_MS +
        1,
    );
    const retry = await store.prepare(
      { ...input, projectId: MISSING_PROJECT_ID },
      "exact prompt",
    );

    expect(retry.project).toMatchObject({
      projectId: MISSING_PROJECT_ID,
      status: "generating",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: clock.toISOString(),
    });
  });

  it("does not reclaim a generating project before its deadline", async () => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    await store.prepare(input, "exact prompt");

    clock = new Date(
      new Date("2026-07-21T00:00:00.000Z").getTime() +
        PROJECT_GENERATION_DEADLINE_MS -
        1,
    );
    await expect(
      store.prepare(
        { ...input, projectId: MISSING_PROJECT_ID },
        "exact prompt",
      ),
    ).rejects.toMatchObject({ code: "project_exists" });

    expect(
      JSON.parse(await readFile(artifactPath("project.json"), "utf8")),
    ).toMatchObject({ projectId: PROJECT_ID, status: "generating" });
  });

  it("restarts stale generation after HTML publication was interrupted", async () => {
    const input = validInput(workspaceRoot);
    const interrupted = makeStore(undefined, undefined, {
      beforeReadyProjectPublish: async () => {
        throw new Error("simulated process interruption");
      },
    });
    const prepared = await interrupted.prepare(input, "exact prompt");
    await expect(interrupted.markReady(prepared, HTML)).rejects.toMatchObject({
      code: "storage_failed",
    });
    expect(await readFile(artifactPath("index.html"), "utf8")).toBe(HTML);

    clock = new Date(
      clock.getTime() + PROJECT_GENERATION_DEADLINE_MS + 1,
    );
    const retryInput = { ...input, projectId: MISSING_PROJECT_ID };
    const restarted = makeStore();
    await expect(restarted.findReadyCreation(retryInput)).resolves.toBeNull();
    const retry = await restarted.prepare(retryInput, "exact prompt");

    expect(retry.project).toMatchObject({
      projectId: MISSING_PROJECT_ID,
      status: "generating",
    });
    await expect(lstat(artifactPath("index.html"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("registers an exact ready project after registry publication was interrupted", async () => {
    const input = validInput(workspaceRoot);
    const interrupted = makeStore(undefined, undefined, {
      beforeRegistryPublish: async () => {
        throw new Error("simulated process interruption");
      },
    });
    const prepared = await interrupted.prepare(input, "exact prompt");
    await expect(interrupted.markReady(prepared, HTML)).rejects.toMatchObject({
      code: "storage_failed",
    });
    await expect(lstat(registryPath())).rejects.toMatchObject({ code: "ENOENT" });

    const retryInput = { ...input, projectId: MISSING_PROJECT_ID };
    const restarted = makeStore();
    await expect(restarted.findReadyCreation(retryInput)).resolves.toEqual({
      status: "ready",
      projectId: MISSING_PROJECT_ID,
      url: `https://host.ts.net:43233/projects/${MISSING_PROJECT_ID}`,
      artifactDirectory: "artifacts/html-anything/q2-report",
      sourcePaths: [],
    });
    await expect(restarted.get(MISSING_PROJECT_ID)).resolves.toMatchObject({
      project: { projectId: MISSING_PROJECT_ID, status: "ready" },
      content: input.content,
      html: HTML,
    });
  });

  it.each([
    ["prompt", validInput, "different prompt"],
    [
      "content",
      (root: string) => ({ ...validInput(root), content: "different content" }),
      "exact prompt",
    ],
    [
      "template",
      (root: string) => ({ ...validInput(root), templateId: "landing-page" }),
      "exact prompt",
    ],
  ])("does not reclaim failed artifacts for different %s", async (_field, retryInput, retryPrompt) => {
    const store = makeStore();
    const input = validInput(workspaceRoot);
    const prepared = await store.prepare(input, "exact prompt");
    await store.markFailed(prepared, "bounded diagnostic");

    await expect(
      store.prepare(retryInput(workspaceRoot), retryPrompt),
    ).rejects.toMatchObject({ code: "project_exists" });

    expect(
      JSON.parse(await readFile(artifactPath("project.json"), "utf8")),
    ).toMatchObject({
      projectId: PROJECT_ID,
      status: "failed",
      diagnostic: "bounded diagnostic",
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
    await expect(store.patch(PROJECT_ID, {
      content: "edited content",
      html: "<html><body>edited</body></html>",
      templateId: "blog-post",
    })).resolves.toBeUndefined();
    const snapshot = await store.get(PROJECT_ID);

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

  it("does not replace unchanged artifact files during a partial patch", async () => {
    const store = makeStore();
    const prepared = await store.prepare(
      validInput(workspaceRoot),
      "exact prompt",
    );
    await store.markReady(prepared, HTML);
    const beforeHtml = await stat(artifactPath("index.html"));

    await store.patch(PROJECT_ID, { content: "content-only edit" });

    expect((await stat(artifactPath("index.html"))).ino).toBe(beforeHtml.ino);
    expect(await readFile(artifactPath("index.html"), "utf8")).toBe(HTML);
    expect(await readFile(artifactPath("content.md"), "utf8")).toBe(
      "content-only edit",
    );
  });

  it("replays an interrupted multi-file patch as one revision", async () => {
    const input = validInput(workspaceRoot);
    const initial = makeStore();
    const prepared = await initial.prepare(input, "exact prompt");
    await initial.markReady(prepared, HTML);

    clock = new Date("2026-07-21T00:02:00.000Z");
    const interrupted = makeStore(undefined, undefined, {
      beforePatchProjectPublish: async () => {
        throw new Error("simulated process interruption");
      },
    });
    await expect(
      interrupted.patch(PROJECT_ID, {
        content: "new content",
        html: "<!doctype html><html><body>new html</body></html>",
        templateId: "blog-post",
      }),
    ).rejects.toMatchObject({ code: "storage_failed" });

    const restarted = makeStore();
    await expect(restarted.get(PROJECT_ID)).resolves.toMatchObject({
      project: {
        templateId: "blog-post",
        updatedAt: "2026-07-21T00:02:00.000Z",
      },
      content: "new content",
      html: "<!doctype html><html><body>new html</body></html>",
    });
    await expect(
      lstat(path.join(artifactPath(), ".patch.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not patch stale artifacts after the registry capability is replaced", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    const replacement = await replaceRegistryDuringArtifactRead();

    await expect(
      store.patch(PROJECT_ID, { content: "must not be written" }),
    ).rejects.toMatchObject({ code: "storage_failed" });

    expect(await readFile(artifactPath("content.md"), "utf8")).toBe("# Q2");
    expect(await readFile(registryPath(), "utf8")).toBe(replacement);
  });

  it("promptly rejects a FIFO registry file", async () => {
    const store = await readyStore();
    const parked = `${registryPath()}.parked`;
    await rename(registryPath(), parked);
    await execFileAsync("mkfifo", [registryPath()]);
    await chmod(registryPath(), 0o600);
    const result = store.get(PROJECT_ID).then(
      () => "unexpected_success",
      (error: unknown) =>
        typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "unexpected_error",
    );
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const promptResult = await Promise.race([
      result,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), 500);
      }),
    ]);
    if (timeout !== undefined) clearTimeout(timeout);

    if (promptResult === null) {
      const writer = await open(
        registryPath(),
        fsConstants.O_WRONLY | fsConstants.O_NONBLOCK,
      );
      await writer.close();
      await result;
    }

    expect(promptResult).toBe("storage_failed");
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

  it("does not unregister a replacement capability record", async () => {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    const replacement = await replaceRegistryDuringArtifactRead();

    await expect(store.unregister(PROJECT_ID)).rejects.toMatchObject({
      code: "storage_failed",
    });

    expect(await readFile(registryPath(), "utf8")).toBe(replacement);
    expect(await readFile(artifactPath("index.html"), "utf8")).toBe(HTML);
  });

  it("skips unsupported directory syncs on Windows", async () => {
    const sentinel = path.join(temporaryDirectory, "sentinel");
    await writeFile(sentinel, "sentinel", { mode: 0o600 });
    const prototype = await fileHandlePrototype(sentinel);
    const originalSync = prototype.sync;
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    vi.spyOn(prototype, "sync").mockImplementation(async function (
      this: OpenedFile,
    ) {
      const metadata = await this.stat();
      if (metadata.isDirectory()) {
        throw Object.assign(new Error("Directory sync is unsupported."), {
          code: "EINVAL",
        });
      }
      return Reflect.apply(originalSync, this, []);
    });
    const store = makeStore();
    const prepared = await store.prepare(
      validInput(workspaceRoot),
      "exact prompt",
    );

    await expect(store.markReady(prepared, HTML)).resolves.toMatchObject({
      status: "ready",
    });
    await expect(
      store.putAsset(PROJECT_ID, "hero.png", pngBytes()),
    ).resolves.toMatchObject({ filename: "hero.png" });
  });

  describe("project assets", () => {
    it("publishes and reads exact owner-only image bytes", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x01, 0x02, 0x03);

      const asset = await store.putAsset(PROJECT_ID, "[Hero] Final.PNG", bytes);

      expect(asset).toEqual({
        path: "assets/hero-final.png",
        filename: "hero-final.png",
        originalName: "[Hero] Final.PNG",
        bytes: bytes.byteLength,
        mediaType: "image/png",
      });
      expect(await readFile(assetPath("hero-final.png"))).toEqual(Buffer.from(bytes));
      expect((await stat(assetPath())).mode & 0o777).toBe(0o700);
      expect((await stat(assetPath("hero-final.png"))).mode & 0o777).toBe(0o600);
      await expect(
        store.getAsset(PROJECT_ID, "hero-final.png"),
      ).resolves.toEqual({
        asset: {
          path: "assets/hero-final.png",
          filename: "hero-final.png",
          originalName: "hero-final.png",
          bytes: bytes.byteLength,
          mediaType: "image/png",
        },
        bytes: Buffer.from(bytes),
      });
      expect(await operationTemporaryFiles()).toEqual([]);
    });

    it.each([
      ["photo.anything", PNG_SIGNATURE, PNG_TRAILER, "photo.png", "image/png"],
      ["photo.png", JPEG, new Uint8Array(), "photo.jpg", "image/jpeg"],
      ["photo.bmp", GIF, new Uint8Array(), "photo.gif", "image/gif"],
      ["photo.gif", WEBP, new Uint8Array(), "photo.webp", "image/webp"],
    ] as const)(
      "derives the canonical stored type for %s",
      async (_originalName, start, end, expectedFilename, expectedMediaType) => {
        const store = await readyStore();
        const bytes = Uint8Array.from([...start, ...end]);

        const asset = await store.putAsset(PROJECT_ID, _originalName, bytes);

        expect(asset).toMatchObject({
          filename: expectedFilename,
          mediaType: expectedMediaType,
        });
        await expect(store.getAsset(PROJECT_ID, expectedFilename)).resolves.toEqual({
          asset: {
            ...asset,
            originalName: expectedFilename,
          },
          bytes: Buffer.from(bytes),
        });
      },
    );

    it("uses exclusive ordinal suffixes without overwriting concurrent uploads", async () => {
      const firstStore = await readyStore();
      const secondStore = makeStore();
      const firstBytes = pngBytes(0x01);
      const secondBytes = pngBytes(0x02, 0x03);

      const results = await Promise.all([
        firstStore.putAsset(PROJECT_ID, "Hero.PNG", firstBytes),
        secondStore.putAsset(PROJECT_ID, "Hero.PNG", secondBytes),
      ]);

      expect(results.map((asset) => asset.filename).sort()).toEqual([
        "hero-2.png",
        "hero.png",
      ]);
      const stored = await Promise.all([
        readFile(assetPath("hero.png")),
        readFile(assetPath("hero-2.png")),
      ]);
      expect(stored).toHaveLength(2);
      expect(stored.some((value) => value.equals(Buffer.from(firstBytes)))).toBe(true);
      expect(stored.some((value) => value.equals(Buffer.from(secondBytes)))).toBe(true);
      expect(await operationTemporaryFiles()).toEqual([]);
    });

    it("syncs an accepted raced assets directory before child publication", async () => {
      await readyStore();
      const bytes = pngBytes(0x01, 0x02);
      const prototype = await fileHandlePrototype(artifactPath("project.json"));
      const originalSync = prototype.sync;
      const mutableFsPromises = createRequire(import.meta.url)(
        "node:fs/promises",
      ) as {
        mkdir: (
          ...arguments_: Parameters<typeof mkdir>
        ) => Promise<string | undefined>;
      };
      const originalMkdir = mutableFsPromises.mkdir;
      const artifactIdentity = await directoryIdentity(artifactPath());
      let artifactSynced = false;
      let raceInjected = false;
      let temporaryObservedSyncedParent: boolean | undefined;
      vi.spyOn(prototype, "sync").mockImplementation(async function (
        this: OpenedFile,
      ) {
        const metadata = await this.stat({ bigint: true });
        if (metadata.isDirectory() && fileIdentity(metadata) === artifactIdentity) {
          artifactSynced = true;
        }
        if (metadata.isFile() && Number(metadata.size) === bytes.byteLength) {
          temporaryObservedSyncedParent = artifactSynced;
        }
        return Reflect.apply(originalSync, this, []);
      });
      mutableFsPromises.mkdir = async (
        ...arguments_: Parameters<typeof mkdir>
      ): Promise<string | undefined> => {
        const directory = String(arguments_[0]);
        if (directory === assetPath() && !raceInjected) {
          raceInjected = true;
          await Reflect.apply(originalMkdir, mutableFsPromises, arguments_);
          throw Object.assign(new Error("Simulated assets mkdir race."), {
            code: "EEXIST",
          });
        }
        return Reflect.apply(originalMkdir, mutableFsPromises, arguments_);
      };
      syncBuiltinESMExports();

      try {
        vi.resetModules();
        const { createProjectStore: createRacedProjectStore } = await import(
          "../storage"
        );
        const racedStore = createRacedProjectStore({
          registryRoot,
          publicBaseUrl: "https://host.ts.net:43233",
          now: () => clock,
        });
        await racedStore.putAsset(PROJECT_ID, "hero.png", bytes);
      } finally {
        mutableFsPromises.mkdir = originalMkdir;
        syncBuiltinESMExports();
      }

      expect(raceInjected).toBe(true);
      expect(temporaryObservedSyncedParent).toBe(true);
    });

    it("rejects invalid bytes and names before creating the assets directory", async () => {
      const store = await readyStore();
      const artifactEntries = (await readdir(artifactPath())).sort();
      const oversized = new Uint8Array(PROJECT_ASSET_MAX_BYTES + 1);
      oversized.set(PNG_SIGNATURE, 0);
      oversized.set(PNG_TRAILER, oversized.length - PNG_TRAILER.length);

      await expect(
        store.putAsset(PROJECT_ID, "empty.png", new Uint8Array()),
      ).rejects.toMatchObject({ code: "invalid_request" });
      await expect(
        store.putAsset(PROJECT_ID, "large.png", oversized),
      ).rejects.toMatchObject({ code: "limit_exceeded" });
      await expect(
        store.putAsset(PROJECT_ID, "vector.svg", new TextEncoder().encode("<svg/>")),
      ).rejects.toMatchObject({ code: "invalid_request" });
      await expect(
        store.putAsset(PROJECT_ID, "../escape.png", pngBytes()),
      ).rejects.toMatchObject({ code: "invalid_request" });

      expect((await readdir(artifactPath())).sort()).toEqual(artifactEntries);
      await expect(lstat(assetPath())).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("returns not found for missing projects and assets without writing", async () => {
      const store = await readyStore();
      const artifactEntries = (await readdir(artifactPath())).sort();

      await expect(
        store.putAsset(MISSING_PROJECT_ID, "hero.png", pngBytes()),
      ).rejects.toMatchObject({ code: "project_not_found" });
      await expect(
        store.getAsset(PROJECT_ID, "missing.png"),
      ).rejects.toMatchObject({ code: "project_not_found" });

      expect((await readdir(artifactPath())).sort()).toEqual(artifactEntries);
      await expect(lstat(assetPath())).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("preserves not found for a missing file in the current assets directory", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x01);
      await store.putAsset(PROJECT_ID, "hero.png", bytes);

      await expect(
        store.getAsset(PROJECT_ID, "missing.png"),
      ).rejects.toMatchObject({ code: "project_not_found" });

      expect(await readFile(assetPath("hero.png"))).toEqual(Buffer.from(bytes));
    });

    it("rejects an asset-directory symlink without writing through it", async () => {
      const store = await readyStore();
      const outside = path.join(temporaryDirectory, "outside-assets");
      await mkdir(outside, { mode: 0o700 });
      await symlink(outside, assetPath(), "dir");

      await expect(
        store.putAsset(PROJECT_ID, "hero.png", pngBytes()),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(await readdir(outside)).toEqual([]);
    });

    it("rejects replaced asset directories and symlink asset files on read", async () => {
      const store = await readyStore();
      await store.putAsset(PROJECT_ID, "hero.png", pngBytes());
      const parked = path.join(temporaryDirectory, "parked-assets");
      const outside = path.join(temporaryDirectory, "outside-assets");
      await mkdir(outside, { mode: 0o700 });
      await rename(assetPath(), parked);
      await symlink(outside, assetPath(), "dir");

      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });

      await rm(assetPath());
      await rename(parked, assetPath());
      const outsideFile = path.join(temporaryDirectory, "outside.png");
      await writeFile(outsideFile, pngBytes(), { mode: 0o600 });
      await symlink(outsideFile, assetPath("linked.png"), "file");
      await expect(
        store.getAsset(PROJECT_ID, "linked.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });
    });

    it("rejects an assets-parent symlink swap during stable readback", async () => {
      const initialStore = await readyStore();
      const original = pngBytes(0x01);
      const outsideBytes = pngBytes(0x08, 0x08);
      await initialStore.putAsset(PROJECT_ID, "hero.png", original);
      const parked = path.join(temporaryDirectory, "parked-assets-read");
      const outside = path.join(temporaryDirectory, "outside-assets-read");
      await mkdir(outside, { mode: 0o700 });
      await writeFile(path.join(outside, "hero.png"), outsideBytes, {
        mode: 0o600,
      });
      const swap = readWithAssetsParentSwap(outside, parked);

      await expect(swap.result).rejects.toMatchObject({
        code: "storage_failed",
      });

      expect(swap.wasPerformed()).toBe(true);
      expect(await readFile(path.join(outside, "hero.png"))).toEqual(
        Buffer.from(outsideBytes),
      );
      expect(await readFile(path.join(parked, "hero.png"))).toEqual(
        Buffer.from(original),
      );
    });

    it("maps malformed bytes behind a swapped assets parent to storage failure", async () => {
      const initialStore = await readyStore();
      await initialStore.putAsset(PROJECT_ID, "hero.png", pngBytes(0x01));
      const parked = path.join(temporaryDirectory, "parked-assets-malformed");
      const outside = path.join(temporaryDirectory, "outside-assets-malformed");
      await mkdir(outside, { mode: 0o700 });
      await writeFile(path.join(outside, "hero.png"), "not an image", {
        mode: 0o600,
      });
      const swap = readWithAssetsParentSwap(outside, parked);

      await expect(swap.result).rejects.toMatchObject({
        code: "storage_failed",
      });

      expect(swap.wasPerformed()).toBe(true);
    });

    it("maps a missing file behind a swapped assets parent to storage failure", async () => {
      const initialStore = await readyStore();
      await initialStore.putAsset(PROJECT_ID, "hero.png", pngBytes(0x01));
      const parked = path.join(temporaryDirectory, "parked-assets-missing");
      const outside = path.join(temporaryDirectory, "outside-assets-missing");
      await mkdir(outside, { mode: 0o700 });
      const swap = readWithAssetsParentSwap(outside, parked);

      await expect(swap.result).rejects.toMatchObject({
        code: "storage_failed",
      });

      expect(swap.wasPerformed()).toBe(true);
    });

    it("maps removal of the captured assets parent to storage failure", async () => {
      const initialStore = await readyStore();
      await initialStore.putAsset(PROJECT_ID, "hero.png", pngBytes(0x01));
      const parked = path.join(temporaryDirectory, "parked-assets-removed");
      const swap = readWithAssetsParentSwap(undefined, parked);

      await expect(swap.result).rejects.toMatchObject({
        code: "storage_failed",
      });

      expect(swap.wasPerformed()).toBe(true);
    });

    it("rejects non-owner, oversized, and malformed stored asset files", async () => {
      const store = await readyStore();
      await store.putAsset(PROJECT_ID, "hero.png", pngBytes());

      await chmod(assetPath("hero.png"), 0o644);
      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });

      await chmod(assetPath("hero.png"), 0o600);
      await writeFile(assetPath("hero.png"), "not an image");
      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "invalid_request" });

      await writeFile(
        assetPath("hero.png"),
        new Uint8Array(PROJECT_ASSET_MAX_BYTES + 1),
      );
      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });
    });

    it("promptly rejects a FIFO asset and releases the project queue", async () => {
      const store = await readyStore();
      await store.putAsset(PROJECT_ID, "other.png", pngBytes(0x02));
      const fifoPath = assetPath("pipe.png");
      await execFileAsync("mkfifo", [fifoPath]);
      await chmod(fifoPath, 0o600);

      const fifoResult = store.getAsset(PROJECT_ID, "pipe.png").then(
        () => "unexpected_success",
        (error: unknown) =>
          typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "unexpected_error",
      );
      const queuedResult = store.getAsset(PROJECT_ID, "other.png").then(
        () => "queue_released",
        () => "queued_failure",
      );
      const settled = Promise.all([fifoResult, queuedResult]);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const promptResult = await Promise.race([
        settled,
        new Promise<null>((resolve) => {
          timeout = setTimeout(() => resolve(null), 500);
        }),
      ]);
      if (timeout !== undefined) clearTimeout(timeout);

      if (promptResult === null) {
        const writer = await open(
          fifoPath,
          fsConstants.O_WRONLY | fsConstants.O_NONBLOCK,
        );
        await writer.close();
        await settled;
      }

      expect(promptResult).toEqual(["storage_failed", "queue_released"]);
    });

    it("rejects an asset changed during stable readback", async () => {
      const store = await readyStore();
      const original = pngBytes(0x01);
      await store.putAsset(PROJECT_ID, "hero.png", original);
      const prototype = await fileHandlePrototype(assetPath("hero.png"));
      const originalReadFile = prototype.readFile;
      let replaced = false;
      vi.spyOn(prototype, "readFile").mockImplementation(async function (
        this: OpenedFile,
        ...arguments_: Parameters<OpenedFile["readFile"]>
      ) {
        const result = await Reflect.apply(originalReadFile, this, arguments_);
        if (!replaced && Buffer.isBuffer(result) && result.equals(Buffer.from(original))) {
          replaced = true;
          await writeFile(assetPath("hero.png"), pngBytes(0x02, 0x03));
        }
        return result;
      });

      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });
      expect(replaced).toBe(true);
    });

    it("revalidates the registry after temporary sync and cleans only its temp", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x01, 0x02);
      const current = JSON.parse(await readFile(registryPath(), "utf8"));
      current.registeredAt = "2026-07-21T00:00:01.000Z";
      const replacement = `${JSON.stringify(current)}\n`;
      const parkedRegistry = `${registryPath()}.parked`;
      const keepPath = assetPath("keep-unrelated");
      const prototype = await fileHandlePrototype(artifactPath("project.json"));
      const originalSync = prototype.sync;
      let replaced = false;
      vi.spyOn(prototype, "sync").mockImplementation(async function (
        this: OpenedFile,
      ) {
        const metadata = await this.stat();
        const result = await Reflect.apply(originalSync, this, []);
        if (!replaced && metadata.isFile() && metadata.size === bytes.byteLength) {
          replaced = true;
          await writeFile(keepPath, "preserve", { mode: 0o600 });
          await rename(registryPath(), parkedRegistry);
          await writeFile(registryPath(), replacement, { flag: "wx", mode: 0o600 });
        }
        return result;
      });

      await expect(
        store.putAsset(PROJECT_ID, "hero.png", bytes),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(replaced).toBe(true);
      expect(await readFile(registryPath(), "utf8")).toBe(replacement);
      expect(await readFile(keepPath, "utf8")).toBe("preserve");
      await expect(lstat(assetPath("hero.png"))).rejects.toMatchObject({
        code: "ENOENT",
      });
      expect(await operationTemporaryFiles()).toEqual([]);
    });

    it("removes a linked asset when post-link publication fails", async () => {
      const store = await readyStore();
      await mkdir(assetPath(), { mode: 0o700 });
      const assetsIdentity = await directoryIdentity(assetPath());
      const prototype = await fileHandlePrototype(artifactPath("project.json"));
      const originalSync = prototype.sync;
      let failedAfterLink = false;
      vi.spyOn(prototype, "sync").mockImplementation(async function (
        this: OpenedFile,
      ) {
        const metadata = await this.stat({ bigint: true });
        if (
          !failedAfterLink &&
          metadata.isDirectory() &&
          fileIdentity(metadata) === assetsIdentity
        ) {
          failedAfterLink = true;
          throw new Error("simulated post-link sync failure");
        }
        return Reflect.apply(originalSync, this, []);
      });

      await expect(
        store.putAsset(PROJECT_ID, "hero.png", pngBytes(0x01)),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(failedAfterLink).toBe(true);
      await expect(lstat(assetPath("hero.png"))).rejects.toMatchObject({
        code: "ENOENT",
      });
      expect(await operationTemporaryFiles()).toEqual([]);
    });

    it("maps a replaced artifact capability to bounded storage failure", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x04, 0x05);
      const parked = path.join(temporaryDirectory, "parked-project");
      const outside = path.join(temporaryDirectory, "outside-project");
      await mkdir(outside, { mode: 0o700 });
      const prototype = await fileHandlePrototype(artifactPath("project.json"));
      const originalSync = prototype.sync;
      let replaced = false;
      vi.spyOn(prototype, "sync").mockImplementation(async function (
        this: OpenedFile,
      ) {
        const metadata = await this.stat();
        const result = await Reflect.apply(originalSync, this, []);
        if (!replaced && metadata.isFile() && metadata.size === bytes.byteLength) {
          replaced = true;
          await rename(artifactPath(), parked);
          await symlink(outside, artifactPath(), "dir");
        }
        return result;
      });

      await expect(
        store.putAsset(PROJECT_ID, "hero.png", bytes),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(replaced).toBe(true);
      expect(await readdir(outside)).toEqual([]);
      await expect(lstat(path.join(parked, "assets", "hero.png"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    });

    it("rejects a real artifact-directory replacement before asset publication", async () => {
      await readyStore();
      let replacement: Awaited<ReturnType<typeof replaceArtifactWithRealDirectory>>;
      const store = makeStore(undefined, async () => {
        replacement = await replaceArtifactWithRealDirectory();
      });

      await expect(
        store.putAsset(PROJECT_ID, "hero.png", pngBytes(0x06)),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(replacement!).toBeDefined();
      await expect(lstat(assetPath("hero.png"))).rejects.toMatchObject({
        code: "ENOENT",
      });
      await expect(
        lstat(path.join(replacement!.parked, "assets", "hero.png")),
      ).rejects.toMatchObject({ code: "ENOENT" });
    });

    it("rejects a real artifact-directory replacement before asset read", async () => {
      const initialStore = await readyStore();
      const original = pngBytes(0x01);
      const outside = pngBytes(0x09, 0x09);
      await initialStore.putAsset(PROJECT_ID, "hero.png", original);
      const prototype = await fileHandlePrototype(assetPath("hero.png"));
      const originalReadFile = prototype.readFile;
      let replacementAssetRead = false;
      vi.spyOn(prototype, "readFile").mockImplementation(async function (
        this: OpenedFile,
        ...arguments_: Parameters<OpenedFile["readFile"]>
      ) {
        const result = await Reflect.apply(originalReadFile, this, arguments_);
        if (Buffer.isBuffer(result) && result.equals(Buffer.from(outside))) {
          replacementAssetRead = true;
        }
        return result;
      });
      let replacement: Awaited<ReturnType<typeof replaceArtifactWithRealDirectory>>;
      const store = makeStore(undefined, async () => {
        replacement = await replaceArtifactWithRealDirectory({
          filename: "hero.png",
          bytes: outside,
        });
      });

      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(replacement!).toBeDefined();
      expect(replacementAssetRead).toBe(false);
      expect(await readFile(assetPath("hero.png"))).toEqual(Buffer.from(outside));
      expect(
        await readFile(path.join(replacement!.parked, "assets", "hero.png")),
      ).toEqual(Buffer.from(original));
    });

    it("rejects a replacement registry capability before asset readback", async () => {
      const initialStore = await readyStore();
      await initialStore.putAsset(PROJECT_ID, "hero.png", pngBytes());
      const current = JSON.parse(await readFile(registryPath(), "utf8"));
      current.registeredAt = "2026-07-21T00:00:01.000Z";
      const replacement = `${JSON.stringify(current)}\n`;
      const parked = `${registryPath()}.parked`;
      let replaced = false;
      const store = makeStore(undefined, async () => {
        if (replaced) return;
        replaced = true;
        await rename(registryPath(), parked);
        await writeFile(registryPath(), replacement, {
          flag: "wx",
          mode: 0o600,
        });
      });

      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "storage_failed" });

      expect(replaced).toBe(true);
      expect(await readFile(registryPath(), "utf8")).toBe(replacement);
    });

    it("reads an asset without loading the project content or HTML", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x01, 0x02);
      const asset = await store.putAsset(PROJECT_ID, "hero.png", bytes);
      const prototype = await fileHandlePrototype(assetPath("hero.png"));
      const originalReadFile = prototype.readFile;
      const projectPayloads = [
        Buffer.from("# Q2"),
        Buffer.from(HTML),
      ];
      let projectPayloadRead = false;
      vi.spyOn(prototype, "readFile").mockImplementation(async function (
        this: OpenedFile,
        ...arguments_: Parameters<OpenedFile["readFile"]>
      ) {
        const result = await Reflect.apply(originalReadFile, this, arguments_);
        if (
          Buffer.isBuffer(result) &&
          projectPayloads.some((payload) => result.equals(payload))
        ) {
          projectPayloadRead = true;
        }
        return result;
      });

      await expect(store.getAsset(PROJECT_ID, "hero.png")).resolves.toEqual({
        asset,
        bytes: Buffer.from(bytes),
      });

      expect(projectPayloadRead).toBe(false);
    });

    it("captures asset metadata outside an overlapping project patch", async () => {
      const initialStore = await readyStore();
      const bytes = pngBytes(0x01, 0x02);
      await initialStore.putAsset(PROJECT_ID, "hero.png", bytes);
      let patchReachedPublish!: () => void;
      const atPatchPublish = new Promise<void>((resolve) => {
        patchReachedPublish = resolve;
      });
      let releasePatch!: () => void;
      const patchRelease = new Promise<void>((resolve) => {
        releasePatch = resolve;
      });
      const store = makeStore(undefined, undefined, {
        beforePatchProjectPublish: async () => {
          patchReachedPublish();
          await patchRelease;
        },
      });
      const patch = store.patch(PROJECT_ID, { content: "overlapping edit" });
      await atPatchPublish;
      let assetSettled = false;
      const assetRead = store.getAsset(PROJECT_ID, "hero.png").finally(() => {
        assetSettled = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(assetSettled).toBe(false);

      releasePatch();
      await expect(patch).resolves.toBeUndefined();
      await expect(assetRead).resolves.toMatchObject({
        bytes: Buffer.from(bytes),
      });
    });

    it("preserves published assets after unregister", async () => {
      const store = await readyStore();
      const bytes = pngBytes(0x01, 0x02, 0x03);
      await store.putAsset(PROJECT_ID, "hero.png", bytes);

      await store.unregister(PROJECT_ID);

      expect(await readFile(assetPath("hero.png"))).toEqual(Buffer.from(bytes));
      await expect(
        store.getAsset(PROJECT_ID, "hero.png"),
      ).rejects.toMatchObject({ code: "project_not_found" });
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

  function makeStore(
    managedRegistryBoundary?: string,
    beforeAssetCapabilityRevalidation?: () => Promise<void>,
    lifecycleHooks: Pick<
      ProjectStoreOptions,
      | "beforeProjectDirectoryPublish"
      | "beforeReadyProjectPublish"
      | "beforeRegistryPublish"
      | "beforePatchProjectPublish"
    > = {},
  ) {
    return createProjectStore({
      registryRoot,
      ...(managedRegistryBoundary === undefined
        ? {}
        : { managedRegistryBoundary }),
      publicBaseUrl: "https://host.ts.net:43233",
      now: () => clock,
      ...(beforeAssetCapabilityRevalidation === undefined
        ? {}
        : { beforeAssetCapabilityRevalidation }),
      ...lifecycleHooks,
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

  function assetPath(name?: string): string {
    const directory = artifactPath("assets");
    return name === undefined ? directory : path.join(directory, name);
  }

  function registryPath(): string {
    return path.join(registryRoot, `${PROJECT_ID}.json`);
  }

  async function operationTemporaryFiles(): Promise<string[]> {
    const directories = [artifactPath(), assetPath(), registryRoot];
    const entries: string[] = [];
    for (const directory of directories) {
      for (const name of await readdir(directory).catch(() => [] as string[])) {
        if (name.includes(".tmp-")) entries.push(path.join(directory, name));
      }
    }
    return entries;
  }

  async function readyStore() {
    const store = makeStore();
    const prepared = await store.prepare(validInput(workspaceRoot), "exact prompt");
    await store.markReady(prepared, HTML);
    return store;
  }

  function readWithAssetsParentSwap(
    outside: string | undefined,
    parked: string,
  ) {
    const mutableFsPromises = createRequire(import.meta.url)(
      "node:fs/promises",
    ) as { open: typeof open };
    const originalOpen = mutableFsPromises.open;
    let swapped = false;
    mutableFsPromises.open = (async (
      ...arguments_: Parameters<typeof open>
    ) => {
      if (!swapped && String(arguments_[0]) === assetPath("hero.png")) {
        swapped = true;
        await rename(assetPath(), parked);
        if (outside !== undefined) {
          await symlink(outside, assetPath(), "dir");
        }
      }
      return Reflect.apply(originalOpen, mutableFsPromises, arguments_);
    }) as typeof open;
    syncBuiltinESMExports();

    const result = (async () => {
      try {
        vi.resetModules();
        const { createProjectStore: createSwappedProjectStore } = await import(
          "../storage"
        );
        const store = createSwappedProjectStore({
          registryRoot,
          publicBaseUrl: "https://host.ts.net:43233",
          now: () => clock,
        });
        return await store.getAsset(PROJECT_ID, "hero.png");
      } finally {
        mutableFsPromises.open = originalOpen;
        syncBuiltinESMExports();
      }
    })();

    return { result, wasPerformed: () => swapped };
  }

  async function replaceArtifactWithRealDirectory(replacementAsset?: {
    filename: string;
    bytes: Uint8Array;
  }) {
    const canonicalNames = [
      "PROMPT.md",
      "content.md",
      "project.json",
      "index.html",
    ] as const;
    const canonicalBytes = await Promise.all(
      canonicalNames.map((name) => readFile(artifactPath(name))),
    );
    const parked = path.join(temporaryDirectory, "parked-real-project");
    await rename(artifactPath(), parked);
    await mkdir(artifactPath(), { mode: 0o700 });
    for (let index = 0; index < canonicalNames.length; index += 1) {
      await writeFile(
        artifactPath(canonicalNames[index]),
        canonicalBytes[index],
        { mode: 0o600 },
      );
    }
    if (replacementAsset !== undefined) {
      await mkdir(assetPath(), { mode: 0o700 });
      await writeFile(
        assetPath(replacementAsset.filename),
        replacementAsset.bytes,
        { mode: 0o600 },
      );
    }
    return { parked };
  }

  function serializedRegistryByteLength(input: CreateProjectInput): number {
    return Buffer.byteLength(
      `${JSON.stringify({
        schemaVersion: 1,
        projectId: input.projectId,
        workspaceRoot: input.workspaceRoot,
        artifactDirectory: path.join(
          input.workspaceRoot,
          "artifacts",
          "html-anything",
          input.slug,
        ),
        registeredAt: clock.toISOString(),
      })}\n`,
    );
  }

  async function replaceRegistryDuringArtifactRead(): Promise<string> {
    const current = JSON.parse(await readFile(registryPath(), "utf8"));
    current.registeredAt = "2026-07-21T00:00:01.000Z";
    const replacement = `${JSON.stringify(current)}\n`;
    const parked = `${registryPath()}.parked`;
    const prototype = await fileHandlePrototype(artifactPath("project.json"));
    const originalReadFile = prototype.readFile;
    let replaced = false;
    vi.spyOn(prototype, "readFile").mockImplementation(async function (
      this: OpenedFile,
      ...arguments_: Parameters<OpenedFile["readFile"]>
    ) {
      const result = await Reflect.apply(originalReadFile, this, arguments_);
      if (!replaced && Buffer.isBuffer(result) && result.equals(Buffer.from(HTML))) {
        replaced = true;
        await rename(registryPath(), parked);
        await writeFile(registryPath(), replacement, { flag: "wx", mode: 0o600 });
      }
      return result;
    });
    return replacement;
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

function fileIdentity(metadata: { dev: bigint; ino: bigint }): string {
  return `${metadata.dev}:${metadata.ino}`;
}

async function directoryIdentity(directory: string): Promise<string> {
  return fileIdentity(await stat(directory, { bigint: true }));
}
