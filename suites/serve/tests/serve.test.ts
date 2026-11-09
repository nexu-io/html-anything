import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import type { IncomingMessage } from "node:http";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { connectRoot, readDirectory } from "@odsuite/sidecar";
import { it } from "vitest";
import { Sources } from "@/index.js";
import { staticServer } from "../src/static.js";

it("serves changing real bytes, ranges and metadata on owned endpoints and retires one source independently", async () => {
  const root = await mkdtemp(join(tmpdir(), "sources-")),
    content = join(root, "content"),
    data = join(root, "state");
  await mkdir(content);
  await writeFile(join(content, "artifact.bin"), "0123456789");
  await writeFile(join(content, "latest.json"), JSON.stringify({ version: "1.0.0-beta.1" }));
  await writeFile(join(root, "secret"), "outside");
  await symlink(join(root, "secret"), join(content, "escape"));
  const scope = { channel: channel("beta"), namespace: namespace("local") };
  await assert.rejects(Sources.open({ data, scope, sources: { unsafe: { directory: root } } }), /separate/);
  let active = await Sources.open({
    data,
    scope,
    sources: { web: { directory: content }, blobs: { directory: content } },
  });
  try {
    const web = active.endpoints[0],
      blobs = active.endpoints[1];
    assert.ok(web && blobs);
    assert.notEqual(web.url, blobs.url);
    const request = (path: string, init?: RequestInit) =>
      fetch(`${web.url}/${path}`, { ...init, signal: AbortSignal.timeout(2000) });
    assert.equal(await (await request("artifact.bin")).text(), "0123456789");
    const partial = await request("artifact.bin", { headers: { range: "bytes=2-5" } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get("content-range"), "bytes 2-5/10");
    assert.equal(await partial.text(), "2345");
    assert.equal(await (await request("artifact.bin", { headers: { range: "bytes=-3" } })).text(), "789");
    assert.equal((await request("artifact.bin", { headers: { range: "bytes=100-" } })).status, 416);
    const head = await request("artifact.bin", { method: "HEAD" });
    assert.equal(head.headers.get("content-length"), "10");
    assert.equal(await head.text(), "");
    assert.equal((await request("missing")).status, 404);
    assert.equal((await request("escape")).status, 403);
    assert.equal((await request("%2e%2e%2fsecret")).status, 403);
    await active.fault("web", { path: "/artifact.bin", mode: "truncate" });
    const truncated = await request("artifact.bin");
    assert.equal(truncated.status, 200);
    await assert.rejects(truncated.text());
    await active.fault("web", null);
    await writeFile(join(content, "latest.json"), JSON.stringify({ version: "1.0.0-beta.2" }));
    assert.deepEqual(await (await request("latest.json")).json(), { version: "1.0.0-beta.2" });
    await assert.rejects(Sources.open({ data, scope, sources: { web: { directory: content } } }), /another manager/);
    const { factory } = await connectRoot(data, scope);
    const peer = await factory.connect({ service: web.service, generation: web.generation });
    await peer.stop();
    await assert.rejects(request("artifact.bin"));
    assert.equal(await (await fetch(`${blobs.url}/artifact.bin`)).text(), "0123456789");
    await active.close();
    const stopped = await readDirectory(data);
    assert.equal(stopped.manager.phase, "closed");
    assert.ok(stopped.instances.every((i) => i.phase === "retired"));
    active = await Sources.open({ data, scope, sources: { web: { directory: content } } });
    assert.notEqual(active.endpoints[0]?.incarnation, web.incarnation);
  } finally {
    await active.close();
    await rm(root, { recursive: true, force: true });
  }
}, 15000);

it("drains a backpressured accepted response before retiring the HTTP listener", async () => {
  const root = await mkdtemp(join(tmpdir(), "static-drain-")),
    socket = join(root, "http.sock");
  const bytes = Buffer.alloc(32 * 1024 * 1024, 0xab);
  await writeFile(join(root, "large.bin"), bytes);
  const server = await staticServer(root, socket);
  let response: IncomingMessage | undefined;
  const requestReady = new Promise<void>((done, reject) => {
    const pending = request({ socketPath: socket, path: "/large.bin" }, (incoming) => {
      response = incoming;
      incoming.pause();
      done();
    });
    pending.once("error", reject);
    pending.end();
  });
  let closing: Promise<void> | undefined;
  try {
    await requestReady;
    assert.ok(response);
    const incoming = response,
      hash = createHash("sha256");
    let received = 0;
    const body = new Promise<string>((done, reject) => {
      incoming.on("data", (chunk: Buffer) => {
        received += chunk.length;
        hash.update(chunk);
      });
      incoming.once("end", () => done(hash.digest("hex")));
      incoming.once("error", reject);
    });
    const result = body.then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    closing = server.close();
    const retiredEarly = await Promise.race([
      closing.then(() => true),
      new Promise<false>((done) => setTimeout(() => done(false), 100)),
    ]);
    incoming.resume();
    const completed = await result;
    assert.ok("value" in completed, "accepted response was truncated during stop");
    assert.equal(completed.value, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(received, bytes.length);
    assert.equal(retiredEarly, false);
    await closing;
  } finally {
    response?.destroy();
    await (closing ?? server.close());
    await rm(root, { recursive: true, force: true });
  }
}, 10000);
