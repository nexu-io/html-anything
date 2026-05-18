import { NextResponse } from "next/server";
import { detectAgents } from "@/lib/agents/detect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agents = detectAgents();
    return NextResponse.json({
      agents,
      installedCount: agents.filter((a) => a.available).length,
      platform: process.platform,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "detection failed" },
      { status: 500 },
    );
  }
}
