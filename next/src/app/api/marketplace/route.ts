import { NextResponse } from "next/server";
import { listPackages } from "@/lib/skills/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * List every installed marketplace package. Host gating is enforced globally
 * by middleware.ts on /api/* (loopback-only) — see lib/security/host-validation.ts.
 */
export async function GET(_req: Request) {
  return NextResponse.json({ packages: listPackages() });
}
