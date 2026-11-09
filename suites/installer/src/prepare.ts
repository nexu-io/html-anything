import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog, compare, metadata as parseMetadata } from "@odsuite/distribution";
import { digest } from "@odsuite/protocol";
import { bundleFile, decode, writeProduct } from "@odsuite/release";
import { observeOwner, startManager } from "@odsuite/sidecar";
import { extract } from "./archive.js";
import { open, participants, registration, scope } from "./domain.js";
import { bundle, hash, io, json, save } from "./files.js";
import type { Handle, Job, Journal, Options } from "./types.js";

const { cp, mkdir, realpath, writeFile } = io;

export async function prepare(options: Options): Promise<Handle> {
  if (process.platform !== "darwin") throw Error("installation replacement is currently macOS only");
  const target = await realpath(options.target);
  let sealed = false;
  const domain = await open(options.root, target, options.catalog.product, options.catalog.channel, {
    register: async (value): Promise<boolean> => {
      if (sealed) throw Error("installation participant admission is closed");
      return registration(domain.context, value, options.catalog.product, options.catalog.channel);
    },
  });
  let job: Job | undefined;
  try {
    const current = await json<{ id: string }>(join(domain.context.roots.data, "current.json"));
    if (current) {
      const record = await json<Journal>(join(domain.context.roots.data, "transactions", current.id, "record.json"));
      if (record && !["failed", "confirmed"].includes(record.phase))
        throw Error("unfinished installation requires explicit resume");
    }
    const catalog = new Catalog({ ...options.catalog, root: domain.context.roots.data });
    const metadata = parseMetadata(await catalog.refresh());
    const shell = metadata.shells.find((s) => s.platform === "mac" && s.arch === process.arch);
    if (shell?.format !== "zip" || compare(options.runtime.version, metadata.minShellVersion, metadata.channel) >= 0)
      throw Error("no required compatible macOS shell update");
    const identity = await bundle(target, {
      appid: metadata.channel === "stable" ? metadata.product : `${metadata.product}.${metadata.channel}`,
      version: options.runtime.version,
    });
    const owner = await observeOwner(options.runtime.root, {
      ...scope(metadata.channel),
      namespace: options.runtime.namespace as never,
    });
    if (!owner) throw Error("requesting runtime is not alive");
    await domain.factory.session(() =>
      registration(domain.context, { ...options.runtime, owner, target }, metadata.product, metadata.channel),
    );
    const id = randomUUID(),
      home = join(domain.context.roots.data, "transactions", id),
      cache = join(domain.context.roots.resource, "executors", id),
      appName = basename(target);
    await mkdir(home, { recursive: true, mode: 0o700 });
    await mkdir(cache, { recursive: true, mode: 0o700 });
    job = {
      ...options,
      root: domain.root,
      target,
      runtime: { ...options.runtime, root: await realpath(options.runtime.root) },
      schema: 1,
      id,
      nonce: randomUUID(),
      metadata,
      shell,
      home,
      executor: join(cache, appName),
      worker: join(cache, "worker.mjs"),
      appName,
    };
    await cp(target, job.executor, { recursive: true, verbatimSymlinks: true });
    await writeFile(job.worker, await readFile(fileURLToPath(new URL("./worker.mjs", import.meta.url))), {
      mode: 0o600,
      flush: true,
    });
    const bytes = await catalog.shell(shell);
    if (digest(bytes) !== shell.digest) throw Error("shell download mismatch");
    await writeFile(join(home, "archive.zip"), bytes, { mode: 0o600, flush: true });
    const candidate = await extract(bytes, join(home, "candidate"), appName);
    await bundle(candidate, {
      appid: metadata.channel === "stable" ? metadata.product : `${metadata.product}.${metadata.channel}`,
      version: shell.version,
    });
    const contentCatalog = new Catalog({ ...options.catalog, shellVersion: shell.version, root: join(home, "policy") });
    const selected = (await contentCatalog.head(scope(metadata.channel).channel)).head!;
    if (selected.generation !== metadata.content.digest) throw Error("installation content selection changed");
    const release = await contentCatalog.release(scope(metadata.channel).channel, selected);
    const capsule = release.assets.find((a) => a.artifact.kind === "capsule")!;
    await writeProduct(join(home, "content"), {
      ...release,
      assets: release.assets.map((a) => ({ ...a, bytes: Buffer.from(a.bytes) })),
      manifest: decode(Buffer.from(bundleFile(capsule.bytes, "release.json")).toString()),
    });
    const old = await domain.factory.session(async () => {
      sealed = true;
      return participants(domain.context, metadata.channel);
    });
    if (!old.length) throw Error("no registered runtime participants");
    const record: Journal = {
      schema: 1,
      id,
      phase: "ready",
      oldHash: await hash(target),
      newHash: await hash(candidate),
      old,
      history: [{ phase: "ready", at: Date.now(), pid: process.pid }],
    };
    await save(join(home, "job.json"), job);
    await save(join(home, "record.json"), record);
    await save(join(domain.context.roots.data, "current.json"), { id });
    await domain.close();
    const manager = await startManager({
      root: domain.root,
      scope: scope(metadata.channel),
      command: join(job.executor, "Contents/MacOS", basename(identity.executable)),
      args: [job.worker, "--job", join(home, "job.json")],
      env: { ELECTRON_RUN_AS_NODE: "1" },
      timeout: 30000,
      log: join(job.home, "manager.log"),
    });
    return { root: domain.root, channel: metadata.channel, id, nonce: job.nonce, manager };
  } catch (error) {
    if (job) await save(join(job.home, "failure.json"), { error: String(error), at: Date.now() });
    try {
      await domain.close();
    } catch {
      /* Preserve interrupted authority for explicit recovery. */
    }
    throw error;
  }
}
