import type { FactoryScope } from "@odsuite/protocol";
import { type Manifest, resolve } from "@odsuite/release";
import { connectRoot, type Factory, readAuthority } from "@odsuite/sidecar";
import { Client } from "@open-motion/daemon/client";
import { admitRuntime } from "@open-motion/standalone/admission";

/** A delegated business connection never owns the manager or its composition. */
export async function attachment(factory: Factory, expected: Manifest) {
  const peer = await admitRuntime(factory, expected);
  const status = async () => {
    const value = await peer.call("status", null);
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
