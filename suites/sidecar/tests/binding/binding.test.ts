import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { afterEach, describe, expect, it } from "vitest";
import { readBinding, serve } from "@";
import { Bindings } from "../../src/state/binding.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("bindings", () => {
  it("persists channel and namespace state with optimistic revisions", async () => {
    const root = await mkdtemp(join(tmpdir(), "binding-"));
    roots.push(root);
    const scope = namespace("main");
    const lane = channel("stable");
    const target = digest("first");
    const bindings = new Bindings(root);
    const initial = await bindings.read(scope, lane);
    const armed = await bindings.transit(scope, lane, initial.revision, {
      mode: "update",
      target,
      type: "arm",
    });

    expect(armed).toMatchObject({ changed: true, journal: { revision: 1 }, ok: true });
    expect(await new Bindings(root).read(scope, lane)).toEqual(armed.journal);

    const [first, stale] = await Promise.all([
      bindings.transit(scope, lane, 1, { nonce: "first", target, type: "begin" }),
      bindings.transit(scope, lane, 1, { nonce: "second", target, type: "begin" }),
    ]);

    expect(first).toMatchObject({ changed: true, journal: { revision: 2 }, ok: true });
    expect(stale).toMatchObject({ fault: "revision", journal: { revision: 2 }, ok: false });
  });

  it("turns an interrupted running attempt into explicit recovery state", async () => {
    const root = await mkdtemp(join(tmpdir(), "binding-"));
    roots.push(root);
    const scope = namespace("main");
    const lane = channel("stable");
    const target = digest("interrupted");
    const bindings = new Bindings(root);
    const armed = await bindings.transit(scope, lane, 0, { mode: "update", target, type: "arm" });
    if (!armed.ok) throw new Error(armed.fault);
    const begun = await bindings.transit(scope, lane, armed.journal.revision, {
      nonce: "attempt",
      target,
      type: "begin",
    });
    if (!begun.ok) throw new Error(begun.fault);

    const recovered = await new Bindings(root).read(scope, lane);
    expect(recovered).toMatchObject({
      revision: begun.journal.revision + 1,
      state: { attempt: { error: "sidecar restart", status: "failed" } },
    });
  });
});

it("reads offline binding without changing it and rejects online inspection", async () => {
  const root = await mkdtemp(join(tmpdir(), "offline-binding-"));
  roots.push(root);
  const scope = { channel: channel("stable"), namespace: namespace("probe") };
  const host = await serve(join(root, "manager.sock"), { root: root });
  const factory = host.factory(scope);
  // Initialize the factory's persistent ownership and bind an armed candidate.
  await factory.grant({ kind: "data", name: "probe", scope: "factory" });
  await factory.transit(0, { type: "arm", mode: "update", target: digest("candidate") });
  await expect(readBinding(root, scope)).rejects.toThrow("held");
  const expected = await factory.binding();
  await host.close();
  const actual = await readBinding(root, scope);
  expect(actual.directory.manager.phase).toBe("closed");
  expect(actual.journal).toEqual(expected);
  expect(await readBinding(root, scope)).toEqual(actual);
});
