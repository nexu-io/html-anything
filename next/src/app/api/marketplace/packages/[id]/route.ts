import { NextResponse } from "next/server";
import { uninstallPackage } from "@/lib/skills/install";
import { invalidateSkillsCache } from "@/lib/templates/loader";
import { hostRejectedResponse, isHostAllowed } from "../../_lib/host-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  if (!isHostAllowed(req)) return hostRejectedResponse();
  const { id } = await ctx.params;
  if (!/^[a-z0-9._-]+__[a-z0-9._-]+$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }
  const removed = await uninstallPackage(id);
  if (!removed) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  invalidateSkillsCache();
  return NextResponse.json({ ok: true });
}
