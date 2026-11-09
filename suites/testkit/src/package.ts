import { type ChildProcess, spawn } from "node:child_process";
import { cp } from "node:fs/promises";
import { basename, join } from "node:path";
import { inspect, pack } from "@odsuite/pack";
import { channel, type Digest, digest, namespace } from "@odsuite/protocol";
import { distinct, type Manifest, resolve } from "@odsuite/release";
import type { Mount } from "@odsuite/runtime";
import type { Client, Lease } from "@odsuite/sidecar";

export interface Installed {
  artifacts: Digest[];
  built: string[];
  pids: number[];
  restored: string[];
  survivors: number[];
  transitions: string[];
}

export interface Sources {
  carrier: string;
  daemon: string;
  web: string;
}

export interface Selections {
  beta: Mount;
  stable: Mount;
}

interface Launch {
  pid: number;
  survivors: number[];
}

function output(child: ChildProcess): Promise<Record<string, unknown>> {
  return new Promise((done, reject) => {
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => reject(new Error(`installed carrier timeout:${stderr}`)), 30000);
    child.stdout?.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`installed carrier exited ${code}:${stderr}`));
      else done(JSON.parse(stdout) as Record<string, unknown>);
    });
  });
}

async function launch(client: Client, app: string, manifest: Manifest, mount: Mount): Promise<Launch> {
  const scope = namespace(`installed${manifest.channel}`);
  const owner = `installed${manifest.channel}`;
  const capability = await client.issue({ channel: manifest.channel, namespace: scope, owner, service: "daemon" });
  const data = await client.grant(
    { namespace: scope, channel: manifest.channel },
    { kind: "data", name: "daemon", scope: "factory" },
  );
  const carrier = await client.grant(
    { namespace: scope, channel: manifest.channel },
    { kind: "data", name: "carrier", scope: "factory" },
  );
  const socket = await client.grant(
    { namespace: scope, channel: manifest.channel },
    { kind: "socket", name: "daemon", owner, scope: "attempt" },
  );
  const port = await client.grant(
    { namespace: scope, channel: manifest.channel },
    {
      kind: "port",
      name: "daemon",
      owner,
      scheme: "http",
      scope: "attempt",
    },
  );
  const executable = join(app, "Contents", "MacOS", manifest.identity.scheme);
  const resources = join(app, "Contents", "Resources");
  let lease: Lease | undefined;
  let child: ChildProcess | undefined;
  let pid = 0;
  let status = "stopped";
  let survivors: number[] = [];

  try {
    lease = await client.start({
      args: [join(mount.daemon, "main.mjs")],
      channel: manifest.channel,
      command: executable,
      env: {
        ELECTRON_RUN_AS_NODE: "1",
        ODSUITE_RUNTIME_DATA: data.value,
        ODSUITE_RUNTIME_ORIGIN: manifest.identity.origin,
        ODSUITE_RUNTIME_SOCKET: socket.value,
        ODSUITE_RUNTIME_TOKEN: capability.token,
      },
      generation: digest(`installed${manifest.channel}`),
      namespace: scope,
      ready: "ready",
      service: "daemon",
    });
    await client.forward({ namespace: scope, channel: manifest.channel }, port.lease, socket.lease);
    child = spawn(executable, [], {
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        ODSUITE_RUNTIME_DAEMON: port.value,
        ODSUITE_RUNTIME_DATA: carrier.value,
        ODSUITE_RUNTIME_PROBE: "1",
        ODSUITE_RUNTIME_RELEASE: join(resources, "release.json"),
        ODSUITE_RUNTIME_TOKEN: capability.token,
        ODSUITE_RUNTIME_WEB: mount.web,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const result = await output(child);
    if (result.origin !== manifest.identity.origin || result.version !== manifest.identity.version) {
      throw new Error("installed identity mismatch");
    }
    pid = lease.pid;
  } finally {
    if (child?.exitCode === null) child.kill("SIGTERM");
    try {
      if (lease) {
        const released = await client.release(lease);
        survivors = released.survivors;
        status = released.status;
      }
    } finally {
      await client.retire(capability);
    }
  }
  if (status !== "stopped") throw new Error(`daemon retirement is ${status}`);
  return { pid, survivors };
}

export async function installed(
  client: Client,
  temporary: string,
  sources: Sources,
  selections: Selections,
): Promise<Installed> {
  const manifests = [
    resolve({}, { channel: channel("stable"), version: "1.0.0" }),
    resolve({}, { channel: channel("beta"), version: "1.0.0-beta.1" }),
  ];
  distinct(manifests);
  const install = join(temporary, "install");
  const built: string[] = [];
  const pids: number[] = [];
  const survivors: number[] = [];

  for (const manifest of manifests) {
    const mount = manifest.channel === "stable" ? selections.stable : selections.beta;
    const result = await pack({
      ...sources,
      manifest,
      output: join(temporary, "pack", manifest.channel),
    });
    const app = join(install, basename(result.app));
    await cp(result.app, app, {
      preserveTimestamps: true,
      recursive: true,
      verbatimSymlinks: true,
    });
    const receipt = await inspect(app);
    if (receipt.appid !== manifest.identity.appid || receipt.version !== manifest.identity.version) {
      throw new Error("installed bundle identity mismatch");
    }
    built.push(basename(app));
    const launched = await launch(client, app, manifest, mount);
    pids.push(launched.pid);
    survivors.push(...launched.survivors);
  }
  return {
    artifacts: [selections.stable.target, selections.beta.target],
    built,
    pids,
    restored: ["capsule", "daemon", "web", "model"],
    survivors,
    transitions: ["select", "mount", "pack", "install", "launch", "ready"],
  };
}
