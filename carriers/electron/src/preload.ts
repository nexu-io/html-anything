import { contextBridge, ipcRenderer } from "electron";

const value: unknown = ipcRenderer.sendSync("bootstrap");
contextBridge.exposeInMainWorld("openMotion", Object.freeze(value));
