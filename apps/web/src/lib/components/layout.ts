import { pane, panelGrid, railLayout, slot, splitLayout } from "@open-motion/components";
export function workspaceLayout(document: Document) {
  const shell = railLayout(document),
    split = splitLayout(document),
    header = slot(document, "header");
  const label = (element: HTMLElement, role: string, name: string) => {
    element.setAttribute("role", role);
    element.setAttribute("aria-label", name);
  };
  label(shell.rail, "complementary", "工作区导航");
  label(split.start, "complementary", "会话");
  label(split.end, "region", "编辑工作区");
  label(header, "toolbar", "工程工具栏");
  split.end.append(header);
  shell.body.append(split.element);
  return {
    element: shell.element,
    navigation: shell.rail,
    conversation: split.start,
    editor: split.end,
    header,
    showNavigation: (visible: boolean) => shell.showRail(visible),
    showConversation: (visible: boolean) => split.showStart(visible),
  };
}
/** Product registration and placement. Atoms own only anonymous grid cells and panel surfaces. */
export function studioLayout(document: Document) {
  const grid = panelGrid(document),
    registry = {
      library: { label: "资源", symbol: "folder", cell: grid.leading, region: "图层与文件" },
      canvas: { label: "预览", symbol: "eye", cell: grid.body, region: "画布与源码" },
      inspector: { label: "属性", symbol: "layers", cell: grid.trailing, region: "属性" },
      timeline: { label: "时间轴", symbol: "clock", cell: grid.footer, region: "时间轴" },
    } as const;
  const mount = (name: keyof typeof registry) => {
    const definition = registry[name],
      view = pane(document, definition.label, definition.symbol);
    definition.cell.setAttribute("role", "region");
    definition.cell.setAttribute("aria-label", definition.region);
    definition.cell.append(view.element);
    return view;
  };
  return {
    element: grid.element,
    library: mount("library"),
    canvas: mount("canvas"),
    inspector: mount("inspector"),
    timeline: mount("timeline"),
  };
}
