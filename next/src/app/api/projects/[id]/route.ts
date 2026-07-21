import { createProjectHttpHandlers } from "@/lib/projects/http";
import { projectService } from "@/lib/projects/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createProjectHttpHandlers(projectService);

export const GET = handlers.GET;
export const PATCH = handlers.PATCH;
export const DELETE = handlers.DELETE;
