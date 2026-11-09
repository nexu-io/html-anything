import { gsap } from "gsap";
import type { Ease } from "../contract.js";
/** Closed monotone GSAP eases. Percentage is tween progress, not elapsed time. */
export function progressAtTime(ease: Ease | undefined, time: number): number {
  const p = Math.max(0, Math.min(100, time)) / 100;
  return ease ? gsap.parseEase(ease)(p) * 100 : p * 100;
}
export function timeAtProgress(ease: Ease | undefined, percentage: number): number {
  if (!ease || ease === "none" || percentage <= 0 || percentage >= 100) return percentage;
  let low = 0,
    high = 100;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (progressAtTime(ease, mid) < percentage) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
/** Preserve every other key's absolute time when an endpoint resizes the tween window. */
export function retimeWindow(options: {
  start: number;
  duration: number;
  ease?: Ease;
  percentages: number[];
  index: number;
  time: number;
  clipStart: number;
  clipEnd: number;
}) {
  const { start, duration, ease, percentages, index, time, clipStart, clipEnd } = options;
  const times = percentages.map((p) => start + (duration * timeAtProgress(ease, p)) / 100);
  const previous = index === 0 ? clipStart : times[index - 1],
    next = index === times.length - 1 ? clipEnd : times[index + 1];
  if (
    previous === undefined ||
    next === undefined ||
    time < clipStart ||
    time > clipEnd ||
    (index > 0 && time <= previous + 1e-6) ||
    (index < times.length - 1 && time >= next - 1e-6)
  )
    throw new Error("关键帧不能越过相邻帧或图层边界");
  const newStart = index === 0 ? time : start,
    newEnd = index === times.length - 1 ? time : start + duration,
    newDuration = newEnd - newStart;
  if (!(newDuration >= 0.01)) throw new Error("动画时间窗过短");
  const result = times
    .map((t, i) => (i === index ? time : t))
    .map((t) => progressAtTime(ease, ((t - newStart) / newDuration) * 100));
  result[0] = 0;
  result[result.length - 1] = 100;
  return { start: newStart, duration: newDuration, percentages: result };
}
