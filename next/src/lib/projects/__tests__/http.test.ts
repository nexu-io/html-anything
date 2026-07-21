import { describe, expect, it, vi } from "vitest";
import {
  PROJECT_CREATE_BODY_MAX_BYTES,
  PROJECT_PATCH_BODY_MAX_BYTES,
  ProjectError,
  type CreateProjectInput,
  type ProjectDocument,
  type ProjectErrorCode,
  type ProjectSnapshot,
  type ReadyProjectResponse,
} from "../contracts";
import {
  createProjectHttpHandlers,
  isLoopbackCreationRequest,
  readBoundedJson,
} from "../http";
import type { ProjectService } from "../service";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const COMPLETE_HTML = "<!doctype html><html><body>ready</body></html>";

function validCreateInput(): CreateProjectInput {
  return {
    projectId: PROJECT_ID,
    workspaceRoot: "/workspace",
    slug: "demo",
    name: "Demo",
    instruction: "Build a demo.",
    content: "# Demo",
    sourceFiles: [],
    templateId: "landing-page",
    format: "markdown",
    agent: "codex",
  };
}

function readyProject(): ProjectDocument {
  return {
    schemaVersion: 1,
    projectId: PROJECT_ID,
    slug: "demo",
    name: "Demo",
    instruction: "Build a demo.",
    templateId: "landing-page",
    format: "markdown",
    agent: "codex",
    sources: [],
    status: "ready",
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
  };
}

function readySnapshot(): ProjectSnapshot {
  return {
    project: readyProject(),
    content: "# Demo",
    html: COMPLETE_HTML,
    url: `https://host.ts.net/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/demo",
  };
}

function readyResponse(): ReadyProjectResponse {
  return {
    status: "ready",
    projectId: PROJECT_ID,
    url: `https://host.ts.net/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/demo",
    sourcePaths: [],
  };
}

function fakeService(options: {
  snapshot?: ProjectSnapshot;
  created?: boolean;
} = {}): ProjectService {
  return {
    create: vi.fn(async () => ({
      response: readyResponse(),
      created: options.created ?? true,
    })),
    get: vi.fn(async () => {
      if (options.snapshot !== undefined) return options.snapshot;
      throw new ProjectError("project_not_found", "Project was not found.");
    }),
    patch: vi.fn(async () => readySnapshot()),
    unregister: vi.fn(async () => undefined),
  };
}

function request(
  method: string,
  path = "/api/projects",
  body?: BodyInit,
  host = "localhost:3000",
): Request {
  const req = new Request(`https://example.invalid${path}`, {
    method,
    ...(body === undefined ? {} : { body }),
  });
  Object.defineProperty(req, "headers", {
    value: { get: (name: string) => name.toLowerCase() === "host" ? host : null },
  });
  return req;
}

async function expectNoStore(res: Response): Promise<void> {
  expect(res.headers.get("Cache-Control")).toBe("no-store");
}

describe("isLoopbackCreationRequest", () => {
  it.each([
    "localhost",
    "localhost:0",
    "LOCALHOST:43233",
    "127.0.0.1",
    "127.0.0.1:43233",
    "[::1]",
    "[::1]:43233",
  ])("accepts loopback Host %s", (host) => {
    expect(isLoopbackCreationRequest(request("POST", "/api/projects", undefined, host))).toBe(true);
  });

  it.each([
    undefined,
    "host.tailnet.ts.net",
    "0.0.0.0:3000",
    "::1",
    "localhost:not-a-port",
    "localhost:3000:4000",
    "127.0.0.2",
    "[::1",
    "localhost.example.com",
  ])("rejects non-loopback or malformed Host %s", (host) => {
    const req = new Request("https://example.invalid/api/projects", {
      method: "POST",
      ...(host === undefined ? {} : { headers: { Host: host } }),
    });
    expect(isLoopbackCreationRequest(req)).toBe(false);
  });
});

describe("readBoundedJson", () => {
  it("parses JSON whose encoded body is exactly at the limit", async () => {
    const body = JSON.stringify({ value: "🙂" });
    const req = new Request("https://example.invalid", { method: "POST", body });

    await expect(readBoundedJson(req, Buffer.byteLength(body))).resolves.toEqual({
      value: "🙂",
    });
  });

  it("rejects JSON whose encoded body exceeds the limit", async () => {
    const body = JSON.stringify({ value: "🙂" });
    const req = new Request("https://example.invalid", { method: "POST", body });

    await expect(readBoundedJson(req, Buffer.byteLength(body) - 1)).rejects.toMatchObject({
      code: "limit_exceeded",
      httpStatus: 413,
    });
  });

  it("maps malformed JSON to an invalid request without echoing it", async () => {
    const req = new Request("https://example.invalid", {
      method: "POST",
      body: "private submitted text",
    });

    await expect(readBoundedJson(req, 100)).rejects.toMatchObject({
      code: "invalid_request",
      message: "Request body must be valid JSON.",
    });
  });
});

describe("createProjectHttpHandlers", () => {
  it("rejects a tailnet POST before reading JSON or calling create", async () => {
    let calls = 0;
    const handlers = createProjectHttpHandlers({
      ...fakeService(),
      create: async () => {
        calls += 1;
        throw new Error("unexpected");
      },
    });
    const req = request(
      "POST",
      "/api/projects",
      "not-json",
      "host.tailnet.ts.net",
    );
    const previousAllowedHosts = process.env.HTML_ANYTHING_ALLOWED_HOSTS;
    process.env.HTML_ANYTHING_ALLOWED_HOSTS = "host.tailnet.ts.net";
    let res: Response;
    try {
      res = await handlers.POST(req);
    } finally {
      if (previousAllowedHosts === undefined) {
        delete process.env.HTML_ANYTHING_ALLOWED_HOSTS;
      } else {
        process.env.HTML_ANYTHING_ALLOWED_HOSTS = previousAllowedHosts;
      }
    }

    expect(res.status).toBe(403);
    expect(calls).toBe(0);
    expect(req.bodyUsed).toBe(false);
    expect(await res.json()).toEqual({
      error: "loopback_required",
      message: "Project creation requires loopback access.",
    });
    await expectNoStore(res);
  });

  it.each([
    [true, 201],
    [false, 200],
  ])(
    "maps atomic created=%s to HTTP %i without a preflight GET",
    async (created, status) => {
      const service = fakeService({ created });
      service.get = vi.fn(async () => {
        throw new Error("HTTP must not probe before create");
      });
      const handlers = createProjectHttpHandlers(service);

      const res = await handlers.POST(
        request("POST", "/api/projects", JSON.stringify(validCreateInput())),
      );

      expect(res.status).toBe(status);
      expect(await res.json()).toEqual(readyResponse());
      expect(service.create).toHaveBeenCalledWith(validCreateInput());
      expect(service.get).not.toHaveBeenCalled();
      await expectNoStore(res);
    },
  );

  it("enforces the POST body ceiling", async () => {
    const service = fakeService();
    const handlers = createProjectHttpHandlers(service);
    const oversized = `"${"x".repeat(PROJECT_CREATE_BODY_MAX_BYTES)}"`;

    const res = await handlers.POST(request("POST", "/api/projects", oversized));

    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ error: "limit_exceeded" });
    expect(service.create).not.toHaveBeenCalled();
  });

  it("returns a project snapshot through promised route params", async () => {
    const handlers = createProjectHttpHandlers(fakeService({ snapshot: readySnapshot() }));
    const res = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}`),
      { params: Promise.resolve({ id: PROJECT_ID }) },
    );

    expect(res.status).toBe(200);
    expect((await res.json()).html).toContain("</html>");
    await expectNoStore(res);
  });

  it.each<[ProjectErrorCode, number]>([
    ["invalid_request", 400],
    ["loopback_required", 403],
    ["limit_exceeded", 413],
    ["project_exists", 409],
    ["project_not_found", 404],
    ["source_changed", 409],
    ["template_not_found", 400],
    ["generation_failed", 422],
    ["generation_timeout", 504],
    ["storage_failed", 500],
    ["configuration_missing", 500],
  ])("maps %s to HTTP %i", async (code, status) => {
    const service = fakeService({ snapshot: readySnapshot() });
    service.get = vi.fn(async () => {
      throw new ProjectError(code, "Safe message.");
    });
    const handlers = createProjectHttpHandlers(service);

    const res = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}`),
      { params: Promise.resolve({ id: PROJECT_ID }) },
    );

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: code, message: "Safe message." });
    await expectNoStore(res);
  });

  it("sanitizes unexpected errors", async () => {
    const service = fakeService({ snapshot: readySnapshot() });
    service.get = vi.fn(async () => {
      throw new Error("/private/workspace contains private submitted text");
    });
    const handlers = createProjectHttpHandlers(service);

    const res = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}`),
      { params: Promise.resolve({ id: PROJECT_ID }) },
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "storage_failed",
      message: "Project operation failed.",
    });
  });

  it.each(["short", "!!!!!!!!!!!!!!!!!!!!!!", "AbCdEfGhIjKlMnOpQrStU="])(
    "rejects invalid ID %s before GET service access",
    async (id) => {
      const service = fakeService({ snapshot: readySnapshot() });
      const handlers = createProjectHttpHandlers(service);

      const res = await handlers.GET(
        new Request(`https://host/api/projects/${encodeURIComponent(id)}`),
        { params: Promise.resolve({ id }) },
      );

      expect(res.status).toBe(400);
      expect(service.get).not.toHaveBeenCalled();
    },
  );

  it("rejects an invalid PATCH ID before reading the body or accessing the service", async () => {
    const service = fakeService();
    const handlers = createProjectHttpHandlers(service);
    const req = request("PATCH", "/api/projects/invalid", "not-json");

    const res = await handlers.PATCH(req, {
      params: Promise.resolve({ id: "invalid" }),
    });

    expect(res.status).toBe(400);
    expect(req.bodyUsed).toBe(false);
    expect(service.patch).not.toHaveBeenCalled();
  });

  it("rejects an invalid DELETE ID before accessing the service", async () => {
    const service = fakeService();
    const handlers = createProjectHttpHandlers(service);

    const res = await handlers.DELETE(
      new Request("https://host/api/projects/invalid", { method: "DELETE" }),
      { params: Promise.resolve({ id: "invalid" }) },
    );

    expect(res.status).toBe(400);
    expect(service.unregister).not.toHaveBeenCalled();
  });

  it("parses and applies PATCH through promised params", async () => {
    const service = fakeService();
    const handlers = createProjectHttpHandlers(service);
    const patch = { content: "updated", templateId: "document" };

    const res = await handlers.PATCH(
      request("PATCH", `/api/projects/${PROJECT_ID}`, JSON.stringify(patch)),
      { params: Promise.resolve({ id: PROJECT_ID }) },
    );

    expect(res.status).toBe(200);
    expect(service.patch).toHaveBeenCalledWith(PROJECT_ID, patch);
    expect(await res.json()).toEqual(readySnapshot());
    await expectNoStore(res);
  });

  it("enforces the PATCH body ceiling", async () => {
    const service = fakeService();
    const handlers = createProjectHttpHandlers(service);
    const oversized = `"${"x".repeat(PROJECT_PATCH_BODY_MAX_BYTES)}"`;

    const res = await handlers.PATCH(
      request("PATCH", `/api/projects/${PROJECT_ID}`, oversized),
      { params: Promise.resolve({ id: PROJECT_ID }) },
    );

    expect(res.status).toBe(413);
    expect(await res.json()).toMatchObject({ error: "limit_exceeded" });
    expect(service.patch).not.toHaveBeenCalled();
  });

  it("returns 204 for DELETE and 404 for a second delete", async () => {
    const service = fakeService();
    service.unregister = vi
      .fn<ProjectService["unregister"]>()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ProjectError("project_not_found", "Project was not found."));
    const handlers = createProjectHttpHandlers(service);
    const context = () => ({ params: Promise.resolve({ id: PROJECT_ID }) });

    const first = await handlers.DELETE(
      new Request(`https://host/api/projects/${PROJECT_ID}`, { method: "DELETE" }),
      context(),
    );
    const second = await handlers.DELETE(
      new Request(`https://host/api/projects/${PROJECT_ID}`, { method: "DELETE" }),
      context(),
    );

    expect(first.status).toBe(204);
    expect(await first.text()).toBe("");
    await expectNoStore(first);
    expect(second.status).toBe(404);
    expect(await second.json()).toMatchObject({ error: "project_not_found" });
    await expectNoStore(second);
  });
});
