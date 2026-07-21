export const PROJECT_NAME_MAX_CODE_POINTS = 120;
export const PROJECT_SLUG_MAX_LENGTH = 48;
export const PROJECT_INSTRUCTION_MAX_BYTES = 65_536;
export const PROJECT_CONTENT_MAX_BYTES = 1_048_576;
export const PROJECT_PROMPT_MAX_BYTES = 2_097_152;
export const PROJECT_HTML_MAX_BYTES = 8_388_608;
export const PROJECT_DIAGNOSTIC_MAX_BYTES = 4_096;
export const PROJECT_SOURCE_MAX_FILES = 10;
export const PROJECT_SOURCE_MAX_TOTAL_BYTES = 262_144;
export const PROJECT_CREATE_BODY_MAX_BYTES = 3_500_000;
export const PROJECT_PATCH_BODY_MAX_BYTES = 9_500_000;
export const PROJECT_GENERATION_DEADLINE_MS = 15 * 60 * 1_000;
export const PROJECT_AUTOSAVE_DELAY_MS = 750;

export type ProjectStatus = "generating" | "ready" | "failed";

export type SourceRecord = {
  path: string;
  bytes: number;
  sha256: string;
};

export type CreateProjectInput = {
  projectId: string;
  workspaceRoot: string;
  slug: string;
  name: string;
  instruction: string;
  content: string;
  sourceFiles: SourceRecord[];
  templateId: string;
  format: string;
  agent: string;
  model?: string;
};

export type ProjectDocument = {
  schemaVersion: 1;
  projectId: string;
  slug: string;
  name: string;
  instruction: string;
  templateId: string;
  format: string;
  agent: string;
  model?: string;
  sources: SourceRecord[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  diagnostic?: string;
};

export type RegistryRecord = {
  schemaVersion: 1;
  projectId: string;
  workspaceRoot: string;
  artifactDirectory: string;
  registeredAt: string;
};

export type ProjectSnapshot = {
  project: ProjectDocument;
  content: string;
  html: string;
  url: string;
  artifactDirectory: string;
};

export type PatchProjectInput = {
  content?: string;
  html?: string;
  templateId?: string;
};

export type ReadyProjectResponse = {
  status: "ready";
  projectId: string;
  url: string;
  artifactDirectory: string;
  sourcePaths: string[];
};

export type ProjectErrorCode =
  | "invalid_request"
  | "loopback_required"
  | "limit_exceeded"
  | "project_exists"
  | "project_not_found"
  | "source_changed"
  | "template_not_found"
  | "generation_failed"
  | "generation_timeout"
  | "storage_failed"
  | "configuration_missing";

export const PROJECT_ERROR_HTTP_STATUS = {
  invalid_request: 400,
  loopback_required: 403,
  limit_exceeded: 413,
  project_exists: 409,
  project_not_found: 404,
  source_changed: 409,
  template_not_found: 400,
  generation_failed: 422,
  generation_timeout: 504,
  storage_failed: 500,
  configuration_missing: 500,
} as const satisfies Record<ProjectErrorCode, number>;

export class ProjectError extends Error {
  readonly code: ProjectErrorCode;
  readonly httpStatus: number;

  constructor(code: ProjectErrorCode, message: string) {
    super(message);
    this.name = "ProjectError";
    this.code = code;
    this.httpStatus = PROJECT_ERROR_HTTP_STATUS[code];
  }
}

const CREATE_KEYS = new Set([
  "projectId",
  "workspaceRoot",
  "slug",
  "name",
  "instruction",
  "content",
  "sourceFiles",
  "templateId",
  "format",
  "agent",
  "model",
]);
const PATCH_KEYS = new Set(["content", "html", "templateId"]);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const FORMAT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,31}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CONTROL_PATTERN = /[\u0000-\u001f\u007f]/u;
const encoder = new TextEncoder();

export function parseCreateProjectInput(value: unknown): CreateProjectInput {
  const record = requireExactRecord(value, CREATE_KEYS, "creation request");
  const projectId = validateProjectId(record.projectId);
  const workspaceRoot = requireNonemptyString(record.workspaceRoot, "workspaceRoot");
  const slug = validateSlug(record.slug);
  const name = requireControlledString(
    record.name,
    "name",
    PROJECT_NAME_MAX_CODE_POINTS,
    false,
  );
  const instruction = requireBoundedText(
    record.instruction,
    "instruction",
    PROJECT_INSTRUCTION_MAX_BYTES,
    false,
  );
  const content = requireBoundedText(
    record.content,
    "content",
    PROJECT_CONTENT_MAX_BYTES,
    false,
  );
  const sourceFiles = parseSourceRecords(record.sourceFiles);
  const templateId = requirePattern(record.templateId, "templateId", IDENTIFIER_PATTERN);
  const format = requirePattern(record.format, "format", FORMAT_PATTERN);
  const agent = requirePattern(record.agent, "agent", IDENTIFIER_PATTERN);

  const result: CreateProjectInput = {
    projectId,
    workspaceRoot,
    slug,
    name,
    instruction,
    content,
    sourceFiles,
    templateId,
    format,
    agent,
  };
  if (Object.hasOwn(record, "model")) {
    result.model = requireControlledString(record.model, "model", 120, false);
  }
  return result;
}

export function parsePatchProjectInput(value: unknown): PatchProjectInput {
  const record = requireExactRecord(value, PATCH_KEYS, "project patch");
  if (Object.keys(record).length === 0) {
    throw invalidRequest("Project patch must not be empty.");
  }

  const result: PatchProjectInput = {};
  if (Object.hasOwn(record, "content")) {
    result.content = requireBoundedText(
      record.content,
      "content",
      PROJECT_CONTENT_MAX_BYTES,
      true,
    );
  }
  if (Object.hasOwn(record, "html")) {
    result.html = requireBoundedText(
      record.html,
      "html",
      PROJECT_HTML_MAX_BYTES,
      true,
    );
  }
  if (Object.hasOwn(record, "templateId")) {
    result.templateId = requirePattern(record.templateId, "templateId", IDENTIFIER_PATTERN);
  }
  return result;
}

export function validateProjectId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(value)) {
    throw invalidRequest("Project ID is invalid.");
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.byteLength !== 16 || decoded.toString("base64url") !== value) {
    throw invalidRequest("Project ID is invalid.");
  }
  return value;
}

export function validateSlug(value: unknown): string {
  if (
    typeof value !== "string" ||
    !new RegExp(`^[a-z0-9-]{1,${PROJECT_SLUG_MAX_LENGTH}}$`).test(value)
  ) {
    throw invalidRequest("Project slug is invalid.");
  }
  return value;
}

function parseSourceRecords(value: unknown): SourceRecord[] {
  if (!Array.isArray(value)) {
    throw invalidRequest("sourceFiles must be an array.");
  }
  if (value.length > PROJECT_SOURCE_MAX_FILES) {
    throw new ProjectError("limit_exceeded", "Too many source files.");
  }

  let totalBytes = 0;
  return value.map((item) => {
    const record = requireExactRecord(
      item,
      new Set(["path", "bytes", "sha256"]),
      "source record",
    );
    const sourcePath = requireNonemptyString(record.path, "source path");
    if (
      typeof record.bytes !== "number" ||
      !Number.isSafeInteger(record.bytes) ||
      record.bytes < 0
    ) {
      throw invalidRequest("Source byte length is invalid.");
    }
    if (typeof record.sha256 !== "string" || !SHA256_PATTERN.test(record.sha256)) {
      throw invalidRequest("Source fingerprint is invalid.");
    }
    totalBytes += record.bytes;
    if (totalBytes > PROJECT_SOURCE_MAX_TOTAL_BYTES) {
      throw new ProjectError("limit_exceeded", "Source files exceed the total limit.");
    }
    return { path: sourcePath, bytes: record.bytes, sha256: record.sha256 };
  });
}

function requireExactRecord(
  value: unknown,
  allowedKeys: ReadonlySet<string>,
  label: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidRequest(`The ${label} is invalid.`);
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw invalidRequest(`The ${label} contains unsupported fields.`);
  }
  return record;
}

function requireNonemptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw invalidRequest(`${label} must be a nonempty string.`);
  }
  return value;
}

function requireControlledString(
  value: unknown,
  label: string,
  maxCodePoints: number,
  allowEmpty: boolean,
): string {
  if (
    typeof value !== "string" ||
    (!allowEmpty && value.length === 0) ||
    CONTROL_PATTERN.test(value)
  ) {
    throw invalidRequest(`${label} is invalid.`);
  }
  if (Array.from(value).length > maxCodePoints) {
    throw new ProjectError("limit_exceeded", `${label} exceeds its limit.`);
  }
  return value;
}

function requireBoundedText(
  value: unknown,
  label: string,
  maxBytes: number,
  allowEmpty: boolean,
): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw invalidRequest(`${label} must be a${allowEmpty ? "" : " nonempty"} string.`);
  }
  if (encoder.encode(value).byteLength > maxBytes) {
    throw new ProjectError("limit_exceeded", `${label} exceeds its byte limit.`);
  }
  return value;
}

function requirePattern(value: unknown, label: string, pattern: RegExp): string {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw invalidRequest(`${label} is invalid.`);
  }
  return value;
}

function invalidRequest(message: string): ProjectError {
  return new ProjectError("invalid_request", message);
}
