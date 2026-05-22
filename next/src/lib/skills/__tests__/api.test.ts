import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exercise the Next.js route handlers directly. We mock the underlying
 * `installFromGitHub` for the success path (because POST runs in this process
 * and needs the same fetch stub the lib tests use) and let DELETE run end-to-end
 * against the on-disk registry.
 */

const SKILL_MD = `---
name: api-test
zh_name: API
en_name: API Test
emoji: "🔌"
description: api test
category: article
scenario: marketing
aspect_hint: a
tags: ["x"]
---
body
`;

async function tarGzDir(dir: string, outPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const parent = path.dirname(dir);
    const base = path.basename(dir);
    const proc = spawn("tar", ["-czf", outPath, "-C", parent, base]);
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar -czf failed (${code}): ${stderr}`));
    });
  });
}

let tmpRoot: string;
let originalFetch: typeof fetch;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ha-api-test-"));
  process.env.HTML_ANYTHING_USER_SKILLS_DIR = path.join(tmpRoot, "user-skills");
  originalFetch = globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  delete process.env.HTML_ANYTHING_USER_SKILLS_DIR;
  await fs.rm(tmpRoot, { recursive: true, force: true });
  vi.resetModules();
});

async function buildOkTarball(): Promise<Buffer> {
  const wrapper = path.join(tmpRoot, "wrapper");
  await fs.mkdir(wrapper, { recursive: true });
  await fs.writeFile(path.join(wrapper, "SKILL.md"), SKILL_MD, "utf8");
  const tarballPath = path.join(tmpRoot, "archive.tar.gz");
  await tarGzDir(wrapper, tarballPath);
  return fs.readFile(tarballPath);
}

function stubFetch(tarball: Buffer): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("api.github.com/repos/")) {
      return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 });
    }
    if (url.includes("codeload.github.com")) {
      return new Response(new Uint8Array(tarball), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

describe("GET /api/marketplace", () => {
  it("returns an empty list when nothing is installed", async () => {
    const { GET } = await import("../../../app/api/marketplace/route");
    const res = await GET(new Request("http://127.0.0.1/api/marketplace"));
    const data = (await res.json()) as { packages: unknown[] };
    expect(data.packages).toEqual([]);
  });

  it("returns 403 when the Host header is not loopback — even for the read endpoint", async () => {
    // Privacy regression test: enumerating installed packages (repo
    // owners / names / refs) must not be reachable via DNS rebinding.
    const { GET } = await import("../../../app/api/marketplace/route");
    const res = await GET(new Request("http://evil.example.com/api/marketplace"));
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("host_not_allowed");
  });
});

describe("POST /api/marketplace/install", () => {
  it("returns 403 when the Host header is not loopback (DNS-rebinding defense)", async () => {
    const { POST } = await import("../../../app/api/marketplace/install/route");
    // undici forbids setting the `host` request header, so encode the
    // attacker-controlled host into the URL — that's what the guard reads
    // (via `new URL(req.url).host`) when no Host header is present.
    const req = new Request("http://evil.example.com/api/marketplace/install", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("host_not_allowed");
  });

  it("returns 400 on invalid JSON", async () => {
    const { POST } = await import("../../../app/api/marketplace/install/route");
    const req = new Request("http://127.0.0.1/api/marketplace/install", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_json");
  });

  it("returns 400 when source is missing", async () => {
    const { POST } = await import("../../../app/api/marketplace/install/route");
    const req = new Request("http://127.0.0.1/api/marketplace/install", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with the InstallError code on invalid spec", async () => {
    const { POST } = await import("../../../app/api/marketplace/install/route");
    const req = new Request("http://127.0.0.1/api/marketplace/install", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "not a spec" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("invalid_spec");
  });

  it("returns 200 + package manifest on a successful install", async () => {
    const tarball = await buildOkTarball();
    stubFetch(tarball);
    const { POST } = await import("../../../app/api/marketplace/install/route");
    const req = new Request("http://127.0.0.1/api/marketplace/install", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "owner/repo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { package: { id: string } };
    expect(data.package.id).toBe("owner__repo");
  });
});

describe("DELETE /api/marketplace/packages/[id]", () => {
  it("returns 400 on a malformed id", async () => {
    const { DELETE } = await import("../../../app/api/marketplace/packages/[id]/route");
    const res = await DELETE(new Request("http://127.0.0.1/api/marketplace/packages/x"), {
      params: Promise.resolve({ id: "../../etc/passwd" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an id with the right shape but no on-disk package", async () => {
    const { DELETE } = await import("../../../app/api/marketplace/packages/[id]/route");
    const res = await DELETE(new Request("http://127.0.0.1/api/marketplace/packages/x"), {
      params: Promise.resolve({ id: "ghost__pack" }),
    });
    expect(res.status).toBe(404);
  });

  it("removes a real installed package", async () => {
    // Install through the POST handler so the on-disk state is realistic.
    stubFetch(await buildOkTarball());
    const { POST } = await import("../../../app/api/marketplace/install/route");
    await POST(
      new Request("http://127.0.0.1/api/marketplace/install", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "owner/repo" }),
      }),
    );

    const { DELETE } = await import("../../../app/api/marketplace/packages/[id]/route");
    const res = await DELETE(new Request("http://127.0.0.1/api/marketplace/packages/x"), {
      params: Promise.resolve({ id: "owner__repo" }),
    });
    expect(res.status).toBe(200);

    const { GET } = await import("../../../app/api/marketplace/route");
    const after = (await (await GET(new Request("http://127.0.0.1/api/marketplace"))).json()) as {
      packages: unknown[];
    };
    expect(after.packages).toEqual([]);
  });
});
