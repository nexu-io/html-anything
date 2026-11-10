import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, readDirectory, serve } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import type { GatewayMethods, GenerationInput, Provider, Reply } from "@";
import { host } from "../src/host.js";

const intent = (): GenerationInput<"generation_create"> => ({
  sessionId: randomUUID(),
  artifactId: randomUUID(),
  revision: digest("revision"),
  providerId: "fixture",
  providerVersion: "account-one-v1",
  modelId: "png-v1",
  prompt: "PNG",
  requestId: randomUUID(),
});
function unwrap<T>(value: Reply<T>) {
  if (!value.ok) throw Error(value.error.message);
  return value.value;
}
/** Deterministic in-process adapter fault fixture, separate from real HTTP acceptance in host.test. */
async function fixture(_path?: string, behavior: { hold?: boolean; holdCancel?: boolean; submitFault?: boolean } = {}) {
  const directory = fileURLToPath(new URL("../../../.artifacts/gateway/", import.meta.url));
  await mkdir(directory, { recursive: true });
  const managerRoot = await mkdtemp(`${directory}lifecycle-`),
    service = await serve(managerEndpoint(managerRoot), { root: managerRoot });
  const factory = service.factory({ channel: channel("dev"), namespace: namespace("gatewaytest") });
  let submits = 0,
    cancelEntered = false,
    cancelAborted = false,
    journalBeforeSubmit = false;
  const untilAbort = (signal: AbortSignal, cancel = false) =>
    new Promise<never>((_resolve, reject) => {
      const abort = () => {
        if (cancel) cancelAborted = true;
        reject(Error("actual callback aborted"));
      };
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  const provider: Provider = {
    id: "fixture",
    version: "account-one-v1",
    models: [{ id: "png-v1", label: "PNG" }],
    submit: async (input) => {
      submits++;
      const journal = new DatabaseSync(join(gateway.root, "generations.sqlite"), { readOnly: true });
      try {
        journalBeforeSubmit = journal
          .prepare("SELECT record FROM jobs")
          .all()
          .some((row) => {
            const value = JSON.parse(String(row.record));
            return (
              value.requestId === input.requestId && value.state === "submitting" && value.submission === "unknown"
            );
          });
      } finally {
        journal.close();
      }
      if (behavior.submitFault) throw new Fault("invalid", "adapter failure after external acceptance");
      return { remoteId: "accepted-one" };
    },
    read: async (_id, signal) => untilAbort(signal),
    cancel: async (_id, signal) => {
      cancelEntered = true;
      if (behavior.holdCancel) await untilAbort(signal, true);
      return { confirmed: true };
    },
  };
  const gateway = await host(factory, { generation: digest("gateway"), provider });
  const peer = await factory.connect<GatewayMethods>({ service: "gateway", generation: digest("gateway") });
  return {
    gateway,
    peer,
    managerRoot,
    service,
    release() {},
    close: () => service.close(),
    get submits() {
      return submits;
    },
    get journalBeforeSubmit() {
      return journalBeforeSubmit;
    },
    get cancelEntered() {
      return cancelEntered;
    },
    get cancelAborted() {
      return cancelAborted;
    },
  };
}

it("aborts and drains the actual replacement cancellation controller during manager close", async () => {
  const f = await fixture(undefined, { hold: true, holdCancel: true }),
    input = intent();
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: created.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).submission).toBe("accepted");
    const running = unwrap(await f.peer.call("generation_read", owner));
    unwrap(
      await f.peer.call("generation_cancel", { ...owner, requestId: randomUUID(), expectedVersion: running.version }),
    );
    await expect.poll(() => f.cancelEntered).toBe(true);
    await f.service.close();
    expect(f.cancelAborted).toBe(true);
    expect((await readDirectory(f.managerRoot)).manager.phase).toBe("closed");
    const journal = new DatabaseSync(join(f.gateway.root, "generations.sqlite"), { readOnly: true });
    try {
      expect(
        JSON.parse(String(journal.prepare("SELECT record FROM jobs WHERE id=?").get(created.id)?.record)),
      ).toMatchObject({ state: "cancelling", submission: "accepted", remoteId: "accepted-one" });
    } finally {
      journal.close();
    }
  } finally {
    f.release();
    await f.service.close();
  }
}, 20000);
it("does not treat an adapter Fault invalid as definitive rejection of unknown submission", async () => {
  const f = await fixture(undefined, { submitFault: true }),
    input = intent();
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: created.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("interrupted");
    expect(unwrap(await f.peer.call("generation_read", owner))).toMatchObject({ submission: "unknown" });
    expect(f.submits).toBe(1);
    expect(f.journalBeforeSubmit).toBe(true);
    expect(unwrap(await f.peer.call("generation_create", input)).id).toBe(created.id);
    expect(f.submits).toBe(1);
  } finally {
    await f.close();
  }
}, 20000);
it("sanitizes unexpected journal errors as integrity and retains safe same-intent retry", async () => {
  const f = await fixture(),
    input = intent();
  const journal = new DatabaseSync(join(f.gateway.root, "generations.sqlite"));
  try {
    journal.exec(
      "CREATE TRIGGER reject_fixture BEFORE INSERT ON jobs BEGIN SELECT RAISE(FAIL,'PRIVATE_ADAPTER_SECRET'); END;",
    );
    const rejected = await f.peer.call("generation_create", input);
    expect(rejected).toMatchObject({
      ok: false,
      error: { code: "integrity", message: "generation operation could not be confirmed" },
    });
    expect(JSON.stringify(rejected)).not.toContain("PRIVATE_ADAPTER_SECRET");
    expect(f.submits).toBe(0);
    journal.exec("DROP TRIGGER reject_fixture;");
    const accepted = unwrap(await f.peer.call("generation_create", input));
    expect(unwrap(await f.peer.call("generation_create", input))).toEqual(accepted);
    await expect.poll(() => f.submits).toBe(1);
    expect(f.journalBeforeSubmit).toBe(true);
  } finally {
    journal.close();
    await f.close();
  }
}, 20000);
