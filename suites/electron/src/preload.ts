import { contextBridge, ipcRenderer } from "electron";
import type { Bridge } from "./bridge.js";

const bootstrap = Object.freeze(ipcRenderer.sendSync("odsuite:bootstrap"));
const request = async (method: string, value?: unknown): Promise<Record<string, unknown>> => {
  const response = await fetch(`${bootstrap.origin}/_daemon/${method}`, {
    signal: AbortSignal.timeout(5000),
    method: method === "write" ? "POST" : "GET",
    headers: { "x-odsuite-nonce": bootstrap.nonce, "content-type": "application/json" },
    body: method === "write" ? JSON.stringify(value) : undefined,
  });
  if (!response.ok) throw new Error(`local protocol ${response.status}`);
  return response.json();
};
const bridge: Bridge = {
  bootstrap,
  call: (method, input) => ipcRenderer.invoke("odsuite:call", bootstrap.nonce, method, input),
  health: () => request("health"),
  read: () => request("read"),
  write: (value) => request("write", value),
};
contextBridge.exposeInMainWorld("odsuite", Object.freeze(bridge));
