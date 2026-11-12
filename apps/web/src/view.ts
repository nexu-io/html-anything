import type { Environment } from "@odsuite/carrier";
import { Client, type Transport } from "./api.js";
import { workspace } from "./lib/components/workspace.js";
import { Editor } from "./lib/editor.js";
export interface Config {
  entry?: string;
  daemon: string;
  token: string;
  environment?: Readonly<Environment>;
}
export interface WebView {
  editor: Editor;
  dispose(): Promise<void>;
}
const views = new WeakMap<HTMLElement, WebView>();
export function mount(root: HTMLElement, config: Config, transport?: Transport): WebView {
  if (views.has(root)) throw new Error("root already has a Web view; await dispose before remounting");
  const client = new Client(config.daemon, config.token, transport),
    editor = new Editor(client);
  if (config.environment) root.setAttribute("data-carrier", config.environment.carrier);
  const view = workspace(root, editor, client, config.entry);
  const handle: WebView = {
    editor,
    async dispose() {
      await view.dispose();
      views.delete(root);
    },
  };
  views.set(root, handle);
  return handle;
}
