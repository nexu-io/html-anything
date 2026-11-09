import { createHash } from "node:crypto";
import { type Identity, identity } from "../control/types.js";

export interface Stamp extends Identity {
  root: string;
  incarnation: string;
}
const flag = "--odsuite-stamp=";
/** Stable across client/host TMPDIR environments; only supported POSIX hosts use Unix sockets. */
export function socketRoot(): string {
  if (process.platform !== "darwin" && process.platform !== "linux") throw new Error("Unix socket host is unsupported");
  return "/tmp";
}
export const rootKey = (root: string) => createHash("sha256").update(root).digest("hex");
export function stamp(input: unknown): Stamp {
  const value = input as Stamp;
  const scope = identity(value);
  if (!/^[a-f0-9]{64}$/.test(value.root) || !/^[a-f0-9-]{36}$/.test(value.incarnation))
    throw new Error("invalid process stamp");
  if (Object.keys(value).sort().join() !== "channel,generation,incarnation,namespace,root,service")
    throw new Error("invalid process stamp fields");
  return { ...scope, root: value.root, incarnation: value.incarnation };
}
export const argument = (input: Stamp) => flag + Buffer.from(JSON.stringify(stamp(input))).toString("base64url");
export function readStamp(command: string): Stamp | undefined {
  const values = [...command.matchAll(/(?:^|\s)--odsuite-stamp=([A-Za-z0-9_-]+)(?=\s|$)/g)];
  if (values.length === 0) return undefined;
  if (values.length !== 1) throw new Error("ambiguous process stamp");
  return stamp(JSON.parse(Buffer.from(values[0]![1]!, "base64url").toString()));
}
export const sameStamp = (a: Stamp, b: Stamp) => argument(a) === argument(b);
export interface ManagerStamp {
  root: string;
  incarnation: string;
}
export function readManagerStamp(command: string): ManagerStamp | undefined {
  const values = [...command.matchAll(/(?:^|\s)--odsuite-manager=([A-Za-z0-9_-]+)(?=\s|$)/g)];
  if (values.length > 1) throw Error("ambiguous manager stamp");
  if (!values[0]) return undefined;
  const v = JSON.parse(Buffer.from(values[0][1]!, "base64url").toString());
  if (
    Object.keys(v).sort().join() !== "incarnation,root" ||
    !/^[a-f0-9]{64}$/.test(v.root) ||
    !/^[a-f0-9-]{36}$/.test(v.incarnation)
  )
    throw Error("invalid manager stamp");
  return v;
}
