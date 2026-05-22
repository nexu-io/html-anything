import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hostRejectedResponse, isHostAllowed } from "../host-guard";

describe("isHostAllowed", () => {
  const original = {
    allowed: process.env.HTML_ANYTHING_ALLOWED_HOSTS,
    any: process.env.HTML_ANYTHING_ALLOW_ANY_HOST,
  };

  beforeEach(() => {
    delete process.env.HTML_ANYTHING_ALLOWED_HOSTS;
    delete process.env.HTML_ANYTHING_ALLOW_ANY_HOST;
  });

  afterEach(() => {
    if (original.allowed === undefined) delete process.env.HTML_ANYTHING_ALLOWED_HOSTS;
    else process.env.HTML_ANYTHING_ALLOWED_HOSTS = original.allowed;
    if (original.any === undefined) delete process.env.HTML_ANYTHING_ALLOW_ANY_HOST;
    else process.env.HTML_ANYTHING_ALLOW_ANY_HOST = original.any;
  });

  function reqWithHost(host: string | null): Request {
    // undici (fetch-spec) forbids the "host" request header; encode the host
    // into the URL instead. The guard reads `req.headers.get('host')` first
    // and falls back to `new URL(req.url).host`, which matches reality —
    // browsers populate Host from the URL they dial.
    const url = host === null ? "file:///no-url-host" : `http://${host}/api/marketplace/install`;
    return new Request(url, { method: "POST" });
  }

  it("allows loopback IPv4 with a port", () => {
    expect(isHostAllowed(reqWithHost("127.0.0.1:3000"))).toBe(true);
  });

  it("allows literal localhost", () => {
    expect(isHostAllowed(reqWithHost("localhost"))).toBe(true);
  });

  it("allows IPv6 loopback in bracketed form", () => {
    expect(isHostAllowed(reqWithHost("[::1]:3000"))).toBe(true);
  });

  it("rejects an attacker-controlled hostname (the DNS-rebinding case)", () => {
    expect(isHostAllowed(reqWithHost("evil.example.com"))).toBe(false);
  });

  it("rejects a request with no Host header", () => {
    expect(isHostAllowed(reqWithHost(null))).toBe(false);
  });

  it("allows a hostname listed in HTML_ANYTHING_ALLOWED_HOSTS", () => {
    process.env.HTML_ANYTHING_ALLOWED_HOSTS = "ha.local, my-box";
    expect(isHostAllowed(reqWithHost("ha.local:3000"))).toBe(true);
    expect(isHostAllowed(reqWithHost("my-box"))).toBe(true);
    expect(isHostAllowed(reqWithHost("other.host"))).toBe(false);
  });

  it("accepts any host when HTML_ANYTHING_ALLOW_ANY_HOST=1 (trusted-proxy mode)", () => {
    process.env.HTML_ANYTHING_ALLOW_ANY_HOST = "1";
    expect(isHostAllowed(reqWithHost("anything.com"))).toBe(true);
  });
});

describe("hostRejectedResponse", () => {
  it("returns a 403 JSON response with an actionable hint", async () => {
    const res = hostRejectedResponse();
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string; hint: string };
    expect(body.error).toBe("host_not_allowed");
    expect(body.hint).toContain("HTML_ANYTHING_ALLOWED_HOSTS");
  });
});
