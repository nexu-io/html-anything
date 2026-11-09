import { chmod, lstat, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FactoryScope } from "@odsuite/protocol";
import { Client } from "../client.js";
import type { Directory } from "./directory.js";

interface Connection {
  schema: 1;
  root: string;
  manager: string;
  endpoint: string;
  authority: string;
}

/** A private rendezvous, never a resource inventory or authority takeover record. */
export async function advertise(root: string, manager: string, endpoint: string, authority: string) {
  root = await realpath(root);
  const path = join(root, "control.json");
  const temporary = join(root, `control-${manager}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify({ schema: 1, root, manager, endpoint, authority }), {
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporary, path);
    if (process.platform !== "win32") await chmod(path, 0o600);
  } finally {
    await rm(temporary, { force: true });
  }
  return async () => {
    const current = JSON.parse(await readFile(path, "utf8")) as Connection;
    if (current.manager !== manager) throw new Error("manager rendezvous changed");
    await rm(path);
  };
}

export async function connectRoot(root: string, scope: FactoryScope, timeout = 5000) {
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) throw new Error("invalid connection timeout");
  root = await realpath(root);
  const path = join(root, "control.json");
  const file = await lstat(path);
  if (!file.isFile() || (process.platform !== "win32" && (file.mode & 0o077) !== 0))
    throw new Error("manager rendezvous must be a private regular file");
  const value = JSON.parse(await readFile(path, "utf8")) as Connection;
  if (
    value.schema !== 1 ||
    value.root !== root ||
    typeof value.manager !== "string" ||
    !/^[0-9a-f-]{36}$/.test(value.manager) ||
    typeof value.endpoint !== "string" ||
    !value.endpoint ||
    typeof value.authority !== "string" ||
    !value.authority
  )
    throw new Error("invalid manager rendezvous");
  const client = new Client(value.endpoint, value.authority, timeout);
  const factory = client.factory(scope);
  const directory: Directory = await factory.directory();
  if (directory.manager.incarnation !== value.manager || directory.manager.phase !== "active")
    throw new Error("manager rendezvous is stale");
  return { factory, manager: Object.freeze(directory.manager) };
}
