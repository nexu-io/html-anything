import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceRecord } from "../contracts";
import { ProjectError } from "../contracts";
import {
  resolveArtifactPaths,
  resolveWorkspaceRoot,
  validateSourceRecords,
} from "../paths";

type OpenedFile = Awaited<ReturnType<typeof import("node:fs/promises").open>>;

const digest = (value: Uint8Array | string) =>
  createHash("sha256").update(value).digest("hex");

describe("project paths", () => {
  let temporaryDirectory: string;
  let workspaceRoot: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "html-anything-paths-"));
    workspaceRoot = path.join(temporaryDirectory, "workspace");
    await mkdir(workspaceRoot);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await chmod(temporaryDirectory, 0o700).catch(() => undefined);
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("resolves a real directory and rejects relative or symlinked workspaces", async () => {
    await expect(resolveWorkspaceRoot(workspaceRoot)).resolves.toBe(
      await realpath(workspaceRoot),
    );
    await expect(resolveWorkspaceRoot("relative/workspace")).rejects.toBeInstanceOf(
      ProjectError,
    );

    const linkedWorkspace = path.join(temporaryDirectory, "linked-workspace");
    await symlink(workspaceRoot, linkedWorkspace);
    await expect(resolveWorkspaceRoot(linkedWorkspace)).rejects.toBeInstanceOf(
      ProjectError,
    );
  });

  it("computes canonical artifact paths without creating them", async () => {
    const result = await resolveArtifactPaths(workspaceRoot, "q2-report");

    expect(result).toEqual({
      workspaceRoot: await realpath(workspaceRoot),
      artifactParent: path.join(workspaceRoot, "artifacts", "html-anything"),
      artifactDirectory: path.join(
        workspaceRoot,
        "artifacts",
        "html-anything",
        "q2-report",
      ),
      promptPath: path.join(
        workspaceRoot,
        "artifacts",
        "html-anything",
        "q2-report",
        "PROMPT.md",
      ),
      contentPath: path.join(
        workspaceRoot,
        "artifacts",
        "html-anything",
        "q2-report",
        "content.md",
      ),
      projectPath: path.join(
        workspaceRoot,
        "artifacts",
        "html-anything",
        "q2-report",
        "project.json",
      ),
      htmlPath: path.join(
        workspaceRoot,
        "artifacts",
        "html-anything",
        "q2-report",
        "index.html",
      ),
    });
    await expect(
      lstat(path.join(workspaceRoot, "artifacts")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects symlinks in existing artifact segments and named files", async () => {
    const outside = path.join(temporaryDirectory, "outside");
    await mkdir(outside);
    await symlink(outside, path.join(workspaceRoot, "artifacts"));
    await expect(
      resolveArtifactPaths(workspaceRoot, "q2-report"),
    ).rejects.toBeInstanceOf(ProjectError);

    await rm(path.join(workspaceRoot, "artifacts"));
    const artifactDirectory = path.join(
      workspaceRoot,
      "artifacts",
      "html-anything",
      "q2-report",
    );
    await mkdir(artifactDirectory, { recursive: true });
    const outsideFile = path.join(outside, "outside.md");
    await writeFile(outsideFile, "outside");
    await symlink(outsideFile, path.join(artifactDirectory, "PROMPT.md"));
    await expect(
      resolveArtifactPaths(workspaceRoot, "q2-report"),
    ).rejects.toBeInstanceOf(ProjectError);
  });

  it("re-reads safe Unicode source records and returns canonical fingerprints", async () => {
    const bytes = Buffer.from("héllo\n", "utf8");
    await mkdir(path.join(workspaceRoot, "资料"));
    await writeFile(path.join(workspaceRoot, "资料", "résumé.md"), bytes);
    const record = {
      path: "资料/résumé.md",
      bytes: bytes.byteLength,
      sha256: digest(bytes),
    };

    await expect(validateSourceRecords(workspaceRoot, [record])).resolves.toEqual([
      record,
    ]);
  });

  it.each([
    "/absolute.md",
    "",
    ".",
    "..",
    "a//b.md",
    "a/./b.md",
    "a/../b.md",
    "a\\b.md",
    "drive:c.md",
    "bad<name.md",
    "bad>name.md",
    'bad"name.md',
    "bad|name.md",
    "bad?name.md",
    "bad*name.md",
    "bad\u0000name.md",
    "bad\u007fname.md",
    "trailing-space ",
    "trailing-dot.",
  ])("rejects unsafe source syntax: %s", async (sourcePath) => {
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor(sourcePath)]),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it.each([
    ".git/config",
    "nested/.SSH/config",
    ".gnupg/pubring.kbx",
    ".aws/config",
    ".azure/config",
    ".kube/config",
    ".docker/config.json",
    "gcloud/configurations/config_default",
    ".env",
    "config/.ENV.local",
    "credentials.json",
    "credential.txt",
    "token.json",
    "tokens.backup",
    "secret.txt",
    "secrets.yaml",
    "id_rsa",
    "id_ed25519.pub",
    "tls/server.KEY",
    "tls/client.pem",
    "tls/bundle.p12",
    "tls/bundle.pfx",
    "tls/store.jks",
    "tls/store.keystore",
    "tls/server.crt",
    "tls/server.cer",
    "tls/server.der",
    "CON",
    "prn.txt",
    "AUX.json",
    "nul.md",
    "COM1.log",
    "com9.log",
    "LPT1",
    "lpt9.txt",
  ])("rejects sensitive or reserved source paths: %s", async (sourcePath) => {
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor(sourcePath)]),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("rejects duplicate paths before reading them", async () => {
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor("a.md"), recordFor("a.md")]),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("rejects source count and declared aggregate limits", async () => {
    await expect(
      validateSourceRecords(
        workspaceRoot,
        Array.from({ length: 11 }, (_, index) => recordFor(`f${index}.md`)),
      ),
    ).rejects.toMatchObject({ code: "limit_exceeded" });
    await expect(
      validateSourceRecords(workspaceRoot, [
        { ...recordFor("large.md"), bytes: 262_145 },
      ]),
    ).rejects.toMatchObject({ code: "limit_exceeded" });
  });

  it("rejects symlinks at intermediate and file source segments", async () => {
    const outsideDirectory = path.join(temporaryDirectory, "outside");
    await mkdir(outsideDirectory);
    await writeFile(path.join(outsideDirectory, "source.md"), "safe");
    await symlink(outsideDirectory, path.join(workspaceRoot, "linked"));
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor("linked/source.md")]),
    ).rejects.toMatchObject({ code: "invalid_request" });

    await symlink(
      path.join(outsideDirectory, "source.md"),
      path.join(workspaceRoot, "linked-file.md"),
    );
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor("linked-file.md")]),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });

  it("rejects missing, non-regular, unreadable UTF-8, and changed sources", async () => {
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor("missing.md")]),
    ).rejects.toMatchObject({ code: "source_changed" });

    await mkdir(path.join(workspaceRoot, "directory.md"));
    await expect(
      validateSourceRecords(workspaceRoot, [recordFor("directory.md")]),
    ).rejects.toMatchObject({ code: "source_changed" });

    const invalidUtf8 = Uint8Array.from([0xc3, 0x28]);
    await writeFile(path.join(workspaceRoot, "invalid.md"), invalidUtf8);
    await expect(
      validateSourceRecords(workspaceRoot, [
        {
          path: "invalid.md",
          bytes: invalidUtf8.byteLength,
          sha256: digest(invalidUtf8),
        },
      ]),
    ).rejects.toMatchObject({ code: "invalid_request" });

    await writeFile(path.join(workspaceRoot, "changed.md"), "new");
    await expect(
      validateSourceRecords(workspaceRoot, [
        { path: "changed.md", bytes: 3, sha256: digest("old") },
      ]),
    ).rejects.toMatchObject({ code: "source_changed" });
    await expect(
      validateSourceRecords(workspaceRoot, [
        { path: "changed.md", bytes: 4, sha256: digest("new") },
      ]),
    ).rejects.toMatchObject({ code: "source_changed" });
  });

  it("does not mutate source files while validating them", async () => {
    const filePath = path.join(workspaceRoot, "source.md");
    await writeFile(filePath, "safe");
    const before = await readFile(filePath);

    await validateSourceRecords(workspaceRoot, [
      { path: "source.md", bytes: before.byteLength, sha256: digest(before) },
    ]);

    await expect(readFile(filePath)).resolves.toEqual(before);
  });

  it("rejects an oversized actual file before an unbounded read", async () => {
    const sourcePath = path.join(workspaceRoot, "oversized.md");
    await writeFile(sourcePath, Buffer.alloc(262_145, "x"));
    const prototype = await fileHandlePrototype(sourcePath);
    const unboundedRead = vi
      .spyOn(prototype, "readFile")
      .mockRejectedValue(new Error("unbounded read attempted"));

    await expect(
      validateSourceRecords(workspaceRoot, [
        { path: "oversized.md", bytes: 1, sha256: digest("x") },
      ]),
    ).rejects.toMatchObject({ code: "limit_exceeded" });
    expect(unboundedRead).not.toHaveBeenCalled();
  });

  it("rejects a source when an ancestor is swapped after open", async () => {
    const sourceDirectory = path.join(workspaceRoot, "docs");
    const parkedDirectory = path.join(workspaceRoot, "docs-parked");
    const outsideDirectory = path.join(temporaryDirectory, "outside-swap");
    await mkdir(sourceDirectory);
    await mkdir(outsideDirectory);
    await writeFile(path.join(sourceDirectory, "source.md"), "same bytes");
    await writeFile(path.join(outsideDirectory, "source.md"), "same bytes");
    const bytes = Buffer.from("same bytes");
    const prototype = await fileHandlePrototype(
      path.join(sourceDirectory, "source.md"),
    );
    const originalStat = prototype.stat;
    let swapped = false;
    vi.spyOn(prototype, "stat").mockImplementation(async function (
      this: OpenedFile,
      ...arguments_: unknown[]
    ) {
      if (!swapped) {
        swapped = true;
        await rename(sourceDirectory, parkedDirectory);
        await symlink(outsideDirectory, sourceDirectory, "dir");
      }
      return Reflect.apply(originalStat, this, arguments_);
    });

    await expect(
      validateSourceRecords(workspaceRoot, [
        { path: "docs/source.md", bytes: bytes.byteLength, sha256: digest(bytes) },
      ]),
    ).rejects.toMatchObject({ code: "invalid_request" });
    expect(swapped).toBe(true);
  });

  it("supports root workspace containment for a test-owned source", async () => {
    const filePath = path.join(workspaceRoot, "root-contained.md");
    const bytes = Buffer.from("root-contained");
    await writeFile(filePath, bytes);
    const sourcePath = path.relative(path.parse(filePath).root, filePath).split(path.sep).join("/");

    await expect(
      validateSourceRecords(path.parse(filePath).root, [
        { path: sourcePath, bytes: bytes.byteLength, sha256: digest(bytes) },
      ]),
    ).resolves.toEqual([
      { path: sourcePath, bytes: bytes.byteLength, sha256: digest(bytes) },
    ]);
  });
});

function recordFor(sourcePath: string): SourceRecord {
  return { path: sourcePath, bytes: 0, sha256: "a".repeat(64) };
}

async function fileHandlePrototype(filePath: string) {
  const handle = await open(filePath, "r");
  const prototype = Object.getPrototypeOf(handle) as OpenedFile;
  await handle.close();
  return prototype;
}
