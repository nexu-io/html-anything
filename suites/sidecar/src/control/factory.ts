import {
  type Capability,
  type Event,
  type FactoryScope,
  factoryKey,
  factoryScope,
  type Permit,
  type Request,
} from "@odsuite/protocol";
import type { Client } from "../client.js";
import type { Lease, Spec } from "../host.js";
import type { Service } from "../runtime/server.js";
import type { Expose, Identity } from "./types.js";

/** A bound management facade, not an OS process or a security sandbox. */
export class Factory {
  readonly scope: Readonly<FactoryScope>;
  constructor(
    private client: Client,
    scope: FactoryScope,
    private service?: Service,
  ) {
    this.scope = factoryScope(scope);
  }
  private bound<T extends object>(value: T): T & FactoryScope {
    const partial = value as Partial<FactoryScope>;
    if (
      (partial.channel !== undefined && partial.channel !== this.scope.channel) ||
      (partial.namespace !== undefined && partial.namespace !== this.scope.namespace)
    )
      throw new Error("factory identity mismatch");
    return { ...value, ...this.scope };
  }
  private exact(value: FactoryScope): void {
    if (factoryKey(value) !== factoryKey(this.scope)) throw new Error("factory identity mismatch");
  }
  async session<T>(operation: (factory: Factory) => Promise<T>): Promise<T> {
    return this.client.session(this.scope, (client) => operation(new Factory(client, this.scope, this.service)));
  }
  async expose<M>(options: Omit<Expose<M>, "identity"> & { identity: Omit<Identity, keyof FactoryScope> }) {
    if (!this.service) throw new Error("expose requires a local Service.factory");
    return this.client.session(this.scope, () =>
      (this.service as Service).expose({ ...options, identity: this.bound(options.identity) }),
    );
  }
  async connect<M>(identity: Omit<Identity, keyof FactoryScope>) {
    return this.client.connect<M>(this.bound(identity));
  }
  async start(spec: Omit<Spec, keyof FactoryScope>) {
    return this.client.start(this.bound(spec));
  }
  async attach(lease: Lease) {
    this.exact(lease);
    return this.client.attach(lease);
  }
  async release(lease: Lease) {
    this.exact(lease);
    return this.client.release(lease);
  }
  directory() {
    return this.client.directory(this.scope);
  }
  async inspect() {
    return (await this.client.inspect()).filter((entry) => factoryKey(entry) === factoryKey(this.scope));
  }
  binding() {
    return this.client.binding(this.scope.namespace, this.scope.channel);
  }
  transit(revision: number, event: Event) {
    return this.client.transit(this.scope.namespace, this.scope.channel, revision, event);
  }
  async issue(permit: Omit<Permit, keyof FactoryScope>) {
    return this.client.issue(this.bound(permit));
  }
  async retire(capability: Capability) {
    this.exact(capability);
    return this.client.retire(capability);
  }
  grant(request: Request) {
    return this.client.grant(this.scope, request);
  }
  revoke(lease: string, survivors: number[] = []) {
    return this.client.revoke(this.scope, lease, survivors);
  }
  forward(port: string, socket: string) {
    return this.client.forward(this.scope, port, socket);
  }
  resources() {
    return this.client.resources(this.scope);
  }
}
