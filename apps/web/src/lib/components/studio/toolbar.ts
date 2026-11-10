import { badge, button, field, numberField, setButtonSelected, slot } from "@open-motion/components";
/** One transport view per Studio; playback updates never replace an active seek input. */
export function playerControls(
  document: Document,
  options: {
    time: HTMLOutputElement;
    control(action: "play" | "pause" | "seek", time?: number): void;
  },
) {
  const seek = numberField(document, { label: "定位秒", min: 0, unit: "s", change: () => {} }),
    element = slot(document, "toolbar"),
    controls: HTMLButtonElement[] = [];
  let owner = "";
  for (const action of ["play", "pause"] as const) {
    const control = button(document, {
      label: action === "play" ? "播放" : "暂停",
      icon: action,
      iconOnly: true,
      variant: "ghost",
      compact: true,
      onClick: () => options.control(action),
    });
    controls.push(control);
    element.append(control);
  }
  const locate = button(document, {
    label: "定位",
    variant: "ghost",
    compact: true,
    onClick: () => {
      seek.validate();
      options.control("seek", seek.input.valueAsNumber);
    },
  });
  controls.push(locate);
  element.append(field(document, "定位秒", seek.element, true, true), locate, options.time);
  return {
    element,
    update(identity: string, blocked: boolean, ready: boolean) {
      if (identity !== owner) {
        seek.value(0, true);
        owner = identity;
      }
      seek.readonly(blocked || !ready);
      for (const control of controls) control.disabled = blocked || !ready;
    },
  };
}
export function studioTools(
  document: Document,
  options: {
    title: string;
    file: string;
    mode: "source" | "preview";
    blocked: boolean;
    setMode(mode: "source" | "preview"): void;
    add(): void;
    open(): void;
    close(): void;
  },
) {
  const context = slot(document, "spread"),
    title = slot(document, "title"),
    file = slot(document, "title"),
    controls = slot(document, "spread"),
    tools = slot(document, "toolbar");
  title.textContent = options.title;
  file.textContent = options.file === "index.html" ? "主合成 / index.html" : `局部合成 / ${options.file}`;
  context.append(title, badge(document, "编辑器类型", "Motion"));
  for (const mode of ["preview", "source"] as const) {
    const control = button(document, {
      label: mode === "preview" ? "预览" : "源码",
      icon: mode === "preview" ? "eye" : "code",
      variant: "tab",
      compact: true,
      selected: options.mode === mode,
      onClick: () => options.setMode(mode),
    });
    control.dataset.mode = mode;
    tools.append(control);
  }
  tools.append(
    button(document, {
      label: "添加文本",
      icon: "text",
      variant: "ghost",
      compact: true,
      disabled: options.blocked,
      onClick: options.add,
    }),
    button(document, {
      label: "打开预览",
      icon: "refresh",
      iconOnly: true,
      variant: "ghost",
      disabled: options.blocked,
      onClick: options.open,
    }),
    button(document, {
      label: "关闭预览",
      icon: "close",
      iconOnly: true,
      variant: "ghost",
      onClick: options.close,
    }),
  );
  controls.append(file, tools);
  return [context, controls];
}

/** Mode chrome is presentation state even while source changes invalidate the native model. */
export function syncMode(root: HTMLElement, mode: "preview" | "source") {
  for (const control of root.querySelectorAll<HTMLButtonElement>("[data-mode]"))
    setButtonSelected(control, control.dataset.mode === mode);
}
