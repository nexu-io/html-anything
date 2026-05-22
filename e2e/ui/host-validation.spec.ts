/**
 * End-to-end verification that the API surface refuses requests whose `Host`
 * header isn't on the loopback allowlist. The exact rebinding attack we are
 * defending against would deliver these requests from a real browser tab
 * after a DNS flip; here we use a raw `request.fetch` so we can forge the
 * header directly.
 *
 * The Playwright webServer in `e2e/playwright.config.ts` runs
 * `next start -p 3317`, which binds to every interface by default. The
 * default `baseURL` resolves to `127.0.0.1:3317` — the loopback path. To
 * exercise the rejection path we override the `Host` header to attacker-
 * controlled values while still dialing the real loopback IP.
 *
 * The accept-loopback tests prove the default dev path keeps working —
 * gating on Host must not break the common case where the user opens
 * `http://localhost:3317/` in a browser on their own machine.
 */
import { test, expect, request as playwrightRequest } from "@playwright/test";

const API_PATHS = [
  "/api/agents",
  "/api/templates",
  "/api/deploy/config?provider=vercel",
] as const;

// Matches the `webServer.url` in e2e/playwright.config.ts (port 3317). Used as
// a fallback when the `baseURL` fixture is undefined — exactOptionalPropertyTypes
// rejects passing `string | undefined` to newContext's `baseURL?: string`.
const DEFAULT_BASE_URL = "http://127.0.0.1:3317";

test.describe("API host-header validation", () => {
  test("accepts loopback Host (127.0.0.1) — default dev path", async ({ baseURL }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "127.0.0.1:3317" },
    });
    for (const p of API_PATHS) {
      const r = await ctx.get(p);
      // Any 2xx / 4xx that ISN'T 403 from this middleware passes — the route
      // may legitimately 400 (missing query / not configured) but it should
      // not be the host-rejection 403.
      if (r.status() === 403) {
        const body = await r.json().catch(() => ({}));
        expect(body.error, `loopback host rejected on ${p}: ${JSON.stringify(body)}`).not.toBe(
          "Host not allowed",
        );
      }
    }
    await ctx.dispose();
  });

  test("accepts localhost Host — default dev path", async ({ baseURL }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "localhost:3317" },
    });
    const r = await ctx.get("/api/agents");
    expect(r.status()).not.toBe(403);
    await ctx.dispose();
  });

  test("rejects attacker.example Host on every API path", async ({ baseURL }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "attacker.example" },
    });
    for (const p of API_PATHS) {
      const r = await ctx.get(p);
      expect(r.status(), `${p} should reject attacker.example`).toBe(403);
      const body = await r.json();
      expect(body.error).toBe("Host not allowed");
    }
    await ctx.dispose();
  });

  test("rejects POST /api/convert with attacker Host (RCE vector)", async ({ baseURL }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "attacker.example" },
    });
    const r = await ctx.post("/api/convert", {
      data: { agent: "claude", templateId: "deck-swiss-international", content: "ignore" },
    });
    expect(r.status(), "POST /api/convert must reject forged Host (RCE vector)").toBe(403);
    await ctx.dispose();
  });

  test("rejects PUT /api/deploy/config with attacker Host (token-write vector)", async ({
    baseURL,
  }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "attacker.example" },
    });
    const r = await ctx.put("/api/deploy/config?provider=vercel", {
      data: { token: "attacker-token" },
    });
    expect(r.status()).toBe(403);
    await ctx.dispose();
  });

  test("rejects subdomain-tricks (localhost.attacker.example)", async ({ baseURL }) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: "localhost.attacker.example" },
    });
    const r = await ctx.get("/api/agents");
    expect(r.status()).toBe(403);
    await ctx.dispose();
  });

  test("rejects empty Host", async ({ baseURL }) => {
    // A single space is deterministically transmitted; per RFC 7230 the
    // receiving parser strips the surrounding OWS and the server sees an
    // empty `host`. The validator's `stripPort.trim()` reduces it to "" and
    // `isAllowedHost("")` returns false → 403. An empty-string value would
    // be at the mercy of Playwright's header-serialization behavior (it may
    // drop the entry, in which case the request goes out with the default
    // loopback Host and the test passes for the wrong reason).
    const ctx = await playwrightRequest.newContext({
      baseURL: baseURL ?? DEFAULT_BASE_URL,
      extraHTTPHeaders: { Host: " " },
    });
    const r = await ctx.get("/api/agents");
    // Some HTTP stacks reject empty Host headers themselves with 400 before
    // it reaches middleware. Either 400 or 403 is acceptable; the key
    // invariant is "no 200".
    expect([400, 403]).toContain(r.status());
    await ctx.dispose();
  });
});
