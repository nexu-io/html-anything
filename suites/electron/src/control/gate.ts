import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { type Catalog, ShellRequired } from "@odsuite/distribution";
import { app, BrowserWindow } from "electron";
import { observeAutomation } from "../automation.js";

function encodeText(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
/** Stable native-owned UI. No product preload, IPC, protocols or adapter code. */
export class NativeGate {
  private window?: BrowserWindow;
  private observe?: ReturnType<typeof observeAutomation>;
  private retrying = false;
  private retries = 0;
  private minimum?: string;
  private installer?: () => Promise<void>;
  install(operation: () => Promise<void>) {
    this.installer = operation;
  }
  async progress(message: string, installation?: unknown) {
    await this.render(`Updating application: ${message}`, { installation }, "updating");
  }
  constructor(
    private catalog: Catalog,
    private automated: boolean,
    private receipt?: string,
  ) {}
  async show(error: unknown, facts: Record<string, unknown> = {}) {
    if (error instanceof ShellRequired) this.minimum = error.metadata.minShellVersion;
    const text =
      error instanceof ShellRequired
        ? `Update required: shell ${this.catalog.options.shellVersion}, minimum ${this.minimum}`
        : `Update verification failed: ${String(error)}`;
    await this.render(text, { ...facts, error: String(error) });
  }
  private async render(text: string, facts: Record<string, unknown> = {}, result = "blocked") {
    if (!this.window) {
      this.window = new BrowserWindow({
        title: "Application update required",
        show: !this.automated,
        focusable: !this.automated,
        webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
      });
      this.observe = observeAutomation(this.window, this.automated);
      this.window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      this.window.webContents.on("will-navigate", (event) => {
        event.preventDefault();
        if (event.url === "odsuite-update://quit") app.quit();
        if (event.url === "odsuite-update://retry" && !this.retrying) void this.retry();
      });
    }
    const html = `<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; navigate-to odsuite-update:"></head><body><h1>Application update required</h1><output>${encodeText(text)}</output><p><a href="odsuite-update://retry">Retry</a> <a href="odsuite-update://quit">Quit</a></p></body></html>`;
    await this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const actual = await this.window.webContents.executeJavaScript("document.querySelector('output')?.textContent");
    if (actual !== text) throw new Error("native blocking document evidence missing");
    if (this.receipt) {
      await mkdir(dirname(this.receipt), { recursive: true });
      await writeFile(
        `${this.receipt}.gate.json`,
        JSON.stringify({
          ...facts,
          result,
          pid: process.pid,
          installed: this.catalog.options.shellVersion,
          minimum: this.minimum,
          witness: actual,
          automation: this.observe!(),
          productPreload: false,
          retries: this.retries,
        }),
      );
    }
  }
  private async retry() {
    this.retrying = true;
    this.retries++;
    try {
      await this.catalog.head(this.catalog.options.channel);
      app.relaunch();
      app.quit();
    } catch (error) {
      if (error instanceof ShellRequired && this.installer) await this.installer();
      else await this.show(error);
    } finally {
      this.retrying = false;
    }
  }
}
