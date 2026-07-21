import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectSnapshot } from "../contracts";
import {
  ProjectClientError,
  getServerProject,
  patchServerProject,
  unregisterServerProject,
} from "../client";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";

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
});
