import { readFile } from "node:fs/promises";
import { compare, verifyKit } from "@odsuite/distribution/kit";
import type { Session } from "@odsuite/installer";
import { canonical } from "@odsuite/protocol";
import { observeOwner, stopManager } from "@odsuite/sidecar";
import { register, registrations, verifyRegistration } from "@open-motion/codexplugin/install";
import { carriers, type PackageManifest, type Selection } from "../contract.js";
import { readInstalled, requestId } from "../install.js";
import { inspect, launch } from "../runtime.js";
import { candidate } from "./candidate.js";
import type { hosting } from "./host.js";
import { type Options, type Plan, type Progress, summary, unpack } from "./plan.js";
import { prepared } from "./prepared.js";

type Host = Parameters<Parameters<typeof hosting>[1]>[0];
export async function activate(
  session: Session,
  host: Host,
  description: PackageManifest,
  selection: Selection,
  options: Options,
  signal?: AbortSignal,
) {
  const id = options.requestId;
  if (!id) throw Error("activation requires --request-id");
  let record = await session.transitions.read(id),
    plan: Plan,
    data: Progress;
  if (record) {
    ({ plan, data } = unpack(record, description, selection, options));
    verifyKit(plan.signed, options.publickey, { product: description.product.appid, channel: selection.scope.channel });
  } else {
    if (await session.transitions.read()) throw Error("unfinished installation transition must resume first");
    const from: Plan["from"] = {};
    for (const c of carriers) from[c] = await readInstalled(session, description, selection, c);
    const signed = await prepared(host.library, host.context.roots.data, options.publickey, {
      product: description.product.appid,
      channel: selection.scope.channel,
    });
    if (signed.metadata.package.name !== options.name) throw Error("activation package name mismatch");
    if (compare(signed.metadata.version, description.release.identity.version, selection.scope.channel) <= 0)
      throw Error("activation requires a newer candidate");
    const current = await inspect(description, selection);
    if (!["running", "stopped", "uninitialized"].includes(current.state))
      throw Error("runtime requires explicit recovery before activation");
    if (current.state === "running" && current.runtime.environment.carrier !== "standalone")
      throw Error("detach the self-hosted Codex connection before activation");
    const owner = current.state === "running" ? await observeOwner(selection.data, selection.scope) : null;
    if (current.state === "running" && owner?.incarnation !== current.link.manager.incarnation)
      throw Error("runtime owner changed before activation intent");
    plan = {
      schema: 1,
      caller: description,
      name: options.name,
      data: selection.data,
      scope: selection.scope,
      codex: options.codex ?? selection.codex ?? "codex",
      signed,
      from,
      owner: owner ?? null,
      registrations: await registrations({
        factory: session.factory,
        context: session.context,
        root: selection.data,
        scope: selection.scope,
      }),
    };
    data = { phase: "staging" };
    record = await session.transitions.begin({ requestId: id, intent: plan, data });
  }
  if (record.complete) {
    await host.library.unretain("recovery", id);
    return summary(record);
  }
  signal?.throwIfAborted();
  const metadata = plan.signed.metadata,
    resource = { type: "file" as const, artifact: metadata.package.artifact };
  await host.library.retain("recovery", id, [resource]);
  const use = await host.library.acquire(resource, async () => {
    throw Error("prepared candidate cache is missing; prepare the exact candidate again");
  });
  try {
    const bytes = await readFile(use.path),
      contents = candidate(bytes, metadata, description),
      next = contents.description;
    const advance = async (phase: Progress["phase"], extra: Partial<Progress> = {}) => {
      data = { ...data, ...extra, phase };
      record = await session.transitions.advance({ requestId: id, expectedRevision: record!.revision, data });
      await options.onCheckpoint?.(phase);
      signal?.throwIfAborted();
    };
    const actual = await registrations({
      factory: session.factory,
      context: session.context,
      root: selection.data,
      scope: selection.scope,
      allowPendingVersion: data.phase === "selected" ? metadata.version : undefined,
    });
    const destinations = (values: Plan["registrations"]) =>
      values.map((r) => ({ profile: r.profile, skills: r.skills, root: r.root, scope: r.scope }));
    if (canonical(destinations(actual)) !== canonical(destinations(plan.registrations)))
      throw Error("owned Codex registration targets changed during activation");
    const registration = (r: Plan["registrations"][number], target: import("@odsuite/installer").Receipt) => ({
      factory: session.factory,
      context: session.context,
      application: target.path,
      installation: { home: selection.home, requestId: target.requestId },
      profile: r.profile,
      skills: r.skills,
      root: selection.data,
      scope: selection.scope,
      version: target.version,
      codex: plan.codex,
      worker: options.worker,
    });
    if (data.phase === "staging") {
      const targets: Record<string, string> = {};
      for (const c of carriers) {
        signal?.throwIfAborted();
        const source = next.carriers[c],
          staged = await session.stage({
            data: selection.data,
            requestId: requestId(canonical({ activation: id, carrier: c, sha256: source.sha256 })),
            source: { sha256: source.sha256, bytes: contents.files.get(`payload/${c}.bundle`)! },
          });
        targets[c] = staged.requestId;
      }
      await advance("staged", { targets });
    }
    if (data.phase === "staged") {
      for (const r of plan.registrations) await verifyRegistration(registration(r, plan.from.codexplugin!));
      const current = await inspect(description, selection);
      if (current.state === "running") {
        const owner = await observeOwner(selection.data, selection.scope);
        if (
          !owner ||
          !plan.owner ||
          owner.incarnation !== plan.owner.incarnation ||
          current.runtime.environment.carrier !== "standalone"
        )
          throw Error("runtime owner changed; refusing activation stop");
        await stopManager(owner);
      } else if (!["stopped", "uninitialized"].includes(current.state))
        throw Error("runtime requires explicit recovery before activation");
      await advance("stopped");
    }
    if (data.phase === "stopped") {
      const current = await inspect(description, selection);
      if (!["stopped", "uninitialized"].includes(current.state))
        throw Error("runtime changed before installation selection");
      await session.select({
        expected: Object.fromEntries(carriers.map((c) => [c, plan.from[c]!.requestId])),
        receipts: data.targets!,
        transition: id,
      });
      await advance("selected");
    }
    const selected = async (c: (typeof carriers)[number]) => {
      const r = await session.read(c);
      if (
        !r ||
        r.requestId !== data.targets?.[c] ||
        r.digest !== `sha256:${next.carriers[c].sha256}` ||
        r.data !== selection.data
      )
        throw Error("activation installation selection changed");
      return r;
    };
    const standalone = await selected("standalone"),
      plugin = await selected("codexplugin");
    if (data.phase === "selected") {
      for (const r of plan.registrations) await register(registration(r, plugin));
      await advance("registered");
    }
    if (data.phase === "registered") await advance("starting");
    if (data.phase === "starting" || data.phase === "running") {
      if (plan.owner) {
        let current = await inspect(next, selection);
        if (current.state !== "running") {
          if (!["stopped", "uninitialized"].includes(current.state))
            throw Error("target runtime requires explicit recovery");
          await launch(standalone, selection, session);
          current = await inspect(next, selection);
        }
        if (current.state !== "running") throw Error("activated runtime is not ready");
        await advance("running", {
          runtime: { version: current.runtime.manifest.identity.version, manager: current.link.manager.incarnation },
        });
      } else await advance("running", { runtime: { state: "stopped" } });
    }
    await host.library.unretain("prepared", "application");
    record = await session.transitions.advance({
      requestId: id,
      expectedRevision: record!.revision,
      data,
      complete: true,
    });
    await host.library.unretain("recovery", id);
    return summary(record);
  } finally {
    await host.library.release(use);
  }
}
