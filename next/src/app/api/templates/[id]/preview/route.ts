import { loadSkill } from "@/lib/templates/loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Returns the skill's `example.html` verbatim so it can be loaded into an
 * `<iframe src=…>`. Lets the browser handle caching and avoids shipping every
 * preview HTML through `srcDoc` (which would block the main thread when the
 * gallery renders dozens of thumbnails at once).
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const skill = loadSkill(id);
  if (!skill || !skill.exampleHtml) {
    return new Response(`no preview for template: ${id}`, { status: 404 });
  }
  return new Response(skill.exampleHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Aggressive caching is fine — contributors editing a preview can
      // hard-refresh; the response key (skill id) doesn't get reused for
      // different content.
      "Cache-Control": "public, max-age=300",
    },
  });
}
