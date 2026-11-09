import { randomBytes, timingSafeEqual } from "node:crypto";
import { chmod, lstat, mkdir, realpath } from "node:fs/promises";
import { createServer, type Server, type Socket } from "node:net";
import { basename, dirname, join, resolve } from "node:path";
import { type Capability, type FactoryScope, factoryKey, factoryScope, type Permit } from "@odsuite/protocol";
import { Client } from "../client.js";
import { advertise } from "../control/connection.js";
import type { Directory } from "../control/directory.js";
import { Factory } from "../control/factory.js";
import { Hosted } from "../control/hosted.js";
import type { SessionScope } from "../control/session.js";
import type { Attachment, Expose } from "../control/types.js";
import { Sidecar } from "../host.js";
import { managerIncarnation } from "../process/manager.js";
import { observeProcesses } from "../process/observe.js";
import { Bindings } from "../state/binding.js";
import { Catalog } from "./catalog.js";
import { Ownership } from "./ownership.js";
import { Resources } from "./resource.js";
import { Sessions } from "./sessions.js";
import { ambient, lifecycleScope } from "./sessionwire.js";
import { decode, encode, type Request, type Response } from "./wire.js";

export interface Service {
  authority: string;
  close(): Promise<void>;
  endpoint: string;
  expose<M>(options: Expose<M>): Promise<Attachment>;
  directory(scope?: FactoryScope): Directory;
  factory(scope: FactoryScope): Factory;
  session<T>(scope: SessionScope, operation: () => Promise<T>): Promise<T>;
}

const limit = 64 * 1024;

function equal(left: string, right: string): boolean {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

interface Runtime {
  catalog: Catalog;
  sessions: Sessions;
  endpoint: string;
  bindings: Bindings;
  capabilities: Map<string, Capability>;
  host: Sidecar;
  hosted: Hosted;
  closing: boolean;
  open(value: FactoryScope): Promise<Resources>;
}

function key(permit: Permit): string {
  return [permit.namespace, permit.channel, permit.owner, permit.service].join(":");
}

function issue(runtime: Runtime, permit: Permit): Capability {
  const identity = key(permit);
  let capability = runtime.capabilities.get(identity);
  if (!capability) {
    capability = { ...permit, token: randomBytes(32).toString("base64url") };
    runtime.capabilities.set(identity, capability);
  }
  return capability;
}

function retire(runtime: Runtime, capability: Capability): boolean {
  const identity = key(capability);
  const current = runtime.capabilities.get(identity);
  if (!current || !equal(current.token, capability.token)) return false;
  return runtime.capabilities.delete(identity);
}

async function dispatch(runtime: Runtime, authority: string, request: Request) {
  if (runtime.closing && ["start", "attach", "issue", "grant", "forward", "transit"].includes(request.type)) {
    throw new Error("sidecar is closing");
  }
  if (request.type === "session") throw new Error("session requires its owner connection");
  if (request.type === "invoke") {
    const invoke = () => runtime.hosted.invoke(request.descriptor, request.operation, request.method, request.input);
    if (request.operation === "call")
      return request.session
        ? runtime.sessions.run(request.descriptor, invoke, request.session)
        : ambient.run({ endpoint: runtime.endpoint, business: true }, invoke);
    return invoke();
  }
  if (request.type === "connect") {
    if (!equal(request.authority, authority)) throw new Error("invalid authority");
    return runtime.hosted.connect(request.identity);
  }
  if (request.type === "start") {
    if (!equal(request.authority, authority)) throw new Error("invalid authority");
    return runtime.host.start(request.spec);
  }

  if (request.type === "attach") return runtime.host.attach(request.lease);
  if (request.type === "release") return runtime.host.release(request.lease);
  if (!equal(request.authority, authority)) throw new Error("invalid authority");
  if (request.type === "directory") return runtime.catalog.snapshot(request);
  if (request.type === "inspect") return runtime.host.inspect();
  if (request.type === "binding") return runtime.bindings.read(request.namespace, request.channel);
  if (request.type === "transit") {
    runtime.catalog.binding(request);
    return runtime.bindings.transit(request.namespace, request.channel, request.revision, request.event);
  }
  if (request.type === "issue") return issue(runtime, request.permit);
  if (request.type === "retire") return retire(runtime, request.capability);
  const resources = await runtime.open(request);
  if (request.type === "grant") return resources.grant(request.resource);
  if (request.type === "forward") {
    await resources.forward(request.port, request.socket);
  }
  if (request.type === "revoke") {
    await resources.release(request.lease, request.survivors);
  }
  return resources.snapshot();
}

function reply(socket: Socket, response: Response): void {
  if (!socket.destroyed) socket.end(encode(response));
}

function accept(server: Server, runtime: Runtime, authority: string, endpoint: string): void {
  server.on("connection", (socket) => {
    let input = "";

    const read = (chunk: Buffer) => {
      input += chunk.toString("utf8");

      if (Buffer.byteLength(input) > limit) {
        reply(socket, { error: "request exceeds limit", ok: false });
        return;
      }

      const end = input.indexOf("\n");
      if (end < 0) return;
      socket.pause();
      socket.off("data", read);

      Promise.resolve(input.slice(0, end))
        .then(decode)
        .then(async (request) => {
          if (request.type === "session") {
            if (runtime.closing || !equal(request.authority, authority))
              throw new Error("invalid authority or closing manager");
            await runtime.sessions.accept(socket, request, request.actor!);
            return undefined;
          }
          if ("authority" in request && !equal(request.authority, authority)) throw new Error("invalid authority");
          const scope = lifecycleScope(request);
          const operation =
            request.type === "invoke" && request.operation === "stop"
              ? runtime.hosted.stopping(request.descriptor)
              : () => dispatch(runtime, authority, request);
          const cleanup =
            request.type === "release" ||
            request.type === "retire" ||
            (request.type === "invoke" && request.operation === "stop");
          const controller = new AbortController();
          socket.once("close", () => controller.abort());
          return {
            value: await ambient.run({ ...ambient.getStore(), endpoint, actor: request.actor }, () =>
              scope && !(request.type === "invoke" && request.operation === "stop" && !request.session)
                ? (cleanup
                    ? runtime.sessions.cleanup.bind(runtime.sessions)
                    : runtime.sessions.run.bind(runtime.sessions))(scope, operation, request.session, controller.signal)
                : operation(),
            ),
          };
        })
        .then((result) => {
          if (result) reply(socket, { ok: true, value: result.value });
        })
        .catch((error: Error) => reply(socket, { error: error.message, ok: false }));
    };
    socket.on("data", read);
  });
}

function listen(server: Server, endpoint: string): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(endpoint, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function serve(endpoint: string, options: { authority?: string; root?: string } = {}): Promise<Service> {
  let root = resolve(options.root ?? dirname(endpoint));
  const authority = options.authority ?? randomBytes(32).toString("base64url");
  for (const name of ["namespaces", "bindings"]) {
    try {
      await lstat(join(root, name));
      throw new Error("unsupported manager layout");
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
    }
  }
  await mkdir(root, { recursive: true, mode: 0o700 });
  root = await realpath(root);
  const ownership = await Ownership.claim(join(root, "manager.sqlite"), managerIncarnation(root));
  root = await realpath(root);
  const host = new Sidecar(root);
  let catalog: Catalog;
  let sessions: Sessions;
  try {
    if (["darwin", "linux"].includes(process.platform) && (await observeProcesses(root)).length)
      throw new Error("unowned stamped processes remain; reconciliation required");
    host.observe({
      claim: (...args) => catalog.observer().claim(...args),
      change: (...args) => catalog.observer().change(...args),
      run: (scope, operation) => sessions.run(scope, operation),
    });
    catalog = Catalog.open(ownership);
    sessions = new Sessions(endpoint, catalog);
  } catch (fault) {
    ownership.abandon();
    throw fault;
  }
  const hosts = new Map<string, Promise<Resources>>();
  const acquired = new Map<string, Resources>();
  const hosted = new Hosted(async (scope) => runtime.open(scope), catalog, sessions);
  const runtime: Runtime = {
    sessions,
    endpoint,
    catalog,
    hosted,
    closing: false,
    bindings: new Bindings(root),
    capabilities: new Map(),
    host,
    open: (value) => {
      const scope = factoryScope(value);
      const name = factoryKey(scope);
      let pending = hosts.get(name);
      if (!pending) {
        catalog.factory(scope, "opening");
        pending = Promise.resolve(acquired.get(name) ?? Resources.open({ ...scope, root }))
          .then((resources) => {
            acquired.set(name, resources);
            catalog.factory(scope, "ready", resources.incarnation);
            return resources;
          })
          .catch((fault) => {
            catalog.factory(scope, "failed", acquired.get(name)?.incarnation);
            throw fault;
          });
        hosts.set(name, pending);
        pending.catch(() => hosts.delete(name));
      }
      return pending;
    },
  };
  const server = createServer();
  accept(server, runtime, authority, endpoint);
  let unpublish: (() => Promise<void>) | undefined;
  try {
    await listen(server, endpoint);
    if (process.platform !== "win32") await chmod(endpoint, 0o600);
    if (process.platform !== "win32") {
      const file = await lstat(endpoint);
      if (!file.isSocket()) throw new Error("manager endpoint is not a socket");
      ownership.publishEndpoint({
        path: join(await realpath(dirname(endpoint)), basename(endpoint)),
        dev: file.dev,
        ino: file.ino,
        ctime: file.ctimeMs,
      });
    }
    unpublish = await advertise(root, ownership.incarnation, endpoint, authority);
  } catch (fault) {
    if (server.listening) await close(server);
    catalog.drained();
    ownership.close();
    throw fault;
  }

  let shutdown: Promise<void> | undefined;
  const stop = async () => {
    sessions.outside();
    runtime.closing = true;
    hosted.quiesce();
    return sessions.shutdown(async () => {
      await hosted.close();
      const results = await host.close();
      if (results.some((result) => result.status !== "stopped")) throw new Error("sidecar processes remain alive");
      if (server.listening) await close(server);
      await Promise.all(
        [...acquired.values()].map(async (resources) => {
          const scope = resources.scope;
          await resources.close();
          catalog.factory(scope, "closed", resources.incarnation);
        }),
      );
      catalog.drained();
      if (["darwin", "linux"].includes(process.platform) && (await observeProcesses(root)).length)
        throw new Error("stamped processes remain; reconciliation required");
      await unpublish?.();
      ownership.close();
    });
  };
  const service: Service = {
    authority,
    endpoint,
    factory: (scope) => new Factory(new Client(endpoint, authority), scope, service),
    expose: (options) => {
      try {
        hosted.available(options.identity);
      } catch (fault) {
        return Promise.reject(fault);
      }
      return sessions.run(options.identity, () => hosted.expose(options));
    },
    session: (scope, operation) => sessions.local(scope, operation),
    directory: (scope) => catalog.snapshot(scope),
    close: () => {
      shutdown ??= stop().catch((fault) => {
        shutdown = undefined;
        throw fault;
      });
      return shutdown;
    },
  };
  return service;
}
