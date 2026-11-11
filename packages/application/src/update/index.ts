import { readFile } from "node:fs/promises";
import { compare, KitCatalog } from "@odsuite/distribution/kit";
import { canonical } from "@odsuite/protocol";
import type { PackageManifest, Selection } from "../contract.js";
import { carriers } from "../contract.js";
import { readInstalled, usingSession } from "../install.js";
import { activate } from "./activation.js";
import { candidate } from "./candidate.js";
import { hosting } from "./host.js";
import { type Options, summary } from "./plan.js";
import { remember } from "./prepared.js";
export type Operation = "check" | "prepare" | "discard" | "activate" | "status";
export async function updates(
  description: PackageManifest,
  selection: Selection,
  operation: Operation,
  options: Options,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  return usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      if (operation === "status") {
        const record = await session.transitions.read(options.requestId);
        if (!record) {
          if (options.requestId) throw Error("activation intent not found");
          return { state: "idle" };
        }
        const plan = record.intent as import("./plan.js").Plan;
        if (
          plan.data !== selection.data ||
          canonical(plan.scope) !== canonical(selection.scope) ||
          plan.name !== options.name ||
          plan.caller.product.appid !== description.product.appid
        )
          throw Error("activation intent differs from this scope");
        return summary(record);
      }
      if (operation !== "activate") {
        if (await session.transitions.read()) throw Error("unfinished installation transition must resume first");
        for (const c of carriers) await readInstalled(session, description, selection, c);
      }
      return hosting(session, async (host) => {
        if (operation === "activate") return activate(session, host, description, selection, options, signal);
        if (operation === "discard") {
          await host.library.unretain("prepared", "application");
          return { state: "discarded" as const };
        }
        const catalog = new KitCatalog({
            ...options,
            product: description.product.appid,
            channel: selection.scope.channel,
            root: host.context.roots.data,
          }),
          metadata = await catalog.refresh(signal);
        if (metadata.package.name !== options.name) throw Error("candidate package name mismatch");
        const order = compare(metadata.version, description.release.identity.version, selection.scope.channel);
        if (order < 0) throw Error("candidate version precedes this application");
        if (!order) return { state: "current" as const, candidate: metadata };
        if (operation === "check") return { state: "available" as const, candidate: metadata };
        const resource = { type: "file" as const, artifact: metadata.package.artifact },
          use = await host.library.acquire(resource, (abort) =>
            catalog.download(metadata, signal ? AbortSignal.any([signal, abort]) : abort),
          );
        try {
          signal?.throwIfAborted();
          candidate(await readFile(use.path), metadata, description);
          signal?.throwIfAborted();
          await remember(host.context.roots.data, await catalog.snapshot());
          await host.library.retain("prepared", "application", [resource]);
          return { state: "prepared" as const, candidate: metadata };
        } finally {
          await host.library.release(use);
        }
      });
    },
  );
}
