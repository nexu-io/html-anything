import { createServer } from "node:http";
import { release } from "node:os";
import { join } from "node:path";
import { Environments } from "@odsuite/carrier";
import { observeAutomation, prepareAutomation } from "@odsuite/electron";
import { app, BrowserWindow } from "electron";

const socket = process.env.ODSUITE_DEV_HOST_SOCKET,
  data = process.env.ODSUITE_DEV_HOST_DATA,
  logs = process.env.ODSUITE_DEV_HOST_LOGS,
  cache = process.env.ODSUITE_DEV_HOST_CACHE,
  temp = process.env.ODSUITE_DEV_HOST_TEMP;
if (!socket || !data || !logs || !cache || !temp || !process.versions.electron)
  throw new Error("managed Electron inputs are required");
const headless = process.env.ODSUITE_DEV_HEADLESS === "1";
prepareAutomation(headless);
app.setName("Open Motion");
app.setPath("userData", data);
app.setPath("sessionData", data);
app.setAppLogsPath(logs);
app.setPath("cache", cache);
app.setPath("temp", temp);
app.setPath("crashDumps", join(logs, "crashes"));
const environment = new Environments().register({
  schema: 1,
  carrier: "electron",
  system: { platform: process.platform, arch: process.arch, release: release() },
  runtime: { name: "electron", version: process.versions.electron },
});
let window: BrowserWindow | undefined, automation: (() => unknown) | undefined;
const server = createServer((request, response) => {
  void (async () => {
    const reply = (code: number, value: unknown) => {
      response.writeHead(code, { "content-type": "application/json", connection: "close" });
      response.end(JSON.stringify(value));
    };
    if (request.method === "GET" && request.url === "/health") {
      const page =
        window && !window.isDestroyed()
          ? await window.webContents.executeJavaScript(
              '({status:document.querySelector("[aria-live]")?.textContent,carrier:document.querySelector("#app")?.dataset.carrier})',
            )
          : null;
      reply(200, {
        pid: process.pid,
        environment,
        ready: page?.status === "就绪" && page?.carrier === "electron",
        page,
        automation: automation?.(),
      });
      return;
    }
    if (request.method !== "POST" || request.url !== "/launch" || window) {
      reply(400, { error: "invalid host operation" });
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const c of request) {
      bytes += c.length;
      if (bytes > 4096) throw new Error("launch input exceeds limit");
      chunks.push(c);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString()),
      url = new URL(input.url);
    if (
      url.protocol !== "http:" ||
      url.hostname !== "127.0.0.1" ||
      !url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error("managed loopback Web origin is required");
    await app.whenReady();
    window = new BrowserWindow({
      show: !headless,
      focusable: !headless,
      title: `Open Motion ${process.env.ODSUITE_DEV_VERSION}`,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    automation = observeAutomation(window, headless);
    await window.loadURL(url.href);
    reply(200, { launched: true });
  })().catch((error) => {
    if (!response.headersSent) response.writeHead(500, { "content-type": "application/json", connection: "close" });
    response.end(JSON.stringify({ error: (error as Error).message }));
  });
});
await new Promise<void>((done, reject) => {
  server.once("error", reject);
  server.listen(socket, done);
});
process.stdout.write("ready\n");
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  server.close(() => app.quit());
  server.closeAllConnections();
  window?.destroy();
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
app.on("window-all-closed", stop);
