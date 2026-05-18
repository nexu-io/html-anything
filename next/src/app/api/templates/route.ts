import { NextResponse } from "next/server";
import { listSkills } from "@/lib/templates/loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const skills = listSkills();
  return NextResponse.json(
    { templates: skills },
    {
      headers: {
        // Browser cache for a few seconds — long enough to dedupe rapid
        // refetches, short enough that a contributor dropping a new skill
        // folder sees it on the next reload without restarting.
        "Cache-Control": "public, max-age=5",
      },
    },
  );
}
