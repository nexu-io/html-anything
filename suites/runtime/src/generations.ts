import { randomUUID } from "node:crypto";
import { mkdir, open, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Library } from "@odsuite/blob";
import {
  type Artifact,
  type Channel,
  canonical,
  type Digest,
  type Envelope,
  envelope,
  type Gate,
  gates,
  type Mode,
  type Namespace,
  startup,
  verify,
} from "@odsuite/protocol";
import type { Feed } from "@odsuite/publish";
import { decode } from "@odsuite/release";
import type { Change, Client, Factory, Journal } from "@odsuite/sidecar";
import { ContentResources } from "./control/content.js";

export interface Content {
  artifact: Artifact;
  bytes: string | Uint8Array;
}

export interface Attempt {
  channel: Channel;
  lease: string;
  namespace: Namespace;
  nonce: string;
  revision: number;
  target: Digest;
}

export interface Mount {
  blobs: Record<string, string>;
  capsule: string;
  daemon: string;
  target: Digest;
  web: string;
}

function list(value: Envelope): Artifact[] {
  const generation = value.generation;
  return [generation.capsule, generation.daemon, generation.web, ...generation.blobs];
}

function key(artifact: Artifact): string {
  return [artifact.kind, artifact.slot, artifact.digest, artifact.bytes].join(":");
}

function changed(value: Change): Journal {
  if (!value.ok) throw new Error(`binding ${value.fault}`);
  return value.journal;
}

async function write(path: string, bytes: string | Uint8Array): Promise<void> {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function persist(path: string, bytes: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { mode: 0o700, recursive: true });
  try {
    await write(path, bytes);
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code !== "EEXIST") throw fault;
    const current = await readFile(path);
    if (!current.equals(Buffer.from(bytes))) throw new Error("durable receipt conflict");
  }
}

export class Generations {
  readonly factory: Factory;
  readonly resources: ContentResources;
  async content(target: Digest): Promise<{ envelope: Envelope; assets: Content[] }> {
    return this.factory.session(async () => {
      const data = await this.factory.grant({ kind: "data", name: "capsule", scope: "factory" });
      const manifest = envelope(
        JSON.parse(await readFile(join(data.value, "generations", `${target.slice(7)}.json`), "utf8")),
      );
      if (manifest.digest !== target) throw new Error("generation receipt mismatch");
      return { envelope: manifest, assets: await this.resources.bytes(manifest) };
    });
  }
  constructor(
    readonly client: Client,
    readonly namespace: Namespace,
    readonly channel: Channel,
    library: Library,
    readonly carrier = 1,
  ) {
    this.factory = client.factory({ namespace, channel });
    this.resources = new ContentResources(library, this.factory);
  }

  async cache(name: string, release: { envelope: Envelope; assets: Content[] }) {
    return this.factory.session(async () => {
      const manifest = envelope(release.envelope);
      const data = await this.factory.grant({ kind: "data", name: "capsule", scope: "factory" });
      await persist(join(data.value, "generations", `${manifest.digest.slice(7)}.json`), canonical(manifest));
      await this.resources.prepare(manifest, release.assets, name);
    });
  }
  async update(feed: Feed): Promise<Attempt | undefined> {
    return this.factory.session(() => this.updateWithin(feed));
  }

  private async updateWithin(feed: Feed): Promise<Attempt | undefined> {
    const distribution = await feed.head(this.channel);
    if (!distribution.head) return undefined;
    const binding = await this.factory.binding();
    if (binding.state.current === distribution.head.generation && !binding.state.handoff) return undefined;
    const release = await feed.release(this.channel, distribution.head);
    return this.stage(release.envelope, release.assets);
  }

  async stage(input: unknown, contents: Content[], mode: Mode = "update"): Promise<Attempt> {
    return this.factory.session(() => this.stageWithin(input, contents, mode));
  }

  private async stageWithin(input: unknown, contents: Content[], mode: Mode = "update"): Promise<Attempt> {
    const manifest = envelope(input);
    if (manifest.generation.carrier > this.carrier) throw new Error("incompatible carrier ABI");
    const expected = new Map(list(manifest).map((artifact) => [key(artifact), artifact]));
    if (expected.size !== contents.length) throw new Error("generation content mismatch");
    const nonce = randomUUID();
    const staging = await this.factory.grant({
      kind: "staging",
      name: "capsule",
      owner: nonce,
      scope: "attempt",
    });

    try {
      for (const content of contents) {
        const artifact = expected.get(key(content.artifact));
        if (!artifact || !verify(artifact, content.bytes)) throw Error("artifact verification failed");
        expected.delete(key(artifact));
      }
      if (expected.size) throw Error("generation content missing");
      const data = await this.factory.grant({
        kind: "data",
        name: "capsule",
        scope: "factory",
      });
      await persist(join(data.value, "generations", `${manifest.digest.slice(7)}.json`), canonical(manifest));
      await this.resources.prepare(manifest, contents);
      const initial = await this.factory.binding();
      const armed = changed(
        await this.factory.transit(initial.revision, {
          mode,
          target: manifest.digest,
          type: "arm",
        }),
      );
      const begun = changed(
        await this.factory.transit(armed.revision, {
          nonce,
          target: manifest.digest,
          type: "begin",
        }),
      );
      return {
        channel: this.channel,
        lease: staging.lease,
        namespace: this.namespace,
        nonce,
        revision: begun.revision,
        target: manifest.digest,
      };
    } catch (fault) {
      await this.factory.revoke(staging.lease);
      throw fault;
    }
  }

  async ready(attempt: Attempt, gate: Gate): Promise<Attempt> {
    this.exact(attempt);
    return this.factory.session(() => this.readyWithin(attempt, gate));
  }

  private async readyWithin(attempt: Attempt, gate: Gate): Promise<Attempt> {
    if (!gates.includes(gate)) throw new TypeError("invalid readiness gate");
    const journal = changed(
      await this.factory.transit(attempt.revision, {
        gate,
        nonce: attempt.nonce,
        target: attempt.target,
        type: "ready",
      }),
    );
    return { ...attempt, revision: journal.revision };
  }

  async commit(attempt: Attempt): Promise<Journal> {
    this.exact(attempt);
    return this.factory.session(() => this.commitWithin(attempt));
  }

  private async commitWithin(attempt: Attempt): Promise<Journal> {
    const before = (await this.factory.binding()).state;
    await this.resources.beforeCommit(before);
    const journal = changed(
      await this.factory.transit(attempt.revision, {
        nonce: attempt.nonce,
        target: attempt.target,
        type: "commit",
      }),
    );
    await this.resources.synchronize(
      journal.state,
      before.current === journal.state.current ? undefined : before.current,
    );
    await this.factory.revoke(attempt.lease);
    return journal;
  }

  async fail(attempt: Attempt, error: string): Promise<Journal> {
    this.exact(attempt);
    return this.factory.session(() => this.failWithin(attempt, error));
  }

  private async failWithin(attempt: Attempt, error: string): Promise<Journal> {
    const journal = changed(
      await this.factory.transit(attempt.revision, {
        error,
        nonce: attempt.nonce,
        target: attempt.target,
        type: "fail",
      }),
    );
    await this.resources.synchronize(journal.state);
    await this.factory.revoke(attempt.lease);
    return journal;
  }

  async recover(target: Digest): Promise<Attempt> {
    return this.factory.session(() => this.recoverWithin(target));
  }

  private async recoverWithin(target: Digest): Promise<Attempt> {
    const nonce = randomUUID();
    const staging = await this.factory.grant({
      kind: "staging",
      name: "capsule",
      owner: nonce,
      scope: "attempt",
    });
    try {
      const initial = await this.factory.binding();
      const recovered = changed(
        await this.factory.transit(initial.revision, {
          target,
          type: "recover",
        }),
      );
      const begun = changed(
        await this.factory.transit(recovered.revision, {
          nonce,
          target,
          type: "begin",
        }),
      );
      return {
        channel: this.channel,
        lease: staging.lease,
        namespace: this.namespace,
        nonce,
        revision: begun.revision,
        target,
      };
    } catch (fault) {
      await this.factory.revoke(staging.lease);
      throw fault;
    }
  }

  async mount(): Promise<Mount> {
    return this.factory.session(() => this.mountWithin());
  }

  private async mountWithin(): Promise<Mount> {
    const binding = await this.factory.binding();
    const selected = startup(binding.state);
    if (selected.mode !== "normal") throw new Error(`capsule startup is ${selected.mode}`);
    return this.materialize(selected.target);
  }

  async prepare(attempt: Attempt): Promise<Mount> {
    this.exact(attempt);
    return this.factory.session(() => this.prepareWithin(attempt));
  }

  private async prepareWithin(attempt: Attempt): Promise<Mount> {
    const binding = await this.factory.binding();
    const active = binding.state.attempt;
    if (active?.status !== "running") throw new Error("capsule attempt is not running");
    if (active.nonce !== attempt.nonce || active.target !== attempt.target) {
      throw new Error("capsule attempt identity mismatch");
    }
    return this.materialize(attempt.target);
  }

  private exact(attempt: Attempt): void {
    if (attempt.channel !== this.channel || attempt.namespace !== this.namespace)
      throw new Error("capsule attempt factory mismatch");
  }

  private async materialize(target: Digest): Promise<Mount> {
    const data = await this.factory.grant({
      kind: "data",
      name: "capsule",
      scope: "factory",
    });
    const receipt = join(data.value, "generations", `${target.slice(7)}.json`);
    const manifest = envelope(JSON.parse(await readFile(receipt, "utf8")));
    if (manifest.digest !== target) throw new Error("generation receipt mismatch");
    if (manifest.generation.carrier > this.carrier) throw new Error("incompatible carrier ABI");
    const paths = await this.resources.paths(manifest);
    const release = decode(await readFile(join(paths.capsule, "release.json"), "utf8"));
    if (release.channel !== this.channel) throw new Error("capsule release channel mismatch");
    return { ...paths, target };
  }
}
