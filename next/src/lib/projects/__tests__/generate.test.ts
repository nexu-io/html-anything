import { describe, expect, it, vi } from "vitest";
import {
  PROJECT_DIAGNOSTIC_MAX_BYTES,
  PROJECT_HTML_MAX_BYTES,
  type CreateProjectInput,
  type PatchProjectInput,
  type ProjectSnapshot,
  type ReadyProjectResponse,
} from "../contracts";
import type { InvokeEvent, InvokeOpts } from "../../agents/invoke";
import type { LoadedSkill } from "../../templates/loader";
import { assemblePrompt } from "../../templates/shared";
import {
  collectCompleteHtml,
  generateAndStoreProject,
  type GenerateProjectDependencies,
} from "../generate";
import { createProjectService, projectService } from "../service";
import type { PreparedProject, ProjectStore } from "../storage";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const PUBLIC_BASE_URL = "https://host.ts.net:43233";
const COMPLETE_HTML = "<!doctype html><html><body>ready</body></html>";

function events(...items: InvokeEvent[]): ReadableStream<InvokeEvent> {
  return new ReadableStream({
    start(controller) {
      for (const item of items) controller.enqueue(item);
      controller.close();
    },
  });
}

describe("collectCompleteHtml", () => {
  it("accumulates delta events into a complete HTML document", async () => {
    const html = await collectCompleteHtml(
      events(
        { type: "delta", text: "<!doctype html><html>" },
        { type: "delta", text: "<body>ready</body></html>" },
        { type: "done", code: 0 },
      ),
      new AbortController().signal,
    );

    expect(html).toBe(COMPLETE_HTML);
  });

  it("replaces accumulated deltas when an html event arrives", async () => {
    const html = await collectCompleteHtml(
      events(
        { type: "delta", text: "chatty preamble" },
        { type: "html", text: COMPLETE_HTML },
        { type: "done", code: 0 },
      ),
      new AbortController().signal,
    );

    expect(html).toBe(COMPLETE_HTML);
  });

  it.each([
    ["agent error", events({ type: "error", message: "private stderr" })],
    ["nonzero exit", events({ type: "delta", text: COMPLETE_HTML }, { type: "done", code: 2 })],
    ["missing done", events({ type: "delta", text: COMPLETE_HTML })],
  ])("rejects %s", async (_label, stream) => {
    await expect(
      collectCompleteHtml(stream, new AbortController().signal),
    ).rejects.toMatchObject({ code: "generation_failed" });
  });

  it("rejects output that exceeds the HTML byte limit", async () => {
    await expect(
      collectCompleteHtml(
        events({ type: "delta", text: "x".repeat(PROJECT_HTML_MAX_BYTES + 1) }),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "limit_exceeded" });
  });

  it.each([
    ["an incomplete document", "<!doctype html><html><body>unfinished"],
    ["plain text that extractHtml would wrap", "just an explanation"],
  ])("rejects %s", async (_label, output) => {
    await expect(
      collectCompleteHtml(
        events({ type: "delta", text: output }, { type: "done", code: 0 }),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ code: "generation_failed" });
  });

  it("rejects promptly when aborted", async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<InvokeEvent>({ start() {} });
    const result = collectCompleteHtml(stream, controller.signal);

    controller.abort();

    await expect(result).rejects.toMatchObject({ code: "generation_timeout" });
  });

  it("reports a timeout when an earlier abort listener closes the stream", async () => {
    const controller = new AbortController();
    let producerClosed = false;
    const stream = new ReadableStream<InvokeEvent>({
      start(streamController) {
        controller.signal.addEventListener("abort", () => {
          producerClosed = true;
          streamController.close();
        }, { once: true });
      },
    });
    const result = collectCompleteHtml(stream, controller.signal);

    controller.abort();

    await expect(result).rejects.toMatchObject({ code: "generation_timeout" });
    expect(producerClosed).toBe(true);
  });
});

describe("generateAndStoreProject", () => {
  it("stores the exact prompt and replacement HTML before returning ready", async () => {
    const store = fakeStore();
    const input = validInput("/workspace");
    let invokeOptions: InvokeOpts | undefined;
    const result = await generateAndStoreProject(input, dependencies(store, (opts) => {
      invokeOptions = opts;
      return events(
        { type: "delta", text: "preamble" },
        { type: "html", text: COMPLETE_HTML },
        { type: "done", code: 0 },
      );
    }));
    const expectedPrompt = assemblePrompt({
      body: "template body",
      content: input.content,
      format: "markdown",
    });

    expect(store.preparedPrompt).toBe(expectedPrompt);
    expect(store.readyHtml).toBe(COMPLETE_HTML);
    expect(store.registryPublished).toBe(true);
    expect(invokeOptions).toEqual({
      agent: "codex",
      prompt: expectedPrompt,
      cwd: "/resolved/workspace",
      model: "gpt-explicit",
      signal: expect.any(AbortSignal),
    });
    expect(result).toEqual({ response: readyResponse(), created: true });
  });

  it("returns an idempotent ready result without loading a template, preparing, or invoking", async () => {
    const store = fakeStore();
    store.findReadyResult = readyResponse();
    const loadSkill = vi.fn<GenerateProjectDependencies["loadSkill"]>();
    const invokeAgent = vi.fn<GenerateProjectDependencies["invokeAgent"]>();

    await expect(generateAndStoreProject(validInput("/workspace"), {
      store,
      publicBaseUrl: PUBLIC_BASE_URL,
      loadSkill,
      invokeAgent,
      deadlineMs: 900_000,
    })).resolves.toEqual({ response: readyResponse(), created: false });

    expect(store.prepareCalls).toBe(0);
    expect(loadSkill).not.toHaveBeenCalled();
    expect(invokeAgent).not.toHaveBeenCalled();
  });

  it.each([
    [undefined],
    ["http://host.ts.net"],
    ["https://host.ts.net/projects"],
    ["https://user:pass@host.ts.net"],
    ["https://host.ts.net/?query=yes"],
    ["https://host.ts.net/#fragment"],
  ])("rejects invalid public base URL %s before any store or agent work", async (publicBaseUrl) => {
    const store = fakeStore();
    const invokeAgent = vi.fn<GenerateProjectDependencies["invokeAgent"]>();

    await expect(generateAndStoreProject(validInput("/workspace"), {
      ...dependencies(store, invokeAgent),
      publicBaseUrl,
    })).rejects.toMatchObject({ code: "configuration_missing" });

    expect(store.findReadyCalls).toBe(0);
    expect(store.prepareCalls).toBe(0);
    expect(invokeAgent).not.toHaveBeenCalled();
  });

  it("rejects a missing template before prepare and agent invocation", async () => {
    const store = fakeStore();
    const invokeAgent = vi.fn<GenerateProjectDependencies["invokeAgent"]>();

    await expect(generateAndStoreProject(validInput("/workspace"), {
      ...dependencies(store, invokeAgent),
      loadSkill: () => null,
    })).rejects.toMatchObject({ code: "template_not_found" });

    expect(store.prepareCalls).toBe(0);
    expect(invokeAgent).not.toHaveBeenCalled();
  });

  it("persists safe failed metadata and never publishes after generation failure", async () => {
    const store = fakeStore();

    await expect(generateAndStoreProject(
      validInput("/workspace"),
      dependencies(store, () => events({ type: "error", message: "secret raw failure" })),
    )).rejects.toMatchObject({ code: "generation_failed" });

    expect(store.failedDiagnostic).toBeDefined();
    expect(store.failedDiagnostic).not.toContain("secret raw failure");
    expect(new TextEncoder().encode(store.failedDiagnostic).byteLength).toBeLessThanOrEqual(
      PROJECT_DIAGNOSTIC_MAX_BYTES,
    );
    expect(store.readyHtml).toBeUndefined();
    expect(store.registryPublished).toBe(false);
  });

  it("aborts the invocation and runs producer cleanup before persisting an oversize failure", async () => {
    const store = fakeStore();
    const markFailed = store.markFailed;
    let invocationSignal: AbortSignal | undefined;
    let producerCleaned = false;
    let markFailedObservedCleanup = false;
    store.markFailed = async (prepared, diagnostic) => {
      markFailedObservedCleanup =
        invocationSignal?.aborted === true && producerCleaned;
      await markFailed(prepared, diagnostic);
    };

    await expect(generateAndStoreProject(
      validInput("/workspace"),
      dependencies(store, (opts) => {
        if (opts.signal === undefined) throw new Error("missing invocation signal");
        invocationSignal = opts.signal;
        opts.signal.addEventListener("abort", () => {
          producerCleaned = true;
        }, { once: true });
        return events({
          type: "delta",
          text: "x".repeat(PROJECT_HTML_MAX_BYTES + 1),
        });
      }),
    )).rejects.toMatchObject({ code: "limit_exceeded" });

    expect(invocationSignal?.aborted).toBe(true);
    expect(producerCleaned).toBe(true);
    expect(markFailedObservedCleanup).toBe(true);
    expect(store.failedDiagnostic).toBeDefined();
    expect(store.registryPublished).toBe(false);
  });

  it("aborts at the deadline and persists failed metadata", async () => {
    const store = fakeStore();
    let invocationSignal: AbortSignal | undefined;

    await expect(generateAndStoreProject(validInput("/workspace"), {
      ...dependencies(store, (opts) => {
        invocationSignal = opts.signal;
        return new ReadableStream<InvokeEvent>({ start() {} });
      }),
      deadlineMs: 5,
    })).rejects.toMatchObject({ code: "generation_timeout" });

    expect(invocationSignal?.aborted).toBe(true);
    expect(store.failedDiagnostic).toBeDefined();
    expect(store.registryPublished).toBe(false);
  });
});

describe("createProjectService", () => {
  it("preserves fresh and idempotent creation outcomes", async () => {
    const freshService = createProjectService(
      dependencies(
        fakeStore(),
        () => events(
          { type: "delta", text: COMPLETE_HTML },
          { type: "done", code: 0 },
        ),
      ),
    );
    const existingStore = fakeStore();
    existingStore.findReadyResult = readyResponse();
    const existingService = createProjectService(
      dependencies(existingStore, vi.fn()),
    );

    await expect(freshService.create(validInput("/workspace"))).resolves.toEqual({
      response: readyResponse(),
      created: true,
    });
    await expect(existingService.create(validInput("/workspace"))).resolves.toEqual({
      response: readyResponse(),
      created: false,
    });
  });

  it("exposes the exact domain operations and delegates storage operations", async () => {
    const store = fakeStore();
    store.findReadyResult = readyResponse();
    const service = createProjectService(dependencies(store, vi.fn()));
    const patch: PatchProjectInput = { content: "changed" };

    await expect(service.create(validInput("/workspace"))).resolves.toEqual({
      response: readyResponse(),
      created: false,
    });
    await service.get(PROJECT_ID);
    await service.patch(PROJECT_ID, patch);
    await service.unregister(PROJECT_ID);

    expect(Object.keys(service).sort()).toEqual(["create", "get", "patch", "unregister"]);
    expect(store.getArgs).toEqual([PROJECT_ID]);
    expect(store.patchArgs).toEqual([[PROJECT_ID, patch]]);
    expect(store.unregisterArgs).toEqual([PROJECT_ID]);
  });

  it("defers configured store construction and reports a missing public URL", async () => {
    vi.stubEnv("HTML_ANYTHING_PUBLIC_BASE_URL", "");
    try {
      await expect(projectService.get(PROJECT_ID)).rejects.toMatchObject({
        code: "configuration_missing",
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

type FakeProjectStore = ProjectStore & {
  preparedPrompt?: string;
  readyHtml?: string;
  failedDiagnostic?: string;
  registryPublished: boolean;
  prepareCalls: number;
  findReadyCalls: number;
  findReadyResult: ReadyProjectResponse | null;
  getArgs: string[];
  patchArgs: Array<[string, PatchProjectInput]>;
  unregisterArgs: string[];
};

function fakeStore(): FakeProjectStore {
  const store: FakeProjectStore = {
    registryPublished: false,
    prepareCalls: 0,
    findReadyCalls: 0,
    findReadyResult: null,
    getArgs: [],
    patchArgs: [],
    unregisterArgs: [],
    async prepare(input, prompt) {
      store.prepareCalls += 1;
      store.preparedPrompt = prompt;
      return preparedProject(input);
    },
    async markReady(_prepared, html) {
      store.readyHtml = html;
      store.registryPublished = true;
      return readyResponse();
    },
    async markFailed(_prepared, diagnostic) {
      store.failedDiagnostic = diagnostic;
    },
    async get(id) {
      store.getArgs.push(id);
      return snapshot();
    },
    async patch(id, patch) {
      store.patchArgs.push([id, patch]);
      return snapshot();
    },
    async unregister(id) {
      store.unregisterArgs.push(id);
    },
    async findReadyCreation() {
      store.findReadyCalls += 1;
      return store.findReadyResult;
    },
  };
  return store;
}

function dependencies(
  store: ProjectStore,
  invokeAgent: GenerateProjectDependencies["invokeAgent"],
): GenerateProjectDependencies {
  return {
    store,
    publicBaseUrl: PUBLIC_BASE_URL,
    loadSkill: () => ({ id: "data-report", body: "template body" }) as LoadedSkill,
    invokeAgent,
    deadlineMs: 900_000,
  };
}

function validInput(workspaceRoot: string): CreateProjectInput {
  return {
    projectId: PROJECT_ID,
    workspaceRoot,
    slug: "q2-report",
    name: "Q2 report",
    instruction: "Create a Q2 report",
    content: "# Q2",
    sourceFiles: [],
    templateId: "data-report",
    format: "markdown",
    agent: "codex",
    model: "gpt-explicit",
  };
}

function preparedProject(input: CreateProjectInput): PreparedProject {
  const workspaceRoot = "/resolved/workspace";
  const artifactDirectory = `${workspaceRoot}/artifacts/html-anything/${input.slug}`;
  return {
    input: { ...input, workspaceRoot },
    paths: {
      workspaceRoot,
      artifactParent: `${workspaceRoot}/artifacts/html-anything`,
      artifactDirectory,
      promptPath: `${artifactDirectory}/PROMPT.md`,
      contentPath: `${artifactDirectory}/content.md`,
      projectPath: `${artifactDirectory}/project.json`,
      htmlPath: `${artifactDirectory}/index.html`,
    },
    project: {
      schemaVersion: 1,
      projectId: input.projectId,
      slug: input.slug,
      name: input.name,
      instruction: input.instruction,
      templateId: input.templateId,
      format: input.format,
      agent: input.agent,
      model: input.model,
      sources: input.sourceFiles,
      status: "generating",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    },
  };
}

function readyResponse(): ReadyProjectResponse {
  return {
    status: "ready",
    projectId: PROJECT_ID,
    url: `${PUBLIC_BASE_URL}/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/q2-report",
    sourcePaths: [],
  };
}

function snapshot(): ProjectSnapshot {
  const input = validInput("/resolved/workspace");
  return {
    project: {
      schemaVersion: 1,
      projectId: input.projectId,
      slug: input.slug,
      name: input.name,
      instruction: input.instruction,
      templateId: input.templateId,
      format: input.format,
      agent: input.agent,
      model: input.model,
      sources: [],
      status: "ready",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    },
    content: input.content,
    html: COMPLETE_HTML,
    url: `${PUBLIC_BASE_URL}/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/q2-report",
  };
}
