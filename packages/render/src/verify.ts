import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { type Specification, specification, type Verification } from "./jobs/contract.js";

function run(command: string, args: string[], signal?: AbortSignal) {
  return new Promise<string>((resolve, reject) =>
    execFile(
      command,
      args,
      {
        signal,
        timeout: 180000,
        maxBuffer: 2 * 1024 ** 2,
        encoding: "utf8",
        windowsHide: true,
      },
      (error, stdout, stderr) =>
        error ? reject(Error(`export verification failed: ${stderr.slice(-2000)}`, { cause: error })) : resolve(stdout),
    ),
  );
}
export async function verify(
  path: string,
  expected: Specification,
  tools: { ffmpeg: string; ffprobe: string },
  signal?: AbortSignal,
): Promise<Verification> {
  const spec = specification.parse(expected),
    rate = spec.fps.num / spec.fps.den,
    probe = JSON.parse(
      await run(tools.ffprobe, ["-v", "error", "-show_streams", "-show_format", "-of", "json", path], signal),
    ),
    videos = probe.streams.filter((s: { codec_type: string }) => s.codec_type === "video"),
    audio = probe.streams.filter((s: { codec_type: string }) => s.codec_type === "audio"),
    video = videos[0],
    ratio = String(video?.avg_frame_rate).split("/").map(Number),
    duration = Number(probe.format?.duration),
    info = await stat(path);
  if (
    !info.isFile() ||
    !info.size ||
    videos.length !== 1 ||
    video.codec_name !== "h264" ||
    video.pix_fmt !== "yuv420p" ||
    video.width !== spec.width ||
    video.height !== spec.height ||
    Math.abs(ratio[0]! / ratio[1]! - rate) > 0.0001 ||
    !Number.isFinite(duration) ||
    Math.abs(duration - spec.frames / rate) > Math.max(0.05, 1 / rate) ||
    !String(probe.format?.format_name).split(",").includes("mp4") ||
    audio.length !== (spec.audio === "required" ? 1 : 0) ||
    audio.some((s: { codec_name: string }) => s.codec_name !== "aac")
  )
    throw Error("encoded output does not match the fixed input specification");
  const decode = await run(
      tools.ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-err_detect",
        "explode",
        "-i",
        path,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-progress",
        "pipe:1",
        "-f",
        "null",
        "-",
      ],
      signal,
    ),
    frames = Number([...decode.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1]);
  if (frames !== spec.frames) throw Error("decoded output frame count differs from the fixed input");
  const seek = [0, spec.frames / rate / 2, Math.max(0, (spec.frames - 1) / rate)];
  for (const time of seek) {
    const decoded = await run(
      tools.ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-ss",
        String(time),
        "-i",
        path,
        "-map",
        "0:v:0",
        "-frames:v",
        "1",
        "-progress",
        "pipe:1",
        "-f",
        "null",
        "-",
      ],
      signal,
    );
    if (Number([...decoded.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1]) !== 1)
      throw Error("export seek did not decode a frame");
  }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) {
    signal?.throwIfAborted();
    hash.update(chunk);
  }
  return { digest: `sha256:${hash.digest("hex")}`, bytes: info.size, frames, duration, audio: !!audio.length, seek };
}
