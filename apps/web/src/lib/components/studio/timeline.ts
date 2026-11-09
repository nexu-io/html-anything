import { badge, button, note, timeTracks } from "@open-motion/components";
import type { Clip } from "@open-motion/motion/contract";
import { timeAtProgress } from "@open-motion/motion/protocol";
export function studioTimeline(
  document: Document,
  options: {
    clips: Clip[];
    selected: string;
    blocked: boolean;
    time: number;
    duration: number | null;
    root: HTMLElement;
    actions: HTMLElement;
    canUndo: boolean;
    canRedo: boolean;
    undo(): void;
    redo(): void;
    choose(id: string): void;
    seek(time: number): void;
    retime(id: string, time: number): void;
    commit(id: string, start: number, duration: number): void;
  },
) {
  const focus = document.activeElement?.closest("[data-keyframe-focus],[data-clip-id]");
  const focusKey = focus?.getAttribute("data-keyframe-focus"),
    focusClip = focus?.getAttribute("data-clip-id");
  const tracks = options.clips.filter(
    (c) => !c.composition && c.start !== null && c.duration !== null && Number.isFinite(c.start + c.duration),
  );
  const length =
    options.duration ??
    Math.max(1, ...options.clips.map((c) => (c.composition ? (c.duration ?? 0) : (c.start ?? 0) + (c.duration ?? 0))));
  const axis = timeTracks(document, {
    duration: length,
    disabled: options.blocked,
    tracks: tracks.map((c) => ({
      id: c.id,
      label: c.text || c.tag,
      start: c.start ?? 0,
      duration: c.duration ?? 1,
      selected: c.id === options.selected,
      lanes: c.animations
        .filter((a) => !a.reason)
        .map((a) => ({
          id: a.id,
          label: a.property ?? "动画",
          keys: a.frames.map((f, i) => ({
            id: JSON.stringify({ animationId: a.id, percentage: f.percentage, elementId: c.id }),
            focus: JSON.stringify([c.id, a.property, i]),
            time: (a.start ?? 0) + ((a.duration ?? 0) * timeAtProgress(a.ease, f.percentage)) / 100,
            range: {
              start:
                i === 0
                  ? (c.start ?? 0)
                  : (a.start ?? 0) +
                    ((a.duration ?? 0) * timeAtProgress(a.ease, a.frames[i - 1]?.percentage ?? 0)) / 100 +
                    0.001,
              end:
                i === a.frames.length - 1
                  ? (c.start ?? 0) + (c.duration ?? 0)
                  : (a.start ?? 0) +
                    ((a.duration ?? 0) * timeAtProgress(a.ease, a.frames[i + 1]?.percentage ?? 100)) / 100 -
                    0.001,
            },
            label: `${a.property} ${f.percentage}%`,
          })),
        })),
    })),
    select: options.choose,
    seek: options.seek,
    retime: options.retime,
    commit: options.commit,
  });
  axis.resize(options.root.clientWidth);
  axis.time(options.time);
  options.actions.replaceChildren(
    badge(document, "时间轴长度", `${length.toFixed(2)}s`),
    button(document, {
      label: "时间轴撤销",
      icon: "undo",
      iconOnly: true,
      variant: "ghost",
      disabled: options.blocked || !options.canUndo,
      onClick: options.undo,
    }),
    button(document, {
      label: "时间轴重做",
      icon: "redo",
      iconOnly: true,
      variant: "ghost",
      disabled: options.blocked || !options.canRedo,
      onClick: options.redo,
    }),
  );
  options.root.replaceChildren(
    tracks.length ? axis.element : note(document, "添加文本，或为图层声明开始秒与持续秒。"),
    note(
      document,
      "拖动移动片段，右侧手柄调整长度；方向键微调，Shift 为 1 秒，Alt 调整长度。菱形点击定位、拖动或方向键调整关键帧，Escape 取消拖动。",
    ),
  );
  const selector = focusKey ? "[data-keyframe-focus]" : "[data-clip-id]",
    value = focusKey ?? focusClip;
  if (value)
    [...options.root.querySelectorAll<SVGElement>(selector)]
      .find((e) => e.getAttribute(focusKey ? "data-keyframe-focus" : "data-clip-id") === value)
      ?.focus();
  return axis;
}
