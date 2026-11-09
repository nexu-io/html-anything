import type {
  Capability,
  Channel,
  Event,
  FactoryScope,
  Grant,
  Namespace,
  Permit,
  Registry,
  Request as ResourceRequest,
} from "@odsuite/protocol";
import { factoryScope } from "@odsuite/protocol";
import type { Directory } from "./control/directory.js";
import { Factory } from "./control/factory.js";
import { Peer } from "./control/peer.js";
import type { SessionScope } from "./control/session.js";
import type { Identity } from "./control/types.js";
import type { Lease, Release, Snapshot, Spec } from "./host.js";
import { type Ambient, ambient, remoteSession } from "./runtime/sessionwire.js";
import { call } from "./runtime/transport.js";
import type { Request } from "./runtime/wire.js";
import type { Change, Journal } from "./state/binding.js";

export class Client {
  private context?: Ambient;
  constructor(
    readonly endpoint: string,
    readonly authority: string,
    readonly timeout = 5000,
  ) {}

  private within<T>(operation: () => T): T {
    if (!this.context) return operation();
    if (!this.context.valid?.()) throw new Error("lifecycle context is expired");
    const current = ambient.getStore();
    const context =
      current?.endpoint === this.endpoint &&
      current.hint?.incarnation === this.context.hint?.incarnation &&
      current.valid?.()
        ? current
        : this.context;
    return ambient.run(context, operation);
  }
  private send(request: Request): Promise<unknown> {
    return this.within(() => call(this.endpoint, request, this.timeout));
  }
  factory(scope: FactoryScope): Factory {
    return this.within(() => new Factory(this, scope));
  }

  async session<T>(scope: SessionScope, operation: (client: Client) => Promise<T>): Promise<T> {
    return this.within(() =>
      remoteSession(this.endpoint, this.authority, scope, this.timeout, () => {
        const scoped = new Client(this.endpoint, this.authority, this.timeout);
        scoped.context = ambient.getStore();
        return operation(scoped);
      }),
    );
  }

  async connect<Methods>(identity: Identity): Promise<Peer<Methods>> {
    const descriptor = await this.send({ authority: this.authority, identity, type: "connect" });
    return new Peer<Methods>(this.endpoint, descriptor, this.timeout);
  }

  async start(spec: Spec): Promise<Lease> {
    return (await this.send({
      authority: this.authority,
      spec,
      type: "start",
    })) as Lease;
  }

  async attach(lease: Lease): Promise<Lease> {
    return (await this.send({ lease, type: "attach" })) as Lease;
  }

  async release(lease: Lease): Promise<Release> {
    return (await this.send({ lease, type: "release" })) as Release;
  }

  async directory(scope: FactoryScope): Promise<Directory> {
    return (await this.send({ authority: this.authority, ...factoryScope(scope), type: "directory" })) as Directory;
  }

  async inspect(): Promise<Snapshot[]> {
    return (await this.send({
      authority: this.authority,
      type: "inspect",
    })) as Snapshot[];
  }

  async binding(namespace: Namespace, channel: Channel): Promise<Journal> {
    return (await this.send({
      authority: this.authority,
      channel,
      namespace,
      type: "binding",
    })) as Journal;
  }

  async transit(namespace: Namespace, channel: Channel, revision: number, event: Event): Promise<Change> {
    return (await this.send({
      authority: this.authority,
      channel,
      event,
      namespace,
      revision,
      type: "transit",
    })) as Change;
  }

  async issue(permit: Permit): Promise<Capability> {
    return (await this.send({
      authority: this.authority,
      permit,
      type: "issue",
    })) as Capability;
  }

  async retire(capability: Capability): Promise<boolean> {
    return (await this.send({
      authority: this.authority,
      capability,
      type: "retire",
    })) as boolean;
  }

  async grant(scope: FactoryScope, resource: ResourceRequest): Promise<Grant> {
    return (await this.send({
      authority: this.authority,
      ...factoryScope(scope),
      resource,
      type: "grant",
    })) as Grant;
  }

  async revoke(scope: FactoryScope, lease: string, survivors: number[] = []): Promise<Registry> {
    return (await this.send({
      authority: this.authority,
      lease,
      ...factoryScope(scope),
      survivors,
      type: "revoke",
    })) as Registry;
  }

  async forward(scope: FactoryScope, port: string, socket: string): Promise<Registry> {
    return (await this.send({
      authority: this.authority,
      ...factoryScope(scope),
      port,
      socket,
      type: "forward",
    })) as Registry;
  }

  async resources(scope: FactoryScope): Promise<Registry> {
    return (await this.send({
      authority: this.authority,
      ...factoryScope(scope),
      type: "resources",
    })) as Registry;
  }
}
