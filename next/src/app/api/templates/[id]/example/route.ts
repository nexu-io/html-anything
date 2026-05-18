import { NextResponse } from "next/server";
import { loadSkill } from "@/lib/templates/loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Returns the skill's pre-shipped example as a JSON bundle the client can
 * drop straight into `loadSample()` — saves the picker from making two
 * round-trips (one for content, one for HTML) when the user hits "Preview".
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const skill = loadSkill(id);
  if (!skill || !skill.example) {
    return new Response(`no example for template: ${id}`, { status: 404 });
  }
  return NextResponse.json({
    id: skill.example.id,
    name: skill.example.name,
    templateId: skill.id,
    format: skill.example.format,
    tagline: skill.example.tagline,
    desc: skill.example.desc,
    source: skill.example.source,
    content: skill.exampleMd ?? "",
    html: skill.exampleHtml ?? "",
  });
}
