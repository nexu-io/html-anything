import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { type Channel, canonical, verify } from "@odsuite/protocol";
import type { Authority } from "./authority.js";

async function immutable(path: string, bytes: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, bytes, { flag: "wx", mode: 0o644 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if (!(await readFile(path)).equals(Buffer.from(bytes))) throw new Error("static feed identity conflict");
  }
}
/** Export public protocol bytes only; publish the channel pointer last. */
export async function writeFeed(authority: Authority, lane: Channel, root: string) {
  const state = await authority.read(lane);
  if (state.head) {
    const envelope = await authority.generation(state.head.generation);
    const proof = await authority.proof(state.head.proof);
    for (const artifact of [
      envelope.generation.capsule,
      envelope.generation.daemon,
      envelope.generation.web,
      ...envelope.generation.blobs,
    ]) {
      const bytes = await authority.object(artifact.digest);
      if (!verify(artifact, bytes)) throw new Error("static feed object integrity mismatch");
      await immutable(join(root, "objects", artifact.digest.slice(7)), bytes);
    }
    await immutable(join(root, "generations", envelope.digest.slice(7)), canonical(envelope));
    await immutable(join(root, "proofs", state.head.proof.slice(7)), canonical(proof));
  }
  const path = join(root, "channels", lane);
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, canonical(state), { mode: 0o644 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return state;
}
