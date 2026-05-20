/**
 * URL reachability polling — adapted from open-design's
 * `waitForReachableDeploymentUrl`. Used to confirm that a freshly created
 * deployment is actually serving traffic before we report success to the
 * client. Vercel and Cloudflare Pages both return URLs eagerly that may
 * 404 / 503 for ~5–30 s while CDN propagation finishes.
 *
 * Special-case: Vercel's free / Hobby tier protects preview deployments
 * with SSO by default. We detect that 401 + Vercel-specific markers and
 * surface a `protected` status instead of looping forever.
 */

export type DeploymentUrlCheck =
  | { reachable: true; statusCode: number }
  | {
      reachable: false;
      status?: "protected";
      statusCode?: number;
      statusMessage?: string;
    };

export type WaitForUrlResult = {
  status: "ready" | "protected" | "link-delayed";
  url: string;
  statusMessage: string;
  reachableAt?: number;
};

const VERCEL_PROTECTED_MESSAGE =
  "Deployment is protected by Vercel SSO. Open the URL once to authenticate, " +
  "or disable Vercel Authentication in Project Settings → Deployment Protection.";

export function normalizeDeploymentUrl(url: unknown): string {
  if (typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isVercelProtectedResponse(resp: Response, body = ""): boolean {
  const server = resp.headers?.get?.("server") || "";
  const setCookie = resp.headers?.get?.("set-cookie") || "";
  const text = String(body || "");
  return (
    /vercel/i.test(server) ||
    /_vercel_sso_nonce/i.test(setCookie) ||
    /Authentication Required/i.test(text) ||
    /Vercel Authentication/i.test(text) ||
    /vercel\.com\/sso-api/i.test(text)
  );
}

async function requestDeploymentUrl(
  url: string,
  method: "HEAD" | "GET",
  timeoutMs: number,
): Promise<DeploymentUrlCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
    });
    if (resp.status >= 200 && resp.status < 400) {
      return { reachable: true, statusCode: resp.status };
    }
    const body =
      method === "GET" || resp.status === 401 ? await resp.text() : "";
    if (resp.status === 401 && isVercelProtectedResponse(resp, body)) {
      return {
        reachable: false,
        status: "protected",
        statusCode: resp.status,
        statusMessage: VERCEL_PROTECTED_MESSAGE,
      };
    }
    return {
      reachable: false,
      statusCode: resp.status,
      statusMessage: `Public link returned HTTP ${resp.status}.`,
    };
  } catch (err) {
    return {
      reachable: false,
      statusMessage: `Public link is not reachable yet: ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkDeploymentUrl(
  url: unknown,
  { timeoutMs = 8_000 }: { timeoutMs?: number } = {},
): Promise<DeploymentUrlCheck> {
  const normalized = normalizeDeploymentUrl(url);
  if (!normalized) {
    return { reachable: false, statusMessage: "Deployment URL is empty." };
  }
  // HEAD first (cheap), GET fallback if the host rejects HEAD (405) or
  // returns a 4xx that might be a method-mismatch rather than a real error.
  const head = await requestDeploymentUrl(normalized, "HEAD", timeoutMs);
  if (head.reachable) return head;
  if ("status" in head && head.status === "protected") return head;
  if (
    "statusCode" in head &&
    head.statusCode &&
    (head.statusCode === 405 ||
      head.statusCode === 403 ||
      head.statusCode >= 400)
  ) {
    const get = await requestDeploymentUrl(normalized, "GET", timeoutMs);
    if (get.reachable) return get;
    if ("status" in get && get.status === "protected") return get;
    return "statusMessage" in get && get.statusMessage ? get : head;
  }
  const get = await requestDeploymentUrl(normalized, "GET", timeoutMs);
  if (get.reachable) return get;
  return "statusMessage" in get && get.statusMessage ? get : head;
}

export async function waitForReachableDeploymentUrl(
  urls: unknown[],
  {
    timeoutMs = 60_000,
    intervalMs = 2_000,
    providerLabel = "Deployment provider",
  } = {},
): Promise<WaitForUrlResult> {
  const candidates = [
    ...new Set((urls || []).map(normalizeDeploymentUrl).filter(Boolean)),
  ];
  const fallbackUrl = candidates[0] || "";
  if (!fallbackUrl) {
    return {
      status: "link-delayed",
      url: "",
      statusMessage: `${providerLabel} did not return a public deployment URL.`,
    };
  }

  const startedAt = Date.now();
  let lastMessage = "";
  while (Date.now() - startedAt <= timeoutMs) {
    for (const url of candidates) {
      const result = await checkDeploymentUrl(url);
      if (result.reachable) {
        return {
          status: "ready",
          url,
          statusMessage: "Public link is ready.",
          reachableAt: Date.now(),
        };
      }
      if ("status" in result && result.status === "protected") {
        return {
          status: "protected",
          url,
          statusMessage: result.statusMessage || VERCEL_PROTECTED_MESSAGE,
        };
      }
      if ("statusMessage" in result && result.statusMessage) {
        lastMessage = result.statusMessage;
      }
    }
    if (Date.now() - startedAt >= timeoutMs) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: "link-delayed",
    url: fallbackUrl,
    statusMessage:
      lastMessage ||
      `${providerLabel} returned a deployment URL, but it is not reachable yet.`,
  };
}
