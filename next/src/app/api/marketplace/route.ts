import { NextResponse } from "next/server";
import { listPackages } from "@/lib/skills/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List every installed marketplace package. */
export async function GET() {
  return NextResponse.json({ packages: listPackages() });
}
