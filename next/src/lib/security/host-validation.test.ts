import { afterEach, describe, expect, it } from "vitest";
import {
  isAllowedHost,
  isRequestHostAllowed,
  parseAllowedHosts,
  stripPort,
} from "./host-validation";

describe("stripPort", () => {
  it("preserves bare hostnames", () => {
    expect(stripPort("localhost")).toBe("localhost");
    expect(stripPort("127.0.0.1")).toBe("127.0.0.1");
    expect(stripPort("daemon.mirage.local")).toBe("daemon.mirage.local");
  });
  it("strips ipv4 + dns ports", () => {
    expect(stripPort("localhost:3000")).toBe("localhost");
    expect(stripPort("127.0.0.1:3317")).toBe("127.0.0.1");
    expect(stripPort("example.com:443")).toBe("example.com");
  });
  it("strips ipv6 ports while keeping brackets", () => {
    expect(stripPort("[::1]:3000")).toBe("[::1]");
    expect(stripPort("[::1]")).toBe("[::1]");
  });
  it("lower-cases", () => {
    expect(stripPort("LOCALHOST:3000")).toBe("localhost");
  });
  it("does not strip when the trailing chunk is not a port", () => {
    expect(stripPort("not-a-port:abc")).toBe("not-a-port:abc");
  });
  // Documents the fact that bare unbracketed `::1` is mangled by the
  // `last-colon-trailing-digit` branch — the last colon is index 1 and the
  // trailing "1" is all digits, so the slice returns ":". A bare `::1` can
  // therefore never match anything in `LOOPBACK_HOSTS`, which is why only
  // the bracketed `[::1]` form is on the allowlist.
  it("mangles bare ::1 to ':' (only [::1] is a real Host header anyway)", () => {
    expect(stripPort("::1")).toBe(":");
  });
});

describe("parseAllowedHosts", () => {
  it("returns an empty set for undefined / empty input", () => {
    expect(parseAllowedHosts(undefined).size).toBe(0);
    expect(parseAllowedHosts("").size).toBe(0);
    expect(parseAllowedHosts("  ,  ,").size).toBe(0);
  });
  it("splits + trims + lowercases + strips ports", () => {
    const set = parseAllowedHosts("Daemon.mirage.local, HOST-A:8080 , host-b");
    expect([...set].sort()).toEqual(["daemon.mirage.local", "host-a", "host-b"]);
  });
});

describe("isAllowedHost (defaults — loopback only)", () => {
  it("accepts loopback variants on any port", () => {
    expect(isAllowedHost("127.0.0.1")).toBe(true);
    expect(isAllowedHost("127.0.0.1:3000")).toBe(true);
    expect(isAllowedHost("localhost")).toBe(true);
    expect(isAllowedHost("LOCALHOST:3317")).toBe(true);
    expect(isAllowedHost("[::1]:3000")).toBe(true);
    expect(isAllowedHost("[::1]")).toBe(true);
  });
  it("rejects attacker hosts", () => {
    expect(isAllowedHost("attacker.example")).toBe(false);
    expect(isAllowedHost("attacker.example:80")).toBe(false);
    expect(isAllowedHost("evil.local")).toBe(false);
    // Adjacent loopback aliases that aren't on the allowlist — keep strict
    expect(isAllowedHost("127.0.0.2")).toBe(false);
    expect(isAllowedHost("localhost.attacker.example")).toBe(false);
  });
  // `0.0.0.0` is reachable from a public page on pre-fix Chrome (< 128) — it
  // routes to the local machine on macOS/Linux without needing DNS rebinding.
  // Must be rejected so the gate covers that sibling vector.
  it("rejects 0.0.0.0 (sidesteps DNS rebinding via 0.0.0.0-day vector)", () => {
    expect(isAllowedHost("0.0.0.0")).toBe(false);
    expect(isAllowedHost("0.0.0.0:3317")).toBe(false);
  });
  // Bare unbracketed `::1` is mangled by stripPort (see stripPort tests) and
  // browsers / HTTP/2 always bracket IPv6 in the Host / :authority field.
  it("rejects bare unbracketed ::1 (only [::1] is a real Host header)", () => {
    expect(isAllowedHost("::1")).toBe(false);
  });
  it("rejects empty / missing host", () => {
    expect(isAllowedHost(null)).toBe(false);
    expect(isAllowedHost(undefined)).toBe(false);
    expect(isAllowedHost("")).toBe(false);
    expect(isAllowedHost("   ")).toBe(false);
  });
});

describe("isAllowedHost — operator-extended allowlist", () => {
  const extras = parseAllowedHosts("daemon.mirage.local,html.anything.lan");
  it("accepts entries from extraAllowed (case + port insensitive)", () => {
    expect(isAllowedHost("daemon.mirage.local", { extraAllowed: extras })).toBe(true);
    expect(isAllowedHost("DAEMON.MIRAGE.LOCAL:3000", { extraAllowed: extras })).toBe(true);
    expect(isAllowedHost("html.anything.lan:8080", { extraAllowed: extras })).toBe(true);
  });
  it("still rejects non-listed hosts even when extras are configured", () => {
    expect(isAllowedHost("attacker.example", { extraAllowed: extras })).toBe(false);
  });
  it("accepts a string[] form for extraAllowed (not just Set)", () => {
    expect(
      isAllowedHost("daemon.mirage.local", { extraAllowed: ["daemon.mirage.local"] }),
    ).toBe(true);
  });
});

describe("isAllowedHost — wildcard opt-out", () => {
  it("allowAny=true accepts any host (reverse-proxy mode)", () => {
    expect(isAllowedHost("attacker.example", { allowAny: true })).toBe(true);
    expect(isAllowedHost(null, { allowAny: true })).toBe(true);
    expect(isAllowedHost("", { allowAny: true })).toBe(true);
  });
});

describe("isRequestHostAllowed (env-driven wrapper)", () => {
  const make = (host: string | null) => ({
    headers: {
      get(name: string) {
        return name.toLowerCase() === "host" ? host : null;
      },
    },
  });

  afterEach(() => {
    delete process.env.HTML_ANYTHING_ALLOWED_HOSTS;
    delete process.env.HTML_ANYTHING_ALLOW_ANY_HOST;
  });

  it("respects defaults when no env is set", () => {
    expect(isRequestHostAllowed(make("127.0.0.1:3317"))).toBe(true);
    expect(isRequestHostAllowed(make("attacker.example"))).toBe(false);
    expect(isRequestHostAllowed(make(null))).toBe(false);
  });
  it("extends allowlist via HTML_ANYTHING_ALLOWED_HOSTS", () => {
    process.env.HTML_ANYTHING_ALLOWED_HOSTS = "html.anything.lan";
    expect(isRequestHostAllowed(make("html.anything.lan:3000"))).toBe(true);
    expect(isRequestHostAllowed(make("attacker.example"))).toBe(false);
  });
  it("opt-out wildcard via HTML_ANYTHING_ALLOW_ANY_HOST=1 accepts everything", () => {
    process.env.HTML_ANYTHING_ALLOW_ANY_HOST = "1";
    expect(isRequestHostAllowed(make("attacker.example"))).toBe(true);
  });
  it("envVar=0 stays strict (only '1' opts out)", () => {
    process.env.HTML_ANYTHING_ALLOW_ANY_HOST = "0";
    expect(isRequestHostAllowed(make("attacker.example"))).toBe(false);
  });
});
