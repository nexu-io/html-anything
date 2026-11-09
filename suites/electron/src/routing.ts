import type { Session } from "@odsuite/runtime";
import type { App, BrowserWindow, IpcMain, IpcMainEvent, IpcMainInvokeEvent, Protocol } from "electron";
import { asset } from "./assets.js";

export class Links {
  private queue: string[] = [];
  private handler?: (url: string) => Promise<unknown>;
  private pending = Promise.resolve();
  private active = true;
  private state = {
    accepted: 0,
    rejected: 0,
    handled: 0,
    last: undefined as string | undefined,
    result: undefined as unknown,
    error: undefined as string | undefined,
  };
  private open = (event: { preventDefault(): void }, url: string) => {
    event.preventDefault();
    this.accept(url);
  };
  private second = (_event: unknown, args: string[]) => {
    for (const value of args) if (value.includes("://")) this.accept(value);
  };
  constructor(
    private app: App,
    readonly scheme: string,
  ) {
    app.on("open-url", this.open);
    app.on("second-instance", this.second);
    for (const arg of process.argv) if (arg.startsWith(`${scheme}://`)) this.accept(arg);
  }
  accept(value: string) {
    try {
      const url = new URL(value);
      if (!this.active || url.protocol !== `${this.scheme}:` || value.length > 8192 || this.queue.length >= 16)
        throw new Error("invalid external URL");
    } catch {
      this.state.rejected++;
      return;
    }
    this.state.accepted++;
    this.queue.push(value);
    this.flush();
  }
  bind(handler: (url: string) => Promise<unknown>) {
    this.handler = handler;
    this.flush();
  }
  private flush() {
    if (!this.handler) return;
    for (const url of this.queue.splice(0))
      this.pending = this.pending.then(async () => {
        if (!this.active) return;
        this.state.last = url;
        try {
          this.state.result = await this.handler!(url);
          this.state.handled++;
          this.state.error = undefined;
        } catch (error) {
          this.state.error = String(error);
        }
      });
  }
  snapshot() {
    return structuredClone({ ...this.state, queued: this.queue.length });
  }
  async close() {
    this.active = false;
    this.app.removeListener("open-url", this.open);
    this.app.removeListener("second-instance", this.second);
    this.queue = [];
    await this.pending;
  }
}

async function input(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65536) throw new Error("payload too large");
      parts.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
export async function local(request: Request, session: Session): Promise<Response> {
  const url = new URL(request.url),
    browser = session.browser(),
    prefix = new URL(session.webURL()).pathname;
  if (url.protocol !== new URL(browser.origin).protocol || url.host !== "carrier")
    return new Response("not found", { status: 404 });
  if (url.pathname.startsWith("/_daemon/")) {
    if (
      !session.acceptDocument(request.headers.get("x-odsuite-nonce")) ||
      (request.headers.has("origin") && request.headers.get("origin") !== browser.origin)
    )
      return new Response("forbidden", { status: 403 });
    if (!["GET", "POST"].includes(request.method)) return new Response("method not allowed", { status: 405 });
    try {
      const method = url.pathname.slice(9);
      if (!/^[a-z][a-z0-9]*$/.test(method)) throw new Error("invalid method");
      const result = await session.call(method, request.method === "POST" ? await input(request) : null);
      return Response.json(result);
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 400 });
    }
  }
  if (!url.pathname.startsWith(prefix)) return new Response("not found", { status: 404 });
  url.pathname = `/${url.pathname.slice(prefix.length)}`;
  return session.webAsset((root) => asset(root, new Request(url, request), "'self'"));
}
export function routes(ipc: IpcMain, protocol: Protocol, window: BrowserWindow, session: Session) {
  let ipcCalls = 0,
    protocolCalls = 0;
  const allowed = (event: IpcMainEvent | IpcMainInvokeEvent) =>
    !!event.senderFrame &&
    event.sender === window.webContents &&
    event.senderFrame === window.webContents.mainFrame &&
    event.senderFrame.url.startsWith(`${session.browser().origin}/_web/`) &&
    event.senderFrame.url === session.webURL();
  const bootstrap = (event: IpcMainEvent) => {
    event.returnValue = allowed(event) ? session.browser() : null;
  };
  ipc.on("odsuite:bootstrap", bootstrap);
  ipc.handle("odsuite:call", async (event, nonce: unknown, method: unknown, value: unknown) => {
    if (!allowed(event) || !session.acceptDocument(nonce)) throw new Error("untrusted or expired renderer");
    if (typeof method !== "string" || Buffer.byteLength(JSON.stringify(value) ?? "") > 65536)
      throw new Error("invalid IPC request");
    ipcCalls++;
    return session.call(method, value);
  });
  const scheme = new URL(session.browser().origin).protocol.slice(0, -1);
  protocol.handle(scheme, (request) => {
    protocolCalls++;
    return local(request, session);
  });
  return {
    snapshot: () => ({ ipcCalls, protocolCalls }),
    close: () => {
      ipc.removeListener("odsuite:bootstrap", bootstrap);
      ipc.removeHandler("odsuite:call");
      protocol.unhandle(scheme);
    },
  };
}
export function loading(text: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `data:text/html;charset=utf-8,${encodeURIComponent(`<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'"></head><body><output>${escaped}</output></body></html>`)}`;
}
