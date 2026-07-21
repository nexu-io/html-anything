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
});
