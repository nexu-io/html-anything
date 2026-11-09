import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { channel, digest, namespace } from "@odsuite/protocol";
import { emit, resolve } from "@odsuite/release";
import { Client, type Lease, serve } from "@odsuite/sidecar";
import { describe, expect, it } from "vitest";

import { asset } from "@";

const electron = createRequire(import.meta.url)("electron") as string;

function output(child: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => reject(new Error(`carrier timeout: ${stderr}`)), 30000);
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`carrier exited ${code}: ${stderr}`));
    });
  });
}

describe("carrier", () => {
  it("serves only files inside the injected web root", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-carrier-"));
    await writeFile(join(root, "index.html"), "ready");

    expect(await (await asset(root, new Request("open-motion://carrier/"))).text()).toBe("ready");
    expect((await asset(root, new Request("open-motion://other/"))).status).toBe(404);
    expect((await asset(root, new Request("open-motion://carrier/%2e%2e%2fsecret"))).status).toBe(403);
  });

  it("emits a runtime identity fixture without changing app version", async () => {
    const root = await mkdtemp(join(tmpdir(), "odsuite-carrier-"));
    const manifest = resolve({}, { channel: channel("beta"), version: "2.0.0-beta.1" });
    const path = await emit(root, manifest);

    expect(path).toBe(join(root, "release.json"));
    expect(manifest.identity.origin).toBe("open-motion-beta://carrier");
  });

  it.runIf(process.platform === "darwin" && process.env.ODSUITE_RUNTIME_GUI === "1")(
    "runs Web to Daemon in real Chromium",
    async () => {
      const root = await mkdtemp(join(tmpdir(), "odsuite-carrier-"));
      const endpoint = join(root, "sidecar.sock");
      const service = await serve(endpoint);
      const client = new Client(endpoint, service.authority);
      const scope = namespace("main");
      const owner = "attempt";
      const capability = await client.issue({
        channel: channel("stable"),
        namespace: scope,
        owner,
        service: "daemon",
      });
      const data = await client.grant(
        { namespace: scope, channel: channel("stable") },
        { kind: "data", name: "daemon", scope: "factory" },
      );
      const carrier = await client.grant(
        { namespace: scope, channel: channel("stable") },
        { kind: "data", name: "carrier", scope: "factory" },
      );
      const socket = await client.grant(
        { namespace: scope, channel: channel("stable") },
        { kind: "socket", name: "daemon", owner, scope: "attempt" },
      );
      const port = await client.grant(
        { namespace: scope, channel: channel("stable") },
        {
          kind: "port",
          name: "daemon",
          owner,
          scheme: "http",
          scope: "attempt",
        },
      );
      const manifest = resolve({}, { channel: channel("stable"), version: "1.0.0" });
      const release = await emit(root, manifest);
      const daemonenv = {
        ODSUITE_RUNTIME_DATA: data.value,
        ODSUITE_RUNTIME_ORIGIN: manifest.identity.origin,
        ODSUITE_RUNTIME_SOCKET: socket.value,
        ODSUITE_RUNTIME_TOKEN: capability.token,
      };
      const here = dirname(fileURLToPath(import.meta.url));
      const webroot = dirname(fileURLToPath(import.meta.resolve("@open-motion/web")));
      const carrierenv = {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        ODSUITE_RUNTIME_DAEMON: port.value,
        ODSUITE_RUNTIME_DATA: carrier.value,
        ODSUITE_RUNTIME_PROBE: "1",
        ODSUITE_RUNTIME_RELEASE: release,
        ODSUITE_RUNTIME_TOKEN: capability.token,
        ODSUITE_RUNTIME_WEB: webroot,
      };
      let lease: Lease | undefined;
      let child: ChildProcess | undefined;

      try {
        const daemonroot = dirname(fileURLToPath(import.meta.resolve("@open-motion/daemon")));
        lease = await client.start({
          args: [join(daemonroot, "main.mjs")],
          channel: channel("stable"),
          command: process.execPath,
          env: daemonenv,
          generation: digest("carrierdaemon"),
          namespace: scope,
          ready: "ready",
          service: "daemon",
        });
        await client.forward({ namespace: scope, channel: channel("stable") }, port.lease, socket.lease);
        const spawned = spawn(electron, [join(here, "../dist/main.mjs")], {
          env: carrierenv,
          stdio: ["ignore", "pipe", "pipe"],
        });
        child = spawned;
        expect(await output(spawned)).toContain('"status":"ready"');
      } finally {
        if (child?.exitCode === null) child.kill("SIGTERM");
        if (lease) await client.release(lease);
        await client.retire(capability);
        await service.close();
        await rm(root, { force: true, recursive: true });
      }
    },
  );
});
