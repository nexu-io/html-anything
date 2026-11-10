import { type Channel, channel, type Digest, type Namespace, namespace, valid } from "@odsuite/protocol";

export interface Identity {
  channel: Channel;
  generation: Digest;
  namespace: Namespace;
  service: string;
}
export interface Descriptor extends Identity {
  incarnation: string;
  token: string;
}
export interface Context {
  /** Registered-owner cleanup, including quiesce; new allocations remain forbidden during manager shutdown. */
  cleanup<T>(operation: () => Promise<T>): Promise<T>;
  /** Create background controller tasks during initialize; stop must cancel and drain them. */
  background<T>(operation: () => T): T;
  readonly identity: Readonly<Identity>;
  readonly incarnation: string;
  readonly roots: Readonly<{ data: string; logs: string; resource: string; runtime: string }>;
  allocate(request: {
    kind: "port" | "socket" | "lock";
    name: string;
    scheme?: "http" | "tcp";
  }): Promise<{ kind: string; value: string }>;
  forward(port: string, socket: string): Promise<void>;
}
export type Input<M, K extends keyof M> = M[K] extends { input: infer I } ? I : never;
export type Output<M, K extends keyof M> = M[K] extends { output: infer O } ? O : never;
export interface Expose<M> {
  identity: Identity;
  handlers: { [K in keyof M]: (input: Input<M, K>, context: Context) => Output<M, K> | Promise<Output<M, K>> };
  lifecycle: {
    initialize(context: Context): Promise<void>;
    /** Cancel/drain background controllers before acquiring the stop lane. Callers
     * already inside a lifecycle session must drain dependent controllers first. */
    quiesce?(): Promise<void>;
    stop(): Promise<void>;
  };
}
export interface Attachment {
  readonly context: Context;
  /** Resolves only after successful drain and retirement. A failed stop can be retried. */
  readonly closed: Promise<void>;
  close(): Promise<void>;
}

export function identity(input: unknown): Identity {
  if (!input || typeof input !== "object") throw new TypeError("invalid service identity");
  const value = input as Identity;
  if (
    typeof value.channel !== "string" ||
    typeof value.namespace !== "string" ||
    !valid(value.generation) ||
    typeof value.service !== "string" ||
    !/^[a-z][a-z0-9]*$/.test(value.service)
  ) {
    throw new TypeError("invalid service identity");
  }
  return {
    channel: channel(value.channel),
    namespace: namespace(value.namespace),
    generation: value.generation,
    service: value.service,
  };
}
export function descriptor(input: unknown): Descriptor {
  const value = input as Descriptor;
  const scope = identity(input);
  if (typeof value.incarnation !== "string" || !value.incarnation || typeof value.token !== "string" || !value.token) {
    throw new TypeError("invalid service capability");
  }
  return { ...scope, incarnation: value.incarnation, token: value.token };
}
