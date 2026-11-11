import { readFile } from "node:fs/promises";
import { Library } from "@odsuite/blob";
import { compare, KitCatalog } from "@odsuite/distribution/kit";
import { digest } from "@odsuite/protocol";
import { candidate } from "./candidate.js";
import { carriers, type PackageManifest, type Selection } from "./contract.js";
import { readInstalled, usingSession } from "./install.js";

export async function updates(
  description: PackageManifest,
  selection: Selection,
  operation: "check" | "prepare" | "discard",
  options: { endpoint: string; publickey: string; name: string },
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  return usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      for (const carrier of carriers) await readInstalled(session, description, selection, carrier);
      let library!: Library, catalog: KitCatalog | undefined;
      const attachment = await session.factory.expose({
        identity: { service: "updates", generation: digest("application-kit-preparation-v1") },
        handlers: {},
        lifecycle: {
          initialize: async (context) => {
            library = await Library.open({ factory: session.factory, context, name: "kits" });
            if (operation !== "discard")
              catalog = new KitCatalog({
                ...options,
                product: description.product.appid,
                channel: selection.scope.channel,
                root: context.roots.data,
              });
          },
          stop: async () => library.close(),
        },
      });
      try {
        signal?.throwIfAborted();
        if (operation === "discard") {
          await library.unretain("prepared", "application");
          return { state: "discarded" as const };
        }
        const metadata = await catalog!.refresh(signal);
        if (metadata.package.name !== options.name) throw Error("candidate package name mismatch");
        const order = compare(metadata.version, description.release.identity.version, selection.scope.channel);
        if (order < 0) throw Error("candidate version precedes this application");
        if (!order) return { state: "current" as const, candidate: metadata };
        if (operation === "check") return { state: "available" as const, candidate: metadata };
        const resource = { type: "file" as const, artifact: metadata.package.artifact };
        const use = await library.acquire(resource, (abort) =>
          catalog!.download(metadata, signal ? AbortSignal.any([signal, abort]) : abort),
        );
        try {
          signal?.throwIfAborted();
          candidate(await readFile(use.path), metadata, description);
          signal?.throwIfAborted();
          await library.retain("prepared", "application", [resource]);
          return { state: "prepared" as const, candidate: metadata };
        } finally {
          await library.release(use);
        }
      } finally {
        await attachment.close();
      }
    },
  );
}
