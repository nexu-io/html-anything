import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { Library } from "@odsuite/blob";
import { channel, digest, namespace } from "@odsuite/protocol";
import { managerEndpoint, readDirectory, serve } from "@odsuite/sidecar";
import { Fault } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import type { Candidate, GatewayMethods, GenerationInput, Reply } from "@";
import { readCandidate } from "@";
import { host } from "../src/host.js";
import type { Provider } from "../src/provider.js";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
async function root() {
  const directory = fileURLToPath(new URL("../../../.artifacts/gateway/", import.meta.url));
  await mkdir(directory, { recursive: true });
  return mkdtemp(`${directory}run-`);
}
const intent = (): GenerationInput<"generation_create"> => ({
  sessionId: randomUUID(),
  artifactId: randomUUID(),
  revision: digest("revision"),
  providerId: "loopback",
  providerVersion: "account-one-v1",
  modelId: "png-v1",
  prompt: "A verified PNG",
  requestId: randomUUID(),
});
function unwrap<T>(value: Reply<T>) {
  if (!value.ok) throw Error(`${value.error.code}: ${value.error.message}`);
  return value.value;
}
async function fixture(
  path?: string,
  behavior: {
    lost?: boolean;
    hold?: boolean;
    invalid?: boolean;
    ignoreAbort?: boolean;
    cancelConfirmed?: boolean;
    submitFault?: boolean;
    holdCancel?: boolean;
  } = {},
) {
  const managerRoot = path ?? (await root()),
    service = await serve(managerEndpoint(managerRoot), { root: managerRoot });
  const factory = service.factory({ channel: channel("dev"), namespace: namespace("gatewaytest") });
  let origin = "",
    submits = 0,
    reads = 0,
    cancels = 0,
    aborted = false,
    cancelEntered = false,
    cancelAborted = false,
    journalBeforeSubmit = false;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const server = createServer((request, response) => {
    if (request.url === "/submit") {
      submits++;
      response.statusCode = behavior.lost ? 503 : 200;
      response.end(JSON.stringify({ remoteId: "accepted-one" }));
    } else if (request.url === "/cancel") {
      cancels++;
      response.end(JSON.stringify({ confirmed: behavior.cancelConfirmed !== false }));
    } else {
      reads++;
      response.end(
        JSON.stringify({
          state: "succeeded",
          data: (behavior.invalid ? Buffer.from("not PNG") : png).toString("base64"),
        }),
      );
    }
  });
  const source = await factory.expose({
    identity: { service: "providerfixture", generation: digest("providerfixture") },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        const port = await context.allocate({ kind: "port", name: "providerfixture", scheme: "http" }),
          socket = await context.allocate({ kind: "socket", name: "providerfixture" });
        origin = port.value;
        await new Promise<void>((resolve) => server.listen(socket.value, resolve));
        await context.forward(port.value, socket.value);
      },
      stop: async () => {
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      },
    },
  });
  const request = async (path: string, signal: AbortSignal) => {
    const response = await fetch(origin + path, { method: "POST", signal });
    if (!response.ok) throw Error("fixture transport interrupted");
    return response.json();
  };
  const provider: Provider = {
    id: "loopback",
    version: "account-one-v1",
    models: [{ id: "png-v1", label: "PNG fixture" }],
    submit: async (_input, signal) => {
      const journal = new DatabaseSync(join(gateway.root, "generations.sqlite"), { readOnly: true });
      try {
        const rows = journal
          .prepare("SELECT record FROM jobs")
          .all()
          .map((row) => JSON.parse(String(row.record)));
        journalBeforeSubmit = rows.some(
          (row) => row.requestId === _input.requestId && row.state === "submitting" && row.submission === "unknown",
        );
        if (!journalBeforeSubmit) throw Error("provider invocation preceded durable intent marker");
      } finally {
        journal.close();
      }
      const result = await request("/submit", signal);
      if (behavior.submitFault) throw new Fault("invalid", "Private adapter failure must not prove rejection");
      return result;
    },
    read: async (_id, signal) => {
      if (behavior.hold) {
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            aborted = true;
            if (!behavior.ignoreAbort) reject(Error("aborted actual fixture read"));
          };
          signal.addEventListener("abort", abort, { once: true });
          void gate.then(() => {
            signal.removeEventListener("abort", abort);
            resolve();
          });
        });
      }
      const value = await request("/read", behavior.ignoreAbort ? new AbortController().signal : signal);
      return { state: "succeeded", bytes: Buffer.from(value.data, "base64") };
    },
    cancel: async (_id, signal) => {
      const result = await request("/cancel", signal);
      if (behavior.holdCancel)
        await new Promise<void>((_resolve, reject) => {
          cancelEntered = true;
          const abort = () => {
            cancelAborted = true;
            reject(Error("actual held cancellation aborted"));
          };
          if (signal.aborted) abort();
          else signal.addEventListener("abort", abort, { once: true });
        });
      return result;
    },
  };
  const gateway = await host(factory, { generation: digest("gateway"), provider });
  const peer = await factory.connect<GatewayMethods>({ service: "gateway", generation: digest("gateway") });
  return {
    managerRoot,
    service,
    factory,
    gateway,
    peer,
    provider,
    source,
    release,
    get submits() {
      return submits;
    },
    get reads() {
      return reads;
    },
    get cancels() {
      return cancels;
    },
    get aborted() {
      return aborted;
    },
    get cancelEntered() {
      return cancelEntered;
    },
    get cancelAborted() {
      return cancelAborted;
    },
    get journalBeforeSubmit() {
      return journalBeforeSubmit;
    },
    close: async () => {
      release();
      await service.close();
    },
  };
}

it("uses actual loopback HTTP, verifies persistent PNG, rejects wrong owner and restores result offline", async () => {
  const f = await fixture(),
    input = intent();
  let candidate: Candidate | undefined;
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    expect(unwrap(await f.peer.call("generation_create", input))).toEqual(created);
    const owner = { id: created.id, sessionId: input.sessionId, artifactId: input.artifactId };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("succeeded");
    const result = unwrap(await f.peer.call("generation_result", owner));
    candidate = result.candidate;
    expect(await readCandidate(f.gateway.root, candidate)).toEqual(png);
    expect(candidate).toMatchObject({ width: 32, height: 24, contentHash: digest(png) });
    expect(f.submits).toBe(1);
    expect(f.reads).toBe(1);
    expect(await f.peer.call("generation_read", { ...owner, sessionId: randomUUID() })).toMatchObject({
      ok: false,
      error: { code: "ownership" },
    });
    expect(await f.peer.call("generation_create", { ...input, prompt: "Changed" })).toMatchObject({
      ok: false,
      error: { code: "idempotency" },
    });
    const resources = await f.factory.resources(),
      grant = resources.grants.find((value) => value.kind === "data" && value.name === "gatewayblob");
    if (!grant) throw Error("missing actual Blob grant");
    const state = JSON.parse(await readFile(`${grant.value}/library.json`, "utf8"));
    expect(Object.values(state.entries)).toHaveLength(1);
    expect(Object.values(state.entries).every((value) => (value as { uses: unknown[] }).uses.length === 0)).toBe(true);
  } finally {
    await f.close();
  }
  const service = await serve(managerEndpoint(f.managerRoot), { root: f.managerRoot });
  try {
    const factory = service.factory({ channel: channel("dev"), namespace: namespace("gatewaytest") });
    const gateway = await host(factory, { generation: digest("gateway") });
    const peer = await factory.connect<GatewayMethods>({ service: "gateway", generation: digest("gateway") });
    expect(unwrap(await peer.call("generation_status", {}))).toMatchObject({ configured: false, providers: [] });
    const replay = unwrap(await peer.call("generation_create", input));
    expect(replay.state).toBe("queued");
    const result = unwrap(
      await peer.call("generation_result", { id: replay.id, sessionId: input.sessionId, artifactId: input.artifactId }),
    );
    expect(result.candidate).toEqual(candidate);
    expect(await readCandidate(gateway.root, result.candidate)).toEqual(png);
    expect(await peer.call("generation_create", { ...input, requestId: randomUUID() })).toMatchObject({
      ok: false,
      error: { code: "invalid" },
    });
  } finally {
    await service.close();
  }
}, 20000);
it("never resubmits an unknown submission after lost response and restart", async () => {
  const f = await fixture(undefined, { lost: true }),
    input = intent();
  let id = "";
  try {
    id = unwrap(await f.peer.call("generation_create", input)).id;
    await expect
      .poll(
        async () =>
          unwrap(await f.peer.call("generation_read", { sessionId: input.sessionId, artifactId: input.artifactId, id }))
            .state,
      )
      .toBe("interrupted");
    expect(f.submits).toBe(1);
    expect(
      unwrap(await f.peer.call("generation_read", { sessionId: input.sessionId, artifactId: input.artifactId, id })),
    ).toMatchObject({ submission: "unknown" });
  } finally {
    await f.close();
  }
  const cold = await fixture(f.managerRoot);
  try {
    expect(unwrap(await cold.peer.call("generation_create", input)).id).toBe(id);
    expect(
      unwrap(await cold.peer.call("generation_read", { sessionId: input.sessionId, artifactId: input.artifactId, id }))
        .submission,
    ).toBe("unknown");
    expect(cold.submits).toBe(0);
  } finally {
    await cold.close();
  }
}, 20000);
it("shutdown drains an active provider callback, then accepted remote identity resumes without submit", async () => {
  const f = await fixture(undefined, { hold: true }),
    input = intent();
  let id = "";
  try {
    id = unwrap(await f.peer.call("generation_create", input)).id;
    await expect
      .poll(
        async () =>
          unwrap(await f.peer.call("generation_read", { sessionId: input.sessionId, artifactId: input.artifactId, id }))
            .submission,
      )
      .toBe("accepted");
    await f.service.close();
    expect(f.aborted).toBe(true);
    expect((await readDirectory(f.managerRoot)).manager.phase).toBe("closed");
  } finally {
    f.release();
    await f.service.close();
  }
  const cold = await fixture(f.managerRoot);
  try {
    await expect
      .poll(
        async () =>
          unwrap(
            await cold.peer.call("generation_read", { sessionId: input.sessionId, artifactId: input.artifactId, id }),
          ).state,
      )
      .toBe("succeeded");
    expect(cold.submits).toBe(0);
    expect(cold.reads).toBe(1);
  } finally {
    await cold.close();
  }
}, 20000);
it("pages complete maximum multibyte prompts through actual bounded Peer frames", async () => {
  const f = await fixture(undefined, { hold: true }),
    input = intent(),
    ids: string[] = [];
  try {
    for (let index = 0; index < 20; index++)
      ids.push(
        unwrap(await f.peer.call("generation_create", { ...input, requestId: randomUUID(), prompt: "界".repeat(8000) }))
          .id,
      );
    const seen: string[] = [];
    let before: string | undefined;
    do {
      const page = unwrap(
        await f.peer.call("generation_list", {
          sessionId: input.sessionId,
          artifactId: input.artifactId,
          limit: 16,
          ...(before ? { before } : {}),
        }),
      );
      expect(Buffer.byteLength(JSON.stringify(page))).toBeLessThanOrEqual(48 * 1024);
      expect(page.jobs.length).toBeGreaterThan(0);
      expect(page.jobs.length).toBeLessThan(16);
      for (const job of page.jobs) expect(job.prompt).toBe("界".repeat(8000));
      seen.push(...page.jobs.map((job) => job.id));
      before = page.next ?? undefined;
    } while (before);
    expect(seen).toEqual(ids.reverse());
    expect(new Set(seen).size).toBe(20);
  } finally {
    await f.close();
  }
}, 20000);
it("cancels queued work without invoking provider and confirms running cancellation", async () => {
  const f = await fixture(undefined, { hold: true }),
    input = intent();
  try {
    const first = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: first.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).submission).toBe("accepted");
    const queued = unwrap(await f.peer.call("generation_create", { ...input, requestId: randomUUID() }));
    const cancelled = unwrap(
      await f.peer.call("generation_cancel", {
        ...owner,
        id: queued.id,
        requestId: randomUUID(),
        expectedVersion: queued.version,
      }),
    );
    expect(cancelled).toMatchObject({ state: "cancelled", submission: "not-started" });
    const running = unwrap(await f.peer.call("generation_read", owner));
    const cancel = { ...owner, requestId: randomUUID(), expectedVersion: running.version };
    const receipt = unwrap(await f.peer.call("generation_cancel", cancel));
    expect(unwrap(await f.peer.call("generation_cancel", cancel))).toEqual(receipt);
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("cancelled");
    expect(f.submits).toBe(1);
    expect(f.cancels).toBe(1);
    expect(f.aborted).toBe(true);
    expect(await f.peer.call("generation_result", owner)).toMatchObject({ ok: false, error: { code: "conflict" } });
  } finally {
    await f.close();
  }
}, 20000);
it("rejects invalid PNG output without marking it successful or adoptable", async () => {
  const f = await fixture(undefined, { invalid: true }),
    input = intent();
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: created.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("failed");
    expect(await f.peer.call("generation_result", owner)).toMatchObject({ ok: false, error: { code: "conflict" } });
  } finally {
    await f.close();
  }
}, 20000);
it("preserves a late verified candidate when confirmed cancellation wins without allowing adoption", async () => {
  const f = await fixture(undefined, { hold: true, ignoreAbort: true }),
    input = intent();
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: created.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).submission).toBe("accepted");
    const current = unwrap(await f.peer.call("generation_read", owner));
    unwrap(
      await f.peer.call("generation_cancel", { ...owner, requestId: randomUUID(), expectedVersion: current.version }),
    );
    f.release();
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("cancelled");
    const cancelled = unwrap(await f.peer.call("generation_read", owner));
    if (!cancelled.candidate) throw Error("late immutable candidate was lost");
    expect(await readCandidate(f.gateway.root, cancelled.candidate)).toEqual(png);
    expect(await f.peer.call("generation_result", owner)).toMatchObject({ ok: false, error: { code: "conflict" } });
    expect(f.submits).toBe(1);
    expect(f.cancels).toBe(1);
  } finally {
    await f.close();
  }
}, 20000);
it("retains unconfirmed cancellation intent on restart instead of resuming generation", async () => {
  const f = await fixture(undefined, { hold: true, cancelConfirmed: false }),
    input = intent();
  let id = "";
  try {
    id = unwrap(await f.peer.call("generation_create", input)).id;
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).submission).toBe("accepted");
    const current = unwrap(await f.peer.call("generation_read", owner));
    unwrap(
      await f.peer.call("generation_cancel", { ...owner, requestId: randomUUID(), expectedVersion: current.version }),
    );
    await expect.poll(() => f.cancels).toBe(1);
    expect(unwrap(await f.peer.call("generation_read", owner))).toMatchObject({
      state: "cancelling",
      submission: "accepted",
      remoteId: "accepted-one",
    });
  } finally {
    await f.close();
  }
  const cold = await fixture(f.managerRoot);
  try {
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id };
    await expect.poll(async () => unwrap(await cold.peer.call("generation_read", owner)).state).toBe("cancelled");
    expect(cold.cancels).toBe(1);
    expect(cold.submits).toBe(0);
    expect(cold.reads).toBe(0);
  } finally {
    await cold.close();
  }
}, 20000);
it("collects temporary Blob content while immutable PNG candidate remains readable", async () => {
  const f = await fixture(),
    input = intent();
  let library: Library | undefined;
  try {
    const created = unwrap(await f.peer.call("generation_create", input));
    const owner = { sessionId: input.sessionId, artifactId: input.artifactId, id: created.id };
    await expect.poll(async () => unwrap(await f.peer.call("generation_read", owner)).state).toBe("succeeded");
    const result = unwrap(await f.peer.call("generation_result", owner));
    await f.gateway.quiesce();
    await f.gateway.close();
    await f.factory.expose({
      identity: { service: "collectorfixture", generation: digest("collectorfixture") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({ factory: f.factory, context, name: "gatewayblob", retentionMs: 0 });
        },
        stop: async () => {
          await library?.close();
        },
      },
    });
    if (!library) throw Error("missing actual hosted library");
    expect(await library.collect()).toHaveLength(1);
    expect(await readCandidate(f.gateway.root, result.candidate)).toEqual(png);
  } finally {
    await f.close();
  }
}, 20000);
