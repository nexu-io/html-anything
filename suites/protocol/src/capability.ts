import type { Channel, Namespace } from "./identity.js";

export interface Permit {
  channel: Channel;
  namespace: Namespace;
  owner: string;
  service: string;
}

export interface Capability extends Permit {
  token: string;
}
