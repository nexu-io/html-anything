// @vitest-environment happy-dom

// The export funnel is read from these events: one request result per start
// attempt, and one terminal result per accepted render when this tab sees it
// finish. A duplicate on re-render or a missing rejection would misstate the
// export success rate the product team decides on.

import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validProperties } from "../../../../tracking/core.ts";
import { studioEvents } from "../../../../tracking/events.ts";
import {
  installEditorTracking,
  resetEditorTrackingForTests,
  setProjectInventory,
  setProjectTemplate,
} from "../../motion/editorTracking";
import { usePlayerStore } from "../../player/store/playerStore";
import { mountRenderQueue, type MountedQueue } from "./renderQueueTestHarness";
import { useRenderQueue } from "./useRenderQueue";

const PROJECT = "0b8a4c1e-5d2f-4a7b-9c3d-1e2f3a4b5c6d";
const sent = vi.fn((_event: string, _properties: Record<string, unknown>) => "queued");
const events = (name: string) =>
  sent.mock.calls.filter(([event]) => event === name).map(([, properties]) => properties);

type Listener = (event: { data: string }) => void;
let source: { listeners: Listener[]; onerror?: () => void } | null = null;
let queue: MountedQueue | null = null;

function stubServer(post: () => Response | Promise<Response>, ffmpegOk = true, cancelStatus = "cancelled") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/environment/ffmpeg")) return Response.json({ ok: ffmpegOk });
      if (init?.method === "POST" && String(url).endsWith("/render")) return post();
      if (init?.method === "POST") return Response.json({ status: cancelStatus });
      return Response.json({ renders: [] });
    }),
  );
  vi.stubGlobal(
    "EventSource",
    class {
      listeners: Listener[] = [];
      onerror?: () => void;
      constructor() {
        source = this;
      }
      close(): void {}
      addEventListener(_type: string, listener: Listener): void {
        this.listeners.push(listener);
      }
    },
  );
}

async function mount(projectId = PROJECT) {
  queue = mountRenderQueue(useRenderQueue, projectId);
  await act(async () => {});
  return queue;
}
const progress = (status: string) =>
  act(async () => source?.listeners.forEach((listener) => listener({ data: JSON.stringify({ status, progress: 100 }) })));

beforeEach(() => {
  sent.mockClear();
  source = null;
  resetEditorTrackingForTests();
  usePlayerStore.setState({ timelineReady: false, duration: 0, elements: [] });
  installEditorTracking(sent as never);
});
afterEach(() => {
  queue?.unmount();
  queue = null;
  installEditorTracking(undefined);
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

describe("Studio export tracking", () => {
  it("reports one accepted request and one completed result, joined by export_id, across re-renders", async () => {
    stubServer(() => Response.json({ jobId: `${PROJECT}_2026-11-10_10-00-00`, status: "rendering" }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "export_panel", format: "webm", quality: "high", fps: 60, resolution: "landscape-4k" });
    });
    expect(events("studio_export_result")).toEqual([]);
    await progress("rendering");
    await progress("complete");
    await progress("complete");
    await act(async () => mounted.api().dismissActionError());

    const [request] = events("studio_export_request_result");
    const results = events("studio_export_result");
    expect(events("studio_export_request_result")).toHaveLength(1);
    expect(results).toHaveLength(1);
    expect(request).toEqual({
      export_id: expect.stringMatching(/^[0-9a-f-]{36}$/), outcome: "accepted", origin: "export_panel",
      format: "webm", quality: "high", resolution: "4k", fps: "60", project_scope: "managed", project_id: PROJECT,
      // Nothing about the project is loaded in this harness; the buckets say so rather than being absent.
      video_duration_bucket: "unknown", clip_count_bucket: "unknown", asset_count_bucket: "unknown", composition_count_bucket: "unknown",
    });
    expect(results[0]).toMatchObject({ export_id: request.export_id, job_state: "completed", origin: "export_panel", format: "webm" });
    for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
    // The server's job id embeds the project id and a timestamp; it never leaves the browser.
    expect(JSON.stringify(sent.mock.calls)).not.toContain("2026-11-10_10-00-00");
  });

  it("reports a failed render with a safe code, never the server's error text", async () => {
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    const mounted = await mount("project");
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await act(async () =>
      source?.listeners.forEach((listener) =>
        listener({ data: JSON.stringify({ status: "failed", error: "ENOENT /srv/someone/film/index.html" }) }),
      ),
    );
    expect(events("studio_export_result")).toEqual([
      expect.objectContaining({ job_state: "failed", error_code: "RENDER_FAILED", origin: "header", project_scope: "default" }),
    ]);
    expect(JSON.stringify(sent.mock.calls)).not.toContain("someone");
  });

  it("reports a lost progress stream and a cancel as their own terminal states", async () => {
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await act(async () => source?.onerror?.());
    expect(events("studio_export_result")).toEqual([expect.objectContaining({ job_state: "failed", error_code: "CONNECTION_LOST" })]);

    sent.mockClear();
    stubServer(() => Response.json({ jobId: "job-2", status: "rendering" }));
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await act(async () => {
      await mounted.api().cancelRender("job-2");
    });
    expect(events("studio_export_result")).toEqual([expect.objectContaining({ job_state: "cancelled" })]);
    expect(events("studio_export_result")[0]).not.toHaveProperty("error_code");
  });

  it("reports the server's outcome when a cancel lands after the render already finished", async () => {
    stubServer(() => Response.json({ jobId: "job-3", status: "rendering" }), true, "complete");
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await act(async () => {
      await mounted.api().cancelRender("job-3");
    });
    await act(async () => mounted.api().dismissActionError());
    expect(events("studio_export_result")).toEqual([expect.objectContaining({ job_state: "completed" })]);
    expect(events("studio_export_result")[0]).not.toHaveProperty("error_code");
  });

  it("reports no outcome when the server never confirmed the cancel", async () => {
    stubServer(() => Response.json({ jobId: "job-5", status: "rendering" }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
      init?.method === "POST" && String(url).includes("/cancel") ? new Response("boom", { status: 500 }) : original(url, init),
    );
    await act(async () => {
      await mounted.api().cancelRender("job-5");
    });
    await act(async () => mounted.api().dismissActionError());
    expect(events("studio_export_request_result")).toHaveLength(1);
    expect(events("studio_export_result")).toEqual([]);
  });

  it("classifies an omitted frame rate as the 30 fps the render actually uses", async () => {
    stubServer(() => Response.json({ jobId: "job-4", status: "rendering" }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    expect(events("studio_export_request_result")).toEqual([expect.objectContaining({ outcome: "accepted", fps: "30" })]);
  });

  it("reports a rejected request with its category and no terminal result", async () => {
    stubServer(() => Response.json({ error: "FFmpeg not found at /opt/private/bin" }, { status: 503 }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "export_panel" });
    });
    stubServer(() => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1")));
    await act(async () => {
      await mounted.api().startRender({ origin: "export_panel" });
    });
    expect(events("studio_export_request_result").map((event) => [event.outcome, event.error_code])).toEqual([
      ["rejected", "SERVICE_UNAVAILABLE"],
      ["rejected", "SERVER_UNREACHABLE"],
    ]);
    expect(events("studio_export_result")).toEqual([]);
    expect(JSON.stringify(sent.mock.calls)).not.toMatch(/private|ECONNREFUSED/);
  });

  it("refuses to start without FFmpeg and says so once per attempt", async () => {
    stubServer(() => Response.json({ jobId: "never" }), false);
    const mounted = await mount();
    // The probe answer is remembered for the tab's life; ask again as the Recheck button does.
    await act(async () => mounted.api().recheckFfmpeg());
    await vi.waitFor(() => expect(mounted.api().ffmpegMissing).toBe(true));
    await act(async () => {
      await mounted.api().startRender({ origin: "composition_card" });
    });
    expect(events("studio_export_request_result")).toEqual([
      expect.objectContaining({ outcome: "rejected", error_code: "FFMPEG_MISSING", origin: "composition_card" }),
    ]);
    // Leave the tab-wide probe cache answering "installed" for the cases after this one.
    stubServer(() => Response.json({ jobId: "never" }), true);
    await act(async () => mounted.api().recheckFfmpeg());
    await vi.waitFor(() => expect(mounted.api().ffmpegMissing).toBe(false));
  });

  it("exports normally when reporting is off or the tracker fails", async () => {
    installEditorTracking((() => {
      throw new Error("collector down");
    }) as never);
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await progress("complete");
    expect(mounted.api().jobs).toEqual([expect.objectContaining({ id: "job-1", status: "complete" })]);

    installEditorTracking(undefined);
    stubServer(() => Response.json({ jobId: "job-2", status: "rendering" }));
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    expect(mounted.api().jobs).toHaveLength(2);
  });

  it("adds video length, project size and the source template as buckets and an id, from memory", async () => {
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    usePlayerStore.setState({
      timelineReady: true,
      duration: 95.4,
      elements: Array.from({ length: 7 }, (_, index) => ({ id: `clip-${index}` })) as never,
    });
    setProjectInventory({ assets: 30, compositions: 1 });
    setProjectTemplate("hf-moment-M1147");
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "export_panel" });
    });
    await progress("complete");
    expect(events("studio_export_request_result")[0]).toMatchObject({
      video_duration_bucket: "1_3min", clip_count_bucket: "6_20", asset_count_bucket: "21_50",
      composition_count_bucket: "1", template_id: "hf-moment-M1147",
    });
    const [result] = events("studio_export_result");
    expect(result).toMatchObject({ job_state: "completed", video_duration_bucket: "1_3min", template_id: "hf-moment-M1147" });
    expect(result).not.toHaveProperty("clip_count_bucket");
    expect(JSON.stringify(sent.mock.calls)).not.toContain("95.4");
    for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
  });

  it("still reports the export when nothing about the project has loaded yet", async () => {
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    setProjectTemplate("A customer's template name");
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "header" });
    });
    await progress("failed");
    const [request] = events("studio_export_request_result");
    expect(request).toMatchObject({
      outcome: "accepted", video_duration_bucket: "unknown", clip_count_bucket: "unknown",
      asset_count_bucket: "unknown", composition_count_bucket: "unknown",
    });
    expect(request).not.toHaveProperty("template_id");
    expect(events("studio_export_result")).toEqual([expect.objectContaining({ job_state: "failed", video_duration_bucket: "unknown" })]);
    for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
  });

  it("does not describe the open timeline when a different composition is rendered", async () => {
    stubServer(() => Response.json({ jobId: "job-1", status: "rendering" }));
    usePlayerStore.setState({ timelineReady: true, duration: 20, elements: [{ id: "a" }] as never });
    const mounted = await mount();
    await act(async () => {
      await mounted.api().startRender({ origin: "composition_card", composition: "scenes/other.html" });
    });
    expect(events("studio_export_request_result")[0]).toMatchObject({ video_duration_bucket: "unknown", clip_count_bucket: "unknown" });
    expect(JSON.stringify(sent.mock.calls)).not.toContain("scenes");
  });
});
