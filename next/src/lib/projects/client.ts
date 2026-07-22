import {
  PROJECT_ASSET_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_CODE_POINTS,
  PROJECT_ASSET_STEM_MAX_LENGTH,
  PROJECT_ERROR_HTTP_STATUS,
  type PatchProjectInput,
  type ProjectAsset,
  type ProjectAssetMediaType,
  type ProjectErrorCode,
  type ProjectSnapshot,
} from "./contracts";

type ProjectErrorResponse = {
  error?: unknown;
  message?: unknown;
};

const PROJECT_ASSET_KEYS = new Set([
  "path",
  "filename",
  "originalName",
  "bytes",
  "mediaType",
]);
const PROJECT_ASSET_MEDIA_TYPES = new Set<ProjectAssetMediaType>([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const PROJECT_ASSET_EXTENSION_MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
} as const satisfies Record<string, ProjectAssetMediaType>;
const PROJECT_ASSET_FILENAME_PATTERN =
  /^([a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?)\.(png|jpg|gif|webp)$/u;
const PROJECT_ASSET_DEVICE_STEM_PATTERN =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/u;
const encoder = new TextEncoder();

export class ProjectClientError extends Error {
  readonly code?: ProjectErrorCode;
  readonly status?: number;

  constructor(
    message: string,
    options: { code?: ProjectErrorCode; status?: number } = {},
  ) {
    super(message);
    this.name = "ProjectClientError";
    this.code = options.code;
    this.status = options.status;
  }
}

export async function getServerProject(id: string): Promise<ProjectSnapshot> {
  const response = await request(`/api/projects/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  return readSnapshot(response);
}

export async function patchServerProject(
  id: string,
  patch: PatchProjectInput,
): Promise<ProjectSnapshot> {
  const response = await request(`/api/projects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return readSnapshot(response);
}

export async function unregisterServerProject(id: string): Promise<void> {
  await request(`/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function uploadProjectAsset(
  projectId: string,
  file: File,
): Promise<ProjectAsset> {
  const response = await request(
    `/api/projects/${encodeURIComponent(projectId)}/assets?name=${encodeURIComponent(file.name)}`,
    { method: "POST", body: file },
  );
  if (response.status !== 201) throw invalidProjectResponse(response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw invalidProjectResponse(response.status);
  }

  const asset = parseProjectAsset(body, file);
  if (asset === null) throw invalidProjectResponse(response.status);
  return asset;
}

async function request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new ProjectClientError("Project request failed.");
  }

  if (!response.ok) {
    throw await readProjectError(response);
  }
  return response;
}

async function readSnapshot(response: Response): Promise<ProjectSnapshot> {
  try {
    return (await response.json()) as ProjectSnapshot;
  } catch {
    throw new ProjectClientError("Project server returned an invalid response.", {
      status: response.status,
    });
  }
}

function parseProjectAsset(value: unknown, file: File): ProjectAsset | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== PROJECT_ASSET_KEYS.size ||
    keys.some((key) => !PROJECT_ASSET_KEYS.has(key))
  ) {
    return null;
  }

  if (
    typeof record.filename !== "string" ||
    typeof record.path !== "string" ||
    record.path !== `assets/${record.filename}` ||
    !isSafeProjectAssetFilename(record.filename) ||
    !isSafeProjectAssetOriginalName(record.originalName) ||
    record.originalName !== file.name ||
    typeof record.bytes !== "number" ||
    !Number.isSafeInteger(record.bytes) ||
    record.bytes < 1 ||
    record.bytes > PROJECT_ASSET_MAX_BYTES ||
    record.bytes !== file.size ||
    !isProjectAssetMediaType(record.mediaType)
  ) {
    return null;
  }

  const extension = record.filename.slice(record.filename.lastIndexOf(".") + 1);
  if (
    !Object.hasOwn(PROJECT_ASSET_EXTENSION_MEDIA_TYPES, extension) ||
    PROJECT_ASSET_EXTENSION_MEDIA_TYPES[
      extension as keyof typeof PROJECT_ASSET_EXTENSION_MEDIA_TYPES
    ] !== record.mediaType
  ) {
    return null;
  }

  return {
    path: record.path,
    filename: record.filename,
    originalName: record.originalName,
    bytes: record.bytes,
    mediaType: record.mediaType,
  };
}

function isSafeProjectAssetOriginalName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value !== "." &&
    value !== ".." &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/u.test(value) &&
    Array.from(value).length <= PROJECT_ASSET_NAME_MAX_CODE_POINTS &&
    encoder.encode(value).byteLength <= PROJECT_ASSET_NAME_MAX_BYTES
  );
}

function isSafeProjectAssetFilename(value: string): boolean {
  const match = PROJECT_ASSET_FILENAME_PATTERN.exec(value);
  return (
    match !== null &&
    match[1].length <= PROJECT_ASSET_STEM_MAX_LENGTH &&
    !PROJECT_ASSET_DEVICE_STEM_PATTERN.test(match[1])
  );
}

function isProjectAssetMediaType(
  value: unknown,
): value is ProjectAssetMediaType {
  return (
    typeof value === "string" &&
    PROJECT_ASSET_MEDIA_TYPES.has(value as ProjectAssetMediaType)
  );
}

function invalidProjectResponse(status: number): ProjectClientError {
  return new ProjectClientError("Project server returned an invalid response.", {
    status,
  });
}

async function readProjectError(response: Response): Promise<ProjectClientError> {
  let body: ProjectErrorResponse = {};
  try {
    body = (await response.json()) as ProjectErrorResponse;
  } catch {
    // Never surface an unstructured response body: it may contain secrets.
  }

  const code = isProjectErrorCode(body.error) ? body.error : undefined;
  const message =
    code !== undefined &&
    typeof body.message === "string" &&
    body.message.length > 0
      ? body.message
      : `Project request failed (${response.status}).`;
  return new ProjectClientError(message, { code, status: response.status });
}

function isProjectErrorCode(value: unknown): value is ProjectErrorCode {
  return (
    typeof value === "string" && Object.hasOwn(PROJECT_ERROR_HTTP_STATUS, value)
  );
}
