import { createHash } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import {
  PROJECT_SOURCE_MAX_FILES,
  PROJECT_SOURCE_MAX_TOTAL_BYTES,
  ProjectError,
  type SourceRecord,
  validateSlug,
} from "./contracts";

export type ArtifactPaths = {
  workspaceRoot: string;
  artifactParent: string;
  artifactDirectory: string;
  promptPath: string;
  contentPath: string;
  projectPath: string;
  htmlPath: string;
};

const FORBIDDEN_SOURCE_CHARACTER = /[\\:<>"|?*\u0000-\u001f\u007f]/u;
const WINDOWS_DEVICE_BASENAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu;
const SENSITIVE_SEGMENTS = new Set([
  ".git",
  ".ssh",
  ".gnupg",
  ".aws",
  ".azure",
  ".kube",
  ".docker",
  "gcloud",
]);
const SENSITIVE_BASENAME = /^(?:\.env(?:\..*)?|credentials?|tokens?|secrets?)(?:\..*)?$/iu;
const PRIVATE_KEY_BASENAME = /^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\..*)?$/iu;
const SENSITIVE_EXTENSION = /\.(?:key|pem|p12|pfx|jks|keystore|crt|cer|der)$/iu;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export async function resolveWorkspaceRoot(value: unknown): Promise<string> {
  if (typeof value !== "string" || value.length === 0 || !path.isAbsolute(value)) {
    throw invalidPath("Workspace root must be an absolute path.");
  }
  await inspectAbsoluteSegments(value, false);
  try {
    const resolved = await realpath(value);
    await inspectAbsoluteSegments(resolved, false);
    const metadata = await lstat(resolved);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw invalidPath("Workspace root is not a real directory.");
    }
    return resolved;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw invalidPath("Workspace root is unavailable.");
  }
}

export async function resolveArtifactPaths(
  workspaceRoot: unknown,
  slug: unknown,
): Promise<ArtifactPaths> {
  const resolvedWorkspace = await resolveWorkspaceRoot(workspaceRoot);
  const validatedSlug = validateSlug(slug);
  const artifactParent = path.join(resolvedWorkspace, "artifacts", "html-anything");
  const artifactDirectory = path.join(artifactParent, validatedSlug);
  const result: ArtifactPaths = {
    workspaceRoot: resolvedWorkspace,
    artifactParent,
    artifactDirectory,
    promptPath: path.join(artifactDirectory, "PROMPT.md"),
    contentPath: path.join(artifactDirectory, "content.md"),
    projectPath: path.join(artifactDirectory, "project.json"),
    htmlPath: path.join(artifactDirectory, "index.html"),
  };

  await inspectContainedPath(resolvedWorkspace, artifactParent, "directory", true);
  const artifactExists = await inspectContainedPath(
    resolvedWorkspace,
    artifactDirectory,
    "directory",
    true,
  );
  if (artifactExists) {
    for (const namedPath of [
      result.promptPath,
      result.contentPath,
      result.projectPath,
      result.htmlPath,
    ]) {
      await inspectContainedPath(resolvedWorkspace, namedPath, "file", true);
    }
  }
  return result;
}

export async function validateSourceRecords(
  workspaceRoot: unknown,
  records: unknown,
): Promise<SourceRecord[]> {
  const resolvedWorkspace = await resolveWorkspaceRoot(workspaceRoot);
  const candidates = validateRecordShapes(records);
  const seen = new Set<string>();
  let declaredTotal = 0;

  for (const record of candidates) {
    validateSourcePath(record.path);
    if (seen.has(record.path)) {
      throw invalidPath("Duplicate source paths are not allowed.");
    }
    seen.add(record.path);
    declaredTotal += record.bytes;
    if (declaredTotal > PROJECT_SOURCE_MAX_TOTAL_BYTES) {
      throw limitExceeded("Source files exceed the total limit.");
    }
  }

  const canonical: SourceRecord[] = [];
  let actualTotal = 0;
  for (const record of candidates) {
    const sourcePath = path.join(resolvedWorkspace, ...record.path.split("/"));
    await inspectSourceSegments(resolvedWorkspace, record.path);
    const bytes = await readRegularFile(sourcePath);
    actualTotal += bytes.byteLength;
    if (actualTotal > PROJECT_SOURCE_MAX_TOTAL_BYTES) {
      throw limitExceeded("Source files exceed the total limit.");
    }
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw invalidPath("Source files must contain valid UTF-8.");
    }
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (record.bytes !== bytes.byteLength || record.sha256 !== sha256) {
      throw sourceChanged("A source file changed during validation.");
    }
    canonical.push({ path: record.path, bytes: bytes.byteLength, sha256 });
  }
  return canonical;
}

function validateRecordShapes(records: unknown): SourceRecord[] {
  if (!Array.isArray(records)) {
    throw invalidPath("Source records must be an array.");
  }
  if (records.length > PROJECT_SOURCE_MAX_FILES) {
    throw limitExceeded("Too many source files.");
  }
  return records.map((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw invalidPath("A source record is invalid.");
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (
      keys.length !== 3 ||
      !keys.includes("path") ||
      !keys.includes("bytes") ||
      !keys.includes("sha256") ||
      typeof record.path !== "string" ||
      typeof record.bytes !== "number" ||
      !Number.isSafeInteger(record.bytes) ||
      record.bytes < 0 ||
      typeof record.sha256 !== "string" ||
      !SHA256_PATTERN.test(record.sha256)
    ) {
      throw invalidPath("A source record is invalid.");
    }
    return {
      path: record.path,
      bytes: record.bytes,
      sha256: record.sha256,
    };
  });
}

function validateSourcePath(sourcePath: string): void {
  if (sourcePath.length === 0 || path.posix.isAbsolute(sourcePath)) {
    throw invalidPath("Source path must be POSIX-relative.");
  }
  const segments = sourcePath.split("/");
  for (const segment of segments) {
    if (
      segment.length === 0 ||
      segment === "." ||
      segment === ".." ||
      FORBIDDEN_SOURCE_CHARACTER.test(segment) ||
      segment.endsWith(" ") ||
      segment.endsWith(".")
    ) {
      throw invalidPath("Source path contains an unsafe segment.");
    }
    const lower = segment.toLowerCase();
    if (
      WINDOWS_DEVICE_BASENAME.test(segment) ||
      SENSITIVE_SEGMENTS.has(lower) ||
      SENSITIVE_BASENAME.test(segment) ||
      PRIVATE_KEY_BASENAME.test(segment) ||
      SENSITIVE_EXTENSION.test(segment)
    ) {
      throw invalidPath("Source path is not allowed.");
    }
  }
}

async function inspectSourceSegments(
  workspaceRoot: string,
  sourcePath: string,
): Promise<void> {
  let current = workspaceRoot;
  const segments = sourcePath.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let metadata;
    try {
      metadata = await lstat(current);
    } catch {
      throw sourceChanged("A source file is unavailable.");
    }
    if (metadata.isSymbolicLink()) {
      throw invalidPath("Source paths must not contain symlinks.");
    }
    if (index < segments.length - 1 && !metadata.isDirectory()) {
      throw sourceChanged("A source path segment is unavailable.");
    }
    if (index === segments.length - 1 && !metadata.isFile()) {
      throw sourceChanged("A source must be a regular file.");
    }
    let resolved;
    try {
      resolved = await realpath(current);
    } catch {
      throw sourceChanged("A source file is unavailable.");
    }
    if (!isContained(workspaceRoot, resolved)) {
      throw invalidPath("Source path escapes the workspace.");
    }
  }
}

async function readRegularFile(filePath: string): Promise<Buffer> {
  let handle;
  try {
    handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const metadata = await handle.stat();
    if (!metadata.isFile()) {
      throw sourceChanged("A source must be a regular file.");
    }
    return await handle.readFile();
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw sourceChanged("A source file could not be read.");
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function inspectAbsoluteSegments(
  absolutePath: string,
  allowMissing: boolean,
): Promise<boolean> {
  const root = path.parse(absolutePath).root;
  let current = root;
  const segments = absolutePath.slice(root.length).split(path.sep).filter(Boolean);
  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      current = path.dirname(current);
      continue;
    }
    current = path.join(current, segment);
    try {
      const metadata = await lstat(current);
      if (metadata.isSymbolicLink()) {
        throw invalidPath("Paths must not contain symlinks.");
      }
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      if (allowMissing && isMissingError(error)) return false;
      throw invalidPath("Path is unavailable.");
    }
  }
  return true;
}

async function inspectContainedPath(
  workspaceRoot: string,
  candidate: string,
  expected: "directory" | "file",
  allowMissing: boolean,
): Promise<boolean> {
  if (!isContained(workspaceRoot, candidate)) {
    throw invalidPath("Path escapes the workspace.");
  }
  const exists = await inspectAbsoluteSegments(candidate, allowMissing);
  if (!exists) return false;
  try {
    const metadata = await lstat(candidate);
    if (
      metadata.isSymbolicLink() ||
      (expected === "directory" ? !metadata.isDirectory() : !metadata.isFile())
    ) {
      throw invalidPath(`Existing artifact ${expected} is invalid.`);
    }
    const resolved = await realpath(candidate);
    if (!isContained(workspaceRoot, resolved)) {
      throw invalidPath("Artifact path escapes the workspace.");
    }
    return true;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    if (allowMissing && isMissingError(error)) return false;
    throw invalidPath("Artifact path is unavailable.");
  }
}

function isContained(workspaceRoot: string, candidate: string): boolean {
  return (
    candidate === workspaceRoot ||
    candidate.startsWith(`${workspaceRoot}${path.sep}`)
  );
}

function isMissingError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function invalidPath(message: string): ProjectError {
  return new ProjectError("invalid_request", message);
}

function sourceChanged(message: string): ProjectError {
  return new ProjectError("source_changed", message);
}

function limitExceeded(message: string): ProjectError {
  return new ProjectError("limit_exceeded", message);
}
