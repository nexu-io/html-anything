import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { link, mkdir, open, realpath, unlink } from "node:fs/promises";
import { join } from "node:path";
import { identifyResource } from "@open-motion/workspace";
import { Fault } from "@open-motion/workspace/contract";
import { type Candidate, type Job, candidate as schema } from "./contract.js";

function path(root: string, candidate: Candidate) {
  const checked = schema.safeParse(candidate);
  if (!checked.success) throw new Fault("invalid", "invalid candidate metadata");
  return join(root, "candidates", `${checked.data.contentHash.slice(7)}.png`);
}
/** Public-to-composer pure metadata check; never trusts a Peer-supplied path. */
export async function readCandidate(root: string, candidate: Candidate) {
  const file = path(root, candidate),
    directory = join(await realpath(root), "candidates");
  if ((await realpath(join(root, "candidates"))) !== directory)
    throw new Fault("integrity", "candidate directory escapes its grant");
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size !== candidate.bytes) throw new Fault("integrity", "candidate size/type mismatch");
    const bytes = await handle.readFile(),
      resource = identifyResource("assets/candidate.png", "Candidate", bytes);
    if (
      resource.type !== "image/png" ||
      resource.digest !== candidate.contentHash ||
      resource.width !== candidate.width ||
      resource.height !== candidate.height
    )
      throw new Fault("integrity", "candidate content mismatch");
    return bytes;
  } finally {
    await handle.close();
  }
}
export async function persistCandidate(root: string, job: Job, bytes: Uint8Array) {
  const data = Buffer.from(bytes),
    resource = identifyResource("assets/candidate.png", "Candidate", data);
  if (resource.type !== "image/png") throw new Fault("invalid", "only PNG generation is supported");
  const candidate: Candidate = {
    jobId: job.id,
    contentHash: resource.digest,
    bytes: resource.bytes,
    type: "image/png",
    width: resource.width,
    height: resource.height,
    providerId: job.providerId,
    providerVersion: job.providerVersion,
    modelId: job.modelId,
  };
  await mkdir(join(root, "candidates"), { recursive: true, mode: 0o700 });
  if ((await realpath(join(root, "candidates"))) !== join(await realpath(root), "candidates"))
    throw new Fault("integrity", "candidate directory escapes its grant");
  const final = path(root, candidate),
    temporary = join(root, "candidates", `${randomUUID()}.tmp`);
  const handle = await open(temporary, "wx", 0o400);
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, final);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await unlink(temporary);
  }
  await readCandidate(root, candidate);
  const directory = await open(join(root, "candidates"), constants.O_RDONLY);
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
  return candidate;
}
export function candidatePath(root: string, candidate: Candidate) {
  return path(root, candidate);
}
