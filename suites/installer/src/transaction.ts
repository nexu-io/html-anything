import { randomUUID } from "node:crypto";
import { chmod, lstat, rename } from "node:fs/promises";
import { join } from "node:path";
import { canonical as serialize } from "@odsuite/protocol";
import { materialize, parseReleaseVersion } from "@odsuite/release";
import { source, verify } from "./archive.js";
import { canonical, directory, inside, sync } from "./files.js";
import { fingerprint, type Intent, Store } from "./store.js";
import { type Input, InstallerFault, type Options, type Receipt } from "./types.js";

export class Transaction {
  readonly store: Store;
  constructor(
    private options: Options,
    private target: string,
    data: string,
    established: boolean,
  ) {
    this.store = new Store(data, established);
  }
  private check(value: Receipt) {
    if (
      value.product !== this.options.product ||
      value.channel !== this.options.scope.channel ||
      value.namespace !== this.options.scope.namespace ||
      !/^[a-z][a-z0-9-]{0,31}$/.test(value.carrier)
    )
      throw new InstallerFault("integrity", "installation receipt identity changed");
    parseReleaseVersion(value.version, value.channel);
    if (value.path !== join(this.target, "versions", value.carrier, value.version, value.digest.slice(7)))
      throw new InstallerFault("integrity", "installed path escaped its grant");
    if (
      inside(join(this.options.home, "authority"), value.data) ||
      inside(join(this.options.home, "applications"), value.data) ||
      inside(value.data, this.options.home)
    )
      throw new InstallerFault("integrity", "runtime data overlaps installation paths");
  }
  private async verified(value: Receipt) {
    this.check(value);
    try {
      if ((await canonical(value.path)) !== value.path)
        throw new InstallerFault("integrity", "installed path escaped its grant");
      await verify(value.path, this.store.files(value));
      return value;
    } catch (error) {
      if (error instanceof InstallerFault) throw error;
      throw new InstallerFault("integrity", "installed closure cannot be verified");
    }
  }
  async read(carrier: string) {
    if (!/^[a-z][a-z0-9-]{0,31}$/.test(carrier)) throw new InstallerFault("invalid", "invalid carrier identity");
    const value = this.store.read(carrier);
    if (value && value.carrier !== carrier) throw new InstallerFault("integrity", "selected carrier receipt changed");
    return value ? this.verified(value) : undefined;
  }
  private async checkpoint(value: Intent, phase: "intent" | "materialized" | "installed" | "selected") {
    await this.options.onCheckpoint?.({ phase, requestId: value.receipt.requestId });
  }
  async install(input: Input) {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.requestId) ||
      !input.source ||
      !/^[a-f0-9]{64}$/.test(input.source.sha256)
    )
      throw new InstallerFault("invalid", "invalid installation request identity");
    const data = await canonical(input.data);
    if (
      inside(join(this.options.home, "authority"), data) ||
      inside(join(this.options.home, "applications"), data) ||
      inside(data, this.options.home)
    )
      throw new InstallerFault("invalid", "runtime data must remain separate from installation authority/applications");
    const key = fingerprint({
      requestId: input.requestId,
      data,
      sha256: input.source.sha256,
      product: this.options.product,
      ...this.options.scope,
    });
    const prior = this.store.lookup(input.requestId, key);
    if (prior) {
      if (prior.digest !== `sha256:${input.source.sha256}` || prior.data !== data)
        throw new InstallerFault("integrity", "installation receipt changed its pinned intent");
      return this.verified(prior);
    }
    // Reject changed intent before touching source bytes, including for an interrupted transaction.
    const pending = this.store.pending(input.requestId, key);
    if (!(input.source.bytes instanceof Uint8Array) || input.source.bytes.length > 64 * 1024 ** 2)
      throw new InstallerFault("invalid", "invalid pinned Node closure bytes");
    const pinned = { sha256: input.source.sha256, bytes: Buffer.from(input.source.bytes) };
    const archive = source(pinned);
    if (archive.runtime.channel !== this.options.scope.channel)
      throw new InstallerFault("invalid", "closure channel differs from installation factory");
    const receipt: Receipt = {
      requestId: input.requestId,
      product: this.options.product,
      carrier: archive.runtime.carrier,
      channel: this.options.scope.channel,
      namespace: this.options.scope.namespace,
      version: archive.runtime.version,
      digest: `sha256:${input.source.sha256}`,
      path: join(this.target, "versions", archive.runtime.carrier, archive.runtime.version, input.source.sha256),
      data,
    };
    this.check(receipt);
    const record = pending ?? this.store.prepare(receipt, key, archive.files);
    if (serialize(record.receipt) !== serialize(receipt) || serialize(record.files) !== serialize(archive.files))
      throw new InstallerFault("integrity", "retained installation intent differs from verified archive");
    await this.checkpoint(record, "intent");
    let exists = false;
    try {
      await lstat(receipt.path);
      exists = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (exists) {
      if (record.phase === "intent")
        throw new InstallerFault("conflict", "uncommitted installation target already exists");
      if ((await canonical(receipt.path)) !== receipt.path)
        throw new InstallerFault("integrity", "installed path escaped its grant");
      await verify(receipt.path, record.files, true);
    } else {
      if (record.phase === "installed" || record.phase === "selected")
        throw new InstallerFault("integrity", "committed installation disappeared");
      const latest = record.stages.at(-1);
      let stage = latest ? join(this.target, ".staging", input.requestId, latest) : undefined,
        ready = false;
      if (stage) {
        try {
          await verify(stage, record.files, true);
          ready = true;
        } catch (error) {
          if (record.phase === "materialized") throw error;
        }
      }
      if (!ready) {
        if (record.stages.length >= 32)
          throw new InstallerFault("conflict", "retained installation attempts require explicit reconciliation");
        const attempt = randomUUID();
        record.stages.push(attempt);
        record.phase = "intent";
        this.store.save(record);
        stage = await directory(this.target, [".staging", input.requestId, attempt]);
        await materialize(pinned.bytes, stage);
        await verify(stage, record.files, true);
      }
      if (!stage) throw new InstallerFault("integrity", "installation stage is missing");
      record.phase = "materialized";
      this.store.save(record);
      await this.checkpoint(record, "materialized");
      const parent = await directory(this.target, ["versions", receipt.carrier, receipt.version]);
      if ((await lstat(stage)).dev !== (await lstat(parent)).dev)
        throw new InstallerFault("invalid", "installation staging and version must share a filesystem");
      await chmod(stage, 0o700);
      await rename(stage, receipt.path);
      await sync(parent);
      await sync(join(this.target, ".staging", input.requestId));
      if ((await canonical(receipt.path)) !== receipt.path)
        throw new InstallerFault("integrity", "installed path escaped its grant");
      await verify(receipt.path, record.files, true);
    }
    record.phase = "installed";
    this.store.save(record);
    await this.checkpoint(record, "installed");
    const result = this.store.complete(record);
    await this.checkpoint(record, "selected");
    return result;
  }
}
