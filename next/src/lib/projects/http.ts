import {
  PROJECT_CREATE_BODY_MAX_BYTES,
  PROJECT_PATCH_BODY_MAX_BYTES,
  ProjectError,
  parseCreateProjectInput,
  parsePatchProjectInput,
  validateProjectId,
} from "./contracts";
import type { ProjectService } from "./service";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export function isLoopbackCreationRequest(req: Request): boolean {
  // This Host-form check protects browsers and accidental tailnet ingress. It
  // is not peer authentication: clients on the fully trusted tailnet can
  // forge Host.
  const host = req.headers.get("host");
  if (host === null) return false;
  return /^(?:(?:localhost|127\.0\.0\.1)(?::[0-9]+)?|\[::1\](?::[0-9]+)?)$/iu.test(
    host,
  );
}

export async function readBoundedJson(
  req: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentLength = req.headers.get("content-length");
  if (
    contentLength !== null &&
    /^[0-9]+$/u.test(contentLength) &&
    BigInt(contentLength) > BigInt(maxBytes)
  ) {
    try {
      await req.body?.cancel();
    } catch {
      // The size error remains authoritative if transport cancellation fails.
    }
    throw new ProjectError("limit_exceeded", "Request body exceeds its limit.");
  }

  const chunks: Uint8Array[] = [];
  let bytes = 0;
  if (req.body !== null) {
    const reader = req.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value.byteLength > maxBytes - bytes) {
          try {
            await reader.cancel();
          } catch {
            // The size error remains authoritative if transport cancellation fails.
          }
          throw new ProjectError(
            "limit_exceeded",
            "Request body exceeds its limit.",
          );
        }
        chunks.push(value);
        bytes += value.byteLength;
      }
    } finally {
      reader.releaseLock();
    }
  }

  const text = Buffer.concat(chunks, bytes).toString("utf8");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ProjectError(
      "invalid_request",
      "Request body must be valid JSON.",
    );
  }
}

export function createProjectHttpHandlers(service: ProjectService) {
  return {
    async POST(req: Request): Promise<Response> {
      try {
        if (!isLoopbackCreationRequest(req)) {
          throw new ProjectError(
            "loopback_required",
            "Project creation requires loopback access.",
          );
        }

        const input = parseCreateProjectInput(
          await readBoundedJson(req, PROJECT_CREATE_BODY_MAX_BYTES),
        );
        const result = await service.create(input);
        return jsonResponse(result.response, result.created ? 201 : 200);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async GET(_req: Request, context: ProjectRouteContext): Promise<Response> {
      try {
        const { id } = await context.params;
        const project = await service.get(validateProjectId(id));
        return jsonResponse(project, 200);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async PATCH(req: Request, context: ProjectRouteContext): Promise<Response> {
      try {
        const { id } = await context.params;
        const projectId = validateProjectId(id);
        const patch = parsePatchProjectInput(
          await readBoundedJson(req, PROJECT_PATCH_BODY_MAX_BYTES),
        );
        const project = await service.patch(projectId, patch);
        return jsonResponse(project, 200);
      } catch (error) {
        return errorResponse(error);
      }
    },

    async DELETE(_req: Request, context: ProjectRouteContext): Promise<Response> {
      try {
        const { id } = await context.params;
        await service.unregister(validateProjectId(id));
        return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
      } catch (error) {
        return errorResponse(error);
      }
    },
  };
}

function jsonResponse(value: unknown, status: number): Response {
  return Response.json(value, { status, headers: NO_STORE_HEADERS });
}

function errorResponse(error: unknown): Response {
  const safeError =
    error instanceof ProjectError
      ? error
      : new ProjectError("storage_failed", "Project operation failed.");
  return jsonResponse(
    { error: safeError.code, message: safeError.message },
    safeError.httpStatus,
  );
}
