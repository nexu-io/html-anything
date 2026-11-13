import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { digest, factoryScope } from "@odsuite/protocol";
import { serve as manager, managerEndpoint, observeProcesses, Peer, readDirectory } from "@odsuite/sidecar";
import { host } from "@open-motion/templates/host";
import type { PrismConfig, Publication } from "@open-motion/templates/prism";
import { initialFiles } from "@open-motion/workspace";
import { expect, it } from "vitest";
import { serve } from "@/service.js";
import { Client } from "@/transport/client.js";

it("uses actual HTTP, sidecar and blob for verified templates, offline/corrupt updates, receipt replay and cold restoration", async () => {
  const root = join(fileURLToPath(new URL("../../../.artifacts/", import.meta.url)), "prism", randomUUID());
  await mkdir(root, { recursive: true });
  const scope = factoryScope({ channel: "dev", namespace: "prism" });
  let control = await manager(managerEndpoint(root), { root }),
    factory = control.factory(scope);
  let origin = "",
    current: Publication,
    offline = false,
    corrupt = false,
    redirect = false,
    sourceRequests = 0,
    catalogRequests = 0;
  const files = new Map<string, Buffer>();
  const makePublication = (version: number): Publication => {
    const source = initialFiles().map((file) => ({
      ...file,
      content:
        file.path === "index.html"
          ? file.content
              .replace("</head>", `<!--${"x".repeat(70000)}--></head>`)
              .replace("Motion</title>", `Motion ${version}</title>`)
          : file.content,
    }));
    return {
      resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
      environment: "dev",
      channel: "default",
      publicationId: `publication-${version}`,
      defaultLocale: "en",
      content: {
        en: {
          templates: [
            {
              templateId: "native-example",
              sortOrder: 1,
              original: {
                templateName: `Prism example ${version}`,
                license: "Apache-2.0",
                sourceUrl: "https://example.com/authored",
              },
              files: source.map((file) => {
                const bytes = Buffer.from(file.content),
                  sha256 = digest(bytes).slice(7);
                files.set(sha256, bytes);
                return { path: file.path, url: `${origin}/files/${sha256}`, bytes: bytes.length, sha256 };
              }),
            },
          ],
        },
      },
    };
  };
  let service: Awaited<ReturnType<typeof serve>> | undefined;
  try {
    const remote = createServer((request, response) => {
      if (request.url?.startsWith("/resources/")) {
        catalogRequests++;
        if (offline) {
          response.writeHead(503);
          response.end();
          return;
        }
        if (request.headers["if-none-match"] === `"${current.publicationId}"`) {
          response.writeHead(304);
          response.end();
          return;
        }
        response.writeHead(200, { "content-type": "application/json", etag: `"${current.publicationId}"` });
        response.end(JSON.stringify(current));
        return;
      }
      sourceRequests++;
      if (redirect) {
        response.writeHead(302, { location: "https://other.invalid/files/source" });
        response.end();
        return;
      }
      const bytes = files.get(request.url?.slice("/files/".length) ?? "");
      if (!bytes || offline) {
        response.writeHead(503);
        response.end();
        return;
      }
      response.writeHead(200);
      response.end(corrupt ? Buffer.from("invalid source bytes") : bytes);
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
          current = makePublication(1);
        },
        stop: async () =>
          new Promise<void>((done, reject) => remote.close((error) => (error ? reject(error) : done()))),
      },
    });
    const config: PrismConfig = {
      origin,
      environment: "dev",
      resourceId: current!.resourceId,
      channel: "default",
      locale: "en",
    };
    const binding = await host(factory, { generation: digest("templates"), config });
    let address = "";
    const startDaemon = async (binding: Awaited<ReturnType<typeof host>>) => {
      await factory.expose({
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
                token: "test-authority",
                prism: binding,
              }),
            );
            await context.forward(port.value, socket.value);
          },
          quiesce: async () => service?.quiesce(),
          stop: async () => service?.close(),
        },
      });
    };
    await startDaemon(binding);
    const client = new Client(address, "test-authority");
    const session = await client.execute("session_create", { requestId: randomUUID(), title: "Prism", mode: "motion" });
    offline = true;
    const unavailable = await client.execute("template_list", {});
    expect(unavailable.templates).toHaveLength(3);
    expect(unavailable.catalog).toBeNull();
    expect(unavailable.catalogError).toBeTruthy();
    const builtin = unavailable.templates[0]!;
    await client.execute("template_create", {
      id: builtin.id,
      contentHash: builtin.contentHash,
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Offline builtin",
    });
    offline = false;
    const listed = await client.execute("template_list", {});
    expect(listed.catalogError).toBeUndefined();
    expect(listed.catalog?.entries).toHaveLength(1);
    expect(sourceRequests).toBe(0);
    const discovery = listed.catalog!.entries[0]!;
    expect(discovery).not.toHaveProperty("width");
    const selected = { id: discovery.id, contentHash: discovery.contentHash };
    const native = await client.execute("template_read", selected);
    expect(native.template).toMatchObject({ width: 1920, height: 1080, duration: 5 });
    expect(JSON.stringify(native).length).toBeGreaterThan(65536);
    const request = { ...selected, requestId: randomUUID(), sessionId: session.id, title: "Independent remote" };
    const original = await client.execute("template_create", request),
      owner = { sessionId: session.id, artifactId: original.id };
    const project = await client.execute("project_read", owner);
    const saved = await client.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: project.files.map((file) => ({
        ...file,
        content: file.path === "index.html" ? file.content.replace("<title>", "<title>Edited ") : file.content,
      })),
    });
    const before = sourceRequests;
    current = makePublication(2);
    await client.execute("template_list", {});
    offline = true;
    expect(await client.execute("template_create", request)).toEqual(original);
    expect(sourceRequests).toBe(before);
    for (const changed of [
      { title: "Different" },
      { contentHash: `sha256:${"0".repeat(64)}` },
      { sessionId: randomUUID() },
    ])
      await expect(client.execute("template_create", { ...request, ...changed })).rejects.toThrow("requestId");
    const stale = await client.execute("template_list", {});
    expect(stale.catalog?.stale).toBe(true);
    expect(stale.catalog?.warning).toBeTruthy();
    offline = false;
    const changed = (await client.execute("template_list", {})).catalog!.entries[0]!;
    corrupt = true;
    await expect(
      client.execute("template_read", { id: changed.id, contentHash: changed.contentHash }),
    ).rejects.toThrow();
    corrupt = false;
    redirect = true;
    await expect(
      client.execute("template_read", { id: changed.id, contentHash: changed.contentHash }),
    ).rejects.toThrow();
    redirect = false;
    const next = await client.execute("template_create", {
      id: changed.id,
      contentHash: changed.contentHash,
      requestId: randomUUID(),
      sessionId: session.id,
      title: "Second version",
    });
    expect(next.id).not.toBe(original.id);
    expect((await client.execute("project_read", owner)).revision).toBe(saved.revision);
    const state = await client.execute("workspace_state", {});
    expect(state.selection.artifactId).toBeNull();
    const grants = await factory.resources();
    const data = grants.grants.find((grant) => grant.kind === "data" && grant.name === "templates")!;
    await expect
      .poll(async () => {
        const library = JSON.parse(await readFile(join(data.value, "library.json"), "utf8"));
        return Object.values(library.entries).every((entry) => !(entry as { uses: unknown[] }).uses.length);
      })
      .toBe(true);
    await writeFile(
      join(root, "result.json"),
      JSON.stringify(
        {
          original,
          sourceRequests,
          catalogRequests,
          revision: saved.revision,
          publication: changed.contentHash,
          uses: 0,
        },
        null,
        2,
      ),
    );
    await control.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    control = await manager(managerEndpoint(root), { root });
    factory = control.factory(scope);
    const restoredBinding = await host(factory, { generation: digest("templates"), config });
    await startDaemon(restoredBinding);
    const cold = new Client(address, "test-authority");
    expect(await cold.execute("template_create", request)).toEqual(original);
    expect((await cold.execute("project_read", owner)).revision).toBe(saved.revision);
    expect((await cold.execute("template_list", {})).catalog?.stale).toBe(true);
    expect(
      (await cold.execute("template_read", { id: changed.id, contentHash: changed.contentHash })).template.id,
    ).toBe(changed.id);
    await control.close();
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
  } finally {
    await control.close();
  }
}, 60000);
