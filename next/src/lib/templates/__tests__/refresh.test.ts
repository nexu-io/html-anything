import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression test for the maintainer-flagged client-cache blocker. The
 * previous install/uninstall flow re-hit `GET /api/templates` but did not
 * touch the module-level `cache` in `@/lib/templates/index.ts`, so the
 * picker kept serving the stale list until a full page reload.
 *
 * `refreshTemplates()` must:
 *   - drop the in-memory cache so subsequent reads / hook mounts re-fetch;
 *   - actually call `/api/templates` again, even if there is an in-flight
 *     request still resolving from before the refresh.
 *
 * The hook-side "warm-cache consumers stay subscribed" change is verified
 * implicitly by typecheck + by the settings-modal flow calling
 * `refreshTemplates` post-install; a hook-mounting test would require
 * `@testing-library/react`, which isn't a project dep.
 */

let templates: typeof import("../index");
let fetchCalls: string[];

beforeEach(async () => {
  vi.resetModules();
  templates = await import("../index");
  fetchCalls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

function stubTemplates(items: Array<{ id: string }>): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    fetchCalls.push(url);
    if (url.includes("/api/templates")) {
      return new Response(JSON.stringify({ templates: items }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

describe("refreshTemplates", () => {
  it("re-fetches `/api/templates` and updates the cache", async () => {
    stubTemplates([{ id: "a" }, { id: "b" }]);

    // First refresh from a cold cache populates it.
    const first = await templates.refreshTemplates();
    expect(first.map((t) => t.id)).toEqual(["a", "b"]);
    expect(templates.getCachedTemplate("a")?.id).toBe("a");
    expect(fetchCalls.filter((u) => u.includes("/api/templates"))).toHaveLength(1);

    // Server-side list changes. Without `refreshTemplates`, the cache would
    // still hold ["a","b"] and consumers would never see "c".
    stubTemplates([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const second = await templates.refreshTemplates();
    expect(second.map((t) => t.id)).toEqual(["a", "b", "c"]);
    expect(templates.getCachedTemplate("c")?.id).toBe("c");
    expect(fetchCalls.filter((u) => u.includes("/api/templates"))).toHaveLength(2);
  });

  it("dropping the in-memory cache survives an uninstall (entry disappears)", async () => {
    stubTemplates([{ id: "user-skill" }, { id: "bundled" }]);
    await templates.refreshTemplates();
    expect(templates.getCachedTemplate("user-skill")?.id).toBe("user-skill");

    // After a hypothetical uninstall, server reports only the bundled one.
    stubTemplates([{ id: "bundled" }]);
    await templates.refreshTemplates();
    expect(templates.getCachedTemplate("user-skill")).toBeUndefined();
    expect(templates.getCachedTemplate("bundled")?.id).toBe("bundled");
  });

  it("on fetch failure, leaves the next mount free to refetch instead of caching the error", async () => {
    stubTemplates([{ id: "stable" }]);
    await templates.refreshTemplates();
    expect(templates.getCachedTemplate("stable")?.id).toBe("stable");

    // Refresh fails — the previous cache stays cleared (so the next read
    // hits the network) and the rejection propagates.
    globalThis.fetch = (async () => new Response("boom", { status: 500 })) as typeof fetch;
    await expect(templates.refreshTemplates()).rejects.toBeInstanceOf(Error);
    expect(templates.getCachedTemplate("stable")).toBeUndefined();

    // Recovery: a subsequent successful refresh repopulates.
    stubTemplates([{ id: "back" }]);
    await templates.refreshTemplates();
    expect(templates.getCachedTemplate("back")?.id).toBe("back");
  });
});
