import type { Digest, FactoryScope } from "@odsuite/protocol";
import { connectRoot, type Factory, type Instance, type Peer } from "@odsuite/sidecar";

export class Inspector {
  private constructor(
    readonly factory: Factory,
    readonly manager: string,
  ) {}
  static async open(root: string, scope: FactoryScope, timeout = 5000): Promise<Inspector> {
    const connection = await connectRoot(root, scope, timeout);
    return new Inspector(connection.factory, connection.manager.incarnation);
  }
  async directory() {
    const value = await this.factory.directory();
    if (value.manager.incarnation !== this.manager || value.manager.phase !== "active")
      throw new Error("inspector manager is stale");
    return value;
  }
  async list(): Promise<Instance[]> {
    return (await this.directory()).instances;
  }
  async target<M>(service: string, generation: Digest, incarnation?: string): Promise<Peer<M>> {
    await this.directory();
    const peer = await this.factory.connect<M>({ service, generation });
    const current = await peer.probe();
    if (incarnation !== undefined && current.incarnation !== incarnation)
      throw new Error("target incarnation is stale");
    return peer;
  }
}
