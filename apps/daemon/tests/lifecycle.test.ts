import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createConnection, type Socket } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { digest, factoryScope } from "@odsuite/protocol";
import { serve as manager, managerEndpoint, observeProcesses, readDirectory } from "@odsuite/sidecar";
import { host } from "@open-motion/templates/host";
import type { PrismConfig } from "@open-motion/templates/prism";
import { initialFiles } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { serve } from "@/service.js";
import { Client } from "@/transport/client.js";

async function fixture(checkpoint: () => Promise<void>, sourceGate?: () => Promise<void>) {
  const root = join(fileURLToPath(new URL("../../../.artifacts/", import.meta.url)), "prism-lifecycle", randomUUID());
  await mkdir(root, { recursive: true });
  const control = await manager(managerEndpoint(root), { root }),
    factory = control.factory(factoryScope({ channel: "dev", namespace: "prism" }));
  let origin = "",
    catalogRequests = 0,
    address = "";
  const sources = initialFiles(),
    files = new Map(sources.map((file) => [digest(file.content).slice(7), Buffer.from(file.content)]));
  const remote = createServer((request, response) => {
    if (request.url?.startsWith("/resources/")) {
      catalogRequests++;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
          environment: "dev",
          channel: "default",
          publicationId: "first",
          defaultLocale: "en",
          content: {
            en: {
              templates: [
                {
                  templateId: "handoff",
                  sortOrder: 1,
                  original: { templateName: "Handoff", license: "Apache-2.0" },
                  files: sources.map((file) => ({
                    path: file.path,
                    url: `${origin}/files/${digest(file.content).slice(7)}`,
                    bytes: Buffer.byteLength(file.content),
                    sha256: digest(file.content).slice(7),
                  })),
                },
              ],
            },
          },
        }),
      );
      return;
    }
    const bytes = files.get(request.url?.slice("/files/".length) ?? "");
    response.writeHead(bytes ? 200 : 404);
    if (bytes && sourceGate) {
      response.write(bytes.subarray(0, 1));
      void sourceGate().then(() => response.end(bytes.subarray(1)));
    } else response.end(bytes);
  });
  await factory.expose({
    identity: { service: "publication", generation: digest("publication") },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        const socket = await context.allocate({ kind: "socket", name: "publication" }),
          port = await context.allocate({ kind: "port", name: "publication", scheme: "http" });
        await new Promise<void>((done) => remote.listen(socket.value, done));
        await context.forward(port.value, socket.value);
        origin = port.value;
      },
      stop: async () => new Promise<void>((done, reject) => remote.close((error) => (error ? reject(error) : done()))),
    },
  });
  const config: PrismConfig = {
    origin,
    environment: "dev",
    channel: "default",
    resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
    locale: "en",
  };
  let binding = await host(factory, { generation: digest("templates"), config });
  const startDaemon = async () => {
    let service: Awaited<ReturnType<typeof serve>> | undefined;
    return factory.expose({
      identity: { service: "daemon", generation: digest("daemon") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          const socket = await context.allocate({ kind: "socket", name: "daemon" }),
            port = await context.allocate({ kind: "port", name: "daemon", scheme: "http" });
          address = port.value;
          service = await context.background(() =>
            serve({
              data: context.roots.data,
              origin: "http://fixture.invalid",
              socket: socket.value,
              token: "authority",
              prism: binding,
              onPrismRead: checkpoint,
            }),
          );
          await context.forward(port.value, socket.value);
        },
        quiesce: async () => service?.quiesce(),
        stop: async () => service?.close(),
      },
    });
  };
  let daemon = await startDaemon();
  const grants = await factory.resources(),
    blob = grants.grants.find((grant) => grant.kind === "data" && grant.name === "templates")!,
    metadata = grants.grants.find(
      (grant) => grant.kind === "data" && grant.name === `h${digest("templates").slice(7, 31)}`,
    )!;
  const uses = async () =>
    Object.values(JSON.parse(await readFile(join(blob.value, "library.json"), "utf8")).entries).flatMap(
      (entry) => (entry as { uses: { owner: { service: string; incarnation: string }; path: string }[] }).uses,
    );
  return {
    root,
    control,
    factory,
    client: () => new Client(address, "authority"),
    address: () => address,
    uses,
    metadata: join(metadata.value, "catalog.json"),
    requests: () => catalogRequests,
    binding: () => binding,
    reopen: async () => {
      await daemon.close();
      await binding.close();
      binding = await host(factory, { generation: digest("templates"), config });
      daemon = await startDaemon();
    },
  };
}
for (const mode of ["manager", "same-factory"] as const)
  it(`keeps the actual Daemon read Use live while ${mode} shutdown waits for its acknowledgement`, async () => {
    let hold = false,
      release = () => {},
      entered = () => {};
    const gate = new Promise<void>((done) => {
        release = done;
      }),
      started = new Promise<void>((done) => {
        entered = done;
      });
    const runtime = await fixture(async () => {
      if (hold) {
        entered();
        await gate;
      }
    });
    let read: Promise<unknown> | undefined,
      closing: Promise<unknown> | undefined,
      closed = false;
    let unused: Socket | undefined;
    try {
      if (mode === "manager") {
        const address = new URL(runtime.address());
        unused = createConnection({ host: address.hostname, port: Number(address.port) });
        await new Promise<void>((done, reject) => {
          unused?.once("connect", done);
          unused?.once("error", reject);
        });
      }
      const catalog = await runtime.client().execute("template_list", {}),
        entry = catalog.catalog!.entries[0]!;
      await expect.poll(runtime.uses).toEqual([]);
      hold = true;
      read = runtime.client().execute("template_read", { id: entry.id, contentHash: entry.contentHash });
      void read.catch(() => {});
      await started;
      const leases = await runtime.uses();
      expect(leases).toHaveLength(1);
      expect(leases[0]!.owner.service).toBe("daemon");
      const daemon = runtime.control.directory().instances.find((item) => item.service === "daemon")!;
      expect(leases[0]!.owner.incarnation).toBe(daemon.incarnation);
      expect((await readFile(leases[0]!.path)).length).toBeGreaterThan(0);
      closing = (
        mode === "manager" ? runtime.control.close() : runtime.factory.session(() => runtime.binding().close())
      ).then(() => {
        closed = true;
      });
      void closing.catch(() => {});
      await expect
        .poll(async () => runtime.control.directory().instances.find((item) => item.service === "templates")?.phase)
        .toBe("stopping");
      expect(closed).toBe(false);
      expect(await runtime.uses()).toHaveLength(1);
      release();
      expect(await read).toMatchObject({ template: { id: entry.id, width: 1920, height: 1080, duration: 5 } });
      await closing;
      if (unused) await expect.poll(() => unused?.destroyed).toBe(true);
      expect(await runtime.uses()).toEqual([]);
      await runtime.control.close();
      expect((await readDirectory(runtime.root)).manager.phase).toBe("closed");
      expect(await observeProcesses(runtime.root)).toEqual([]);
      await writeFile(
        join(runtime.root, "result.json"),
        JSON.stringify(
          {
            mode,
            heldUseOwner: "daemon",
            readCompleted: true,
            unusedConnectionRetired: unused?.destroyed,
            closed: true,
            uses: 0,
            processes: [],
          },
          null,
          2,
        ),
      );
    } finally {
      unused?.destroy();
      release();
      await read?.catch(() => {});
      await closing?.catch(() => {});
      await runtime.control.close();
    }
  }, 20000);
it("retains a corrupt committed publication failure across repeated requests without fetching or replacing it", async () => {
  const runtime = await fixture(async () => {});
  try {
    expect((await runtime.client().execute("template_list", {})).catalog?.entries).toHaveLength(1);
    await expect.poll(runtime.uses).toEqual([]);
    await writeFile(runtime.metadata, JSON.stringify({ schema: 1, ready: [], invalid: "not a committed Head" }));
    await runtime.reopen();
    const before = runtime.requests();
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await runtime.client().execute("template_list", {});
      expect(result.templates).toHaveLength(3);
      expect(result.catalog).toBeNull();
      expect(result.catalogError).toContain("metadata");
    }
    expect(runtime.requests()).toBe(before);
    expect(JSON.parse(await readFile(runtime.metadata, "utf8"))).toMatchObject({ invalid: "not a committed Head" });
  } finally {
    await runtime.control.close();
  }
}, 20000);

it("manager shutdown aborts and drains an actual partial source download without retiring its Use early", async () => {
  let release = () => {},
    entered = () => {};
  const gate = new Promise<void>((done) => {
      release = done;
    }),
    started = new Promise<void>((done) => {
      entered = done;
    });
  const runtime = await fixture(
    async () => {},
    async () => {
      entered();
      await gate;
    },
  );
  let reading: Promise<unknown> | undefined;
  try {
    const entry = (await runtime.client().execute("template_list", {})).catalog!.entries[0]!;
    await expect.poll(runtime.uses).toEqual([]);
    reading = runtime.client().execute("template_read", { id: entry.id, contentHash: entry.contentHash });
    void reading.catch(() => {});
    await started;
    expect((await runtime.uses()).some((use) => use.owner.service === "templates")).toBe(true);
    const stopped = runtime.control.close();
    await expect(reading).rejects.toThrow();
    await stopped;
    expect(await runtime.uses()).toEqual([]);
    expect((await readDirectory(runtime.root)).manager.phase).toBe("closed");
    expect(await observeProcesses(runtime.root)).toEqual([]);
  } finally {
    release();
    await reading?.catch(() => {});
    await runtime.control.close();
  }
}, 20000);
