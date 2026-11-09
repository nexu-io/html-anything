import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { metadata, signHead } from "@odsuite/distribution";
import { location, prepare } from "@odsuite/installer";
import { channel, digest, identify, namespace } from "@odsuite/protocol";
import { managerAlive, managerEndpoint, observeOwner, serve } from "@odsuite/sidecar";
import { build } from "plist";
import { it } from "vitest";
import { hash } from "../src/files.js";

it.runIf(process.platform === "darwin")(
  "retains the old host and exact installation on unavailable, corrupted and invalid archives",
  async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), "installer-prepare-"))),
      target = join(root, "probe.app"),
      product = "io.openmotion.probe",
      runtime = join(root, "runtime"),
      scope = { channel: channel("stable"), namespace: namespace("primary") };
    await mkdir(join(target, "Contents/MacOS"), { recursive: true });
    await writeFile(
      join(target, "Contents/Info.plist"),
      build({ CFBundleIdentifier: product, CFBundleExecutable: "probe", CFBundleShortVersionString: "0.1.0" }),
    );
    await writeFile(join(target, "Contents/MacOS/probe"), "old executable", { mode: 0o755 });
    await writeFile(join(target, "retained"), "user bytes");
    const oldHash = await hash(target),
      service = await serve(managerEndpoint(runtime), { root: runtime });
    await service.factory(scope).resources();
    const owner = await observeOwner(runtime, scope);
    assert.ok(owner);
    const artifact = (kind: "capsule" | "web" | "daemon") => ({
      kind,
      slot: "main",
      digest: digest(kind),
      bytes: kind.length,
    });
    const generation = {
      schema: 1 as const,
      carrier: 1,
      capsule: artifact("capsule"),
      web: artifact("web"),
      daemon: artifact("daemon"),
      blobs: [],
    };
    const bytes = Buffer.from("invalid archive bytes"),
      value = metadata({
        schema: 1,
        product,
        channel: "stable",
        version: "0.2.0",
        revision: 1,
        minShellVersion: "0.2.0",
        content: { schema: 1, digest: identify(generation), generation },
        units: { capsule: "0.1.0", web: "0.1.0", daemon: "0.1.0" },
        shells: [
          {
            platform: "mac",
            arch: process.arch,
            version: "0.2.0",
            digest: digest(bytes),
            bytes: bytes.length,
            format: "zip",
          },
        ],
      });
    const keys = generateKeyPairSync("ed25519"),
      privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
      publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString();
    let mode = "unavailable";
    const server = createServer((request, response) => {
      if (request.url?.endsWith("head.json")) response.end(JSON.stringify(signHead(value, privatekey)));
      else if (request.url?.endsWith("metadata.json")) response.end(JSON.stringify(value));
      else if (mode === "unavailable") {
        response.statusCode = 503;
        response.end("unavailable");
      } else response.end(mode === "corrupted" ? Buffer.alloc(bytes.length) : bytes);
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    try {
      for (mode of ["unavailable", "corrupted", "invalid"]) {
        await assert.rejects(
          prepare({
            root: location(target, product, "stable"),
            target,
            runtime: { root: runtime, namespace: "primary", version: "0.1.0" },
            catalog: {
              endpoint: `http://127.0.0.1:${address.port}`,
              publickey,
              product,
              channel: channel("stable"),
              shellVersion: "0.1.0",
              platform: "mac",
              arch: process.arch,
            },
            env: {},
          }),
          mode === "unavailable" ? /503/ : mode === "corrupted" ? /integrity/ : /central directory|zip/i,
        );
        assert.equal(await hash(target), oldHash);
        assert.equal(await readFile(join(target, "retained"), "utf8"), "user bytes");
        assert.equal(await managerAlive(owner), true);
      }
    } finally {
      await service.close();
      await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    }
  },
  15000,
);
