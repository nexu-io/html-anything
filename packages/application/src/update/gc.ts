import { canonical } from "@odsuite/protocol";
import { registrations, verifyRegistration } from "@open-motion/codexplugin/install";
import { carriers, type PackageManifest, type Selection } from "../contract.js";
import { readInstalled, usingSession } from "../install.js";

/** Product references are composed here; installer owns eligibility and durable code retirement. */
export async function collect(
  description: PackageManifest,
  selection: Selection,
  operation: "plan" | "apply" | "status",
  options: { requestId?: string; expected?: string; codex?: string; worker: string },
) {
  return usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      if (operation === "status") {
        const collection = await session.gc.read(options.requestId);
        if (options.requestId && !collection) throw Error("collection intent not found");
        return { state: "status", collection: collection ?? null };
      }
      for (const carrier of carriers) await readInstalled(session, description, selection, carrier);
      const owned = await registrations({
        factory: session.factory,
        context: session.context,
        root: selection.data,
        scope: selection.scope,
      });
      const protectedReceipts: string[] = [];
      for (const registration of owned) {
        if (
          !registration.installation ||
          registration.installation.home !== selection.home ||
          registration.installation.product !== description.product.appid ||
          canonical(registration.scope) !== canonical(selection.scope)
        )
          throw Error("owned registration has an invalid installation binding");
        await verifyRegistration({
          ...registration,
          factory: session.factory,
          context: session.context,
          codex: options.codex,
          worker: options.worker,
        });
        protectedReceipts.push(registration.installation.requestId);
      }
      const retained = [...new Set(protectedReceipts)].sort();
      if (operation === "plan") return session.gc.plan(retained);
      if (!options.requestId || !options.expected)
        throw Error("gc apply requires --request-id and --expected from gc plan");
      return session.gc.apply({
        requestId: options.requestId,
        expected: options.expected,
        protectedReceipts: retained,
      });
    },
  );
}
