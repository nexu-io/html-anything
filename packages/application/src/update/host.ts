import { Library } from "@odsuite/blob";
import type { Session } from "@odsuite/installer";
import { digest } from "@odsuite/protocol";
import type { Context } from "@odsuite/sidecar";

export async function hosting<T>(session: Session, work: (host: { library: Library; context: Context }) => Promise<T>) {
  let library!: Library;
  const attachment = await session.factory.expose({
    identity: { service: "updates", generation: digest("application-kit-preparation-v1") },
    handlers: {},
    lifecycle: {
      initialize: async (context) => {
        library = await Library.open({ factory: session.factory, context, name: "kits" });
      },
      stop: async () => library?.close(),
    },
  });
  try {
    return await work({ library, context: attachment.context });
  } finally {
    await attachment.close();
  }
}
