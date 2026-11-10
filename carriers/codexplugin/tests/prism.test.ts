import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { channel, digest, namespace } from "@odsuite/protocol";
import { source } from "@odsuite/serve";
import { managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import type { Output } from "@open-motion/daemon/contract";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";

it("creates a verified Prism project through stock SDK stdio and replays its receipt offline", async () => {
  const evidence = fileURLToPath(new URL(`../../../.artifacts/prism-stdio/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "product"),
    fixtureRoot = join(evidence, "publication"),
    directory = join(evidence, "documents"),
    resourceId = randomUUID(),
    scope = { channel: channel("dev"), namespace: namespace("prism-stdio") },
    report: Record<string, unknown> = {};
  await mkdir(directory, { recursive: true });
  const fixture = await serve(managerEndpoint(fixtureRoot), { root: fixtureRoot });
  let client: Client | undefined,
    failure: unknown,
    fixtureClosed = false,
    reads = 0;
  const errors: unknown[] = [];
  try {
    const files = initialFiles().map((file) => ({
        ...file,
        content: file.path === "index.html" ? `${file.content}<!--${"verified-source".repeat(6000)}-->` : file.content,
      })),
      manifest = files.map((file) => ({
        path: file.path,
        bytes: Buffer.byteLength(file.content),
        sha256: digest(file.content).slice(7),
      }));
    let origin = "";
    const documents = Object.fromEntries([
      [
        `/resources/${resourceId}/channels/default/main.json`,
        () => ({
          type: "application/json",
          body: JSON.stringify({
            resourceId,
            environment: "prod",
            channel: "default",
            publicationId: "stock-sdk-publication",
            defaultLocale: "zh-CN",
            content: {
              "zh-CN": {
                templates: [
                  {
                    templateId: "stock-sdk",
                    sortOrder: 0,
                    original: { templateName: "SDK verified starter", license: "Apache-2.0" },
                    files: manifest.map((file) => ({ ...file, url: `${origin}/files/${file.sha256}` })),
                  },
                ],
              },
            },
          }),
        }),
      ],
      ...files.map((file, index) => [
        `/files/${manifest[index]!.sha256}`,
        () => {
          reads++;
          return { type: "text/plain; charset=utf-8", body: file.content };
        },
      ]),
    ]);
    origin = (await source(fixture.factory(scope), { name: "publication", directory, documents })).endpoint.url;
    const prism = { origin, environment: "prod", resourceId, channel: "default", locale: "zh-CN" },
      entry = fileURLToPath(new URL("../dist/index.mjs", import.meta.url)),
      script = `import {connect} from ${JSON.stringify(entry)}; await connect(${JSON.stringify({ root, scope, prism, version: "0.6.1-dev.1" })});`;
    client = new Client({ name: "prism-stdio-verifier", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--input-type=module", "-e", script],
      stderr: "pipe",
    });
    let diagnostics = "";
    transport.stderr?.on("data", (chunk) => {
      diagnostics += chunk;
    });
    try {
      await client.connect(transport);
    } catch (error) {
      await writeFile(join(evidence, "private-child-stderr.log"), diagnostics, { mode: 0o600 });
      throw error;
    }
    const call = async <
      N extends "session_create" | "template_list" | "template_read" | "template_create" | "project_read",
    >(
      name: N,
      args: Record<string, unknown>,
    ): Promise<Output<N>> => {
      const result = await client!.callTool({ name, arguments: args });
      expect(result.isError, JSON.stringify(result.structuredContent)).not.toBe(true);
      return result.structuredContent as unknown as Output<N>;
    };
    const session = await call("session_create", { requestId: randomUUID(), title: "SDK Prism", mode: "motion" }),
      catalog = await call("template_list", {}),
      remote = catalog.catalog?.entries[0];
    expect(reads).toBe(0);
    expect(catalog.catalog).toMatchObject({ environment: "prod", channel: "default", stale: false });
    if (!remote) throw Error("missing configured remote template");
    expect(remote.availability).toBe("source-required");
    const selected = { id: remote.id, contentHash: remote.contentHash },
      received = await call("template_read", selected);
    expect(JSON.stringify(received).length).toBeGreaterThan(65536);
    const intent = { ...selected, sessionId: session.id, title: "SDK independent project", requestId: randomUUID() },
      created = await call("template_create", intent),
      project = await call("project_read", { sessionId: session.id, artifactId: created.id });
    for (const file of files) expect(project.files.find((item) => item.path === file.path)).toEqual(file);
    await fixture.close();
    fixtureClosed = true;
    const before = reads;
    expect(await call("template_create", intent)).toEqual(created);
    expect(reads).toBe(before);
    report.acceptance = {
      transport: "stock SDK stdio",
      selected,
      bytes: JSON.stringify(received).length,
      artifactId: created.id,
      revision: project.revision,
      offlineReplay: true,
      sourceReads: reads,
    };
  } catch (error) {
    failure = error;
  } finally {
    for (const close of [() => client?.close(), () => !fixtureClosed && fixture.close()]) {
      try {
        await close();
      } catch (error) {
        errors.push(error);
      }
    }
    for (const [name, path] of [
      ["product", root],
      ["publication", fixtureRoot],
    ] as const) {
      try {
        report[name] = { phase: (await readDirectory(path)).manager.phase, processes: await observeProcesses(path) };
      } catch (error) {
        report[name] = { observation: "unknown" };
        errors.push(error);
      }
    }
    if (failure) report.failure = String(failure);
    if (errors.length) report.cleanupErrors = errors.map(String);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  }
  if (failure || errors.length)
    throw new AggregateError(
      [...(failure ? [failure] : []), ...errors],
      "Prism SDK acceptance failed; evidence retained",
    );
  expect(report.product).toEqual({ phase: "closed", processes: [] });
  expect(report.publication).toEqual({ phase: "closed", processes: [] });
}, 30000);
