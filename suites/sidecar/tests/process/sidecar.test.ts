import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, describe, expect, it } from "vitest";

import type { Spec } from "@";
import { Sidecar } from "../../src/host.js";

const hosts: Sidecar[] = [];
const roots: string[] = [];

function spec(name: string, ready = "ready"): Spec {
  return {
    args: ["-e", `process.stdout.write('ready\\n');setInterval(()=>{},1000)`],
    channel: channel("stable"),
    command: process.execPath,
    generation: digest(name),
    grace: 200,
    namespace: namespace("main"),
    ready,
    service: "daemon",
    timeout: 2000,
  };
}

function host(): Sidecar {
  const value = new Sidecar(join(tmpdir(), `host-${process.pid}`));
  hosts.push(value);
  return value;
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function dead(pid: number): Promise<boolean> {
  for (let index = 0; index < 25; index += 1) {
    if (!alive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  return !alive(pid);
}

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((value) => value.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("sidecar", () => {
  it("reuses one generation across attachments", async () => {
    const sidecar = host();
    const first = await sidecar.start(spec("one"));
    const second = await sidecar.attach(first);

    expect(second.pid).toBe(first.pid);
    expect(second.capability).not.toBe(first.capability);
    expect(await sidecar.inspect()).toEqual([
      expect.objectContaining({
        attachments: 2,
        pid: first.pid,
        state: "running",
      }),
    ]);
    expect(await sidecar.release(first)).toEqual({
      status: "retained",
      survivors: [],
    });
    await expect(sidecar.attach(first)).rejects.toThrow("capability");
    expect(await sidecar.release(second)).toEqual({
      status: "stopped",
      survivors: [],
    });
    expect(await sidecar.inspect()).toEqual([]);
  });

  it("rejects invalid capabilities", async () => {
    const sidecar = host();
    const value = await sidecar.start(spec("secure"));
    const forged = { ...value, capability: "forged" };
    const crossed = { ...value, namespace: namespace("other") };

    await expect(sidecar.attach(forged)).rejects.toThrow("capability");
    await expect(sidecar.release(forged)).rejects.toThrow("capability");
    await expect(sidecar.attach(crossed)).rejects.toThrow("unavailable");
  });

  it("rejects conflicting configuration for one generation", async () => {
    const sidecar = host();
    const value = spec("stable");
    await sidecar.start(value);

    await expect(sidecar.start({ ...value, ready: "other" })).rejects.toThrow("config mismatch");
  });

  it("retires a process that misses readiness", async () => {
    const sidecar = host();

    await expect(sidecar.start(spec("timeout", "never"))).rejects.toThrow("readiness timeout");
    expect(await sidecar.inspect()).toEqual([]);
  });

  it("keeps generations physically independent", async () => {
    const sidecar = host();
    const first = await sidecar.start(spec("first"));
    const second = await sidecar.start(spec("second"));

    expect(second.pid).not.toBe(first.pid);
    expect(await sidecar.inspect()).toHaveLength(2);
    await sidecar.release(first);
    expect(await sidecar.inspect()).toEqual([
      expect.objectContaining({
        generation: second.generation,
        state: "running",
      }),
    ]);
  });

  it("isolates equal generations across namespaces", async () => {
    const sidecar = host();
    const value = spec("shared");
    const first = await sidecar.start(value);
    const second = await sidecar.start({ ...value, namespace: namespace("other") });

    expect(second.pid).not.toBe(first.pid);
    expect(second.generation).toBe(first.generation);
    expect(second.namespace).not.toBe(first.namespace);
  });

  it("isolates distribution channels inside one namespace", async () => {
    const sidecar = host();
    const value = spec("shared");
    const first = await sidecar.start(value);
    const second = await sidecar.start({ ...value, channel: channel("beta") });

    expect(second.pid).not.toBe(first.pid);
    expect(second.namespace).toBe(first.namespace);
    expect(second.channel).not.toBe(first.channel);
  });

  it("passes declared resources without leaking management authority", async () => {
    const prior = process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;
    process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY = "secret";
    const source = [
      "if(process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY)process.exit(2);",
      "if(process.env.ODSUITE_RUNTIME_DATA!=='granted')process.exit(3);",
      "process.stdout.write('ready\\n');setInterval(()=>{},1000);",
    ].join("");

    try {
      const value = await host().start({
        ...spec("environment"),
        args: ["-e", source],
        env: { ODSUITE_RUNTIME_DATA: "granted" },
      });
      expect(value.pid).toBeGreaterThan(0);
    } finally {
      if (prior === undefined) delete process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;
      else process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY = prior;
    }
  });

  it.runIf(process.platform !== "win32")("retires the complete process group", async () => {
    const root = await mkdtemp(join(tmpdir(), "sidecar-"));
    const file = join(root, "pid");
    roots.push(root);
    const source = [
      "const { spawn } = await import('node:child_process');",
      "const { writeFileSync } = await import('node:fs');",
      "const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)']);",
      `writeFileSync(${JSON.stringify(file)}, String(child.pid));`,
      "process.stdout.write('ready\\n');",
      "setInterval(()=>{},1000);",
    ].join("");
    const sidecar = host();
    const value = await sidecar.start({
      ...spec("tree"),
      args: ["--input-type=module", "-e", source],
    });
    const child = Number(await readFile(file, "utf8"));

    expect(alive(child)).toBe(true);
    expect(await sidecar.release(value)).toEqual({ status: "stopped", survivors: [] });
    expect(await dead(child)).toBe(true);
  });
});
