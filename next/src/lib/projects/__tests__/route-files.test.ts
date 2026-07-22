import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(process.cwd(), "src");

describe("project editor routes", () => {
  it("awaits project params and passes the ID to ProjectWorkspace", async () => {
    const source = await readFile(
      path.join(srcRoot, "app/projects/[id]/page.tsx"),
      "utf8",
    );

    expect(source).toContain('import { ProjectWorkspace } from "@/components/project-workspace"');
    expect(source).toContain("params: Promise<{ id: string }>");
    expect(source).toContain("const { id } = await params");
    expect(source).toContain("<ProjectWorkspace projectId={id} />");
  });

  it("keeps the root editor in browser-local mode", async () => {
    const source = await readFile(path.join(srcRoot, "app/page.tsx"), "utf8");

    expect(source).toContain('import { EditorWorkspace } from "@/components/editor-workspace"');
    expect(source).toContain("<EditorWorkspace />");
    expect(source).not.toContain("projectMode=");
  });

  it("threads project upload and preview props only from project mode", async () => {
    const [workspaceSource, editorSource, promptSource, previewSource] = await Promise.all([
      readFile(path.join(srcRoot, "components/editor-workspace.tsx"), "utf8"),
      readFile(path.join(srcRoot, "components/editor-pane.tsx"), "utf8"),
      readFile(path.join(srcRoot, "components/ai-prompt-bar.tsx"), "utf8"),
      readFile(path.join(srcRoot, "components/preview-pane.tsx"), "utf8"),
    ]);

    expect(workspaceSource).toContain("projectId={projectMode?.projectId}");
    expect(workspaceSource).toContain("localAutosaveEnabled={!projectMode}");
    expect(workspaceSource).toContain("assetBaseHref={");
    expect(workspaceSource).toContain(
      "`/api/projects/${encodeURIComponent(projectMode.projectId)}/`",
    );
    expect(workspaceSource).toContain(": undefined");
    expect(editorSource).toContain("localAutosaveEnabled = true");
    expect(editorSource).toContain("useAutosave(localAutosaveEnabled)");
    expect(editorSource).toContain("localAutosaveEnabled && hasContent");
    expect(editorSource).toContain(
      "const { ingest, uploading, error } = useUploadFile({ projectId })",
    );
    expect(editorSource).toContain("<AiPromptBar");
    expect(editorSource).toContain("ingest={ingest}");
    expect(editorSource).toContain("uploading={uploading}");
    expect(editorSource).toContain("error={error}");
    expect(editorSource).toContain("projectMode={projectId !== undefined}");
    expect(promptSource).not.toContain("useUploadFile");
    expect(promptSource).toContain(
      "accept={projectMode ? PROJECT_ACCEPT_TYPES : ACCEPT_TYPES}",
    );
    expect(promptSource).toContain("const PROJECT_ACCEPT_TYPES =");
    const projectAccept = promptSource.slice(
      promptSource.indexOf("const PROJECT_ACCEPT_TYPES ="),
      promptSource.indexOf(";", promptSource.indexOf("const PROJECT_ACCEPT_TYPES =")),
    );
    expect(projectAccept).toContain(".png,.jpg,.jpeg,.gif,.webp");
    expect(projectAccept).not.toContain(".svg");
    expect(previewSource).toContain("assetBaseHref?: string");
    expect(previewSource).toContain(
      "injectPreviewBase(previewHtml(debouncedHtml), assetBaseHref)",
    );
    expect(previewSource).toContain(
      "injectPreviewBase(cleaned, assetBaseHref)",
    );
    expect(previewSource).toContain("html={previewCleaned}");
  });

  it("defines bounded upload state messages in both dictionaries", async () => {
    const source = await readFile(path.join(srcRoot, "lib/i18n.ts"), "utf8");

    expect(source).toContain('"upload.uploading": "Uploading image…"');
    expect(source).toContain(
      '"upload.projectFailed": "Image upload failed. Try again."',
    );
    expect(source).toContain('"upload.uploading": "正在上传图片…"');
    expect(source).toContain(
      '"upload.projectFailed": "图片上传失败，请重试。"',
    );
  });
});

describe("project asset API routes", () => {
  it("delegates the collection POST through a Node force-dynamic handler", async () => {
    const source = await readFile(
      path.join(srcRoot, "app/api/projects/[id]/assets/route.ts"),
      "utf8",
    );

    expect(source).toContain(
      'import { createProjectAssetHttpHandlers } from "@/lib/projects/http"',
    );
    expect(source).toContain(
      'import { projectService } from "@/lib/projects/service"',
    );
    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain(
      "const handlers = createProjectAssetHttpHandlers(projectService)",
    );
    expect(source).toContain("export const POST = handlers.POST");
  });

  it("delegates the item GET through a Node force-dynamic handler", async () => {
    const source = await readFile(
      path.join(srcRoot, "app/api/projects/[id]/assets/[filename]/route.ts"),
      "utf8",
    );

    expect(source).toContain(
      'import { createProjectAssetHttpHandlers } from "@/lib/projects/http"',
    );
    expect(source).toContain(
      'import { projectService } from "@/lib/projects/service"',
    );
    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain(
      "const handlers = createProjectAssetHttpHandlers(projectService)",
    );
    expect(source).toContain("export const GET = handlers.GET");
  });

  it("awaits collection and item route params in the shared handlers", async () => {
    const source = await readFile(
      path.join(srcRoot, "lib/projects/http.ts"),
      "utf8",
    );

    expect(source).toContain('params: Promise<{ id: string }>');
    expect(source).toContain(
      'params: Promise<{ id: string; filename: string }>',
    );
    expect(source).toContain("const { id } = await context.params");
    expect(source).toContain(
      "const { id, filename } = await context.params",
    );
  });
});
