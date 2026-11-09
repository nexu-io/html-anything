import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Catalog, type CatalogOptions, ShellRequired } from "@odsuite/distribution";
import { protocolIdentity } from "@odsuite/release";
import { Bootstrap, type Receipt, Session, type SessionOptions } from "@odsuite/runtime";
import { type Options as UpdateOptions, watch } from "@odsuite/update";
import { app, BrowserWindow, ipcMain, protocol } from "electron";
import { type AutomationReceipt, observeAutomation, prepareAutomation } from "./automation.js";
import { NativeGate } from "./control/gate.js";
import { type Installation, installation } from "./control/install.js";
import { renderer as rendererAdapter } from "./control/renderer.js";
import { Links, loading, routes } from "./routing.js";

export interface HostOptions extends Omit<SessionOptions, "executable"> {
  preload: string;
  probe?: boolean;
  automation?: boolean;
  receipt?: string;
  updates?: Omit<UpdateOptions, "activate" | "layer" | "source" | "onError"> & {
    activate?: boolean;
    capsule?: boolean;
  };
  distribution?: Pick<CatalogOptions, "endpoint" | "publickey" | "product">;
  installation?: Installation;
  /** Caller-owned debugging contract; manager credentials are never sent to the renderer. */
  inspect?: (
    session: Session,
    receipt: HostReceipt,
    quit: () => void,
    snapshot: () => Promise<HostReceipt>,
  ) => Promise<void>;
}

export interface HostReceipt extends Receipt {
  automation: AutomationReceipt;
  adapter: {
    loading: string;
    title: string;
    internal: string;
    external: string;
    ipcCalls: number;
    protocolCalls: number;
    links: ReturnType<Links["snapshot"]>;
  };
}

export async function startElectron(options: HostOptions): Promise<void> {
  const automated = !!(options.probe || options.automation);
  prepareAutomation(automated);
  const root = resolve(options.root);
  const identity = protocolIdentity(options.manifest);
  const links = new Links(app, identity.external);
  app.setName(options.manifest.identity.name);
  app.setPath("userData", root);
  if (!app.requestSingleInstanceLock()) {
    app.exit(1);
    return;
  }
  protocol.registerSchemesAsPrivileged([
    {
      scheme: identity.internal,
      privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
    },
  ]);
  let session: Session | undefined;
  let bootstrap: Bootstrap | undefined;
  let catalog: Catalog | undefined;
  let gate: NativeGate | undefined;
  let blocking: Promise<void> | undefined;
  let installing: ReturnType<typeof installation> | undefined;
  const updateOptions = () => ({
    ...options.updates,
    endpoint: options.distribution?.endpoint ?? options.updates!.endpoint,
    publickey: options.distribution?.publickey ?? options.updates!.publickey,
    source: catalog,
    onError: (error: unknown) => {
      if (!(error instanceof ShellRequired) || blocking) return;
      // Fence synchronously; never await a watcher's close from its own check.
      const drained = session?.block(String(error));
      blocking = (async () => {
        await capsuleObserver?.close();
        await drained;
        await gate!.show(error, { runtime: await session?.snapshot() });
        if (window && !window.isDestroyed()) window.destroy();
        if (installing) await installing.start();
      })().catch((error) => {
        process.stderr.write(`${String(error)}\n`);
        app.quit();
      });
    },
  });
  let closing = false;
  let window: BrowserWindow | undefined;
  let completed = false;
  let capsuleObserver: Awaited<ReturnType<typeof watch>> | undefined;
  let registered: ReturnType<typeof routes> | undefined;
  let screen: ReturnType<typeof rendererAdapter> | undefined;
  const adapter = () => ({
    loading: screen?.snapshot().loading ?? payloadLoading,
    title: window?.getTitle() ?? options.manifest.identity.name,
    internal: identity.internal,
    external: identity.external,
    ...(registered?.snapshot() ?? { ipcCalls: 0, protocolCalls: 0 }),
    links: links.snapshot(),
  });
  let payloadLoading = "";
  app.on("before-quit", (event) => {
    // Every request stays fenced while asynchronous drain owns shutdown. A
    // repeated native/remote quit must not bypass the first request's cleanup.
    event.preventDefault();
    if (closing) return;
    closing = true;
    void (async () => {
      await blocking;
      await capsuleObserver?.close();
      await bootstrap?.close();
      return session?.close() ?? { status: "stopped", survivors: [] };
    })()
      .then(async (stop) => {
        registered?.close();
        await links.close();
        if (options.receipt) {
          await mkdir(dirname(options.receipt), { recursive: true });
          await writeFile(`${options.receipt}.stop.json`, JSON.stringify(stop));
        }
        app.exit(completed ? 0 : 1);
      })
      .catch(async (fault: Error) => {
        process.stderr.write(`${fault.stack}\n`);
        if (options.receipt)
          await writeFile(
            `${options.receipt}.stop.json`,
            JSON.stringify({ status: "failed", error: String(fault), stack: fault.stack }),
          );
        app.exit(1);
      });
  });
  try {
    await app.whenReady();
    const runtime = { ...options, root, executable: process.execPath, onQuit: () => app.quit() };
    if (options.distribution) {
      const expectedAppid =
        options.manifest.channel === "stable"
          ? options.distribution.product
          : `${options.distribution.product}.${options.manifest.channel}`;
      if (options.manifest.identity.appid !== expectedAppid) throw new Error("distribution product identity mismatch");
      bootstrap = await Bootstrap.open(runtime);
      catalog = new Catalog({
        ...options.distribution,
        channel: options.manifest.channel,
        shellVersion: app.isPackaged ? app.getVersion() : options.manifest.identity.version,
        platform: process.platform === "darwin" ? "mac" : process.platform === "win32" ? "win" : "linux",
        arch: process.arch,
        root: bootstrap.context.roots.data,
      });
      gate = new NativeGate(catalog, automated, options.receipt);
      if (options.installation) {
        installing = installation(
          catalog,
          { root, namespace: options.namespace },
          gate,
          () => {
            completed = true;
            app.quit();
          },
          options.installation,
          options.receipt,
        );
        gate.install(installing.start);
      }
      try {
        await catalog.head(options.manifest.channel);
      } catch (error) {
        await gate.show(error, {
          owner: { service: bootstrap.context.identity.service, incarnation: bootstrap.context.incarnation },
          productInitialized: false,
        });
        if (installing && error instanceof ShellRequired) await installing.start();
        app.on("window-all-closed", () => app.quit());
        if (options.probe) app.quit();
        return;
      }
    }
    session = await Session.open(runtime, bootstrap);
    bootstrap = undefined;
    await installing?.register();
    const active = session;
    const payload = await active.activate({
      updates:
        options.updates || catalog
          ? async () => {
              if (!screen) throw new Error("renderer not ready for updates");
              return watch(active, {
                ...updateOptions(),
                layer: "leaf",
                activate: options.updates?.activate ? (release) => active.applyLeaf(release, screen!) : undefined,
              });
            }
          : undefined,
    });
    payloadLoading = payload.loading;
    window = new BrowserWindow({
      title: payload.window.title,
      show: !automated,
      focusable: !automated,
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        preload: resolve(options.preload),
      },
    });
    const automation = observeAutomation(window, automated);
    window.on("page-title-updated", (event) => event.preventDefault());
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    registered = routes(ipcMain, protocol, window, active);
    await window.loadURL(loading(payload.loading));
    payloadLoading = await window.webContents.executeJavaScript("document.querySelector('output')?.textContent");
    if (payloadLoading !== payload.loading) throw new Error("loading page evidence mismatch");
    await active.start();
    screen = rendererAdapter(window, active);
    const renderer = await screen.reload();
    const receipt: HostReceipt = {
      ...(await active.confirm(payload, renderer)),
      automation: automation(),
      adapter: adapter(),
    };
    if (options.updates?.capsule || catalog)
      capsuleObserver = await watch(active, {
        ...updateOptions(),
        layer: "capsule",
        activate: options.updates?.capsule ? (release) => active.applyCapsule(release, screen!) : undefined,
      });
    links.bind((url) => active.call("open", url));
    await options.inspect?.(
      active,
      receipt,
      () => app.quit(),
      async () => ({ ...(await active.snapshot()), automation: automation(), adapter: adapter() }),
    );
    await active.announce();
    await installing?.confirm(receipt);
    if (options.receipt) {
      await mkdir(dirname(options.receipt), { recursive: true });
      await writeFile(options.receipt, JSON.stringify(receipt));
    }
    completed = true;
    if (options.probe) app.quit();
    else app.on("window-all-closed", () => app.quit());
  } catch (fault) {
    process.stderr.write(`${(fault as Error).stack}\n`);
    app.quit();
  }
}
