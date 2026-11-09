import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { createServer, type Server } from "node:net";
import { dirname, join } from "node:path";
import { canonical, digest, factoryKey, factoryScope, valid } from "@odsuite/protocol";
import { parse as directory } from "../control/directory.js";
import { rootKey, socketRoot } from "../process/identity.js";
import { capture, exact } from "../process/observe.js";
import { Ownership } from "../runtime/ownership.js";
import { registry, path as resourcePath } from "../runtime/resource.js";
import { parse as binding } from "./binding.js";
import { bytes, checkCleanup, witness } from "./files.js";
import { AuthorityLock } from "./lock.js";
import type { Baseline, Cleanup, FactoryState, RecoveryRecord } from "./types.js";

export const fingerprint = (baseline: Baseline) => digest(canonical(baseline));
export const baseFor = (root: string, value: FactoryState) =>
  join(root, "factories", value.scope.channel, value.scope.namespace);
export class Inventory {
  readonly locks: AuthorityLock[] = [];
  readonly reservations: Server[] = [];
  private constructor(
    readonly root: string,
    readonly manager: AuthorityLock,
    readonly current: Baseline,
  ) {}
  static async open(input: string) {
    const root = await realpath(input);
    const manager = await AuthorityLock.open(join(root, "manager.sqlite"));
    let view: Inventory | undefined;
    try {
      view = new Inventory(root, manager, {
        root,
        owner: manager.owner,
        directory: directory(manager.directory, {
          ...manager.owner,
          phase: manager.owner.phase === "active" ? "interrupted" : "closed",
        }),
        factories: [],
        cleanup: [],
      });
      const entries = [...view.current.directory.factories].sort((a, b) => factoryKey(a).localeCompare(factoryKey(b)));
      const actual: string[] = [];
      const storage = join(root, "factories");
      const channels = await (async () => {
        if (!(await lstat(storage)).isDirectory()) throw new Error("linked/invalid factory storage");
        return readdir(storage);
      })().catch((error) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      for (const channel of channels) {
        if (!(await lstat(join(storage, channel))).isDirectory()) throw new Error("linked/invalid factory channel");
        for (const namespace of await readdir(join(storage, channel))) {
          if (!(await lstat(join(storage, channel, namespace))).isDirectory())
            throw new Error("linked/invalid factory directory");
          actual.push(factoryKey(factoryScope({ channel, namespace })));
        }
      }
      if (actual.some((key) => !entries.some((entry) => factoryKey(entry) === key)))
        throw new Error("unknown factory authority");
      for (const entry of entries) {
        const scope = factoryScope(entry),
          base = join(storage, scope.channel, scope.namespace);
        if (entry.phase === "unopened") {
          if (entry.incarnation) throw new Error("unopened factory has allocator authority");
          const names = await readdir(base).catch((error) => {
            if (error.code === "ENOENT") return [];
            throw error;
          });
          const intent = manager.journal() as RecoveryRecord | undefined;
          const pending =
            intent && ["prepared", "files"].includes(intent.phase) && valid(intent.id)
              ? `binding.json.recovery-${intent.id.slice(7)}.tmp`
              : undefined;
          if (names.some((name) => name !== "binding.json" && name !== pending))
            throw new Error("unopened factory has unknown state");
          const journal = await bytes(join(base, "binding.json"));
          if (entry.binding && journal === undefined) throw new Error("binding authority missing");
          if (journal !== undefined) binding(JSON.parse(journal), scope.namespace, scope.channel);
          view.current.factories.push({ scope, ...(journal === undefined ? {} : { binding: journal }) });
          continue;
        }
        if (!entry.incarnation || entry.phase === "opening") throw new Error("factory authority unpublished");
        const lock = await AuthorityLock.open(join(base, "ownership.sqlite"));
        view.locks.push(lock);
        if (lock.owner.directory || lock.directory !== undefined || lock.owner.endpoint)
          throw new Error("invalid factory authority");
        if (lock.owner.incarnation !== entry.incarnation) throw new Error("factory incarnation changed");
        const state = await bytes(join(base, "registry.json"));
        if (state === undefined) throw new Error("resource registry missing");
        registry(JSON.parse(state), base, scope);
        const journal = await bytes(join(base, "binding.json"));
        if (entry.binding && journal === undefined) throw new Error("binding authority missing");
        if (journal !== undefined) binding(JSON.parse(journal), scope.namespace, scope.channel);
        const intent = manager.journal() as RecoveryRecord | undefined;
        const pending =
          intent && ["prepared", "files"].includes(intent.phase) && valid(intent.id) ? intent.id.slice(7) : undefined;
        if (
          (await readdir(base)).some((name) => {
            const metadata = name === "registry.tmp" || /^(binding|registry)\.json\..+\.tmp$/.test(name);
            return (
              metadata &&
              !(pending && ["registry", "binding"].some((kind) => name === `${kind}.json.recovery-${pending}.tmp`))
            );
          })
        )
          throw new Error("unpublished metadata remains");
        view.current.factories.push({
          scope,
          owner: lock.owner,
          registry: state,
          ...(journal === undefined ? {} : { binding: journal }),
        });
      }
      return view;
    } catch (error) {
      if (view) await view.close();
      else manager.close();
      throw error;
    }
  }
  record(input: unknown): RecoveryRecord | undefined {
    if (input === undefined) return undefined;
    const value = input as RecoveryRecord;
    if (
      value?.schema !== 1 ||
      !["prepared", "files", "complete"].includes(value.phase) ||
      value.baseline?.root !== this.root ||
      fingerprint(value.baseline) !== value.id
    )
      throw new Error("invalid recovery journal");
    Ownership.decode(JSON.stringify(value.baseline.owner), this.manager.path);
    directory(value.baseline.directory, {
      ...value.baseline.owner,
      phase: value.baseline.owner.phase === "active" ? "interrupted" : "closed",
    });
    const declared = value.baseline.directory.factories.map(factoryKey).sort();
    const recorded = value.baseline.factories.map((f) => factoryKey(factoryScope(f.scope))).sort();
    if (new Set(recorded).size !== recorded.length || declared.join() !== recorded.join())
      throw new Error("recovery factory set mismatch");
    for (const f of value.baseline.factories) {
      factoryScope(f.scope);
      const base = baseFor(this.root, f);
      if (f.owner) {
        if (f.registry === undefined) throw new Error("invalid recovery factory");
        Ownership.decode(JSON.stringify(f.owner), join(base, "ownership.sqlite"));
        registry(JSON.parse(f.registry), base, f.scope);
      } else if (
        f.registry !== undefined ||
        !value.baseline.directory.factories.some(
          (entry) => factoryKey(entry) === factoryKey(f.scope) && entry.phase === "unopened",
        )
      )
        throw new Error("invalid unopened factory");
      if (f.binding !== undefined) binding(JSON.parse(f.binding), f.scope.namespace, f.scope.channel);
    }
    return value;
  }
  async quiescent(baseline: Baseline, reserve = true) {
    const all = await capture();
    const live = (pid: number, birth: string) => all.some((p) => exact(p, { pid, birth }));
    if (live(baseline.owner.pid, baseline.owner.birth)) throw new Error("manager owner is alive");
    if (all.some((p) => p.stamp?.root === rootKey(this.root))) throw new Error("stamped process remains alive");
    for (const f of baseline.factories)
      if (f.owner && live(f.owner.pid, f.owner.birth)) throw new Error("factory owner is alive");
    for (const session of baseline.directory.sessions)
      if (!["completed", "failed"].includes(session.phase) && live(session.controller.pid, session.controller.birth))
        throw new Error("lifecycle controller remains alive");
    for (const entry of baseline.directory.instances) {
      if (entry.kind === "process") {
        if (!entry.process && entry.phase !== "retired") throw new Error("process ownership witness unavailable");
        if (entry.process) {
          if (entry.process.stamp.root !== rootKey(this.root)) throw new Error("foreign process root witness");
          if ([entry.process.root, entry.process.target].some((w) => live(w.pid, w.birth)))
            throw new Error("recorded process remains alive");
        }
      } else if (entry.phase !== "retired" && entry.pid !== baseline.owner.pid) throw new Error("unknown hosted owner");
    }
    for (const f of baseline.factories) {
      if (f.registry === undefined) continue;
      const state = registry(JSON.parse(f.registry!), baseFor(this.root, f), f.scope);
      for (const grant of state.grants.filter((g) => reserve && g.kind === "port" && g.scope === "attempt")) {
        const url = new URL(grant.value);
        if (url.hostname !== "127.0.0.1" || !Number(url.port)) throw new Error("invalid managed port");
        const server = createServer((socket) => socket.destroy());
        await new Promise<void>((done, reject) => {
          server.once("error", reject);
          server.listen(Number(url.port), "127.0.0.1", done);
        });
        this.reservations.push(server);
      }
    }
  }
  async cleanup(baseline: Baseline): Promise<Cleanup[]> {
    const result: Cleanup[] = [];
    for (const f of baseline.factories) {
      if (f.registry === undefined) continue;
      const base = baseFor(this.root, f),
        state = registry(JSON.parse(f.registry!), base, f.scope);
      for (const grant of state.grants.filter((g) => g.scope === "attempt" && g.kind !== "port")) {
        const path = resourcePath(base, grant, grant.lease);
        // Resource-created descendants must not redirect through a caller-created link.
        const stop = grant.kind === "socket" ? socketRoot() : base;
        let parent = dirname(path);
        while (parent !== stop) {
          try {
            if (!(await lstat(parent)).isDirectory()) throw new Error("linked resource path");
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          }
          const next = dirname(parent);
          if (next === parent) throw new Error("resource escaped root");
          parent = next;
        }
        const item = await witness(
          path,
          grant.kind === "socket" ? "socket" : grant.kind === "lock" ? "file" : "directory",
        );
        if (item) result.push(item);
      }
    }
    const endpoint = baseline.owner.endpoint;
    if (!endpoint) throw new Error("manager endpoint witness unavailable");
    const existing = await witness(endpoint.path, "socket");
    if (existing) {
      if (existing.dev !== endpoint.dev || existing.ino !== endpoint.ino || existing.ctime !== endpoint.ctime)
        throw new Error("manager endpoint changed");
      result.push(existing);
    }
    const control = await witness(join(this.root, "control.json"), "file", true);
    if (control) {
      let data: { root?: string; manager?: string };
      try {
        data = JSON.parse(await readFile(control.path, "utf8"));
      } catch {
        throw new Error("invalid manager rendezvous");
      }
      if (data.root !== this.root || data.manager !== baseline.owner.incarnation)
        throw new Error("manager rendezvous changed");
      result.push(control);
    }
    return result.sort((a, b) => a.path.localeCompare(b.path));
  }
  async validateCleanup(baseline: Baseline) {
    const allowed = new Set<string>([join(this.root, "control.json"), baseline.owner.endpoint?.path ?? ""]);
    for (const f of baseline.factories.filter((f) => f.registry !== undefined))
      for (const grant of registry(JSON.parse(f.registry!), baseFor(this.root, f), f.scope).grants) {
        if (grant.scope === "attempt" && grant.kind !== "port") {
          const path = resourcePath(baseFor(this.root, f), grant, grant.lease);
          allowed.add(join(await realpath(dirname(path)), path.split("/").at(-1)!));
        }
      }
    for (const item of baseline.cleanup) {
      if (!allowed.has(item.path)) throw new Error("recovery cleanup escaped authority");
      await checkCleanup(item);
    }
  }
  async close() {
    for (const server of this.reservations) await new Promise<void>((done) => server.close(() => done()));
    for (const lock of [...this.locks].reverse()) lock.close();
    this.manager.close();
  }
}
