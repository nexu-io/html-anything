export interface TimeTrack {
  id: string;
  label: string;
  start: number;
  duration: number;
  selected: boolean;
  kind?: string;
  readonly?: boolean;
  maximum?: number;
  lanes?: {
    id: string;
    label: string;
    keys: { id: string; focus: string; time: number; label: string; range?: { start: number; end: number } }[];
  }[];
}
/** Numeric SVG coordinates describe temporal content, never CSS or product persistence. */
export function timeTracks(
  document: Document,
  options: {
    duration: number;
    tracks: TimeTrack[];
    disabled: boolean;
    select(id: string): void;
    seek(time: number): void;
    retime?(id: string, time: number): void;
    commit(id: string, start: number, duration: number): void;
  },
) {
  let disabled = options.disabled,
    width = 1000,
    cursor = 0;
  const measurements: (() => void)[] = [];
  const element = document.createElement("div");
  element.className = "om-time";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    sizes = options.tracks.map((t) => 48 + (t.lanes?.length ?? 0) * 24),
    height = 40 + sizes.reduce((sum, n) => sum + n, 0),
    duration = Math.max(1, options.duration),
    coordinate = (time: number) => 160 + (time / duration) * (width - 180);
  svg.classList.add("om-time__surface");
  svg.setAttribute("viewBox", `0 0 ${width} ${Math.max(100, height)}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "原生时间轴轨道");
  const ruler = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  ruler.classList.add("om-time__ruler");
  ruler.setAttribute("x", "160");
  ruler.setAttribute("y", "0");
  ruler.setAttribute("width", "820");
  ruler.setAttribute("height", "30");
  ruler.addEventListener("pointerdown", (event) => {
    if (disabled) return;
    const rect = svg.getBoundingClientRect();
    options.seek(
      Math.max(
        0,
        Math.min(duration, ((((event.clientX - rect.left) / rect.width) * width - 160) / (width - 180)) * duration),
      ),
    );
  });
  svg.append(ruler);
  for (let i = 0; i <= 10; i++) {
    const tick = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tick.classList.add("om-time__tick");
    if (i === 10) tick.classList.add("om-time__tick--end");
    tick.setAttribute("x", String(coordinate((i / 10) * duration)));
    tick.setAttribute("y", "20");
    tick.textContent = `${((i / 10) * duration).toFixed(1)}s`;
    const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
    grid.classList.add("om-time__grid");
    grid.setAttribute("x1", String(coordinate((i / 10) * duration)));
    grid.setAttribute("x2", String(coordinate((i / 10) * duration)));
    grid.setAttribute("y1", "30");
    grid.setAttribute("y2", String(Math.max(100, height)));
    measurements.push(() => {
      const x = String(coordinate((i / 10) * duration));
      tick.setAttribute("x", x);
      grid.setAttribute("x1", x);
      grid.setAttribute("x2", x);
    });
    svg.append(grid, tick);
  }
  let rowTop = 36;
  options.tracks.forEach((track, index) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g"),
      label = document.createElementNS("http://www.w3.org/2000/svg", "text"),
      bar = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
      handle = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
      heading = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
      caption = document.createElementNS("http://www.w3.org/2000/svg", "text"),
      kind = document.createElementNS("http://www.w3.org/2000/svg", "text"),
      y = rowTop;
    rowTop += sizes[index] ?? 48;
    group.classList.add("om-time__track");
    if (track.selected) group.classList.add("om-time__track--selected");
    group.setAttribute("tabindex", disabled ? "-1" : "0");
    group.setAttribute("role", "button");
    group.setAttribute("aria-label", `${track.label} ${track.start.toFixed(2)}秒 / ${track.duration.toFixed(2)}秒`);
    group.setAttribute("data-clip-id", track.id);
    group.setAttribute("aria-description", track.readonly ? "只读时间窗口" : "可编辑时间窗口");
    label.classList.add("om-time__label");
    label.setAttribute("x", "8");
    label.setAttribute("y", String(y + 26));
    label.textContent = track.label.length > 20 ? `${track.label.slice(0, 19)}…` : track.label;
    bar.classList.add("om-time__bar");
    bar.setAttribute("x", String(coordinate(track.start)));
    bar.setAttribute("y", String(y));
    bar.setAttribute("width", String(Math.max(6, (track.duration / duration) * (width - 180))));
    bar.setAttribute("height", "40");
    bar.setAttribute("rx", "4");
    handle.classList.add("om-time__handle");
    handle.setAttribute("x", String(coordinate(track.start + track.duration) - 8));
    handle.setAttribute("y", String(y));
    handle.setAttribute("width", "8");
    handle.setAttribute("height", "40");
    const limitStart = (value: number) => Math.max(0, Math.min(duration - track.duration, value)),
      limitDuration = (value: number) =>
        Math.max(
          Math.min(0.1, duration - track.start, track.maximum ?? Number.POSITIVE_INFINITY),
          Math.min(duration - track.start, track.maximum ?? Number.POSITIVE_INFINITY, value),
        );
    let drag: { x: number; resize: boolean; value: number } | undefined;
    heading.classList.add("om-time__heading");
    kind.classList.add("om-time__kind");
    caption.classList.add("om-time__caption");
    heading.setAttribute("y", String(y));
    heading.setAttribute("height", "14");
    heading.setAttribute("rx", "4");
    kind.setAttribute("y", String(y + 11));
    kind.textContent = track.kind ?? "T · 文本";
    caption.setAttribute("y", String(y + 30));
    const place = (start: number, span: number) => {
      const x = coordinate(start),
        extent = Math.max(6, (span / duration) * (width - 180));
      bar.setAttribute("x", String(x));
      bar.setAttribute("width", String(extent));
      heading.setAttribute("x", String(x));
      heading.setAttribute("width", String(extent));
      kind.setAttribute("x", String(x + 6));
      caption.setAttribute("x", String(x + 6));
      const count = Math.max(0, Math.floor(extent / 7) - 2);
      caption.textContent =
        track.label.length > count ? `${track.label.slice(0, Math.max(0, count - 1))}…` : track.label;
      handle.setAttribute("x", String(coordinate(start + span) - 8));
    };
    const restore = () => place(track.start, track.duration);
    measurements.push(() => {
      drag = undefined;
      restore();
    });
    restore();
    group.addEventListener("pointerdown", (event) => {
      if (disabled || event.button !== 0) return;
      if (track.readonly) {
        options.select(track.id);
        return;
      }
      event.preventDefault();
      group.focus();
      group.setPointerCapture(event.pointerId);
      drag = {
        x: event.clientX,
        resize: event.target === handle,
        value: event.target === handle ? track.duration : track.start,
      };
    });
    group.addEventListener("pointermove", (event) => {
      if (disabled) {
        drag = undefined;
        restore();
        return;
      }
      if (!drag) return;
      const delta =
        ((((event.clientX - drag.x) / svg.getBoundingClientRect().width) * width) / (width - 180)) * duration;
      drag.value = drag.resize
        ? limitDuration(Math.round((track.duration + delta) * 10) / 10)
        : limitStart(Math.round((track.start + delta) * 10) / 10);
      place(drag.resize ? track.start : drag.value, drag.resize ? drag.value : track.duration);
    });
    group.addEventListener("pointerup", (event) => {
      if (disabled) {
        drag = undefined;
        restore();
        return;
      }
      if (!drag) return;
      const chosen = drag;
      drag = undefined;
      restore();
      if (Math.abs(event.clientX - chosen.x) < 3) options.select(track.id);
      else
        options.commit(
          track.id,
          chosen.resize ? track.start : chosen.value,
          chosen.resize ? chosen.value : track.duration,
        );
    });
    group.addEventListener("lostpointercapture", () => {
      drag = undefined;
      restore();
    });
    group.addEventListener("keydown", (event) => {
      if (disabled) return;
      if (event.key === "Enter") {
        event.preventDefault();
        options.select(track.id);
      }
      if (!track.readonly && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        const delta = (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1);
        options.commit(
          track.id,
          event.altKey ? track.start : limitStart(Math.round((track.start + delta) * 10) / 10),
          event.altKey ? limitDuration(Math.round((track.duration + delta) * 10) / 10) : track.duration,
        );
      }
      if (event.key === "Escape") {
        drag = undefined;
        restore();
      }
    });
    group.append(label, bar, heading, kind, caption, handle);
    svg.append(group);
    for (const [laneIndex, lane] of (track.lanes ?? []).entries()) {
      const laneLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      laneLabel.classList.add("om-time__label");
      laneLabel.setAttribute("x", "20");
      laneLabel.setAttribute("y", String(y + 48 + laneIndex * 24 + 10));
      laneLabel.setAttribute("data-lane-id", lane.id);
      laneLabel.textContent = lane.label;
      svg.append(laneLabel);
      for (const frame of lane.keys) {
        const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        diamond.classList.add("om-time__key");
        diamond.setAttribute("role", "button");
        diamond.setAttribute("tabindex", disabled ? "-1" : "0");
        diamond.setAttribute("aria-label", frame.label);
        diamond.setAttribute("data-keyframe-id", frame.id);
        diamond.setAttribute("data-keyframe-focus", frame.focus);
        const place = (time = frame.time) => {
          const x = coordinate(time),
            center = y + 48 + laneIndex * 24 + 6;
          diamond.setAttribute("points", `${x},${center - 5} ${x + 5},${center} ${x},${center + 5} ${x - 5},${center}`);
        };
        let dragKey: { x: number; time: number } | undefined,
          suppressClick = false;
        const bound = (time: number) =>
          Math.max(frame.range?.start ?? frame.time, Math.min(frame.range?.end ?? frame.time, time));
        measurements.push(() => {
          dragKey = undefined;
          place();
        });
        place();
        diamond.addEventListener("pointerdown", (event) => {
          if (disabled || event.button !== 0 || !frame.range || !options.retime) return;
          event.preventDefault();
          diamond.focus();
          diamond.setPointerCapture(event.pointerId);
          suppressClick = false;
          dragKey = { x: event.clientX, time: frame.time };
        });
        diamond.addEventListener("pointermove", (event) => {
          if (!dragKey) return;
          if (disabled) {
            dragKey = undefined;
            place();
            return;
          }
          dragKey.time = bound(
            frame.time +
              ((((event.clientX - dragKey.x) / svg.getBoundingClientRect().width) * width) / (width - 180)) * duration,
          );
          place(dragKey.time);
        });
        diamond.addEventListener("pointerup", (event) => {
          if (!dragKey) return;
          const candidate = dragKey;
          dragKey = undefined;
          place();
          suppressClick = Math.abs(event.clientX - candidate.x) >= 3;
          if (!disabled && suppressClick && Math.abs(candidate.time - frame.time) > 1e-5)
            options.retime?.(frame.id, candidate.time);
        });
        diamond.addEventListener("lostpointercapture", () => {
          dragKey = undefined;
          place();
        });
        diamond.addEventListener("click", () => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          if (!disabled) options.seek(frame.time);
        });
        diamond.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
            suppressClick = !!dragKey;
            dragKey = undefined;
            place();
          }
          if (!disabled && frame.range && options.retime && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            const time = bound(frame.time + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1));
            if (Math.abs(time - frame.time) > 1e-5) options.retime(frame.id, time);
          }
          if (!disabled && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            options.seek(frame.time);
          }
        });
        svg.append(diamond);
      }
    }
  });
  const playhead = document.createElementNS("http://www.w3.org/2000/svg", "line");
  playhead.classList.add("om-time__playhead");
  playhead.setAttribute("y1", "0");
  playhead.setAttribute("y2", String(Math.max(100, height)));
  svg.append(playhead);
  element.append(svg);
  return {
    element,
    resize(value: number) {
      if (!Number.isFinite(value) || value <= 0 || value > 16384) return;
      width = Math.max(640, value);
      svg.setAttribute("viewBox", `0 0 ${width} ${Math.max(100, height)}`);
      ruler.setAttribute("width", String(width - 180));
      for (const update of measurements) update();
      playhead.setAttribute("x1", String(coordinate(cursor)));
      playhead.setAttribute("x2", String(coordinate(cursor)));
    },
    disable(value: boolean) {
      disabled = value;
      element.classList.toggle("om-time--disabled", value);
      for (const track of svg.querySelectorAll("[data-clip-id],[data-keyframe-id]")) {
        track.setAttribute("tabindex", value ? "-1" : "0");
        track.setAttribute("aria-disabled", String(value));
      }
    },
    time(value: number) {
      cursor = Math.max(0, Math.min(duration, value));
      const x = coordinate(cursor);
      playhead.setAttribute("x1", String(x));
      playhead.setAttribute("x2", String(x));
    },
  };
}
