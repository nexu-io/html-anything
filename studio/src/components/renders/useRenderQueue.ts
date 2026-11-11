import { useEmptyPreview } from "../nle/useEmptyPreview";
import { useMvpEditor } from "../../motion/StudioHost";
import { buildProjectApiPath } from "../../utils/projectRouting";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { CanvasResolution } from "@hyperframes/parsers";
import { trackStudioRenderStart } from "../../telemetry/events";
import { getAnonymousId } from "../../telemetry/config";
import { browserTelemetryAllowed } from "../../telemetry/policy";
import { generateId } from "../../utils/generateId";
import { readServerError } from "./serverError";
import { ffmpegInstallMessage, useFfmpegStatus } from "./useFfmpegStatus";
import { requestStudioFeedback, type FeedbackContext } from "../feedback/feedbackTrigger";
import { studioApiFetch, studioProjectUrl } from "../../utils/studioApiFetch";
import { usePlayerStore } from "../../player/store/playerStore";
import {
  durationBucket,
  exportRejection,
  exportSettings,
  openTemplateFields,
  projectScaleFields,
  projectFields,
  reportExportRequest,
  reportExportResult,
  type ExportOrigin,
} from "../../motion/editorTracking";

export interface RenderJob {
  id: string;
  status: "rendering" | "complete" | "failed" | "cancelled";
  progress: number;
  stage?: string;
  error?: string;
  filename: string;
  createdAt: number;
  durationMs?: number;
}

// The CLI consumes this same source through @hyperframes/core's re-export.
// Importing from the browser-safe parsers package avoids the core barrel's
// Node-only transitive modules without duplicating the preset union in Studio.
export type ResolutionPreset = CanvasResolution;

export interface StartRenderOptions {
  fps?: number;
  quality?: "draft" | "standard" | "high";
  format?: "mp4" | "webm" | "mov" | "gif";
  /** `"auto"` (default) renders at the composition's authored dimensions. */
  resolution?: ResolutionPreset | "auto";
  gpu?: boolean;
  gifLoop?: number;
  /**
   * Render a specific composition file. Omit it to render the composition the
   * user currently has open — only the sidebar's per-composition Render button
   * names one, because it renders a card the user is not looking at.
   */
  composition?: string;
  /**
   * Composition-variable overrides ({variableId: value}), forwarded to the
   * render route and injected as window.__hfVariables — the same channel
   * `hyperframes render --variables` uses.
   */
  variables?: Record<string, unknown>;
  /** Which control asked for this render. Reported as a category only; defaults to the header. */
  origin?: ExportOrigin;
}

// "Hide" (formerly "Clear") is a view operation, not a delete: hidden ids are
// remembered here so hidden renders don't resurrect from the on-disk history
// on the next load. Per-project key so projects don't hide each other's rows.
function hiddenIdsKey(projectId: string): string {
  return `hf-studio-hidden-renders:${projectId}`;
}

function readHiddenIds(projectId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(hiddenIdsKey(projectId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function writeHiddenIds(projectId: string, ids: Set<string>): void {
  try {
    // Cap the list so it doesn't grow unbounded across months of renders.
    window.localStorage.setItem(hiddenIdsKey(projectId), JSON.stringify([...ids].slice(-200)));
  } catch {
    /* localStorage may be unavailable or full */
  }
}


export function useRenderQueue(
  projectId: string | null,
  // A ref, not the value: the render target has to be read at click time, and
  // threading the value through would rebuild every callback below on each
  // composition switch.
  activeCompPathRef: { current: string | null },
) {
  const mvp = useMvpEditor();
  const emptyComposition = useEmptyPreview(projectId ?? "", mvp);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  // History fetch failure — distinguished from "no renders yet" so the panel
  // never shows a false empty state.
  const [loadError, setLoadError] = useState<string | null>(null);
  // Failure of a user action (delete/cancel), surfaced inline in the panel.
  const [actionError, setActionError] = useState<string | null>(null);
  // Owned here rather than in the panel: Studio renders from three places —
  // the panel's Export button, the header's, and each composition card in the
  // left sidebar — and a check living in one of them leaves the rest free to
  // start a render this machine cannot finish. Every caller routes through
  // `startRender`, so that is where the refusal belongs. Call sites still
  // read `ffmpegMissing` to put the prompt on screen, because a refusal the
  // user cannot see reads as a broken button.
  const { status: ffmpeg, checking: ffmpegChecking, recheck: recheckFfmpeg } = useFfmpegStatus();
  // A null status means the probe gave no answer (older server, failed
  // request), which is not evidence of a missing encoder. Unknown fails open.
  const ffmpegMissing = ffmpeg !== null && !ffmpeg.ok;
  const eventSourceRef = useRef<EventSource | null>(null);
  const activeJobRef = useRef<string | null>(null);
  // Renders started in THIS tab, mapped to the settings they ran with.
  // `loadRenders` also injects finished jobs from disk history, and those must
  // never trigger a feedback prompt — the user did not just watch them happen.
  const sessionJobs = useRef(new Map<string, FeedbackContext>());
  const promptedJobIds = useRef(new Set<string>());
  // Accepted renders this tab started and has not yet reported a terminal state for.
  // Cancels are optimistic: the row flips to "cancelled" before the server confirms, and a
  // render that had already finished is reconciled afterwards. Hold the terminal report until then.
  const cancelling = useRef(new Set<string>());
  // What the cancel route said the render had already become, when it was not "cancelled".
  const settledBeforeCancel = useRef(new Map<string, "completed" | "failed">());
  // Cancels the server never confirmed: the render may still be running, so no outcome is reported.
  const unconfirmedCancels = useRef(new Set<string>());
  const [cancelSettled, setCancelSettled] = useState(0);
  const trackedExports = useRef(
    new Map<
      string,
      {
        exportId: string;
        settings: ReturnType<typeof exportSettings> & { video_duration_bucket: ReturnType<typeof durationBucket>; template_id?: string };
        lost?: boolean;
      }
    >(),
  );

  /**
   * The one way a render started here enters the list. Every start path — the
   * happy one and all three failure shortcuts — goes through here, so both
   * "this render belongs to this session" and "these are the settings it ran
   * with" have a single owner. A report about a render is only actionable if
   * it arrives with the settings that produced it.
   */
  const addSessionJob = useCallback((job: RenderJob, settings: FeedbackContext) => {
    sessionJobs.current.set(job.id, settings);
    setJobs((prev) => [...prev, job]);
  }, []);

  const closeActiveEventSource = useCallback((jobId?: string) => {
    if (jobId && activeJobRef.current !== jobId) return;
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    activeJobRef.current = null;
  }, []);

  // Load completed renders from the server
  const loadRenders = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await studioApiFetch(buildProjectApiPath(projectId, `/renders`));
      if (!res.ok) {
        setLoadError(`Couldn't load render history (server error ${res.status}).`);
        return;
      }
      const data = await res.json();
      setLoadError(null);
      if (Array.isArray(data.renders)) {
        const hidden = readHiddenIds(projectId);
        setJobs((prev) => {
          const existing = new Set(prev.map((j) => j.id));
          const fromServer: RenderJob[] = data.renders
            .filter((r: { id: string }) => !existing.has(r.id) && !hidden.has(r.id))
            .map(
              (r: {
                id: string;
                filename: string;
                createdAt: number;
                size: number;
                status?: string;
                durationMs?: number;
              }) => ({
                id: r.id,
                status: (r.status === "failed" ? "failed" : "complete") as "complete" | "failed",
                progress: 100,
                filename: r.filename,
                createdAt: r.createdAt,
                durationMs: r.durationMs,
              }),
            );
          return [...prev, ...fromServer];
        });
      }
    } catch {
      setLoadError("Couldn't load render history. Is the studio server running?");
    }
  }, [projectId]);

  useEffect(() => {
    loadRenders();
  }, [loadRenders]);

  // Start a render and track progress via SSE
  // Pre-existing branchy fetch/poll flow — the variables passthrough added one branch.
  const startRender = useCallback(
    // fallow-ignore-next-line complexity
    async (opts: StartRenderOptions = {}) => {
      if (!projectId) return;
      if (emptyComposition && (!opts.composition || opts.composition === activeCompPathRef.current)) {
        setActionError("No content to export. Add media first.");
        return;
      }
      // One request result per start attempt. The id is minted here because the
      // server's job id embeds the project id and a timestamp.
      const exportId = generateId();
      // Length and size of what is being rendered, from the player's memory at request time, bucketed.
      // A composition other than the open one has no loaded timeline here, so it reports `unknown`.
      const player = usePlayerStore.getState();
      const openComposition = !opts.composition || opts.composition === activeCompPathRef.current;
      const timeline = openComposition && player.timelineReady;
      const tracked = {
        ...exportSettings(opts.origin, opts),
        video_duration_bucket: durationBucket(timeline ? player.duration : undefined),
        ...openTemplateFields(),
      };
      const scale = projectScaleFields(timeline ? player.elements.length : undefined);
      const requestResult = (
        outcome: "accepted" | "rejected",
        error_code?: Parameters<typeof reportExportRequest>[0]["error_code"],
      ) =>
        reportExportRequest({
          export_id: exportId,
          outcome,
          ...tracked,
          ...scale,
          ...(error_code ? { error_code } : {}),
          ...projectFields(projectId),
        });
      // The server would answer this with a 503 anyway. Refusing here keeps
      // the reason and the fix in the message, and keeps a control that
      // forgot to disable itself from producing a mystery failure.
      if (ffmpegMissing) {
        // Components still preparing are a different refusal from a machine without FFmpeg.
        requestResult("rejected", ffmpeg?.runtime ? "RUNTIME_NOT_READY" : "FFMPEG_MISSING");
        if (ffmpeg?.runtime) return;
        addSessionJob(
          {
            id: generateId(),
            status: "failed",
            progress: 0,
            error: ffmpegInstallMessage(ffmpeg),
            filename: "Export blocked",
            createdAt: Date.now(),
          },
          {},
        );
        return;
      }

      const fps = opts.fps ?? 30;
      const quality = opts.quality ?? "standard";
      const format = opts.format ?? "mp4";
      const resolution = opts.resolution;
      // Which composition a render targets belongs here, with the same
      // argument the FFmpeg gate above makes: Studio starts renders from three
      // controls, and a default living in one of them leaves the others
      // exporting a file the user is not looking at. The header's Export
      // passed no options at all, so every render it started went to
      // index.html no matter which composition was selected (#3549).
      const composition = opts.composition ?? activeCompPathRef.current ?? undefined;

      trackStudioRenderStart({
        fps,
        quality,
        format,
        resolution,
        composition,
      });

      const startTime = Date.now();
      // Travels with any feedback about this render. Settings only: the
      // composition path is a name the user chose, not file contents.
      const settings: FeedbackContext = {
        render_format: format,
        render_quality: quality,
        render_fps: fps,
        render_resolution: resolution ?? "auto",
        render_composition: composition ?? "index.html",
        render_has_variables: Boolean(opts.variables && Object.keys(opts.variables).length > 0),
      };
      // "auto" / undefined means "render at the composition's authored size".
      // Omit the field entirely — sending "auto" would trip the route's
      // enum validation set.
      const body: {
        fps: number;
        quality: string;
        format: string;
        resolution?: string;
        composition?: string;
        variables?: Record<string, unknown>;
        gpu?: boolean;
        gifLoop?: number;
        telemetryDistinctId?: string;
        telemetryOptOut?: boolean;
      } = {
        fps,
        quality,
        format,
      };
      // The id is MINTED by getAnonymousId(), so calling it unconditionally
      // created a telemetry identity for a profile that had opted out — and
      // then shipped it to the server. The server's own policy cannot see this
      // browser's localStorage or DoNotTrack, so it has to be told: an
      // explicit `telemetryOptOut` suppresses the render outcome, which
      // omitting the id alone does NOT (an old client omits it too, and that
      // falls back to the install id).
      if (browserTelemetryAllowed()) {
        // So the server-emitted render_complete/render_error is attributed to
        // this browser user (same id studio_* events use), making the render
        // funnel joinable. Matches studio_render_start fired just above.
        body.telemetryDistinctId = getAnonymousId();
      } else {
        body.telemetryOptOut = true;
      }
      if (resolution && resolution !== "auto") body.resolution = resolution;
      if (composition) body.composition = composition;
      if (opts.gpu) body.gpu = true;
      if (format === "gif" && opts.gifLoop !== undefined) body.gifLoop = opts.gifLoop;
      if (opts.variables && Object.keys(opts.variables).length > 0) {
        body.variables = opts.variables;
      }
      let res: Response;
      try {
        res = await studioApiFetch(buildProjectApiPath(projectId, `/render`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err) {
        // The cause used to be discarded. Every failure — a dead server, an
        // aborted request, a DNS error, a mid-render crash — surfaced as the
        // same sentence, and this string is what travels into the feedback
        // report too, so field reports of a render that fails *every time*
        // still carried nothing to act on. Keep the CLI guidance, name the
        // cause after it.
        requestResult("rejected", "SERVER_UNREACHABLE");
        const cause = err instanceof Error ? err.message : String(err);
        const failedJob: RenderJob = {
          id: generateId(),
          status: "failed",
          progress: 0,
          error: `Could not reach render server: ${cause}. Use \`hyperframes render\` from the CLI instead.`,
          filename: "Export failed",
          createdAt: startTime,
        };
        addSessionJob(failedJob, settings);
        return;
      }
      if (!res.ok) {
        if (res.status === 409 && (await res.clone().json().catch(() => null))?.code === 'NATIVE_RUNTIME_NOT_READY') {
          requestResult("rejected", "RUNTIME_NOT_READY");
          setActionError('Video components are not ready. Check preparation status.');
          recheckFfmpeg(false);
          return;
        }
        requestResult("rejected", exportRejection(res.status));
        const failedJob: RenderJob = {
          id: generateId(),
          status: "failed",
          progress: 0,
          error: await readServerError(res),
          filename: "Export failed",
          createdAt: startTime,
        };
        addSessionJob(failedJob, settings);
        return;
      }
      const { jobId } = await res.json();
      if (typeof jobId === "string" && jobId) {
        requestResult("accepted");
        trackedExports.current.set(jobId, { exportId, settings: tracked });
      } else requestResult("rejected", "INVALID_RESPONSE");

      const FORMAT_EXT: Record<string, string> = {
        mp4: ".mp4",
        webm: ".webm",
        mov: ".mov",
        gif: ".gif",
      };
      const ext = FORMAT_EXT[format] ?? ".mp4";
      const job: RenderJob = {
        id: jobId,
        status: "rendering",
        progress: 0,
        filename: `${jobId}${ext}`,
        createdAt: startTime,
      };
      addSessionJob(job, settings);
      activeJobRef.current = jobId;

      // Track progress via SSE
      const es = new EventSource(studioProjectUrl(`/api/render/${jobId}/progress`, projectId));
      eventSourceRef.current = es;

      es.addEventListener("progress", (event) => {
        try {
          const data = JSON.parse(event.data);
          const terminal =
            data.status === "complete" || data.status === "failed" || data.status === "cancelled";
          setJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    progress: data.progress ?? j.progress,
                    stage: data.stage ?? data.message ?? j.stage,
                    status: terminal ? (data.status as RenderJob["status"]) : j.status,
                    durationMs: data.status === "complete" ? Date.now() - startTime : undefined,
                    error: data.error ?? j.error,
                  }
                : j,
            ),
          );
          if (terminal) {
            closeActiveEventSource(jobId);
          }
        } catch {
          // ignore parse errors
        }
      });

      es.onerror = () => {
        es.close();
        const lost = trackedExports.current.get(jobId);
        if (lost) lost.lost = true;
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId && j.status === "rendering"
              ? {
                  ...j,
                  status: "failed" as const,
                  error: "Connection lost. Is the render server running?",
                }
              : j,
          ),
        );
        activeJobRef.current = null;
      };

      return jobId;
    },
    [projectId, activeCompPathRef, closeActiveEventSource, addSessionJob, ffmpeg, ffmpegMissing, recheckFfmpeg, emptyComposition],
  );

  // Cancel an in-flight render. The job row stays (as "cancelled") so the
  // user sees the outcome; the SSE stream is closed either way.
  const cancelRender = useCallback(
    async (jobId: string) => {
      setActionError(null);
      cancelling.current.add(jobId);
      closeActiveEventSource(jobId);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId && j.status === "rendering" ? { ...j, status: "cancelled" } : j,
        ),
      );
      try {
        const res = await studioApiFetch(`/api/render/${jobId}/cancel`, { method: "POST" });
        if (!res.ok && res.status !== 404) {
          unconfirmedCancels.current.add(jobId);
          setActionError("Couldn't cancel on the server. The render may still be running.");
          return;
        }
        // Reconcile with the status the route reports: if the render actually
        // finished (or failed) before the cancel landed, don't leave the row
        // stuck on the optimistic "cancelled" — reload to pick up the real
        // outcome (and the finished file's metadata).
        if (res.ok) {
          const body = (await res.json().catch(() => null)) as { status?: string } | null;
          if (body?.status && body.status !== "cancelled") {
            if (body.status === "complete") settledBeforeCancel.current.set(jobId, "completed");
            else if (body.status === "failed") settledBeforeCancel.current.set(jobId, "failed");
            await loadRenders();
          }
        }
      } catch {
        unconfirmedCancels.current.add(jobId);
        setActionError("Couldn't reach the server to cancel. The render may still be running.");
      } finally {
        cancelling.current.delete(jobId);
        setCancelSettled((n) => n + 1);
      }
    },
    [closeActiveEventSource, loadRenders],
  );

  const deleteRender = useCallback(
    async (jobId: string) => {
      setActionError(null);
      closeActiveEventSource(jobId);
      try {
        const res = await studioApiFetch(`/api/render/${jobId}`, { method: "DELETE" });
        if (!res.ok) {
          setActionError("Couldn't delete the render. It's still on disk.");
          return;
        }
      } catch {
        setActionError("Couldn't reach the server to delete the render.");
        return;
      }
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    },
    [closeActiveEventSource],
  );

  // Hide finished rows from the list (view-only — files stay on disk and can
  // be recovered from the renders/ directory). Remembered per project so the
  // rows don't resurrect from history on reload.
  const clearCompleted = useCallback(() => {
    setJobs((prev) => {
      const finished = prev.filter((j) => j.status !== "rendering");
      if (projectId && finished.length > 0) {
        const hidden = readHiddenIds(projectId);
        for (const j of finished) hidden.add(j.id);
        writeHiddenIds(projectId, hidden);
      }
      return prev.filter((j) => j.status === "rendering");
    });
  }, [projectId]);

  const dismissActionError = useCallback(() => setActionError(null), []);

  // Ask for feedback the moment a render this tab started reaches its outcome.
  // Watching the list (rather than each of the four places a job can finish)
  // keeps one trigger for every path, including SSE drops and cancels-that-
  // finished-anyway. `requestStudioFeedback` decides whether to actually ask.
  useEffect(() => {
    // The terminal state this tab observed, once per accepted render. Rows loaded
    // from disk history and rows for refused starts were never tracked here.
    for (const job of jobs) {
      const started = job.status === "rendering" ? undefined : trackedExports.current.get(job.id);
      if (!started) continue;
      if (job.status === "cancelled" && cancelling.current.has(job.id)) continue;
      trackedExports.current.delete(job.id);
      if (unconfirmedCancels.current.delete(job.id)) continue;
      const reconciled = settledBeforeCancel.current.get(job.id);
      settledBeforeCancel.current.delete(job.id);
      reportExportResult({
        export_id: started.exportId,
        job_state: reconciled ?? (job.status === "complete" ? "completed" : job.status === "cancelled" ? "cancelled" : "failed"),
        duration_ms: Math.min(86_400_000, Math.max(0, Math.round(job.durationMs ?? Date.now() - job.createdAt))),
        ...started.settings,
        ...((reconciled ?? job.status) === "failed"
          ? { error_code: started.lost ? ("CONNECTION_LOST" as const) : ("RENDER_FAILED" as const) }
          : {}),
        ...projectFields(projectId),
      });
    }
    for (const job of jobs) {
      if (job.status === "rendering" || job.status === "cancelled") continue;
      const settings = sessionJobs.current.get(job.id);
      if (!settings || promptedJobIds.current.has(job.id)) continue;
      promptedJobIds.current.add(job.id);
      requestStudioFeedback({
        reason: job.status === "complete" ? "render_complete" : "render_failed",
        renderId: job.id,
        detail: job.error,
        context: {
          ...settings,
          // How far it got and how long it took separate "died on frame one"
          // from "died during encode", which need different fixes.
          render_progress: job.progress,
          render_duration_ms: job.durationMs ?? Date.now() - job.createdAt,
          render_stage: job.stage,
          render_error: job.error,
          // Earlier renders this session: a first-render failure and a
          // failure after nine successes are different bugs.
          renders_this_session: sessionJobs.current.size,
        },
      });
    }
  }, [jobs, projectId, cancelSettled]);

  // Clean up EventSource on unmount or projectId change
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      trackedExports.current.clear();
    };
  }, [projectId]);

  const isRendering = jobs.some((j) => j.status === "rendering");
  return useMemo(
    () => ({
      jobs,
      isRendering,
      loadError,
      actionError,
      dismissActionError,
      reloadRenders: loadRenders,
      deleteRender,
      cancelRender,
      clearCompleted,
      startRender: startRender as (options: unknown) => Promise<void>,
      // Every Export control reads these, so no caller has to decide for
      // itself whether this machine can encode.
      ffmpeg,
      ffmpegMissing,
      emptyComposition,
      ffmpegChecking,
      recheckFfmpeg,
    }),
    [
      jobs,
      isRendering,
      loadError,
      actionError,
      dismissActionError,
      loadRenders,
      deleteRender,
      cancelRender,
      clearCompleted,
      startRender,
      ffmpeg,
      ffmpegMissing,
      emptyComposition,
      ffmpegChecking,
      recheckFfmpeg,
    ],
  );
}
