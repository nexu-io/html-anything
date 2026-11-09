import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { observeAutomation, prepareAutomation } from "@odsuite/electron";
import { app, BrowserWindow, ipcMain, protocol } from "electron";

import { asset } from "./assets.js";
import { runtime } from "./runtime.js";

const options = runtime();
const identity = options.manifest.identity;
const mark = (state: string): void => {
  if (options.probe) process.stderr.write(`carrier:${state}\n`);
};

mark("loaded");
protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      corsEnabled: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: identity.scheme,
  },
]);
prepareAutomation(options.probe);
app.setName(identity.name);
app.setPath("userData", options.data);
app.on("will-finish-launching", () => mark("launching"));

ipcMain.on("bootstrap", (event) => {
  event.returnValue = { daemon: options.daemon, token: options.token };
});

async function probe(window: BrowserWindow, automation: ReturnType<typeof observeAutomation>): Promise<void> {
  const limit = Date.now() + 10000;
  let last: unknown;
  while (Date.now() < limit) {
    const value = await window.webContents.executeJavaScript(`({
      body: document.body.innerHTML,
      status: document.querySelector('output')?.textContent,
      bootstrap: typeof globalThis.openMotion,
    })`);
    if (value.status === "ready") {
      process.stdout.write(
        `${JSON.stringify({
          origin: identity.origin,
          status: "ready",
          version: identity.version,
          automation: automation(),
        })}\n`,
      );
      app.quit();
      return;
    }
    last = value;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`renderer readiness timeout: ${JSON.stringify(last)}`);
}

async function launch(): Promise<void> {
  mark("ready");
  protocol.handle(identity.scheme, (request) => asset(options.web, request));
  const here = fileURLToPath(new URL(".", import.meta.url));
  const window = new BrowserWindow({
    show: !options.probe,
    focusable: !options.probe,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(here, "preload.cjs"),
      sandbox: true,
    },
  });
  const automation = observeAutomation(window, options.probe);
  window.webContents.on("console-message", (details) => mark(`console:${details.message}`));
  window.webContents.on("did-fail-load", (_event, code, text) => mark(`load:${code}:${text}`));
  window.webContents.on("preload-error", (_event, _path, fault) => mark(`preload:${fault.message}`));
  await window.loadURL(identity.origin);
  mark("loadedweb");
  if (options.probe) {
    await probe(window, automation);
  }
}

app
  .whenReady()
  .then(launch)
  .catch((fault: Error) => {
    process.stderr.write(`${fault.message}\n`);
    app.exit(1);
  });
app.on("window-all-closed", () => app.quit());
