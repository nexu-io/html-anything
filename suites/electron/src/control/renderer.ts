import type { Composition, Session } from "@odsuite/runtime";
import type { BrowserWindow } from "electron";
import { loading } from "../routing.js";

export function renderer(window: BrowserWindow, session: Session) {
  let lastLoading: string | undefined;
  const probe = async () => {
    const until = Date.now() + 10000;
    while (Date.now() < until) {
      const expected = session.browser();
      const result = await window.webContents.executeJavaScript(`(async()=>({
        status: document.querySelector('output')?.textContent,
        witness: document.querySelector('output')?.getAttribute('data-witness'),
        generation: globalThis.odsuite?.bootstrap.generation,
        nonce: globalThis.odsuite?.bootstrap.nonce,
        health: await globalThis.odsuite?.health()
      }))()`);
      if (
        result.status === "ready" &&
        result.generation === expected.generation &&
        result.nonce === expected.nonce &&
        result.witness
      ) {
        const health = await session.request("health");
        if (
          result.health?.pid !== health.pid ||
          result.health?.generation !== health.generation ||
          result.health?.nonce !== health.nonce
        )
          throw new Error("renderer daemon identity mismatch");
        return result.witness as string;
      }
      await new Promise((done) => setTimeout(done, 50));
    }
    throw new Error("renderer readiness timeout");
  };
  return {
    snapshot: () => ({ loading: lastLoading }),
    compose: async (composition: Composition) => {
      window.setTitle(composition.window.title);
      await window.loadURL(loading(composition.loading));
      lastLoading = await window.webContents.executeJavaScript("document.querySelector('output')?.textContent");
      if (lastLoading !== composition.loading) throw new Error("capsule loading evidence mismatch");
    },
    probe,
    reload: async () => {
      await session.documentStart(async () => {
        if (!window.isDestroyed()) await window.loadURL(loading("Stopped"));
      });
      await window.loadURL(session.webURL());
      const witness = await probe();
      await session.documentReady();
      return witness;
    },
  };
}
