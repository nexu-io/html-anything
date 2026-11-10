import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { digest } from "@odsuite/protocol";
import { expect, it } from "vitest";
import { type Job, readCandidate } from "@";
import { candidatePath, persistCandidate } from "../src/candidates.js";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAYCAYAAACbU/80AAAAPklEQVR4AcXBMQEAIAzAsK5CuPEvChtMRpN5535CEpOYxCQmMYlJTGISk5jEJCYxiUlMYhKTmMQkJjGJSWwBYl8CWwMRvGQAAAAASUVORK5CYII=",
  "base64",
);
async function fixture() {
  const directory = fileURLToPath(new URL("../../../.artifacts/gateway/", import.meta.url));
  await mkdir(directory, { recursive: true });
  const root = await mkdtemp(`${directory}candidate-`);
  const job: Job = {
    id: randomUUID(),
    sessionId: randomUUID(),
    artifactId: randomUUID(),
    requestId: randomUUID(),
    revision: digest("revision"),
    providerId: "fixture",
    providerVersion: "account-v1",
    modelId: "png-v1",
    prompt: "PNG",
    version: 1,
    state: "running",
    submission: "accepted",
    remoteId: "accepted",
    createdAt: 0,
    updatedAt: 0,
  };
  return { root, job };
}
it("stores content once and independently recomputes hash/dimensions before each read", async () => {
  const { root, job } = await fixture();
  const candidate = await persistCandidate(root, job, png);
  expect(await persistCandidate(root, job, png)).toEqual(candidate);
  expect(await readCandidate(root, candidate)).toEqual(png);
  await expect(readCandidate(root, { ...candidate, width: candidate.width + 1 })).rejects.toThrow("mismatch");
  await expect(readCandidate(root, { ...candidate, contentHash: "../../escape" })).rejects.toThrow("metadata");
});
it("rejects a candidate-directory symlink before writing persistent user content", async () => {
  const { root, job } = await fixture(),
    external = await fixture();
  await symlink(external.root, join(root, "candidates"));
  await expect(persistCandidate(root, job, png)).rejects.toThrow("escapes");
});
it("rejects symlink/corrupt committed candidates without silently replacing them", async () => {
  const { root, job } = await fixture();
  await mkdir(join(root, "candidates"));
  const outside = join(root, "outside.png");
  await writeFile(outside, png);
  const facts = {
    jobId: job.id,
    contentHash: digest(png),
    bytes: png.length,
    width: 32,
    height: 24,
    type: "image/png" as const,
    providerId: job.providerId,
    providerVersion: job.providerVersion,
    modelId: job.modelId,
  };
  await symlink(outside, candidatePath(root, facts));
  await expect(readCandidate(root, facts)).rejects.toThrow();
  await expect(persistCandidate(root, job, png)).rejects.toThrow();
  await expect(persistCandidate(root, job, new Uint8Array(6 * 1024 * 1024 + 1))).rejects.toThrow("bounds");
});
