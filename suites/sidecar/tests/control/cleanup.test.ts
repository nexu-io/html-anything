import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { type Context, type Lease, managerEndpoint, observeProcesses, readDirectory, serve } from "@";

it("drains a registered owner's background cleanup after shutdown forbids new management sessions", async () => {
  const root = await mkdtemp(join(tmpdir(), "sidecar-owner-cleanup-")),
    manager = await serve(managerEndpoint(root), { root }),
    factory = manager.factory({ channel: channel("dev"), namespace: namespace("cleanup") });
  let context!: Context,
    lease!: Lease,
    release = () => {},
    background!: Promise<void>,
    drained = false;
  const gate = new Promise<void>((done) => {
    release = done;
  });
  await factory.expose<{ invalid: { input: unknown; output: unknown } }>({
    identity: { service: "owner", generation: digest("owner cleanup") },
    handlers: { invalid: () => context.cleanup(async () => true) },
    lifecycle: {
      initialize: async (ctx) => {
        context = ctx;
        const entry = join(ctx.roots.runtime, "worker.mjs");
        await writeFile(entry, 'process.stdout.write("ready\\n");setInterval(()=>{},1000);');
        lease = await factory.start({
          service: "worker",
          generation: digest("worker"),
          command: process.execPath,
          args: [entry],
          ready: "ready",
        });
        background = ctx.background(async () => {
          await gate;
          await ctx.cleanup(() =>
            factory.session(async (scoped) => {
              await expect(
                scoped.grant({ kind: "staging", name: "late", owner: ctx.incarnation, scope: "attempt" }),
              ).rejects.toThrow("closing");
              expect((await scoped.release(lease)).status).toBe("stopped");
              drained = true;
            }),
          );
        });
      },
      quiesce: async () => {
        release();
        await background;
      },
      stop: async () => {},
    },
  });
  try {
    const peer = await factory.connect<{ invalid: { input: unknown; output: unknown } }>({
      service: "owner",
      generation: digest("owner cleanup"),
    });
    await expect(peer.call("invalid", null)).rejects.toThrow("business callbacks");
    await manager.close();
    expect(drained).toBe(true);
    expect(await observeProcesses(root)).toEqual([]);
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    await expect(context.cleanup(async () => {})).rejects.toThrow("retired");
  } finally {
    await manager.close();
  }
});
