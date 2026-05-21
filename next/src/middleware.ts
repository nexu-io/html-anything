import { NextRequest, NextResponse } from "next/server";
import { isRequestHostAllowed } from "@/lib/security/host-validation";

/**
 * Gate every `/api/*` request behind a Host-header allowlist. See
 * `next/src/lib/security/host-validation.ts` for the threat-model rationale and
 * env knobs (`HTML_ANYTHING_ALLOWED_HOSTS`, `HTML_ANYTHING_ALLOW_ANY_HOST`).
 *
 * Why /api/*: the static + RSC routes don't have side effects worth gating
 * (and refusing the document would just produce a confusing UX during DNS
 * rebinding). The agent-spawn, file-write, and credentialed network paths
 * all live under `/api/`.
 */
export function middleware(req: NextRequest) {
  if (isRequestHostAllowed(req)) return NextResponse.next();
  return new NextResponse(
    JSON.stringify({
      error: "Host not allowed",
      hint:
        "html-anything's API only accepts requests with a loopback Host header (127.0.0.1, localhost, ::1). " +
        "If you're fronting it behind a different hostname, add it to HTML_ANYTHING_ALLOWED_HOSTS (comma-separated) " +
        "or set HTML_ANYTHING_ALLOW_ANY_HOST=1 if a trusted reverse proxy is terminating Host upstream.",
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    },
  );
}

// Pin to the Node runtime so `process.env.HTML_ANYTHING_ALLOWED_HOSTS` and
// `process.env.HTML_ANYTHING_ALLOW_ANY_HOST` are read per-request, not
// inlined at build time. On Edge middleware, Next can fold `process.env.*`
// references into the build output — operator-set env in `next/.env.local`
// would then silently fail to take effect after `next start`, locking out
// legitimate LAN hosts (`HTML_ANYTHING_ALLOWED_HOSTS`) or failing to disable
// the gate (`HTML_ANYTHING_ALLOW_ANY_HOST=1`). Node runtime middleware
// (Next 15.2+) sidesteps that by reading env at request time.
export const runtime = "nodejs";

export const config = {
  // Run on every API route. Excludes static assets, RSC payloads, and the
  // page tree — those are not the rebinding-attack surface.
  matcher: ["/api/:path*"],
};
