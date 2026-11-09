import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { metadata, signHead } from "@odsuite/distribution";
import { channel, digest } from "@odsuite/protocol";
import { compose, writeProduct } from "@odsuite/release";
import { it } from "vitest";
import { hash } from "../src/files.js";
import { Transaction } from "../src/transaction.js";
import type { Job, Journal } from "../src/types.js";

it("retains exact old and candidate bytes when the backup parent is blocked by a file", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "installer-io-"))),
    home = join(root, "transaction"),
    target = join(root, "probe.app"),
    candidate = join(home, "candidate", "probe.app"),
    unit = join(root, "unit");
  for (const path of [target, candidate, unit]) await mkdir(path, { recursive: true });
  await writeFile(join(target, "executable"), "old shell");
  await writeFile(join(candidate, "executable"), "new shell");
  await writeFile(join(unit, "entry.js"), "export default true;");
  const product = await compose(
    {
      schema: 1,
      channel: channel("stable"),
      identity: {
        appid: "io.openmotion.probe",
        name: "Probe",
        origin: "probe://carrier",
        scheme: "probe",
        version: "0.1.0",
      },
    },
    { carrier: 1, capsule: unit, web: unit, daemon: unit },
  );
  await writeProduct(join(home, "content"), product);
  const bytes = Buffer.from("retained archive verified before layout mutation");
  await writeFile(join(home, "archive.zip"), bytes);
  await writeFile(join(home, "backup"), "blocking file must survive");
  const shell = {
    platform: "mac" as const,
    arch: "arm64" as const,
    version: "0.2.0",
    digest: digest(bytes),
    bytes: bytes.length,
    format: "zip" as const,
  };
  const value = metadata({
    schema: 1,
    product: product.manifest.identity.appid,
    channel: "stable",
    version: "0.2.0",
    revision: 1,
    minShellVersion: "0.2.0",
    content: product.envelope,
    units: { capsule: "0.1.0", web: "0.1.0", daemon: "0.1.0" },
    shells: [shell],
  });
  const keys = generateKeyPairSync("ed25519"),
    privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString();
  const server = createServer((request, response) =>
    response.end(JSON.stringify(request.url?.endsWith("head.json") ? signHead(value, privatekey) : value)),
  );
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const id = randomUUID(),
    oldHash = await hash(target),
    newHash = await hash(candidate);
  const job: Job = {
    schema: 1,
    id,
    nonce: randomUUID(),
    root: join(root, "authority"),
    home,
    target,
    appName: "probe.app",
    executor: join(root, "executor"),
    worker: join(root, "worker.mjs"),
    runtime: { root: join(root, "runtime"), namespace: "primary", version: "0.1.0" },
    catalog: {
      endpoint: `http://127.0.0.1:${address.port}`,
      publickey,
      product: value.product,
      channel: channel("stable"),
      shellVersion: "0.1.0",
      platform: "mac",
      arch: "arm64" as const,
    },
    metadata: value,
    shell,
    env: {},
  };
  const record: Journal = { schema: 1, id, phase: "ready", oldHash, newHash, old: [], history: [] };
  try {
    await assert.rejects(new Transaction(job, record).run(), /EEXIST|ENOTDIR/);
    assert.equal(await hash(target), oldHash);
    assert.equal(await hash(candidate), newHash);
    assert.equal(await readFile(join(home, "backup"), "utf8"), "blocking file must survive");
    const retained = JSON.parse(await readFile(join(home, "record.json"), "utf8"));
    assert.equal(retained.phase, "failed");
    assert.deepEqual(
      retained.history.map((h: { phase: string }) => h.phase),
      ["waiting", "vacated", "failed"],
    );
    assert.match(retained.error, /EEXIST|ENOTDIR/);
  } finally {
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
  }
});
