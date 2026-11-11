import { canonical } from "@odsuite/protocol";
import { type Manifest, parse } from "@odsuite/release";
import type { Factory } from "@odsuite/sidecar";
import type { Methods } from "./index.js";

export interface RuntimeIdentity {
  manifest: Manifest;
  carrier: string;
}

interface Owner {
  carrier: string;
  channel: string;
  namespace: string;
  manager: string;
  instance: string;
  pid: number;
}

export class RuntimeReleaseMismatch extends Error {
  readonly code = "runtime_release_mismatch";

  constructor(
    readonly requested: Manifest,
    readonly running: Manifest,
    readonly owner: Owner,
  ) {
    super(`Requested release ${requested.identity.version} differs from running release ${running.identity.version}`);
  }

  diagnostic() {
    return {
      code: this.code,
      message: this.message,
      requested: this.requested,
      running: this.running,
      owner: this.owner,
    };
  }
}

/** Admission reads the selected composition's identity before contacting its Daemon. */
export async function admitRuntime(factory: Factory, requested: Manifest) {
  const directory = await factory.directory();
  const candidates = directory.instances.filter((entry) => entry.service === "standalone" && entry.phase !== "retired");
  const instance = candidates[0];
  if (
    directory.manager.phase !== "active" ||
    candidates.length !== 1 ||
    instance?.kind !== "hosted" ||
    instance.phase !== "ready"
  )
    throw Error("Managed standalone composition is not ready; inspect its owner before reconnecting");
  const peer = await factory.connect<Methods>(instance);
  if (peer.connection().capability.incarnation !== instance.incarnation)
    throw Error("Managed standalone composition changed during admission");
  const identity = await peer.call("runtime_identity", null);
  const running = parse(identity.manifest);
  if (canonical(running) !== canonical(requested))
    throw new RuntimeReleaseMismatch(requested, running, {
      carrier: identity.carrier,
      channel: instance.channel,
      namespace: instance.namespace,
      manager: directory.manager.incarnation,
      instance: instance.incarnation,
      pid: directory.manager.pid,
    });
  return peer;
}
