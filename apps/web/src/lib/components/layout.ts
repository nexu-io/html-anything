import { pane, panelGrid, railLayout, slot } from "@open-motion/components";
export function workspaceLayout(document: Document) {
  const shell = railLayout(document),
    header = slot(document, "header");
  shell.showRail(false);
  shell.body.setAttribute("role", "region");
  shell.body.setAttribute("aria-label", "编辑工作区");
  header.setAttribute("role", "toolbar");
  header.setAttribute("aria-label", "项目工具栏");
  shell.body.append(header);
  return { element: shell.element, editor: shell.body, header };
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
