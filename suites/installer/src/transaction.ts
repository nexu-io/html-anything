import { mkdir, readFile, rename, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Catalog } from "@odsuite/distribution";
import { canonical, digest, namespace } from "@odsuite/protocol";
import { readProduct } from "@odsuite/release";
import { connectRoot, type Manager, managerAlive, observeOwner, readDirectory, startManager } from "@odsuite/sidecar";
import { scope } from "./domain.js";
import { bundle, hash, save, sync } from "./files.js";
import type { Confirmation, Job, Journal, Options } from "./types.js";

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw e;
  }
}
export class Transaction {
  record: Journal;
  private accepted?: () => void;
  private launched?: Promise<Manager>;
  constructor(
    readonly job: Job,
    record: Journal,
  ) {
    this.record = record;
  }
  async persist(phase: Journal["phase"]) {
    this.record.phase = phase;
    this.record.history.push({ phase, at: Date.now(), pid: process.pid });
    await save(join(this.job.home, "record.json"), this.record);
  }
  async checkpoint(phase: NonNullable<Options["checkpoint"]>) {
    if (this.job.checkpoint === phase) {
      await save(join(this.job.home, "checkpoint.json"), { phase, pid: process.pid, id: this.job.id });
      await new Promise(() => {});
    }
  }
  async verify() {
    if (this.record.schema !== 1 || this.record.id !== this.job.id) throw Error("installation transaction mismatch");
    const catalog = new Catalog({ ...this.job.catalog, root: join(this.job.home, "policy") }),
      current = await catalog.refresh();
    if (digest(canonical(current)) !== digest(canonical(this.job.metadata)))
      throw Error("installation publication changed");
    if (digest(await readFile(join(this.job.home, "archive.zip"))) !== this.job.shell.digest)
      throw Error("retained installation archive mismatch");
    const content = await readProduct(join(this.job.home, "content"));
    if (canonical(content.envelope) !== canonical(this.job.metadata.content))
      throw Error("retained installation content mismatch");
  }
  async confirm(value: Confirmation) {
    if (
      value.id !== this.job.id ||
      value.nonce !== this.job.nonce ||
      value.version !== this.job.shell.version ||
      value.root !== this.job.runtime.root ||
      value.generation !== this.job.metadata.content.digest
    )
      throw Error("installation confirmation mismatch");
    const owner = await this.launched;
    if (!owner || this.record.phase !== "launched" || !(await managerAlive(owner)))
      throw Error("installation launch is not live");
    if ((await hash(this.job.target)) !== this.record.newHash)
      throw Error("installed bytes changed before confirmation");
    await this.checkpoint("confirming");
    await this.persist("confirmed");
    this.accepted?.();
    return true;
  }
  private async shutdown() {
    for (const runtime of this.record.old) {
      if (!(await managerAlive(runtime.owner))) continue;
      const { factory } = await connectRoot(runtime.root, runtime.owner.scope),
        entry = (await factory.directory()).instances.find((i) => i.service === "electron" && i.phase === "ready");
      if (!entry) throw Error("runtime shutdown adapter unavailable");
      const peer = await factory.connect<{ quit: { input: null; output: boolean } }>({
        service: "electron",
        generation: entry.generation,
      });
      await peer.call("quit", null);
    }
    const deadline = Date.now() + 20000;
    for (;;) {
      let alive = false;
      for (const runtime of this.record.old) if (await managerAlive(runtime.owner)) alive = true;
      if (!alive) {
        for (const runtime of this.record.old)
          if ((await readDirectory(runtime.root)).manager.phase !== "closed")
            throw Error(`old runtime ownership did not drain cleanly: ${runtime.root}`);
        return;
      }
      if (Date.now() > deadline) throw Error("old runtime participants did not exit");
      await new Promise((done) => setTimeout(done, 25));
    }
  }
  async run() {
    const job = this.job,
      backup = join(job.home, "backup", job.appName),
      candidate = join(job.home, "candidate", job.appName);
    try {
      await this.verify();
      await this.checkpoint("ready");
      await this.persist("waiting");
      await this.shutdown();
      await this.persist("vacated");
      await this.checkpoint("vacated");
      await mkdir(dirname(backup), { recursive: true, mode: 0o700 });
      const targetExists = await exists(job.target),
        backupExists = await exists(backup),
        candidateExists = await exists(candidate);
      if (targetExists && (await hash(job.target)) === this.record.oldHash && !backupExists && candidateExists) {
        if ((await hash(candidate)) !== this.record.newHash) throw Error("candidate bytes changed");
        await rename(job.target, backup);
        await sync(dirname(job.target));
        await sync(dirname(backup));
        await this.persist("displaced");
        await this.checkpoint("displaced");
      } else if (!targetExists && backupExists && candidateExists) {
        if ((await hash(backup)) !== this.record.oldHash || (await hash(candidate)) !== this.record.newHash)
          throw Error("interrupted install bytes mismatch");
      } else if (
        !(
          targetExists &&
          backupExists &&
          !candidateExists &&
          (await hash(job.target)) === this.record.newHash &&
          (await hash(backup)) === this.record.oldHash
        )
      )
        throw Error("unrecognized installation layout; recovery required");
      if (await exists(candidate)) {
        await rename(candidate, job.target);
        await sync(dirname(job.target));
      }
      await bundle(job.target, {
        appid:
          job.metadata.channel === "stable" ? job.metadata.product : `${job.metadata.product}.${job.metadata.channel}`,
        version: job.shell.version,
      });
      if ((await hash(job.target)) !== this.record.newHash) throw Error("installed candidate hash mismatch");
      await this.persist("installed");
      await this.checkpoint("installed");
      const current = await observeOwner(job.runtime.root, {
        channel: scope(job.metadata.channel).channel,
        namespace: namespace(job.runtime.namespace),
      });
      if (current) throw Error("runtime root is still live; adoption is not allowed");
      const executable = (
        await bundle(job.target, {
          appid:
            job.metadata.channel === "stable"
              ? job.metadata.product
              : `${job.metadata.product}.${job.metadata.channel}`,
          version: job.shell.version,
        })
      ).executable;
      const env = {
        ...job.env,
        ODSUITE_INSTALLATION_ROOT: job.root,
        ODSUITE_INSTALLATION_ID: job.id,
        ODSUITE_INSTALLATION_NONCE: job.nonce,
        ODSUITE_PROBE: "0",
        ELECTRON_RUN_AS_NODE: undefined,
        ODSUITE_CANDIDATE: join(job.home, "content"),
        ODSUITE_RECOVER: "0",
        ODSUITE_DATA: job.runtime.root,
        ODSUITE_INSTALLATION_PAUSE: undefined,
      };
      this.launched = startManager({
        root: job.runtime.root,
        scope: { channel: scope(job.metadata.channel).channel, namespace: namespace(job.runtime.namespace) },
        command: executable,
        args: [],
        env,
        timeout: 30000,
        log: join(job.home, "manager.log"),
      });
      this.record.next = await this.launched;
      await this.persist("launched");
      await this.checkpoint("launched");
      await new Promise<void>((done, reject) => {
        if (this.record.phase === "confirmed") return done();
        this.accepted = done;
        const timer = setTimeout(() => reject(Error("new host confirmation timeout")), 30000);
        const accepted = this.accepted;
        this.accepted = () => {
          clearTimeout(timer);
          accepted();
        };
      });
      await this.checkpoint("confirmed");
    } catch (error) {
      this.record.error = String(error);
      await this.persist("failed");
      throw error;
    }
  }
}
