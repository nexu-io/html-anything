import { canonical, type FactoryScope } from "@odsuite/protocol";
import { type Manifest, resolve } from "@odsuite/release";
import { connectRoot, type Factory, readAuthority } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import type { Methods } from "@open-motion/standalone";

/** A delegated business connection never owns the manager or its composition. */
export async function attachment(factory: Factory, expected?: Manifest) {
  const directory = await factory.directory();
  const candidates = directory.instances.filter((i) => i.service === "standalone" && i.phase !== "retired");
  if (candidates.length !== 1 || candidates[0]?.kind !== "hosted" || candidates[0].phase !== "ready")
    throw new Error("Managed standalone composition is not ready; inspect its owner before reconnecting");
  const peer = await factory.connect<Methods>(candidates[0]);
  const status = async () => {
    const value = await peer.call("status", null);
    if (expected && canonical(value.manifest) !== canonical(expected))
      throw new Error("Managed runtime release does not match the installed Codex release");
    if (!value.daemon.ok) throw new Error("Managed runtime Daemon is not healthy");
    return value;
  };
  await status();
  const connection = await peer.call("connection", null);
  const client = new Client(connection.daemon, connection.token);
  return { status, execute: client.execute.bind(client) };
}

export async function existing(root: string, scope: FactoryScope, version: string) {
  let factory: Factory;
  try {
    factory = (await connectRoot(root, scope)).factory;
  } catch (error) {
    // An unavailable endpoint is not evidence of an absent owner. Offline
    // authority inspection rejects held, incomplete and interrupted roots.
    const authority = await readAuthority(root);
    if (!authority || authority.manager.phase === "closed") return undefined;
    throw new Error("Managed runtime requires explicit sidecar recovery", { cause: error });
  }
  return attachment(factory, resolve({}, { channel: scope.channel, version }));
}
