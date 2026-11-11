import { type Options, open, type Receipt, type Session } from "@odsuite/installer";
import { canonical } from "@odsuite/protocol";
import { register } from "@open-motion/codexplugin/install";
import { carriers, hash, type PackageManifest, payload, type Selection } from "./contract.js";

export async function usingSession<T>(options: Options, action: (session: Session) => Promise<T>): Promise<T> {
  const session = await open(options);
  const outcome = await action(session).then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  try {
    await session.close();
  } catch (cleanup) {
    if (!outcome.ok)
      throw new AggregateError(
        [outcome.error, cleanup],
        `${String(outcome.error)}; cleanup failed: ${String(cleanup)}`,
      );
    throw cleanup;
  }
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}

function requestId(value: string): string {
  const h = hash(value).slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`;
}
export async function setup(directory: string, description: PackageManifest, selection: Selection, worker: string) {
  const sources = await payload(directory, description);
  return usingSession(
    { home: selection.home, product: description.product.appid, scope: selection.scope },
    async (session) => {
      const receipts = {} as Record<(typeof carriers)[number], Receipt>;
      for (const carrier of carriers)
        receipts[carrier] = await session.install({
          data: selection.data,
          requestId: requestId(
            canonical({
              product: description.product.appid,
              scope: selection.scope,
              data: selection.data,
              carrier,
              sha256: sources[carrier].sha256,
            }),
          ),
          source: sources[carrier],
        });
      for (const carrier of carriers) {
        const current = await session.read(carrier);
        if (
          !current ||
          current.requestId !== receipts[carrier].requestId ||
          current.digest !== receipts[carrier].digest
        )
          throw Error("installation intent has been superseded");
      }
      const registration =
        selection.carrier === "codexplugin"
          ? await register({
              factory: session.factory,
              context: session.context,
              application: receipts.codexplugin.path,
              profile: selection.profile,
              skills: selection.skills,
              root: selection.data,
              scope: selection.scope,
              version: description.release.identity.version,
              codex: selection.codex,
              worker,
            })
          : undefined;
      return { version: description.release.identity.version, receipts, ...(registration ? { registration } : {}) };
    },
  );
}
export async function installed(
  description: PackageManifest,
  selection: Selection,
  carrier: (typeof carriers)[number],
) {
  return usingSession({ home: selection.home, product: description.product.appid, scope: selection.scope }, (session) =>
    readInstalled(session, description, selection, carrier),
  );
}
export async function readInstalled(
  session: Session,
  description: PackageManifest,
  selection: Selection,
  carrier: (typeof carriers)[number],
) {
  const receipt = await session.read(carrier);
  if (!receipt) throw Error("application is not installed; run setup first");
  if (
    receipt.version !== description.release.identity.version ||
    receipt.digest !== `sha256:${description.carriers[carrier].sha256}` ||
    receipt.data !== selection.data
  )
    throw Error("selected application differs from this package or data scope");
  return receipt;
}
