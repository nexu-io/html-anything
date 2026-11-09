import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { serve } from "@odsuite/sidecar";
import { it } from "vitest";
import { Inspector } from "@/index.js";

it("discovers privately, scopes arbitrary methods and fences restarted services and managers", async () => {
  const root = await mkdtemp(join(tmpdir(), "inspect-"));
  const socket = join(root, "control.sock"),
    scope = { channel: channel("beta"), namespace: namespace("local") };
  const generation = digest("generation");
  let manager = await serve(socket, { root: root });
  try {
    const expose = () =>
      manager
        .factory(scope)
        .expose<{ sum: { input: number[]; output: number }; echo: { input: unknown; output: unknown } }>({
          identity: { service: "custom", generation },
          handlers: {
            sum: (v) => {
              if (!Array.isArray(v)) throw new Error("expected numbers");
              return v.reduce((a, b) => a + b, 0);
            },
            echo: (v) => v,
          },
          lifecycle: { initialize: async () => {}, stop: async () => {} },
        });
    const active = await expose();
    const inspector = await Inspector.open(root, scope);
    const first = (await inspector.list()).find((i) => i.service === "custom");
    assert.ok(first);
    const peer = await inspector.target<{
      sum: { input: number[]; output: number };
      echo: { input: unknown; output: unknown };
    }>("custom", generation, first.incarnation);
    assert.deepEqual(await Promise.all([peer.call("sum", [1, 2, 3]), peer.call("echo", { hello: true })]), [
      6,
      { hello: true },
    ]);
    await assert.rejects(peer.call("sum", null as unknown as number[]), /expected numbers/);
    const foreign = await Inspector.open(root, { ...scope, namespace: namespace("other") });
    assert.deepEqual(await foreign.list(), []);
    await assert.rejects(foreign.target("custom", generation), /not ready/);
    await assert.rejects(inspector.target("custom", digest("wrong")), /not ready/);
    await peer.stop();
    await active.closed;
    await expose();
    await assert.rejects(peer.probe(), /fenced/);
    await assert.rejects(inspector.target("custom", generation, first.incarnation), /stale/);
    await manager.close();
    await assert.rejects(readFile(join(root, "control.json")), { code: "ENOENT" });
    manager = await serve(socket, { root: root });
    await expose();
    await assert.rejects(inspector.list(), /authority/);
    assert.notEqual((await Inspector.open(root, scope)).manager, inspector.manager);
    if (process.platform !== "win32") {
      await chmod(join(root, "control.json"), 0o644);
      await assert.rejects(Inspector.open(root, scope), /private regular/);
      await chmod(join(root, "control.json"), 0o600);
    }
  } finally {
    await manager.close();
    await rm(root, { recursive: true, force: true });
  }
});
