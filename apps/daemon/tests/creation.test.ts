import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Workspace } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { listGuidance, readGuidance } from "@/content/guidance.js";
import { Templates } from "@/content/templates.js";
import { schemas } from "@/contract.js";

it("creates independent exact-version projects, retains original receipts after edits/reopen and never switches selection", async () => {
  const root = await mkdtemp(join(tmpdir(), "template-create-"));
  let workspace = new Workspace(root);
  try {
    let templates = new Templates(workspace);
    const session = workspace.execute("session_create", {
        requestId: randomUUID(),
        title: "Templates",
        mode: "motion",
      }),
      catalog = templates.execute("template_list", {});
    const before = workspace.execute("workspace_state", {}).selection;
    const created = [];
    for (const template of catalog.templates) {
      const input = {
        requestId: randomUUID(),
        sessionId: session.id,
        title: template.title,
        id: template.id,
        contentHash: template.contentHash,
      };
      const artifact = templates.execute("template_create", input),
        owner = { sessionId: session.id, artifactId: artifact.id },
        project = workspace.execute("project_read", owner);
      expect(templates.execute("template_create", input)).toEqual(artifact);
      const saved = workspace.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: project.revision,
        files: project.files.map((file) => ({
          ...file,
          content: file.path === "index.html" ? file.content.replace("<title>", "<title>Edited ") : file.content,
        })),
      });
      expect(templates.execute("template_create", input)).toEqual(artifact);
      expect(workspace.execute("project_read", owner).revision).toBe(saved.revision);
      expect(() => templates.execute("template_create", { ...input, title: "different intent" })).toThrow("requestId");
      expect(() =>
        templates.execute("template_create", { ...input, requestId: randomUUID(), sessionId: randomUUID() }),
      ).toThrow();
      expect(() =>
        templates.execute("template_create", {
          ...input,
          requestId: randomUUID(),
          contentHash: `sha256:${"0".repeat(64)}`,
        }),
      ).toThrow("changed");
      created.push({ artifact, input, saved });
    }
    expect(workspace.execute("workspace_state", {}).selection).toEqual(before);
    expect(new Set(created.map((entry) => entry.artifact.projectId)).size).toBe(3);
    workspace.close();
    workspace = new Workspace(root);
    templates = new Templates(workspace);
    for (const entry of created) {
      expect(templates.execute("template_create", entry.input)).toEqual(entry.artifact);
      expect(workspace.execute("project_read", { sessionId: session.id, artifactId: entry.artifact.id })).toEqual(
        entry.saved,
      );
    }
  } finally {
    workspace.close();
    await rm(root, { recursive: true, force: true });
  }
});
it("returns complete versioned guidance from a finite resource graph without paths or legacy operation aliases", () => {
  const resources = listGuidance();
  expect(resources.slice(0, 4).map((entry) => entry.name)).toEqual([
    "production",
    "native",
    "templates",
    "verification",
  ]);
  for (const entry of resources) {
    const result = readGuidance(entry.uri);
    for (const operation of result.content.match(
      /\b(?:workspace|session|message|artifact|project|resource|export|template|motion)_[a-z_]+\b/g,
    ) ?? []) {
      expect(Object.hasOwn(schemas, operation)).toBe(true);
    }
    expect(result.contentHash).toBe(`sha256:${createHash("sha256").update(result.content).digest("hex")}`);
    expect(result.contentHash).toBe(entry.contentHash);
    for (const reference of result.references) expect(resources.some((entry) => entry.uri === reference)).toBe(true);
  }
  expect(() => readGuidance("file:///etc/passwd")).toThrow("registered");
});
