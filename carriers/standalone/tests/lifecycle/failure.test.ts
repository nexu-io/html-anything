import { digest } from "@odsuite/protocol";
import type { Context, Factory } from "@odsuite/sidecar";
import { expect, it, vi } from "vitest";
import { Daemon } from "@/daemon.js";
import { collect } from "@/environment.js";

it("retains capability and resource protection when failed startup has unresolved process ownership", async () => {
  const generation = digest("failure");
  let phase = "failed";
  const retire = vi.fn();
  const factory = {
    issue: async () => ({ token: "test" }),
    start: async () => {
      throw new Error("launch failed");
    },
    directory: async () => ({ instances: [{ service: "daemon", generation, phase }] }),
    retire,
  } as unknown as Factory;
  const context = {
    incarnation: "example",
    roots: { data: "/unused" },
    allocate: async (request: { kind: string }) => ({ kind: request.kind, value: "/unused" }),
  } as unknown as Context;
  const daemon = new Daemon(factory);
  await expect(
    daemon.start(context, { entry: "/unused", origin: "http://127.0.0.1:4000", generation, environment: collect() }),
  ).rejects.toThrow("launch failed");
  await expect(daemon.close()).rejects.toThrow("retirement unresolved");
  expect(retire).not.toHaveBeenCalled();
  phase = "retired";
  await daemon.close();
  expect(retire).toHaveBeenCalledTimes(1);
});
