import { NextResponse } from "next/server";
import { listPackages } from "@/lib/skills/registry";
import { hostRejectedResponse, isHostAllowed } from "./_lib/host-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * List every installed marketplace package.
 *
 * Gated behind the same Host guard as install/uninstall — even though this
 * is read-only, returning installed packages to a DNS-rebinding origin
 * would leak repo owners / names / refs from the user's local app to any
 * site they visit. Once the global `/api/*` middleware (PR #61) lands, the
 * per-route check here is redundant; until then it must cover the whole
 * marketplace surface, not just the write endpoints.
 */
export async function GET(req: Request) {
  if (!isHostAllowed(req)) return hostRejectedResponse();
  return NextResponse.json({ packages: listPackages() });
}
