import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { readDirectory } from "@odsuite/sidecar";
import { nativeTools } from "@open-motion/render/tools";
import { expect, it } from "vitest";
import { open } from "@";

it("runs real Web and a sidecar-owned Daemon with propagated environment and durable state", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-"));
  const scope = { channel: channel("stable"), namespace: namespace("first") };
  let runtime: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await expect(open({ root, scope, version: "0.6.1", web: root })).rejects.toThrow("separate");
    runtime = await open({ root, scope, version: "0.6.1" });
    const status = await runtime.status();
    expect(status.environment.carrier).toBe("standalone");
    expect(status.daemon.environment).toEqual(status.environment);
    expect(status.daemon.pid).not.toBe(process.pid);
    expect(status.manifest.identity.appid).toBe("io.openmotion.app");
    expect(await (await fetch(status.web)).text()).toContain("./main.js");
    const bootstrap = await (await fetch(`${status.web}/bootstrap.json`)).json();
    expect(bootstrap.environment).toEqual(status.environment);
    const send = (path: string, init?: RequestInit) =>
      fetch(`${bootstrap.daemon}${path}`, {
        ...init,
        headers: { authorization: `Bearer ${bootstrap.token}`, ...init?.headers },
      });
    expect((await fetch(`${bootstrap.daemon}/health`)).status).toBe(401);
    expect((await send("/health")).status).toBe(200);
    expect((await send("/health", { method: "OPTIONS", headers: { origin: status.web } })).status).toBe(204);
    expect(
      (await send("/health", { method: "OPTIONS", headers: { origin: "https://unrelated.example" } })).status,
    ).toBe(403);
    const session = await runtime.execute("session_create", {
      requestId: randomUUID(),
      title: "durable session",
      mode: "motion",
    });
    const directory = runtime.manager.directory(scope);
    expect(directory.instances.filter((i) => i.kind === "process").map((i) => i.service)).toEqual(["daemon"]);
    const services = ["daemon", "standalone", "web"];
    if (nativeTools()) services.push("renderer");
    expect(directory.instances.map((i) => i.service).sort()).toEqual(services.sort());
    const registry = await runtime.manager.factory(scope).resources();
    expect(registry.grants.filter((g) => g.kind === "port")).toHaveLength(2);
    expect(registry.grants.filter((g) => g.kind === "socket")).toHaveLength(2);
    await expect(open({ root, scope, version: "0.6.1" })).rejects.toThrow();
    await runtime.close();
    expect((await readDirectory(root)).instances.every((i) => i.phase === "retired")).toBe(true);
    await expect(fetch(status.web, { signal: AbortSignal.timeout(500) })).rejects.toThrow();
    runtime = await open({ root, scope, version: "0.6.1" });
    expect((await runtime.execute("session_get", { sessionId: session.id })).title).toBe("durable session");
  } finally {
    await runtime?.close();
    await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("keeps factory resources and data isolated across channel and namespace", async () => {
  const root = await mkdtemp(join(tmpdir(), "standalone-isolation-"));
  try {
    for (const [lane, name, version] of [
      ["stable", "one", "0.6.1"],
      ["stable", "two", "0.6.1"],
      ["beta", "one", "0.6.1-beta.1"],
    ]) {
      const runtime = await open({
        root,
        scope: { channel: channel(lane ?? ""), namespace: namespace(name ?? "") },
        version,
      });
      try {
        expect((await runtime.execute("workspace_state", {})).sessions).toEqual([]);
        await runtime.execute("session_create", { requestId: randomUUID(), title: "isolated", mode: "motion" });
      } finally {
        await runtime.close();
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 15000);
