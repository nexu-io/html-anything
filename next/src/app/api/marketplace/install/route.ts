import { NextResponse } from "next/server";
import { installFromGitHub, InstallError } from "@/lib/skills/install";
import { invalidateSkillsCache } from "@/lib/templates/loader";
import { hostRejectedResponse, isHostAllowed } from "../_lib/host-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isHostAllowed(req)) return hostRejectedResponse();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const spec = (body as { source?: unknown } | null)?.source;
  if (typeof spec !== "string" || !spec.trim()) {
    return NextResponse.json({ error: "missing_source" }, { status: 400 });
  }
  try {
    const result = await installFromGitHub(spec);
    invalidateSkillsCache();
    return NextResponse.json({ package: result.package });
  } catch (err) {
    if (err instanceof InstallError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "install_failed", message }, { status: 500 });
  }
}
