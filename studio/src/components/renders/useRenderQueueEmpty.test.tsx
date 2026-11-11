// @vitest-environment happy-dom
import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { mountRenderQueue, renderPosts, stubRenderFetch } from "./renderQueueTestHarness";
import { usePlayerStore } from "../../player/store/playerStore";
import { usePreviewIframeStore } from "../../player/store/previewIframeStore";
vi.mock("../../motion/StudioHost", () => ({ useMvpEditor: () => true }));
vi.mock("./useFfmpegStatus", () => ({ useFfmpegStatus: () => ({ status: { ok: true }, checking: false, recheck: vi.fn() }), ffmpegInstallMessage: () => "" }));
vi.mock("../../telemetry/events", () => ({ trackStudioRenderStart: vi.fn() }));
const { useRenderQueue } = await import("./useRenderQueue");
let queue: ReturnType<typeof mountRenderQueue> | undefined;
afterEach(() => {
  queue?.unmount(); queue = undefined;
  usePlayerStore.getState().reset();
  usePreviewIframeStore.getState().setIframe(null);
  document.body.replaceChildren(); vi.unstubAllGlobals();
});
it("blocks the confirmed empty composition at the shared start handler, then allows real content", async () => {
  const fetchMock = stubRenderFetch();
  const iframe = document.createElement("iframe"); document.body.append(iframe);
  iframe.contentDocument!.body.innerHTML = '<div data-composition-id="main"></div>';
  usePreviewIframeStore.getState().setIframe(iframe);
  usePlayerStore.setState({ timelineReady: true, timelineProjectId: "demo", elements: [] });
  queue = mountRenderQueue(useRenderQueue, "demo", "index.html");
  await act(async () => { await queue!.api().startRender(); });
  expect(queue.api().emptyComposition).toBe(true);
  expect(renderPosts(fetchMock)).toHaveLength(0);
  expect(queue.api().jobs).toHaveLength(0);
  await act(async () => { iframe.contentDocument!.querySelector("div")!.textContent = "Static title"; });
  expect(queue.api().emptyComposition).toBe(false);
  await act(async () => { await queue!.api().startRender(); });
  expect(renderPosts(fetchMock)).toHaveLength(1);
});
