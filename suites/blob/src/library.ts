import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { canonical, type Digest, valid } from "@odsuite/protocol";
import type { Directory } from "@odsuite/sidecar";
import { locate } from "./control/access.js";
import { clock } from "./control/clock.js";
import { Controller } from "./control/controller.js";
import { eraseView } from "./control/erase.js";
import { scoped } from "./control/session.js";
import { anchor, exists, fs, read, save, view } from "./files.js";
import { compatible, exact, key, materialize, resource } from "./materialize/index.js";
import { Store } from "./store.js";
import type {
  Consumer,
  Entry,
  LibraryOptions,
  LibrarySession,
  Loader,
  Owner,
  Reference,
  Resource,
  State,
  Use,
} from "./types.js";

function consumer(value: Consumer) {
  if (
    !value ||
    !/^[a-z][a-z0-9]*$/.test(value.service) ||
    !valid(value.generation) ||
    !/^[a-f0-9-]{36}$/.test(value.incarnation) ||
    (value.epoch !== undefined && !/^[A-Za-z0-9:_-]{1,128}$/.test(value.epoch))
  )
    throw Error("invalid blob consumer");
}
function alive(owner: Owner, directory: Directory): "live" | "retired" | "unknown" {
  consumer(owner);
  if (directory.manager.phase !== "active") return "unknown";
  if (directory.manager.incarnation !== owner.manager) return "retired";
  const entry = directory.instances.find((e) => e.service === owner.service);
  if (!entry) return "unknown";
  if (entry.incarnation !== owner.incarnation) return "retired";
  if (entry.generation !== owner.generation) return "unknown";
  return entry.phase === "retired"
    ? "retired"
    : entry.phase === "ready" || entry.phase === "initializing" || entry.phase === "stopping"
      ? "live"
      : "unknown";
}
function settle(state: State) {
  const pinned = new Set(state.references.flatMap((r) => r.keys));
  for (const [id, entry] of Object.entries(state.entries)) {
    if (pinned.has(id as Digest) || entry.uses.length || entry.operation) delete entry.idleSince;
    else entry.idleSince ??= clock.now();
  }
}
export class Library {
  private loads = new Map<Digest, Promise<string>>();
  private fetching = new Map<Digest, Promise<void>>();
  private controller: Controller;
  private closing?: Promise<void>;
  private timer?: ReturnType<typeof setInterval>;
  private constructor(
    private options: LibraryOptions,
    private roots: { data: string; cas: string; cache: string },
    private owner: Owner,
    private store: Store,
  ) {
    this.controller = new Controller(options.context);
    this.timer = options.context.background(() =>
      setInterval(() => {
        void this.collect().catch((error) => {
          if (options.onError) options.onError(error);
          else process.stderr.write(`blob GC: ${String(error)}\n`);
        });
      }, options.intervalMs ?? 60000),
    );
    this.timer.unref();
  }
  static async open(options: LibraryOptions) {
    const retention = options.retentionMs ?? 3600000,
      interval = options.intervalMs ?? 60000;
    if (!Number.isSafeInteger(interval) || interval < 1 || interval > 3600000)
      throw Error("invalid blob collection interval");
    if (!Number.isSafeInteger(retention) || retention < 0) throw Error("invalid blob retention");
    options = { ...options, name: options.name ?? "blob" };
    if (!/^[a-z][a-z0-9]{0,31}$/.test(options.name!)) throw Error("invalid blob domain");
    const factory = options.factory,
      context = options.context;
    if (factory.scope.channel !== context.identity.channel || factory.scope.namespace !== context.identity.namespace)
      throw Error("blob factory mismatch");
    return factory.session(async () => {
      const directory = await factory.directory(),
        instance = directory.instances.find((i) => i.service === context.identity.service);
      if (
        instance?.kind !== "hosted" ||
        instance.pid !== process.pid ||
        instance.incarnation !== context.incarnation ||
        instance.phase !== "initializing"
      )
        throw Error("open blob library during real owner initialization");
      const established = (await factory.resources()).grants.some((g) => g.kind === "data" && g.name === options.name);
      const data = await factory.grant({ kind: "data", name: options.name!, scope: "factory" }),
        cas = await factory.grant({ kind: "cas", name: options.name!, scope: "factory" }),
        cache = await factory.grant({ kind: "cache", name: options.name!, scope: "factory" });
      for (const root of [data.value, cas.value, cache.value]) await anchor(root);
      if (established && !(await exists(join(data.value, "library.json"))))
        throw Error("blob library metadata missing; reconciliation required");
      await fs.mkdir(join(cache.value, "views"), { recursive: true, mode: 0o700 });
      await anchor(join(cache.value, "views"));
      const state = await read(join(data.value, "library.json"), !established);
      if (state.owner && alive(state.owner, directory) !== "retired")
        throw Error("blob library already owned or unresolved");
      const owner: Owner = {
        service: instance.service,
        generation: instance.generation,
        incarnation: instance.incarnation,
        manager: directory.manager.incarnation,
      };
      const library = new Library(
        { ...options, retentionMs: retention },
        { data: data.value, cas: cas.value, cache: cache.value },
        owner,
        await Store.open({ root: cas.value }),
      );
      try {
        for (const [id, entry] of Object.entries(state.entries))
          if (key(entry.resource) !== id) throw Error("blob entry identity mismatch");
        await library.reconcile(state, directory);
        for (const [id, entry] of Object.entries(state.entries))
          if (entry.phase === "deleting") await library.erase(state, id as Digest);
        state.owner = owner;
        settle(state);
        await library.write(state);
        return library;
      } catch (error) {
        if (library.timer) clearInterval(library.timer);
        await library.controller.drain();
        throw error;
      }
    });
  }
  private path() {
    return join(this.roots.data, "library.json");
  }
  private async write(state: State) {
    await save(this.path(), state);
  }
  private async state() {
    for (const path of [this.roots.data, this.roots.cas, this.roots.cache, join(this.roots.cache, "views")])
      await anchor(path);
    if (!(await exists(this.path()))) throw Error("blob library metadata missing; reconciliation required");
    const state = await read(this.path());
    if (canonical(state.owner) !== canonical(this.owner)) throw Error("blob library owner changed");
    for (const [id, entry] of Object.entries(state.entries)) {
      if (key(entry.resource) !== id) throw Error("blob entry identity mismatch");
      for (const use of entry.uses)
        if (use.key !== id || use.path !== join(view(this.roots.cache, id), "value"))
          throw Error("blob use path mismatch");
    }
    return state;
  }
  private async cleanup(entry: Entry) {
    if (!entry.operation) return;
    const operation = entry.operation,
      grant = (await this.options.factory.resources()).grants.find((g) => g.lease === operation.lease);
    if (grant) {
      if (
        grant.kind !== "staging" ||
        grant.name !== this.options.name ||
        grant.owner !== operation.id ||
        grant.value !== operation.path
      )
        throw Error("blob operation grant mismatch");
      await this.options.factory.revoke(grant.lease);
    }
    delete entry.operation;
  }
  private async reconcile(state: State, directory: Directory) {
    for (const [id, entry] of Object.entries(state.entries)) {
      entry.uses = entry.uses.filter((u) => alive(u.owner, directory) !== "retired");
      if (
        entry.operation &&
        (alive(entry.operation.owner, directory) === "retired" ||
          (canonical(entry.operation.owner) === canonical(this.owner) &&
            entry.phase === "failed" &&
            !this.loads.has(id as Digest)))
      ) {
        await this.cleanup(entry);
        entry.phase = "failed";
        entry.error = "interrupted blob load; explicit recovery reconciled";
      }
    }
    settle(state);
  }
  private mutate<T>(operation: (state: State, directory: Directory) => Promise<T>) {
    return this.options.context.cleanup(() =>
      this.options.factory.session(async () => {
        const state = await this.state(),
          directory = await this.options.factory.directory();
        if (alive(this.owner, directory) !== "live") throw Error("blob controller is not live");
        const before = canonical(state);
        await this.reconcile(state, directory);
        const value = await operation(state, directory);
        settle(state);
        if (canonical(state) !== before) await this.write(state);
        return value;
      }),
    );
  }
  private entry(state: State, value: Resource) {
    const id = key(value);
    state.entries[id] ??= { resource: resource(value), phase: "empty", uses: [] };
    return { id, entry: state.entries[id] };
  }
  acquire(value: Resource, load: Loader, who: Consumer = this.owner): Promise<Use> {
    const spec = resource(value);
    compatible(spec);
    consumer(who);
    return this.controller.run(() => this.acquireWithin(spec, load, who));
  }
  private async acquireWithin(spec: Resource, load: Loader, who: Consumer): Promise<Use> {
    const use = await this.mutate(async (state, directory) => {
      const instance = directory.instances.find(
        (i) => i.service === who.service && i.generation === who.generation && i.incarnation === who.incarnation,
      );
      if (instance?.phase !== "ready") throw Error("blob consumer is not a ready sidecar subject");
      const { id, entry } = this.entry(state, spec);
      if (entry.phase === "deleting") throw Error("blob deletion is pending recovery");
      const use: Use = {
        id: randomUUID(),
        key: id,
        path: join(view(this.roots.cache, id), "value"),
        owner: {
          service: who.service,
          generation: who.generation,
          incarnation: who.incarnation,
          ...(who.epoch === undefined ? {} : { epoch: who.epoch }),
          manager: directory.manager.incarnation,
        },
      };
      entry.uses.push(use);
      return use;
    });
    try {
      await this.ensure(spec, load);
      await this.mutate(async (state, directory) => {
        if (alive(use.owner, directory) !== "live") throw Error("blob consumer retired during load");
        if (!state.entries[use.key]?.uses.some((u) => u.id === use.id)) throw Error("blob use was retired during load");
      });
      return use;
    } catch (error) {
      await this.releaseWithin(use);
      throw error;
    }
  }
  private ensure(spec: Resource, load: Loader) {
    const id = key(spec),
      current = this.loads.get(id);
    if (current) return current;
    const work = this.load(spec, load);
    this.loads.set(id, work);
    void work.then(
      () => this.loads.delete(id),
      () => this.loads.delete(id),
    );
    return work;
  }
  private async load(spec: Resource, loader: Loader) {
    const id = key(spec),
      destination = view(this.roots.cache, id),
      operation = await this.mutate(async (state) => {
        const entry = state.entries[id]!;
        if (entry.phase === "loading") throw Error("blob load is unresolved");
        if (entry.phase === "ready") return undefined;
        const attempt = randomUUID(),
          grant = await this.options.factory.grant({
            kind: "staging",
            name: this.options.name!,
            scope: "attempt",
            owner: attempt,
          });
        entry.phase = "loading";
        delete entry.error;
        entry.operation = { id: attempt, lease: grant.lease, path: grant.value, owner: this.owner };
        return entry.operation;
      });
    if (!operation) {
      try {
        return await exact(spec, destination);
      } catch (error) {
        await this.mutate(async (state) => {
          state.entries[id]!.phase = "failed";
          state.entries[id]!.error = String(error);
        });
        throw error;
      }
    }
    try {
      await anchor(operation.path);
      await this.options.onCheckpoint?.({ phase: "loading", key: id });
      this.controller.abort.signal.throwIfAborted();
      await this.fetch(spec, loader, operation.path);
      const stage = join(operation.path, "content");
      await materialize(
        spec,
        spec.type === "archive" ? await this.store.path(spec.artifact) : await this.store.read(spec.artifact),
        stage,
        this.controller.abort.signal,
      );
      await this.options.factory.session(async () => {
        const state = await this.state(),
          entry = state.entries[id]!;
        if (entry.operation?.id !== operation.id) throw Error("blob operation changed");
        this.controller.abort.signal.throwIfAborted();
        if (await exists(destination)) {
          await exact(spec, destination);
          await fs.rm(stage, { recursive: true });
        } else await fs.rename(stage, destination);
        await this.options.onCheckpoint?.({ phase: "materialized", key: id });
        await this.cleanup(entry);
        entry.phase = "ready";
        settle(state);
        await this.write(state);
      });
      return exact(spec, destination);
    } catch (error) {
      await this.mutate(async (state) => {
        const entry = state.entries[id]!;
        entry.phase = "failed";
        entry.error = String(error);
        if (entry.operation?.id === operation.id) await this.cleanup(entry);
      });
      throw error;
    }
  }
  private async fetch(spec: Resource, loader: Loader, staging: string) {
    if (await this.store.has(spec.artifact)) return;
    let work = this.fetching.get(spec.artifact.digest);
    if (!work) {
      work = (async () => {
        const bytes = await loader(this.controller.abort.signal);
        this.controller.abort.signal.throwIfAborted();
        await this.store.import(spec.artifact, bytes, staging, this.controller.abort.signal);
      })();
      this.fetching.set(spec.artifact.digest, work);
      void work.then(
        () => this.fetching.delete(spec.artifact.digest),
        () => this.fetching.delete(spec.artifact.digest),
      );
    }
    await work;
  }
  release(use: Use) {
    return this.controller.run(() => this.releaseWithin(use));
  }
  private releaseWithin(use: Use) {
    return this.mutate(async (state) => {
      const entry = state.entries[use.key],
        found = entry?.uses.find((u) => u.id === use.id);
      if (!found) return false;
      if (canonical(found) !== canonical(use)) throw Error("blob use witness mismatch");
      entry!.uses = entry!.uses.filter((u) => u.id !== use.id);
      return true;
    });
  }
  prefetch(value: Resource, load: Loader) {
    return this.controller.run(() => this.prefetchWithin(value, load));
  }
  private async prefetchWithin(value: Resource, load: Loader) {
    const spec = resource(value);
    compatible(spec);
    const use = await this.acquireWithin(spec, load, this.owner);
    try {
      return { key: use.key, type: spec.type, bytes: spec.artifact.bytes };
    } finally {
      await this.releaseWithin(use);
    }
  }
  retain(kind: Reference["kind"], name: string, values: Resource[]) {
    return this.controller.run(() => this.retainWithin(kind, name, values));
  }
  private retainWithin(kind: Reference["kind"], name: string, values: Resource[]) {
    this.reference(kind, name);
    const specs = values.map(resource);
    return this.mutate(async (state) => {
      const keys = [...new Set(specs.map((s) => this.entry(state, s).id))].sort();
      if (keys.some((id) => state.entries[id]!.phase === "deleting")) throw Error("blob deletion is pending recovery");
      state.references = state.references.filter((r) => r.kind !== kind || r.name !== name);
      state.references.push({ kind, name, keys });
    });
  }
  private reference(kind: Reference["kind"], name: string) {
    if (!["current", "prepared", "recovery"].includes(kind) || !/^[-A-Za-z0-9:_.]{1,128}$/.test(name))
      throw Error("invalid blob reference");
  }
  unretain(kind: Reference["kind"], name: string) {
    return this.controller.run(() => this.unretainWithin(kind, name));
  }
  private unretainWithin(kind: Reference["kind"], name: string) {
    this.reference(kind, name);
    return this.mutate(async (state) => {
      state.references = state.references.filter((r) => r.kind !== kind || r.name !== name);
    });
  }
  /** Execute within the caller's factory lane; never dispatch a competing controller. */
  session<T>(operation: (library: LibrarySession) => Promise<T>): Promise<T> {
    return this.controller.track(() =>
      this.options.factory.session(async () => {
        if (alive(this.owner, await this.options.factory.directory()) !== "live")
          throw Error("blob controller is not live");
        return scoped(
          {
            referencedPath: async (value) => locate(value, this.roots.cache, await this.state(), true),
            read: async (value) => {
              const spec = resource(value);
              if (spec.type === "archive") throw Error("native archives require verified paths, not buffered reads");
              await locate(spec, this.roots.cache, await this.state());
              return this.store.read(spec.artifact);
            },
            status: async () => structuredClone(await this.state()),
            acquire: (value, load, who = this.owner) => {
              const spec = resource(value);
              compatible(spec);
              consumer(who);
              return this.acquireWithin(spec, load, who);
            },
            prefetch: (value, load) => this.prefetchWithin(value, load),
            release: (use) => this.releaseWithin(use),
            retain: (kind, name, values) => this.retainWithin(kind, name, values),
            unretain: (kind, name) => this.unretainWithin(kind, name),
          },
          operation,
        );
      }),
    );
  }
  status() {
    return this.controller.run(() => this.options.factory.session(async () => structuredClone(await this.state())));
  }
  private async erase(state: State, id: Digest) {
    const entry = state.entries[id]!;
    if (entry.uses.length || entry.operation || state.references.some((r) => r.keys.includes(id)))
      throw Error("blob deletion intent conflicts with protection");
    await eraseView(this.roots.cache, id, entry.resource.type !== "file", this.options.onCheckpoint);
    if (
      !Object.entries(state.entries).some(
        ([other, e]) => other !== id && e.resource.artifact.digest === entry.resource.artifact.digest,
      )
    )
      await this.store.remove(entry.resource.artifact.digest);
    delete state.entries[id];
  }
  collect() {
    return this.controller.run(() =>
      this.mutate(async (state) => {
        const removed: Digest[] = [],
          now = clock.now(),
          pinned = new Set(state.references.flatMap((r) => r.keys));
        for (const [key, entry] of Object.entries(state.entries)) {
          const id = key as Digest;
          if (
            pinned.has(id) ||
            entry.uses.length ||
            entry.operation ||
            entry.idleSince === undefined ||
            now - entry.idleSince < this.options.retentionMs!
          )
            continue;
          entry.phase = "deleting";
          await this.write(state);
          await this.options.onCheckpoint?.({ phase: "deleting", key: id });
          await this.erase(state, id);
          await this.write(state);
          removed.push(id);
        }
        return removed;
      }),
    );
  }
  close() {
    this.closing ??= (async () => {
      if (this.timer) clearInterval(this.timer);
      await this.controller.drain();
      await this.options.factory.session(async () => {
        const state = await this.state();
        await this.reconcile(state, await this.options.factory.directory());
        delete state.owner;
        settle(state);
        await this.write(state);
      });
    })();
    return this.closing;
  }
}
