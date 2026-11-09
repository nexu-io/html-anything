import { mkdir, rename } from "node:fs/promises";
import { join } from "node:path";
import {
  captureFrame,
  closeBrowserPool,
  closeCaptureSession,
  createCaptureSession,
  encodeFramesFromDir,
  initializeSession,
  MIXED_AUDIO_FILENAME,
  muxVideoWithAudio,
  parseAudioElements,
  parseMasterFxChain,
  processCompositionAudio,
  setHostHandlesSigint,
} from "@hyperframes/engine";
import type { Progress, Specification } from "./contract.js";

export async function encode(options: {
  origin: string;
  view: string;
  html: string;
  scratch: string;
  output: string;
  browser: string;
  spec: Specification;
  signal: AbortSignal;
  progress(phase: Progress): Promise<void>;
}) {
  const { spec, signal } = options,
    frames = join(options.scratch, "frames");
  await mkdir(frames);
  setHostHandlesSigint(true);
  await options.progress("capturing");
  const session = await createCaptureSession(
    options.origin,
    frames,
    {
      width: spec.width,
      height: spec.height,
      fps: spec.fps,
      format: "png",
      compositionDurationSeconds: spec.duration,
    },
    null,
    {
      chromePath: options.browser,
      expectedChromiumMajor: 156,
      forceScreenshot: true,
      browserGpuMode: "software",
      enableBrowserPool: false,
      useDrawElement: false,
      staticFrameDedup: false,
      videoLayerPassthrough: false,
      concurrency: 1,
      browserTimeout: 60000,
      protocolTimeout: 60000,
      playerReadyTimeout: 10000,
      renderReadyTimeout: 10000,
      extractCacheDir: join(options.scratch, "extract-cache"),
    },
  );
  try {
    await initializeSession(session);
    for (let frame = 0; frame < spec.frames; frame++) {
      signal.throwIfAborted();
      await captureFrame(session, frame, (frame * spec.fps.den) / spec.fps.num);
    }
  } finally {
    await closeCaptureSession(session);
    await closeBrowserPool();
  }
  signal.throwIfAborted();
  await options.progress("encoding");
  const video = join(options.scratch, "video.mp4"),
    result = await encodeFramesFromDir(
      frames,
      "frame_%06d.png",
      video,
      {
        width: spec.width,
        height: spec.height,
        fps: spec.fps,
        codec: "h264",
        pixelFormat: "yuv420p",
        preset: "fast",
        useGpu: false,
      },
      signal,
      { ffmpegEncodeTimeout: 180000 },
    );
  if (!result.success) throw Error(`video encoding failed: ${result.error}`);
  const tracks = parseAudioElements(options.html);
  if (spec.audio === "required") {
    const audio = join(options.scratch, MIXED_AUDIO_FILENAME),
      mixed = await processCompositionAudio(
        tracks,
        options.view,
        join(options.scratch, "audio-work"),
        audio,
        (spec.frames * spec.fps.den) / spec.fps.num,
        signal,
        { ffmpegProcessTimeout: 180000, masterFxChain: parseMasterFxChain(options.html) },
        options.view,
      );
    if (!mixed.success || !mixed.tracksProcessed) throw Error(`audio mixing failed: ${mixed.error}`);
    const muxed = await muxVideoWithAudio(
      video,
      audio,
      options.output,
      signal,
      { audioCodec: "aac", ffmpegProcessTimeout: 180000 },
      spec.fps,
    );
    if (!muxed.success) throw Error(`audio/video mux failed: ${muxed.error}`);
  } else await rename(video, options.output);
}
