import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectAsset, ProjectSnapshot } from "../contracts";
import {
  ProjectClientError,
  getServerProject,
  patchServerProject,
  unregisterServerProject,
  uploadProjectAsset,
} from "../client";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";

function uploadedAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
  return {
    path: "assets/hero-final.png",
    filename: "hero-final.png",
    originalName: "Hero final #1.PNG",
    bytes: 21,
    mediaType: "image/png",
    ...overrides,
  };
}

function readySnapshot(): ProjectSnapshot {
  return {
    project: {
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
    },
    content: "# Demo",
    html: "<!doctype html><html><body>ready</body></html>",
    url: `https://host.ts.net/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/demo",
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("project browser client", () => {
  it("gets a project snapshot without caching", async () => {
    const fetchMock = vi.fn(async () => Response.json(readySnapshot()));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getServerProject(PROJECT_ID)).resolves.toEqual(readySnapshot());
    expect(fetchMock).toHaveBeenCalledWith(`/api/projects/${PROJECT_ID}`, {
      cache: "no-store",
    });
  });

  it("patches only the supplied editable project fields", async () => {
    const fetchMock = vi.fn(async () => Response.json(readySnapshot()));
    vi.stubGlobal("fetch", fetchMock);
    const patch = {
      content: "changed",
      html: "<!doctype html><html><body>changed</body></html>",
      templateId: "article-magazine",
    };

    await expect(patchServerProject(PROJECT_ID, patch)).resolves.toEqual(
      readySnapshot(),
    );
    expect(fetchMock).toHaveBeenCalledWith(`/api/projects/${PROJECT_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  });

  it("unregisters a project without reading a response body", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(unregisterServerProject(PROJECT_ID)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(`/api/projects/${PROJECT_ID}`, {
      method: "DELETE",
    });
  });

  it("preserves a structured server error code and safe message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            error: "project_not_found",
            message: "Project was not found.",
          },
          { status: 404 },
        ),
      ),
    );

    await expect(getServerProject(PROJECT_ID)).rejects.toMatchObject({
      name: "ProjectClientError",
      code: "project_not_found",
      status: 404,
      message: "Project was not found.",
    });
  });

  it("does not expose unstructured response bodies or fetch errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("token=server-secret", { status: 500 }),
      )
      .mockRejectedValueOnce(new Error("token=browser-secret"));
    vi.stubGlobal("fetch", fetchMock);

    const responseError = await getServerProject(PROJECT_ID).catch(
      (error: unknown) => error,
    );
    const networkError = await getServerProject(PROJECT_ID).catch(
      (error: unknown) => error,
    );

    expect(responseError).toBeInstanceOf(ProjectClientError);
    expect(networkError).toBeInstanceOf(ProjectClientError);
    expect((responseError as Error).message).not.toContain("server-secret");
    expect((networkError as Error).message).not.toContain("browser-secret");
  });

  it("uploads one raw File body with an encoded original name and no retry", async () => {
    const asset = uploadedAsset();
    const file = new File([new Uint8Array(asset.bytes)], asset.originalName, {
      type: "image/png",
    });
    const fetchMock = vi.fn(async () => Response.json(asset, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadProjectAsset(PROJECT_ID, file)).resolves.toEqual(asset);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/projects/${PROJECT_ID}/assets?name=Hero%20final%20%231.PNG`,
      { method: "POST", body: file },
    );
  });

  it.each([
    ["mismatched path", uploadedAsset({ path: "assets/other.png" })],
    ["unsafe filename", uploadedAsset({ filename: "../hero.png", path: "assets/../hero.png" })],
    ["mismatched original name", uploadedAsset({ originalName: "Different.PNG" })],
    ["unsafe original name", uploadedAsset({ originalName: "../Hero.PNG" })],
    ["unknown media type", { ...uploadedAsset(), mediaType: "image/bmp" }],
    ["extension/media mismatch", uploadedAsset({ mediaType: "image/jpeg" })],
    ["zero bytes", uploadedAsset({ bytes: 0 })],
    ["fractional bytes", uploadedAsset({ bytes: 1.5 })],
    ["oversized bytes", uploadedAsset({ bytes: 10_485_761 })],
    ["extra field", { ...uploadedAsset(), privatePath: "/private/workspace" }],
  ])("rejects a successful response with %s", async (_label, body) => {
    const file = new File([new Uint8Array(21)], "Hero final #1.PNG", {
      type: "image/png",
    });
    const fetchMock = vi.fn(async () => Response.json(body, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadProjectAsset(PROJECT_ID, file).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ProjectClientError);
    expect(error).toMatchObject({
      status: 201,
      message: "Project server returned an invalid response.",
    });
    expect((error as Error).message).not.toContain("private/workspace");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose malformed success bodies and never retries", async () => {
    const file = new File([new Uint8Array(21)], "secret-name.PNG");
    const fetchMock = vi.fn(async () =>
      new Response("token=success-secret", {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadProjectAsset(PROJECT_ID, file).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ProjectClientError);
    expect((error as Error).message).toBe(
      "Project server returned an invalid response.",
    );
    expect((error as Error).message).not.toContain("success-secret");
    expect((error as Error).message).not.toContain("secret-name");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a valid asset body returned with a non-201 success status", async () => {
    const asset = uploadedAsset();
    const file = new File([new Uint8Array(asset.bytes)], asset.originalName);
    const fetchMock = vi.fn(async () => Response.json(asset, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadProjectAsset(PROJECT_ID, file)).rejects.toMatchObject({
      name: "ProjectClientError",
      status: 200,
      message: "Project server returned an invalid response.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["network", undefined],
    [
      "HTTP",
      Response.json(
        { error: "unknown_error", message: "token=server-secret" },
        { status: 500 },
      ),
    ],
  ])("keeps %s upload failures secret-safe and performs zero retries", async (_label, response) => {
    const file = new File([new Uint8Array(21)], "Hero.PNG");
    const fetchMock = response === undefined
      ? vi.fn(async () => {
          throw new Error("token=browser-secret");
        })
      : vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadProjectAsset(PROJECT_ID, file).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ProjectClientError);
    expect((error as Error).message).not.toContain("browser-secret");
    expect((error as Error).message).not.toContain("server-secret");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
