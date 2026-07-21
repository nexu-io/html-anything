import { createProjectHttpHandlers } from "@/lib/projects/http";
import { projectService } from "@/lib/projects/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = createProjectHttpHandlers(projectService);

export const POST = handlers.POST;
