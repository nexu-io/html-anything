#!/bin/bash
# Optional developer fallback; ordinary use goes through openmotion_open_preview.
set -euo pipefail
openmotion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
openmotion_installed="$(node "$openmotion_root/scripts/resolve-installed.mjs" "$openmotion_root")"
openmotion_ffmpeg="${FFMPEG_PATH:-}"
if [ -z "$openmotion_ffmpeg" ] && [ -x "$openmotion_root/.tools/ffmpeg" ]; then openmotion_ffmpeg="$openmotion_root/.tools/ffmpeg"; fi
if [ -z "$openmotion_ffmpeg" ]; then openmotion_ffmpeg="$(command -v ffmpeg || true)"; fi
FFMPEG_PATH="$openmotion_ffmpeg" node --experimental-strip-types "$openmotion_installed/preview.ts"
