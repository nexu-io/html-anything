import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Library } from "@odsuite/blob";

import {
  type Artifact,
  canonical,
  channel,
  digest,
  type Envelope,
  type Generation,
  gates,
  identify,
  type Kind,
  namespace,
} from "@odsuite/protocol";
import { Client, type Service, serve } from "@odsuite/sidecar";
import { afterEach, describe, expect, it } from "vitest";

import { type Content, Generations } from "@";

const libraries: Library[] = [];
const roots: string[] = [];
const services: Service[] = [];

function artifact(kind: Kind, slot: string, bytes: string): Artifact {
  return { bytes: Buffer.byteLength(bytes), digest: digest(bytes), kind, slot };
}

function fixture(seed: string): { contents: Content[]; envelope: Envelope } {
  const archive = (value: string) =>
    canonical({ files: [{ path: "fixture", bytes: Buffer.from(value).toString("base64"), mode: 0o644 }], schema: 1 });
  const values = {
    blob: `${seed}blob`,
    capsule: archive(`${seed}capsule`),
    daemon: archive(`${seed}daemon`),
    web: archive(`${seed}web`),
  };
  const generation: Generation = {
    blobs: [artifact("blob", "model", values.blob)],
    capsule: artifact("capsule", "main", values.capsule),
    carrier: 1,
    daemon: artifact("daemon", "main", values.daemon),
    schema: 1,
    web: artifact("web", "main", values.web),
  };
  const blob = generation.blobs[0];
  if (!blob) throw new Error("blob missing");
  return {
    contents: [
      { artifact: generation.capsule, bytes: values.capsule },
      { artifact: generation.daemon, bytes: values.daemon },
      { artifact: generation.web, bytes: values.web },
      { artifact: blob, bytes: values.blob },
    ],
    envelope: { digest: identify(generation), generation, schema: 1 },
  };
}

afterEach(async () => {
  await Promise.all(libraries.splice(0).map((library) => library.close()));
  await Promise.all(services.splice(0).map((service) => service.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("capsule", () => {
  it("commits verified generations and explicitly recovers after failure", async () => {
    const root = await mkdtemp(join(tmpdir(), "capsule-"));
    roots.push(root);
    const service = await serve(join(root, "sidecar.sock"));
    services.push(service);
    const client = new Client(service.endpoint, service.authority);
    const scope = namespace("main");
    const lane = channel("stable");
    let library!: Library;
    await service.factory({ namespace: scope, channel: lane }).expose({
      identity: { service: "electron", generation: digest("test") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({
            factory: service.factory({ namespace: scope, channel: lane }),
            context,
            name: "content",
          });
        },
        stop: async () => {},
      },
    });
    libraries.push(library);
    const capsule = new Generations(client, scope, lane, library);
    const first = fixture("first");
    let attempt = await capsule.stage(first.envelope, first.contents);

    const before = await capsule.factory.binding();
    const grants = await capsule.factory.resources();
    for (const foreign of [
      { ...attempt, channel: channel("beta") },
      { ...attempt, namespace: namespace("other") },
    ]) {
      await expect(capsule.ready(foreign, "capsule")).rejects.toThrow("factory mismatch");
      await expect(capsule.commit(foreign)).rejects.toThrow("factory mismatch");
      await expect(capsule.fail(foreign, "foreign")).rejects.toThrow("factory mismatch");
      await expect(capsule.prepare(foreign)).rejects.toThrow("factory mismatch");
    }
    expect(await capsule.factory.binding()).toEqual(before);
    expect(await capsule.factory.resources()).toEqual(grants);

    for (const gate of gates) attempt = await capsule.ready(attempt, gate);
    const committed = await capsule.commit(attempt);
    expect(committed.state.current).toBe(first.envelope.digest);

    const second = fixture("second");
    attempt = await capsule.stage(second.envelope, second.contents);
    attempt = await capsule.ready(attempt, "capsule");
    const failed = await capsule.fail(attempt, "daemon timeout");
    expect(failed.state.current).toBe(first.envelope.digest);

    attempt = await capsule.recover(first.envelope.digest);
    for (const gate of gates) attempt = await capsule.ready(attempt, gate);
    const recovered = await capsule.commit(attempt);
    expect(recovered.state).toEqual({ channel: lane, current: first.envelope.digest, namespace: scope });
    const grantsAfter = (await client.resources({ namespace: scope, channel: lane })).grants;
    expect(grantsAfter.some((g) => g.kind === "staging" && g.name === "capsule")).toBe(false);
    expect(
      grantsAfter
        .filter((g) => g.name === "content")
        .map((g) => g.kind)
        .sort(),
    ).toEqual(["cache", "cas", "data"]);
  });

  it("rejects content before arming a generation", async () => {
    const root = await mkdtemp(join(tmpdir(), "capsule-"));
    roots.push(root);
    const service = await serve(join(root, "sidecar.sock"));
    services.push(service);
    const client = new Client(service.endpoint, service.authority);
    const scope = namespace("preview");
    const lane = channel("beta");
    let library!: Library;
    await service.factory({ namespace: scope, channel: lane }).expose({
      identity: { service: "electron", generation: digest("test") },
      handlers: {},
      lifecycle: {
        initialize: async (context) => {
          library = await Library.open({
            factory: service.factory({ namespace: scope, channel: lane }),
            context,
            name: "content",
          });
        },
        stop: async () => {},
      },
    });
    libraries.push(library);
    const capsule = new Generations(client, scope, lane, library);
    const value = fixture("broken");
    const first = value.contents[0];
    if (!first) throw new Error("fixture missing");
    value.contents[0] = { ...first, bytes: "tampered" };

    await expect(capsule.stage(value.envelope, value.contents)).rejects.toThrow("verification");
    expect(await client.binding(scope, lane)).toMatchObject({ revision: 0, state: { channel: lane } });
    expect(
      (await client.resources({ namespace: scope, channel: lane })).grants.some(
        (g) => g.kind === "staging" && g.name === "capsule",
      ),
    ).toBe(false);
  });
});
