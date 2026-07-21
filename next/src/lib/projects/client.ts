import {
  PROJECT_ERROR_HTTP_STATUS,
  type PatchProjectInput,
  type ProjectErrorCode,
  type ProjectSnapshot,
} from "./contracts";

type ProjectErrorResponse = {
  error?: unknown;
  message?: unknown;
};

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

async function readProjectError(response: Response): Promise<ProjectClientError> {
  let body: ProjectErrorResponse = {};
  try {
    body = (await response.json()) as ProjectErrorResponse;
  } catch {
    // Never surface an unstructured response body: it may contain secrets.
  }

  const code = isProjectErrorCode(body.error) ? body.error : undefined;
  const message =
    typeof body.message === "string" && body.message.length > 0
      ? body.message
      : `Project request failed (${response.status}).`;
  return new ProjectClientError(message, { code, status: response.status });
}

function isProjectErrorCode(value: unknown): value is ProjectErrorCode {
  return (
    typeof value === "string" && Object.hasOwn(PROJECT_ERROR_HTTP_STATUS, value)
  );
}
