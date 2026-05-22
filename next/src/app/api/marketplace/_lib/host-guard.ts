/**
 * Per-route Host-header guard for marketplace install/uninstall.
 *
 * Why this lives next to the marketplace routes rather than at the middleware
 * layer: a sibling PR (security/api-host-validation) introduces a global
 * `/api/*` middleware that covers every API route. Until that lands, the
 * marketplace POST is a particularly attractive DNS-rebinding target — it
 * downloads and writes arbitrary user-supplied GitHub repos to disk and
 * registers them as installable skills. So we ship a local check here that:
 *   - mirrors the same default (loopback-only) and env knobs
 *     (`HTML_ANYTHING_ALLOWED_HOSTS`, `HTML_ANYTHING_ALLOW_ANY_HOST`),
 *   - is independent of the middleware so it works whichever PR lands first,
 *   - becomes a redundant no-op once the global middleware also runs.
 *
 * Once the global host-validation middleware merges, this module can be
 * deleted and the routes can rely on the middleware alone.
 */

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "0.0.0.0"]);

function stripPort(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    if (end === -1) return trimmed;
    return trimmed.slice(1, end);
  }
  const colon = trimmed.lastIndexOf(":");
  if (colon === -1) return trimmed;
  const tail = trimmed.slice(colon + 1);
  return /^\d+$/.test(tail) ? trimmed.slice(0, colon) : trimmed;
}

function parseAllowlist(): Set<string> {
  const raw = process.env.HTML_ANYTHING_ALLOWED_HOSTS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isHostAllowed(req: Request): boolean {
  if (process.env.HTML_ANYTHING_ALLOW_ANY_HOST === "1") return true;
  // Prefer the Host header — that's what browsers send and what the dev-server
  // populates over the wire. Fall back to `new URL(req.url).host` because
  // fetch-spec-compliant `Request` constructors (undici, browsers) forbid
  // setting Host explicitly, and tests have to rely on the URL.
  const rawHost = req.headers.get("host") ?? safeUrlHost(req.url);
  if (!rawHost) return false;
  const host = stripPort(rawHost);
  if (!host) return false;
  if (LOOPBACK_HOSTS.has(host)) return true;
  return parseAllowlist().has(host);
}

function safeUrlHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function hostRejectedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "host_not_allowed",
      hint:
        "marketplace install/uninstall only accepts loopback Host. " +
        "Add the hostname to HTML_ANYTHING_ALLOWED_HOSTS or set HTML_ANYTHING_ALLOW_ANY_HOST=1 behind a trusted proxy.",
    }),
    { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
}
