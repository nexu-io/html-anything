import { call } from "../runtime/transport.js";
import { type Descriptor, descriptor, type Identity, type Input, type Output } from "./types.js";

export class Peer<Methods> {
  private readonly capability: Descriptor;
  constructor(
    private endpoint: string,
    capability: unknown,
    private timeout = 5000,
  ) {
    this.capability = Object.freeze(descriptor(capability));
  }
  async call<K extends Extract<keyof Methods, string>>(
    method: K,
    input: Input<Methods, K>,
  ): Promise<Output<Methods, K>> {
    return (await call(
      this.endpoint,
      { type: "invoke", descriptor: this.capability, operation: "call", method, input },
      this.timeout,
    )) as Output<Methods, K>;
  }
  async probe(): Promise<{ identity: Identity; incarnation: string; phase: string }> {
    return (await call(
      this.endpoint,
      { type: "invoke", descriptor: this.capability, operation: "probe" },
      this.timeout,
    )) as { identity: Identity; incarnation: string; phase: string };
  }
  async stop(): Promise<void> {
    await call(this.endpoint, { type: "invoke", descriptor: this.capability, operation: "stop" }, this.timeout);
  }
}
