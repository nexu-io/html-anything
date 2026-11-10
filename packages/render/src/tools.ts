import { source } from "@odsuite/blob";
import type { Tools } from "./index.js";
/** Finite vendor sources; compressed and materialized identities are pinned independently. */
export function nativeTools(): Tools | undefined {
  if (process.platform !== "darwin" || process.arch !== "arm64") return undefined;
  return {
    browser: (() => {
      const resource = {
        type: "archive",
        platform: "darwin",
        arch: "arm64",
        tree: "sha256:3338448835fd01d307d047775de60a50161bd0a86a04cb3b9101478277fc909c",
        expandedBytes: 213343906,
        artifact: {
          kind: "blob",
          slot: "browser",
          bytes: 103927850,
          digest: "sha256:2fd1c09a3e1ebde9e69e6aba92f1dd3f21ad247b55d9bf66e39213ff4205436d",
        },
      } as const;
      return {
        resource,
        executable: "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        load: source(
          "https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.47/mac-arm64/chrome-headless-shell-mac-arm64.zip",
          resource,
          60000,
        ),
      };
    })(),
    ffmpeg: (() => {
      const resource = {
        type: "archive",
        platform: "darwin",
        arch: "arm64",
        tree: "sha256:5a926034e68650759b6b8c66f294e52813262ba3b55c2cb27c586c08619611c4",
        expandedBytes: 66332880,
        artifact: {
          kind: "blob",
          slot: "ffmpeg",
          bytes: 28395699,
          digest: "sha256:c8ed4c4e6978a03c485edbfe4e0a5dc2380f8a30bba5150531b31b094492d924",
        },
      } as const;
      return {
        resource,
        executable: "ffmpeg",
        load: source(
          "https://ffmpeg.martin-riedl.de/download/macos/arm64/1789931890_9.0.2/ffmpeg.zip",
          resource,
          60000,
        ),
      };
    })(),
    ffprobe: (() => {
      const resource = {
        type: "archive",
        platform: "darwin",
        arch: "arm64",
        tree: "sha256:a53023b72393c2031610c37922864005eb6c4030233be453443ecd8a581516d5",
        expandedBytes: 66158064,
        artifact: {
          kind: "blob",
          slot: "ffprobe",
          bytes: 28317701,
          digest: "sha256:fcbe839537485eaee7a7a8bc5cbc0f90d53617e80943e8a5b2e31cb851197ea6",
        },
      } as const;
      return {
        resource,
        executable: "ffprobe",
        load: source(
          "https://ffmpeg.martin-riedl.de/download/macos/arm64/1789931890_9.0.2/ffprobe.zip",
          resource,
          60000,
        ),
      };
    })(),
  };
}
