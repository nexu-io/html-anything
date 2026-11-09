import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { CreateBucketCommand, DeleteObjectCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { canonical, channel, digest } from "@odsuite/protocol";
import { compose, emitUnit, resolve as manifest } from "@odsuite/release";
import { it } from "vitest";
import { Catalog, metadata, ShellRequired } from "@";
import { publish, Storage } from "../src/s3.js";

it.runIf(!!process.env.ODSUITE_SILO_ENDPOINT)(
  "publishes and retrieves actual S3 objects with CAS, verified floors and offline retention",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "silo-distribution-"));
    const endpoint = process.env.ODSUITE_SILO_ENDPOINT!,
      bucket = `odsuite-${Date.now()}`;
    const until = Date.now() + 10000;
    for (;;) {
      try {
        if ((await fetch(`${endpoint}/minio/health/live`, { signal: AbortSignal.timeout(1000) })).ok) break;
      } catch {
        /* The declared Compose service may still be starting. */
      }
      if (Date.now() >= until) throw new Error("declared Silo did not become ready");
      await new Promise((done) => setTimeout(done, 50));
    }
    const options = {
      endpoint,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: { accessKeyId: "odsuitelocal", secretAccessKey: "odsuite-local-development-only" },
    };
    const admin = new S3Client(options),
      storage = new Storage(options, bucket);
    await admin.send(new CreateBucketCommand({ Bucket: bucket }));
    await admin.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            { Effect: "Allow", Principal: "*", Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${bucket}/*`] },
          ],
        }),
      }),
    );
    for (const kind of ["capsule", "web", "daemon"]) {
      await mkdir(join(root, kind));
      await writeFile(join(root, kind, "index.mjs"), `export const marker=${JSON.stringify(kind)}`);
      if (kind !== "capsule")
        await emitUnit(join(root, kind), {
          schema: 1,
          kind: kind as "web" | "daemon",
          version: "1.0.0",
          api: "probe/1",
        });
    }
    const product = await compose(manifest({}, { channel: channel("stable"), version: "1.0.0" }), {
      carrier: 1,
      capsule: join(root, "capsule"),
      web: join(root, "web"),
      daemon: join(root, "daemon"),
    });
    const shellbytes = Buffer.from("shell transport probe, not an installable archive");
    const shell = {
      platform: "mac",
      arch: "arm64",
      version: "2.0.0",
      digest: digest(shellbytes),
      bytes: shellbytes.length,
      format: "zip",
    };
    const keys = generateKeyPairSync("ed25519"),
      privatekey = keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
      publickey = keys.publicKey.export({ format: "pem", type: "spki" }).toString();
    const m = metadata({
      schema: 1,
      product: product.manifest.identity.appid,
      channel: "stable",
      version: "1.0.0",
      revision: 1,
      minShellVersion: "1.0.0",
      content: product.envelope,
      units: { capsule: "1.0.0", web: "1.0.0", daemon: "1.0.0" },
      shells: [shell],
    });
    const publication = (value: typeof m, expected: number) =>
      publish({
        storage,
        metadata: value,
        assets: product.assets,
        shells: [{ artifact: value.shells[0]!, bytes: shellbytes }],
        privatekey,
        expected,
      });
    const catalog = new Catalog({
      endpoint: `${endpoint}/${bucket}`,
      publickey,
      product: m.product,
      channel: channel("stable"),
      shellVersion: "1.0.0",
      platform: "mac",
      arch: "arm64",
      root: join(root, "cache"),
    });
    try {
      const first = await publication(m, 0);
      assert.deepEqual(await publication(m, 0), first);
      const selected = (await catalog.head(channel("stable"))).head!;
      assert.equal((await catalog.release(channel("stable"), selected)).envelope.digest, product.envelope.digest);
      assert.deepEqual(await catalog.shell(m.shells[0]!), shellbytes);
      const objectpath = `products/${m.product}/objects/sha256/${product.envelope.generation.web.digest.slice(7)}`;
      const object = (await storage.get(objectpath))!;
      await storage.put(objectpath, Buffer.from("x"), { etag: object.etag });
      await assert.rejects(catalog.release(channel("stable"), selected), /integrity/);
      await storage.put(objectpath, object.bytes, { etag: (await storage.get(objectpath))!.etag });
      const next = metadata({ ...m, version: "2.0.0", revision: 2, minShellVersion: "2.0.0" });
      await publication(next, 1);
      await assert.rejects(catalog.head(channel("stable")), ShellRequired);
      const path = `products/${m.product}/channels/stable/head.json`,
        saved = (await storage.get(path))!;
      await assert.rejects(publication(metadata({ ...next, version: "3.0.0", revision: 3 }), 1), /revision conflict/);
      const changed = metadata({ ...next, revision: 3, minShellVersion: "1.5.0" });
      await assert.rejects(publication(changed, 2), /immutable S3 identity conflict/);
      assert.equal(Buffer.from((await storage.get(path))!.bytes).toString(), Buffer.from(saved.bytes).toString());
      // Authentic rollback is rejected against persisted revision, not only in memory.
      await storage.put(path, Buffer.from(canonical(first)), { etag: saved.etag });
      const cold = new Catalog(catalog.options);
      await assert.rejects(cold.head(channel("stable")), /regressed/);
      await storage.put(path, saved.bytes, { etag: (await storage.get(path))!.etag });
      await admin.send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
      await assert.rejects(new Catalog(catalog.options).head(channel("stable")), ShellRequired);
      await storage.put(path, saved.bytes);
      const untrusted = JSON.parse(Buffer.from(saved.bytes).toString());
      untrusted.revision++;
      await storage.put(path, Buffer.from(JSON.stringify(untrusted)), { etag: (await storage.get(path))!.etag });
      await assert.rejects(new Catalog(catalog.options).head(channel("stable")), /signature/);
      await storage.put(path, saved.bytes, { etag: (await storage.get(path))!.etag });
      const competitors = await Promise.allSettled([
        publication(metadata({ ...next, version: "3.0.0", revision: 3 }), 2),
        publication(metadata({ ...next, version: "4.0.0", revision: 3 }), 2),
      ]);
      assert.equal(competitors.filter((v) => v.status === "fulfilled").length, 1);
      assert.equal(competitors.filter((v) => v.status === "rejected").length, 1);
      const evidence = resolve("../../.artifacts/distribution-gate/silo.json");
      await mkdir(join(evidence, ".."), { recursive: true });
      await writeFile(
        evidence,
        JSON.stringify(
          {
            result: "passed",
            endpoint,
            bucket,
            publickey,
            root,
            metadata: next,
            first,
            checks: [
              "S3 publication/download",
              "idempotent publication",
              "immutable version conflict",
              "CAS revision conflict",
              "signed persisted rollback refusal",
              "tampered signature refusal",
              "shell transport integrity",
            ],
            cache: JSON.parse(await readFile(join(root, "cache/distribution.json"), "utf8")),
          },
          null,
          2,
        ),
      );
    } finally {
      storage.close();
      admin.destroy();
    }
  },
  60000,
);
