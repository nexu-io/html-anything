import { writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Catalog } from "@odsuite/distribution";
import { arm, confirm, location, type Options, prepare, register, status } from "@odsuite/installer";
import type { Receipt } from "@odsuite/runtime";
import { app } from "electron";
import type { NativeGate } from "./gate.js";

export interface Installation {
  checkpoint?: Options["checkpoint"];
}
export function installation(
  catalog: Catalog,
  runtime: { root: string; namespace: string },
  gate: NativeGate,
  quit: () => void,
  options: Installation,
  receipt?: string,
) {
  if (!app.isPackaged || process.platform !== "darwin")
    throw Error("automatic installation requires a packaged macOS app");
  const target = dirname(dirname(dirname(app.getPath("exe")))),
    root = location(target, catalog.options.product, catalog.options.channel);
  const { root: _, ...policy } = catalog.options;
  let pending: Promise<void> | undefined;
  const start = () => {
    pending ??= (async () => {
      await gate.progress("Preparing a compatible application update");
      const env = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key, value]) =>
            key.startsWith("ODSUITE_") &&
            !key.startsWith("ODSUITE_RUNTIME_") &&
            typeof value === "string" &&
            !key.includes("TOKEN"),
        ),
      ) as Record<string, string>;
      if (receipt) env.ODSUITE_RECEIPT = `${receipt}.next`;
      const handle = await prepare({
        root,
        target,
        catalog: policy,
        runtime: { ...runtime, version: app.getVersion() },
        env,
        checkpoint: options.checkpoint,
      });
      if (receipt)
        await writeFile(
          `${receipt}.installation.json`,
          JSON.stringify({ id: handle.id, root, target, manager: handle.manager }),
        );
      await gate.progress("Installation coordinator is ready", { id: handle.id, manager: handle.manager });
      await arm(handle);
      quit();
    })()
      .catch(async (error) => {
        try {
          const transaction = await status(root, catalog.options.channel);
          if (!transaction || !["failed", "confirmed"].includes(transaction.phase)) {
            await gate.progress("Another application instance is preparing this update");
            return;
          }
        } catch {
          // No active coordinator could be verified; keep the original failure visible.
        }
        if (receipt)
          await writeFile(
            `${receipt}.installation-error.json`,
            JSON.stringify({ error: String(error), stack: error instanceof Error ? error.stack : undefined }),
          );
        await gate.show(error);
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
  return {
    start,
    register: () => register({ root, target, catalog: policy, runtime: { ...runtime, version: app.getVersion() } }),
    confirm: async (value: Receipt) => {
      if (!process.env.ODSUITE_INSTALLATION_ID) return;
      if (process.env.ODSUITE_INSTALLATION_ROOT !== root) throw Error("installation confirmation root mismatch");
      await confirm(root, catalog.options.channel, {
        id: process.env.ODSUITE_INSTALLATION_ID,
        nonce: process.env.ODSUITE_INSTALLATION_NONCE ?? "",
        version: app.getVersion(),
        root: runtime.root,
        generation: value.generation,
      });
    },
  };
}
