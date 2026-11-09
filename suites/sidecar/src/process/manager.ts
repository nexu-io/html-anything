import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, open, realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type FactoryScope, factoryScope } from "@odsuite/protocol";
import { connectRoot } from "../control/connection.js";
import { readDirectory } from "../runtime/catalog.js";
import type { Service } from "../runtime/server.js";
import { readManagerStamp, rootKey, socketRoot } from "./identity.js";
import { capture, exact, type Witness } from "./observe.js";

interface Stamp {
  root: string;
  incarnation: string;
}
export interface Manager extends Witness {
  root: string;
  incarnation: string;
  scope: FactoryScope;
}
const flag = "--odsuite-manager=";
export const managerEndpoint = (root: string) =>
  join(
    socketRoot(),
    `odsuite-${typeof process.getuid === "function" ? process.getuid() : "user"}-${rootKey(resolve(root)).slice(0, 20)}-${process.pid}.sock`,
  );
function _decode(value: string): Stamp {
  const v = JSON.parse(Buffer.from(value, "base64url").toString());
  if (
    Object.keys(v).sort().join() !== "incarnation,root" ||
    !/^[a-f0-9]{64}$/.test(v.root) ||
    !/^[a-f0-9-]{36}$/.test(v.incarnation)
  )
    throw new Error("invalid manager stamp");
  return v;
}
function parse(command: string): Stamp | undefined {
  return readManagerStamp(command);
}
/** Internal serve claim input. A manager stamp is separate from a workload stamp. */
export function managerIncarnation(root: string): string | undefined {
  const stamp = parse(process.argv.join(" "));
  return stamp?.root === rootKey(root) ? stamp.incarnation : undefined;
}
export async function observeOwner(root: string, scope: FactoryScope): Promise<Manager | undefined> {
  root = await realpath(root);
  let manager: Awaited<ReturnType<typeof readDirectory>>["manager"];
  try {
    manager = (await connectRoot(root, factoryScope(scope))).manager;
  } catch {
    manager = (await readDirectory(root)).manager;
  }
  const found = (await capture()).find((p) => exact(p, manager));
  if (!found) return undefined;
  const stamp = parse(found.command);
  if (stamp && (stamp.root !== rootKey(root) || stamp.incarnation !== manager.incarnation))
    throw new Error("manager stamp/authority mismatch");
  return { root, pid: found.pid, birth: found.birth, incarnation: manager.incarnation, scope: factoryScope(scope) };
}
export async function managerAlive(witness: Manager): Promise<boolean> {
  const found = (await capture()).find((p) => exact(p, witness));
  if (!found) return false;
  const stamp = parse(found.command);
  if (stamp && (stamp.root !== rootKey(await realpath(witness.root)) || stamp.incarnation !== witness.incarnation))
    throw Error("manager stamp changed");
  return true;
}
export async function managerReady(service: Service, root: string, scope: FactoryScope) {
  root = await realpath(root);
  if (!managerIncarnation(root)) return undefined;
  const info = service.directory().manager,
    self = (await capture()).find((p) => exact(p, info));
  const owner = self
      ? { root, pid: self.pid, birth: self.birth, incarnation: info.incarnation, scope: factoryScope(scope) }
      : undefined,
    expected = managerIncarnation(root);
  if (
    !owner ||
    !expected ||
    owner.pid !== process.pid ||
    owner.incarnation !== expected ||
    service.directory().manager.incarnation !== expected
  )
    throw new Error("manager readiness authority mismatch");
  if (process.connected)
    await new Promise<void>((done, reject) =>
      process.send?.({ type: "manager-ready", owner }, (error) => (error ? reject(error) : done())),
    );
  process.disconnect?.();
  return owner;
}
/** Spawn a new resource authority, not a retained workload. The child must call managerReady. */
export async function startManager(options: {
  root: string;
  scope: FactoryScope;
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  log: string;
}): Promise<Manager> {
  await mkdir(options.root, { recursive: true, mode: 0o700 });
  const root = await realpath(options.root),
    incarnation = randomUUID();
  await capture();
  const env = { ...process.env, ...options.env };
  delete env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;
  delete env.ODSUITE_RUNTIME_SIDECAR_ENDPOINT;
  const output = await open(options.log, "a", 0o600);
  try {
    const child = spawn(
      options.command,
      [...options.args, flag + Buffer.from(JSON.stringify({ root: rootKey(root), incarnation })).toString("base64url")],
      { env, detached: true, stdio: ["ignore", "ignore", output.fd, "ipc"], windowsHide: true },
    );
    let stderr = "";
    try {
      const owner = await new Promise<Manager>((done, reject) => {
        const timer = setTimeout(
          () => finish(() => reject(new Error(`manager readiness timeout: ${stderr}`))),
          options.timeout ?? 15000,
        );
        const finish = (operation: () => void) => {
          clearTimeout(timer);
          child.off("message", message);
          operation();
        };
        const message = (input: unknown) => {
          const v = input as { type: string; owner: Manager };
          if (v?.type === "manager-ready") finish(() => done(v.owner));
        };
        child.on("message", message);
        child.once("error", (error) => finish(() => reject(error)));
        child.once("exit", (code) =>
          finish(() => reject(new Error(`manager exited before readiness:${code}: ${stderr}`))),
        );
      });
      const actual = await observeOwner(root, options.scope);
      if (
        !actual ||
        owner.pid !== child.pid ||
        actual.pid !== owner.pid ||
        actual.birth !== owner.birth ||
        actual.incarnation !== incarnation ||
        owner.root !== root
      )
        throw new Error("manager bootstrap witness mismatch");
      child.unref();
      return actual;
    } catch (error) {
      const current = (await capture()).find((p) => p.pid === child.pid),
        stamp = current ? parse(current.command) : undefined;
      if (current && stamp?.root === rootKey(root) && stamp.incarnation === incarnation) {
        const witness = { pid: current.pid, birth: current.birth };
        for (const signal of ["SIGTERM", "SIGKILL"] as const) {
          const live = (await capture()).find((p) => exact(p, witness));
          if (!live) break;
          const observed = parse(live.command);
          if (observed?.root !== rootKey(root) || observed.incarnation !== incarnation)
            throw Error("manager cleanup stamp changed", { cause: error });
          try {
            process.kill(live.pid, signal);
          } catch (fault) {
            if ((fault as NodeJS.ErrnoException).code !== "ESRCH") throw fault;
          }
          const until = Date.now() + 1000;
          while ((await capture()).some((p) => exact(p, witness)) && Date.now() < until)
            await new Promise((done) => setTimeout(done, 20));
        }
        if ((await capture()).some((p) => exact(p, witness)))
          throw Error("failed manager remains alive; authority retained", { cause: error });
      }
      if (child.connected) child.disconnect();
      child.unref();
      try {
        const log = await open(options.log, "r"),
          info = await log.stat(),
          bytes = Buffer.alloc(Math.min(info.size, 8192));
        try {
          await log.read(bytes, 0, bytes.length, Math.max(0, info.size - bytes.length));
          stderr = bytes.toString();
        } finally {
          await log.close();
        }
      } catch {}
      throw new Error(`${String(error)}: ${stderr}`, { cause: error });
    }
  } finally {
    await output.close();
  }
}

/** Stop an exact stamped manager through its graceful lifecycle. Never take over or erase authority. */
export async function stopManager(owner: Manager, options: { timeout?: number } = {}): Promise<void> {
  const timeout = options.timeout ?? 15000;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 300000)
    throw new Error("invalid manager stop timeout");
  const root = await realpath(owner.root),
    found = (await capture()).find((p) => exact(p, owner));
  if (!found) {
    const directory = await readDirectory(root);
    if (directory.manager.incarnation === owner.incarnation && directory.manager.phase === "closed") return;
    throw new Error("manager is no longer live; inspect authority before recovery");
  }
  const stamp = parse(found.command);
  if (!stamp || stamp.root !== rootKey(root) || stamp.incarnation !== owner.incarnation)
    throw new Error("manager stop witness mismatch");
  process.kill(found.pid, "SIGTERM");
  const until = Date.now() + timeout;
  while (await managerAlive(owner)) {
    if (Date.now() > until) throw new Error("manager drain timeout; authority retained");
    await new Promise((r) => setTimeout(r, 25));
  }
  const directory = await readDirectory(root);
  if (directory.manager.incarnation !== owner.incarnation || directory.manager.phase !== "closed")
    throw new Error("manager exited without a completed drain; explicit recovery is required");
}

/** Caller chooses the domain base; sidecar owns channel/namespace manager-root derivation. */
export function scopedManagerRoot(base: string, scope: FactoryScope): string {
  const value = factoryScope(scope);
  return join(resolve(base), value.channel, value.namespace);
}
