import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { asset } from "../src/assets.js";

it("rejects a web-root symlink escape and applies a restrictive CSP", async () => {
  const root = await mkdtemp(join(tmpdir(), "assets-"));
  try {
    const web = join(root, "web");
    await mkdir(web);
    await writeFile(join(root, "secret"), "secret");
    await writeFile(join(web, "index.html"), "ready");
    await symlink(join(root, "secret"), join(web, "leak"));
    expect((await asset(web, new Request("fixture://carrier/leak"))).status).toBe(403);
    expect((await asset(web, new Request("fixture://carrier/"))).headers.get("content-security-policy")).toContain(
      "connect-src 'none'",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
