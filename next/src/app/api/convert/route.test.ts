import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectError } from "@/lib/projects/contracts";

vi.mock("@/lib/agents/invoke", () => ({ invokeAgent: vi.fn() }));
vi.mock("@/lib/templates/loader", () => ({
  loadSkill: vi.fn(() => ({
    body: "template body",
    zhName: "Template",
    aspectHint: "16:9",
  })),
}));
vi.mock("@/lib/templates/shared", () => ({
  assemblePrompt: vi.fn(() => "assembled prompt"),
}));
vi.mock("@/lib/projects/service", () => ({
  projectService: { resolveConversionContext: vi.fn() },
}));

import { invokeAgent } from "@/lib/agents/invoke";
import { projectService } from "@/lib/projects/service";
import { assemblePrompt } from "@/lib/templates/shared";
import { POST } from "./route";

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";

function request(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: "codex",
      templateId: "landing-page",
      content: "Build it",
      ...body,
    }),
  });
}

beforeEach(() => {
  vi.mocked(invokeAgent).mockReset();
  vi.mocked(invokeAgent).mockReturnValue(
    new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
  );
  vi.mocked(projectService.resolveConversionContext).mockReset();
  vi.mocked(assemblePrompt).mockClear();
});

describe("project conversion workspace resolution", () => {
  it("uses the registered workspace and initial instruction", async () => {
    vi.mocked(projectService.resolveConversionContext).mockResolvedValue({
      cwd: "/registered/workspace",
      instruction: "Keep the original product requirements",
      artifactDirectory:
        "/registered/workspace/artifacts/html-anything/demo",
    });

    const response = await POST(
      request({ projectId: PROJECT_ID, cwd: "/client/supplied" }),
    );

    expect(response.status).toBe(200);
    expect(projectService.resolveConversionContext).toHaveBeenCalledWith(
      PROJECT_ID,
    );
    expect(assemblePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        projectInstruction: expect.stringContaining(
          "Keep the original product requirements",
        ),
      }),
    );
    expect(assemblePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        projectInstruction: expect.stringContaining(
          "/registered/workspace/artifacts/html-anything/demo",
        ),
      }),
    );
    expect(invokeAgent).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: "/registered/workspace" }),
    );
  });

  it("keeps the initial instruction in project diff-edit prompts", async () => {
    vi.mocked(projectService.resolveConversionContext).mockResolvedValue({
      cwd: "/registered/workspace",
      instruction: "Keep the original product requirements",
      artifactDirectory:
        "/registered/workspace/artifacts/html-anything/demo",
    });

    const response = await POST(
      request({
        projectId: PROJECT_ID,
        editFromContent: "Old content",
        editFromHtml: "<html><body>Old</body></html>",
      }),
    );

    expect(response.status).toBe(200);
    expect(invokeAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(
          "Keep the original product requirements",
        ),
      }),
    );
    expect(invokeAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(
          "/registered/workspace/artifacts/html-anything/demo",
        ),
      }),
    );
  });

  it("does not invoke an agent when project resolution fails", async () => {
    vi.mocked(projectService.resolveConversionContext).mockRejectedValue(
      new ProjectError("project_not_found", "Project was not found."),
    );

    const response = await POST(request({ projectId: PROJECT_ID }));

    expect(response.status).toBe(404);
    expect(invokeAgent).not.toHaveBeenCalled();
  });
});
