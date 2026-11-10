import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { channel, namespace } from "@odsuite/protocol";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { open, type Status } from "@open-motion/standalone";
import type { SessionDetail } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

const built = async () => JSON.parse(await readFile(resolve("dist/runtime/runtime.json"), "utf8"));
function connection(root: string, lane: string) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve("dist/runtime/main.mjs")],
    env: {
      OPEN_MOTION_ROOT: root,
      OPEN_MOTION_CHANNEL: lane,
      OPEN_MOTION_NAMESPACE: "installed",
    },
    stderr: "pipe",
  });
  transport.stderr?.on("data", () => {});
  const client = new Client({ name: "installed-host-test", version: "1.0.0" });
  return {
    client,
    transport,
    close: async () => {
      await client.close();
      await transport.close();
    },
  };
}

it("shares an existing matching standalone between concurrent installed clients without transferring stop ownership", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-installed-")),
    identity = await built(),
    scope = { channel: channel(identity.channel), namespace: namespace("installed") };
  const runtime = await open({ root, scope, version: identity.version });
  const first = connection(root, identity.channel),
    second = connection(root, identity.channel);
  const report: Record<string, unknown> = { root, version: identity.version };
  const failures: unknown[] = [];
  try {
    await Promise.all([first.client.connect(first.transport), second.client.connect(second.transport)]);
    const a = (await first.client.callTool({ name: "runtime_status", arguments: {} }))
      .structuredContent as unknown as Status;
    expect(a.manifest).toEqual((await runtime.status()).manifest);
    expect(a.environment.carrier).toBe("standalone");
    const original = runtime.manager.directory();
    expect(
      original.instances.filter((instance) => instance.service === "standalone" && instance.phase === "ready"),
    ).toHaveLength(1);
    const created = (
      await first.client.callTool({
        name: "session_create",
        arguments: { title: "Shared installed session", requestId: randomUUID(), mode: "motion" },
      })
    ).structuredContent as unknown as SessionDetail;
    await first.close();
    expect(runtime.manager.directory().manager).toEqual(original.manager);
    const read = await second.client.callTool({ name: "session_get", arguments: { sessionId: created.id } });
    expect(read.isError).not.toBe(true);
    expect((await runtime.status()).daemon.ok).toBe(true);
    await second.close();
    expect(runtime.manager.directory().manager.phase).toBe("active");
    expect((await fetch((await runtime.status()).web)).ok).toBe(true);
    report.sharedSession = created.id;
    report.attachedEOFLeavesStandaloneActive = true;
  } catch (error) {
    failures.push(error);
  } finally {
    for (const item of [first, second])
      try {
        await item.close();
      } catch (error) {
        failures.push(error);
      }
    try {
      await runtime.close();
    } catch (error) {
      failures.push(error);
    }
    try {
      const directory = await readDirectory(root),
        processes = await observeProcesses(root);
      report.closed = directory.manager.phase;
      report.processes = processes;
      expect(directory.manager.phase).toBe("closed");
      expect(processes).toEqual([]);
    } catch (error) {
      failures.push(error);
    }
    const evidence = resolve("../../.artifacts/codex-installed", randomUUID());
    await mkdir(evidence, { recursive: true });
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failures.length) throw new AggregateError(failures, "installed attachment or drain failed");
}, 30000);

it("refuses a live manager without a ready matching composition instead of starting another authority", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-unready-")),
    identity = await built();
  const manager = await serve(managerEndpoint(root), { root }),
    client = connection(root, identity.channel);
  try {
    await expect(client.client.connect(client.transport)).rejects.toThrow();
    expect(manager.directory().manager.phase).toBe("active");
    expect(manager.directory().instances).toHaveLength(0);
  } finally {
    await client.close();
    await manager.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  }
}, 15000);

it("refuses an existing composition from another release without stopping it", async () => {
  const root = await mkdtemp(join(tmpdir(), "codex-mismatch-")),
    identity = await built();
  const version = identity.channel === "stable" ? "0.0.1" : `0.0.1-${identity.channel}.1`;
  const runtime = await open({
    root,
    scope: { channel: channel(identity.channel), namespace: namespace("installed") },
    version,
  });
  const client = connection(root, identity.channel);
  try {
    await expect(client.client.connect(client.transport)).rejects.toThrow();
    expect((await runtime.status()).manifest.identity.version).toBe(version);
    expect((await runtime.status()).daemon.ok).toBe(true);
  } finally {
    await client.close();
    await runtime.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  }
}, 15000);
