import { describe, expect, it, vi } from "vitest";
import {
  PROJECT_ASSET_MAX_BYTES,
  PROJECT_CREATE_BODY_MAX_BYTES,
  PROJECT_PATCH_BODY_MAX_BYTES,
  ProjectError,
  type CreateProjectInput,
  type ProjectDocument,
  type ProjectErrorCode,
  type ProjectAsset,
  type ProjectSnapshot,
  type ReadyProjectResponse,
} from "../contracts";
import {
  createProjectAssetHttpHandlers,
  createProjectHttpHandlers,
  isLoopbackCreationRequest,
  readBoundedBytes,
  readBoundedJson,
} from "../http";
import type { ProjectService } from "../service";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const COMPLETE_HTML = "<!doctype html><html><body>ready</body></html>";

function pngBytes(payload = 0x01, size = 21): Uint8Array {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.fill(payload, 8, size - 12);
  bytes.set([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ], size - 12);
  return bytes;
}

function projectAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
  return {
    path: "assets/hero.png",
    filename: "hero.png",
    originalName: "Hero.PNG",
    bytes: pngBytes().byteLength,
    mediaType: "image/png",
    ...overrides,
  };
}

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
    putAsset: vi.fn(async () => projectAsset()),
    getAsset: vi.fn(async () => ({
      asset: projectAsset({ originalName: "hero.png" }),
      bytes: pngBytes(),
    })),
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

function streamedRequest(
  body: ReadableStream<Uint8Array>,
  headers?: HeadersInit,
): Request {
  const req = new Request("https://example.invalid", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  if (headers !== undefined) {
    Object.defineProperty(req, "headers", { value: new Headers(headers) });
  }
  return req;
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
  it("rejects an oversized stream without pulling its remainder", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      encoder.encode('{"value":"'),
      encoder.encode("too large"),
      encoder.encode('"}'),
    ];
    let pulls = 0;
    let cancellations = 0;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          controller.enqueue(chunks[pulls]);
          pulls += 1;
          if (pulls === chunks.length) controller.close();
        },
        cancel() {
          cancellations += 1;
        },
      },
      { highWaterMark: 0 },
    );
    const req = streamedRequest(body);

    await expect(readBoundedJson(req, chunks[0].byteLength)).rejects.toMatchObject({
      code: "limit_exceeded",
      httpStatus: 413,
    });
    expect(pulls).toBe(2);
    expect(cancellations).toBe(1);
    expect(req.body?.locked).toBe(false);
  });

  it("rejects an oversized Content-Length before pulling the body", async () => {
    let pulls = 0;
    let cancellations = 0;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulls += 1;
          controller.enqueue(new TextEncoder().encode("{}"));
          controller.close();
        },
        cancel() {
          cancellations += 1;
        },
      },
      { highWaterMark: 0 },
    );
    const req = streamedRequest(body, { "Content-Length": "3" });

    expect(req.headers.get("content-length")).toBe("3");
    await expect(readBoundedJson(req, 2)).rejects.toMatchObject({
      code: "limit_exceeded",
      httpStatus: 413,
    });
    expect(pulls).toBe(0);
    expect(cancellations).toBe(1);
  });

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

describe("readBoundedBytes", () => {
  it("returns a raw stream whose byte length is exactly the limit", async () => {
    const bytes = pngBytes(0x02, PROJECT_ASSET_MAX_BYTES);
    const req = streamedRequest(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.subarray(0, 17));
        controller.enqueue(bytes.subarray(17));
        controller.close();
      },
    }), { "Content-Length": String(PROJECT_ASSET_MAX_BYTES) });

    const result = await readBoundedBytes(req, PROJECT_ASSET_MAX_BYTES);

    expect(result.byteLength).toBe(PROJECT_ASSET_MAX_BYTES);
    expect(result.subarray(0, 8)).toEqual(bytes.subarray(0, 8));
    expect(result.subarray(-12)).toEqual(bytes.subarray(-12));
    expect(req.body?.locked).toBe(false);
  });

  it("rejects a valid oversized Content-Length before pulling and cancels", async () => {
    let pulls = 0;
    let cancellations = 0;
    const req = streamedRequest(new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(pngBytes());
        controller.close();
      },
      cancel() {
        cancellations += 1;
      },
    }, { highWaterMark: 0 }), {
      "Content-Length": String(PROJECT_ASSET_MAX_BYTES + 1),
    });

    await expect(readBoundedBytes(req, PROJECT_ASSET_MAX_BYTES)).rejects.toMatchObject({
      code: "limit_exceeded",
      httpStatus: 413,
    });
    expect(pulls).toBe(0);
    expect(cancellations).toBe(1);
    expect(req.body?.locked).toBe(false);
  });

  it("cancels immediately on streamed overflow and releases the reader lock", async () => {
    let pulls = 0;
    let cancellations = 0;
    const req = streamedRequest(new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(Uint8Array.of(1, 2));
      },
      cancel() {
        cancellations += 1;
      },
    }, { highWaterMark: 0 }));

    await expect(readBoundedBytes(req, 3)).rejects.toMatchObject({
      code: "limit_exceeded",
      httpStatus: 413,
    });
    expect(pulls).toBe(2);
    expect(cancellations).toBe(1);
    expect(req.body?.locked).toBe(false);
  });
});

describe("createProjectAssetHttpHandlers", () => {
  it.each([
    ["invalid project ID", "invalid", "Hero.PNG"],
    ["missing name", PROJECT_ID, null],
    ["duplicate name", PROJECT_ID, "duplicate"],
    ["invalid name", PROJECT_ID, "../Hero.PNG"],
  ])("rejects %s before pulling the upload body", async (_label, id, name) => {
    let pulls = 0;
    let cancellations = 0;
    const service = fakeService();
    const handlers = createProjectAssetHttpHandlers(service);
    const query =
      name === null
        ? ""
        : name === "duplicate"
          ? "?name=Hero.PNG&name=Other.PNG"
          : `?name=${encodeURIComponent(name)}`;
    const req = new Request(
      `https://host/api/projects/${id}/assets${query}`,
      {
        method: "POST",
        body: new ReadableStream<Uint8Array>({
          pull(controller) {
            pulls += 1;
            controller.enqueue(pngBytes());
            controller.close();
          },
          cancel() {
            cancellations += 1;
          },
        }, { highWaterMark: 0 }),
        duplex: "half",
      } as RequestInit & { duplex: "half" },
    );

    const res = await handlers.POST(req, {
      params: Promise.resolve({ id }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_request" });
    expect(pulls).toBe(0);
    expect(cancellations).toBe(0);
    expect(req.bodyUsed).toBe(false);
    expect(service.putAsset).not.toHaveBeenCalled();
    await expectNoStore(res);
  });

  it("accepts an exact-limit raw upload from a non-loopback host", async () => {
    const bytes = pngBytes(0x03, PROJECT_ASSET_MAX_BYTES);
    const asset = projectAsset({ bytes: bytes.byteLength });
    const service = fakeService();
    let uploadedBytes: Uint8Array | undefined;
    service.putAsset = vi.fn(async (_id, _originalName, value) => {
      uploadedBytes = value;
      return asset;
    });
    const handlers = createProjectAssetHttpHandlers(service);
    const req = new Request(
      `https://host.tailnet.ts.net/api/projects/${PROJECT_ID}/assets?name=Hero.PNG`,
      {
        method: "POST",
        headers: {
          Host: "host.tailnet.ts.net",
          "Content-Length": String(PROJECT_ASSET_MAX_BYTES),
        },
        body: new Uint8Array(bytes),
      },
    );

    const res = await handlers.POST(req, {
      params: Promise.resolve({ id: PROJECT_ID }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(asset);
    expect(service.putAsset).toHaveBeenCalledTimes(1);
    expect(vi.mocked(service.putAsset).mock.calls[0]?.slice(0, 2)).toEqual([
      PROJECT_ID,
      "Hero.PNG",
    ]);
    expect(uploadedBytes?.byteLength).toBe(PROJECT_ASSET_MAX_BYTES);
    expect(uploadedBytes?.subarray(0, 8)).toEqual(bytes.subarray(0, 8));
    expect(uploadedBytes?.subarray(-12)).toEqual(bytes.subarray(-12));
    await expectNoStore(res);
  });

  it.each([
    ["empty", new Uint8Array(), new ProjectError("invalid_request", "Project asset is empty")],
    ["malformed", new TextEncoder().encode("private image bytes"), new ProjectError("invalid_request", "Unsupported project image")],
    ["overflow", new Uint8Array(PROJECT_ASSET_MAX_BYTES + 1), undefined],
  ])("maps %s upload failures to bounded envelopes", async (_label, bytes, serviceError) => {
    const service = fakeService();
    if (serviceError !== undefined) {
      service.putAsset = vi.fn(async () => {
        throw serviceError;
      });
    }
    const handlers = createProjectAssetHttpHandlers(service);
    const req = new Request(
      `https://host/api/projects/${PROJECT_ID}/assets?name=private-name.png`,
      { method: "POST", body: bytes },
    );

    const res = await handlers.POST(req, {
      params: Promise.resolve({ id: PROJECT_ID }),
    });
    const body = await res.text();

    expect(res.status).toBe(bytes.byteLength > PROJECT_ASSET_MAX_BYTES ? 413 : 400);
    expect(JSON.parse(body)).toMatchObject({
      error: bytes.byteLength > PROJECT_ASSET_MAX_BYTES
        ? "limit_exceeded"
        : "invalid_request",
    });
    expect(body).not.toContain("private image bytes");
    expect(body).not.toContain("private-name");
    await expectNoStore(res);
  });

  it("returns exact asset bytes and immutable response headers", async () => {
    const bytes = pngBytes(0x04);
    const asset = projectAsset({
      originalName: "hero.png",
      bytes: bytes.byteLength,
    });
    const service = fakeService();
    service.getAsset = vi.fn(async () => ({ asset, bytes }));
    const handlers = createProjectAssetHttpHandlers(service);

    const res = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}/assets/hero.png`),
      { params: Promise.resolve({ id: PROJECT_ID, filename: "hero.png" }) },
    );

    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Content-Length")).toBe(String(bytes.byteLength));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe(
      "private, max-age=31536000, immutable",
    );
    expect(service.getAsset).toHaveBeenCalledWith(PROJECT_ID, "hero.png");
  });

  it.each([
    ["invalid", "hero.png"],
    [PROJECT_ID, "../hero.png"],
  ])("rejects invalid GET params before service access", async (id, filename) => {
    const service = fakeService();
    const handlers = createProjectAssetHttpHandlers(service);

    const res = await handlers.GET(
      new Request(`https://host/api/projects/${id}/assets/${encodeURIComponent(filename)}`),
      { params: Promise.resolve({ id, filename }) },
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_request" });
    expect(service.getAsset).not.toHaveBeenCalled();
    await expectNoStore(res);
  });

  it("maps missing assets and unexpected read failures to bounded JSON", async () => {
    const service = fakeService();
    service.getAsset = vi
      .fn<ProjectService["getAsset"]>()
      .mockRejectedValueOnce(new ProjectError("project_not_found", "Project was not found."))
      .mockRejectedValueOnce(new Error("/private/workspace/secret.png"));
    const handlers = createProjectAssetHttpHandlers(service);
    const context = () => ({
      params: Promise.resolve({ id: PROJECT_ID, filename: "hero.png" }),
    });

    const missing = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}/assets/hero.png`),
      context(),
    );
    const failed = await handlers.GET(
      new Request(`https://host/api/projects/${PROJECT_ID}/assets/hero.png`),
      context(),
    );

    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({
      error: "project_not_found",
      message: "Project was not found.",
    });
    expect(failed.status).toBe(500);
    const failedBody = await failed.text();
    expect(JSON.parse(failedBody)).toEqual({
      error: "storage_failed",
      message: "Project operation failed.",
    });
    expect(failedBody).not.toContain("private/workspace");
    await expectNoStore(missing);
    await expectNoStore(failed);
  });
});

describe("createProjectHttpHandlers", () => {
  it("uses forgeable loopback Host authority only as a browser and accidental-ingress guard on the trusted tailnet", async () => {
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
