import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { digest, factoryScope } from "@odsuite/protocol";
import { type Context, managerEndpoint, serve } from "@odsuite/sidecar";
import { canonical, directory, exclusive, json } from "./files.js";
import { Collector } from "./install/collection.js";
import { Transaction } from "./install/transaction.js";
import { Transitions } from "./transitions.js";
import { InstallerFault, type Options, type Session } from "./types.js";
import { consume, observations } from "./usage.js";

/** Policy ownership marker is not a lock or liveness registry. Only sidecar claims authority. */
async function ownership(home: string, product: string) {
  const path = join(home, "product.json"),
    current = await json(path);
  if (current !== undefined) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      Object.keys(current).sort().join(":") !== "product:schema" ||
      (current as { schema: unknown }).schema !== 1 ||
      (current as { product: unknown }).product !== product
    )
      throw new InstallerFault("conflict", "installation home belongs to another product or has invalid policy");
    return;
  }
  if ((await readdir(home)).length)
    throw new InstallerFault("conflict", "nonempty installation home has no ownership policy");
  try {
    await exclusive(path, { schema: 1, product });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    await ownership(home, product);
  }
}
export async function open(options: Options): Promise<Session> {
  if (
    !options ||
    typeof options.product !== "string" ||
    !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(options.product) ||
    options.product.length > 120
  )
    throw new InstallerFault("invalid", "invalid installation product");
  const scope = factoryScope(options.scope),
    home = await canonical(options.home);
  if (join(home, "..") === home) throw new InstallerFault("invalid", "installation home cannot be a filesystem root");
  await directory(home);
  await ownership(home, options.product);
  const authority = await directory(home, ["authority", options.product]);
  const service = await serve(managerEndpoint(authority), { root: authority });
  const factory = service.factory(scope);
  let transaction: Transaction | undefined, context: Context | undefined, transitions: Transitions | undefined;
  let closing = false,
    closed: Promise<void> | undefined;
  const pending = new Set<Promise<unknown>>();
  try {
    const target = await directory(home, ["applications", options.product, scope.channel, scope.namespace]);
    const old = (await factory.resources()).grants.find(
      (grant) => grant.kind === "installation" && grant.name === "application",
    );
    if (old && old.value !== target) throw new InstallerFault("integrity", "installation grant target changed");
    await factory.grant({ kind: "installation", name: "application", scope: "factory", target });
    const established = new Set(
      (await factory.resources()).grants.filter((grant) => grant.kind === "data").map((grant) => grant.value),
    );
    await factory.expose({
      identity: { service: "installer", generation: digest("node-installation-v3") },
      handlers: {},
      lifecycle: {
        initialize: async (value) => {
          context = value;
          transaction = new Transaction(
            { ...options, home, scope },
            target,
            value.roots.data,
            established.has(value.roots.data),
          );
        },
        stop: async () => {
          transitions?.close();
          transaction?.store.close();
        },
      },
    });
    if (!context || !transaction) throw new InstallerFault("integrity", "installation context is unavailable");
    const active = transaction;
    let queue: Promise<unknown> = Promise.resolve();
    const run = <T>(work: () => Promise<T>) => {
      if (closing) return Promise.reject(new InstallerFault("conflict", "installation session is closing"));
      const task = queue.then(() => factory.session(work));
      queue = task.catch(() => undefined);
      pending.add(task);
      void task.then(
        () => pending.delete(task),
        () => pending.delete(task),
      );
      return task;
    };
    const journal = async (create = false) => {
      if (transitions) return transitions;
      const old = (await factory.resources()).grants.some((g) => g.kind === "data" && g.name === "transitions");
      if (!old && !create) return undefined;
      const grant = await factory.grant({ kind: "data", name: "transitions", scope: "factory" });
      await directory(grant.value);
      transitions = new Transitions(grant.value, old);
      return transitions;
    };
    const allowed = async (id?: string) => {
      if (active.store.collection.read())
        throw new InstallerFault("conflict", "unfinished collection must resume first");
      const pending = (await journal())?.read();
      if (pending && pending.requestId !== id)
        throw new InstallerFault("conflict", "unfinished installation transition must resume first");
    };
    const collector = new Collector(active, { ...options, home, scope }, async () => (await journal())?.read());
    return {
      factory,
      context,
      install: (input) => {
        const accepted = { ...input, source: input?.source ? { ...input.source } : input?.source };
        return run(async () => {
          await allowed();
          return active.install(accepted);
        });
      },
      stage: (input) => {
        const accepted = { ...input, source: input?.source ? { ...input.source } : input?.source };
        return run(async () => {
          if (active.store.collection.read())
            throw new InstallerFault("conflict", "unfinished collection must resume first");
          return active.install(accepted, false);
        });
      },
      select: (input) =>
        run(async () => {
          await allowed(input.transition);
          return active.select(input);
        }),
      transitions: {
        read: (id) => run(async () => (await journal())?.read(id)),
        begin: (input) =>
          run(async () => {
            if (active.store.collection.read())
              throw new InstallerFault("conflict", "unfinished collection must resume first");
            return (await journal(true))!.begin(input);
          }),
        advance: (input) => run(async () => (await journal(true))!.advance(input)),
      },
      read: (carrier) => run(() => active.read(carrier)),
      use: (input) => {
        const accepted = structuredClone(input);
        return run(async () => {
          if (active.store.collection.read())
            throw new InstallerFault("conflict", "unfinished collection must resume first");
          return consume(active, factory, accepted);
        });
      },
      uses: () => run(() => observations(active)),
      gc: {
        plan: (protectedReceipts) => {
          const accepted = structuredClone(protectedReceipts);
          return run(() => collector.plan(accepted));
        },
        apply: (input) => {
          const accepted = structuredClone(input);
          return run(() => collector.apply(accepted));
        },
        read: (id) => run(async () => active.store.collection.read(id)),
      },
      close: () => {
        closed ??= (async () => {
          closing = true;
          await Promise.allSettled([...pending]);
          await service.close();
        })();
        return closed;
      },
    };
  } catch (error) {
    closing = true;
    await service.close();
    throw error;
  }
}
