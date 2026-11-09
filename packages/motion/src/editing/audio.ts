import type { AudioState } from "../contract.js";
export const numeric = (value: string | undefined) =>
  value === undefined || !value.trim() || !Number.isFinite(Number(value)) ? null : Number(value);
export function audioState(attributes: Readonly<Record<string, string | undefined>>, animated: boolean): AudioState {
  const sourceDuration = numeric(attributes["data-source-duration"]),
    inPoint = numeric(attributes["data-media-start"]),
    rate = numeric(attributes["data-playback-rate"]),
    volume = attributes["data-volume"] === undefined ? 1 : numeric(attributes["data-volume"]),
    duration = numeric(attributes["data-duration"]);
  let reason: string | null = null;
  if (
    !attributes.src ||
    sourceDuration === null ||
    sourceDuration <= 0 ||
    inPoint === null ||
    inPoint < 0 ||
    inPoint >= sourceDuration ||
    duration === null ||
    duration <= 0 ||
    !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test((attributes["data-playback-rate"] ?? "").trim()) ||
    rate === null ||
    rate < 0.1 ||
    rate > 10 ||
    inPoint + duration * rate > sourceDuration + 1e-8 ||
    volume === null ||
    volume < 0 ||
    volume > 1
  )
    reason = "只读：音频需要直接素材引用、有效源长度、入点、窗口、0.1..10 倍率和 0..1 音量";
  else if (
    [
      "data-playback-start",
      "data-automation",
      "data-fx-chain",
      "data-fx-carve",
      "data-audio-group",
      "data-fade-in",
      "data-fade-out",
      "loop",
      "autoplay",
    ].some((name) => attributes[name] !== undefined) ||
    animated
  )
    reason = "渐变速、自动化、效果或宿主脚本音频当前只读";
  return { sourceDuration, inPoint, rate, volume, muted: attributes.muted !== undefined, reason };
}
