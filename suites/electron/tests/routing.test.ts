import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import type { Session } from "@odsuite/runtime";
import type { App, BrowserWindow, IpcMain, Protocol } from "electron";
import { it } from "vitest";
import { Links, local, routes } from "../src/routing.js";

it("queues startup links, routes only the selected channel and drains before unregistering", async () => {
  const app = new EventEmitter() as unknown as App,
    links = new Links(app, "od-preview");
  let prevent = 0;
  app.emit("open-url", { preventDefault: () => prevent++ }, "od-preview://probe?value=cold");
  links.accept("od-stable://probe?value=wrong");
  const seen: string[] = [];
  links.bind(async (url) => {
    seen.push(url);
    return { url };
  });
  app.emit("second-instance", {}, ["app", "od-preview://probe?value=warm"]);
  await new Promise((done) => setTimeout(done, 10));
  assert.equal(prevent, 1);
  assert.equal(seen.length, 2);
  assert.deepEqual(links.snapshot(), {
    accepted: 2,
    rejected: 1,
    handled: 2,
    last: seen[1],
    result: { url: seen[1] },
    error: undefined,
    queued: 0,
  });
  await links.close();
  assert.equal(app.listenerCount("open-url"), 0);
  assert.equal(app.listenerCount("second-instance"), 0);
  links.accept("od-preview://probe");
  assert.equal(links.snapshot().rejected, 2);
});

it("fences old documents and forwards bounded internal requests through the Capsule adapter", async () => {
  const calls: unknown[] = [];
  const session = {
    browser: () => ({ origin: "od://carrier" }),
    documentNonce: () => "epoch2",
    acceptDocument: (nonce: unknown) => nonce === "epoch2",
    webURL: () => "od://carrier/_web/digest/",
    call: async (method: string, input: unknown) => {
      calls.push({ method, input });
      return { method, input };
    },
  } as unknown as Session;
  const request = (nonce: string, method = "POST", body = '{"value":1}') =>
    new Request("od://carrier/_daemon/write", {
      method,
      headers: { "x-odsuite-nonce": nonce },
      body: method === "POST" ? body : undefined,
    });
  assert.equal((await local(request("epoch1"), session)).status, 403);
  assert.equal(calls.length, 0);
  assert.deepEqual(await (await local(request("epoch2"), session)).json(), { method: "write", input: { value: 1 } });
  assert.equal((await local(request("epoch2", "POST", "x".repeat(65537)), session)).status, 400);
  const wrong = new Request("od://other/_daemon/read", { headers: { "x-odsuite-nonce": "epoch2" } });
  assert.equal((await local(wrong, session)).status, 404);
  assert.equal(calls.length, 1);
});

it("rejects loading-page bootstrap before Web mounting without querying an unavailable URL", () => {
  const events = new EventEmitter();
  let handles = 0,
    unhandled = 0;
  const ipc = Object.assign(events, { handle: () => handles++, removeHandler: () => handles-- }) as unknown as IpcMain;
  const protocol = { handle: () => {}, unhandle: () => unhandled++ } as unknown as Protocol;
  const frame = { url: "data:text/html,loading" },
    contents = { mainFrame: frame };
  const window = { webContents: contents } as unknown as BrowserWindow;
  const session = {
    browser: () => ({ origin: "od://carrier" }),
    webURL: () => {
      throw Error("not mounted");
    },
  } as unknown as Session;
  const registered = routes(ipc, protocol, window, session);
  const event = { sender: contents, senderFrame: frame, returnValue: undefined };
  events.emit("odsuite:bootstrap", event);
  assert.equal(event.returnValue, null);
  registered.close();
  assert.equal(handles, 0);
  assert.equal(unhandled, 1);
  assert.equal(events.listenerCount("odsuite:bootstrap"), 0);
});
