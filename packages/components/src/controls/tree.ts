import { type Icon, icon } from "../studio/icons.js";
export interface TreeItem {
  id: string;
  label: string;
  parent: string | null;
  icon: Icon;
}
export function tree(
  document: Document,
  options: { label: string; select(id: string): void; expand(id: string, open: boolean): void },
) {
  const element = document.createElement("div");
  element.className = "om-tree";
  element.setAttribute("role", "tree");
  element.setAttribute("aria-label", options.label);
  element.tabIndex = 0;
  let nodes: TreeItem[] = [],
    expanded = new Set<string>(),
    focus = "",
    selected = "",
    disabled = false;
  const ids = new Map<string, string>();
  const visible = () =>
    nodes.filter((item) => {
      const visited = new Set<string>();
      let parent = item.parent;
      while (parent) {
        if (visited.has(parent)) return false;
        visited.add(parent);
        if (!expanded.has(parent)) return false;
        parent = nodes.find((n) => n.id === parent)?.parent ?? null;
      }
      return true;
    });
  const render = () => {
    const rows = visible();
    if (!rows.some((n) => n.id === focus)) focus = rows.find((n) => n.id === selected)?.id ?? rows[0]?.id ?? "";
    const body = rows.map((item) => {
      const row = document.createElement("div"),
        label = document.createElement("span"),
        toggle = document.createElement("span");
      if (!ids.has(item.id)) ids.set(item.id, `tree-${document.defaultView?.crypto.randomUUID()}`);
      row.id = ids.get(item.id) ?? "";
      row.className = item.id === selected ? "om-tree__row om-tree__row--selected" : "om-tree__row";
      row.setAttribute("role", "treeitem");
      row.setAttribute("aria-selected", String(item.id === selected));
      row.setAttribute("aria-label", item.label);
      let depth = 1,
        parent = item.parent;
      const visited = new Set<string>();
      while (parent && !visited.has(parent)) {
        visited.add(parent);
        depth++;
        parent = nodes.find((n) => n.id === parent)?.parent ?? null;
      }
      row.setAttribute("aria-level", String(depth));
      for (let i = 1; i < depth; i++) {
        const indent = document.createElement("span");
        indent.className = "om-tree__indent";
        row.append(indent);
      }
      const branch = nodes.some((n) => n.parent === item.id);
      toggle.className = branch
        ? expanded.has(item.id)
          ? "om-tree__toggle om-tree__toggle--open"
          : "om-tree__toggle"
        : "om-tree__toggle om-tree__toggle--empty";
      if (branch) {
        row.setAttribute("aria-expanded", String(expanded.has(item.id)));
        toggle.append(icon(document, "chevron"));
      }
      label.className = "om-tree__label";
      label.textContent = item.label;
      row.append(toggle, icon(document, item.icon), label);
      row.onclick = (event) => {
        if (disabled) return;
        focus = item.id;
        element.focus();
        if (branch && toggle.contains(event.target as Node)) options.expand(item.id, !expanded.has(item.id));
        else options.select(item.id);
      };
      return row;
    });
    element.replaceChildren(...body);
    if (focus) element.setAttribute("aria-activedescendant", ids.get(focus) ?? "");
    else element.removeAttribute("aria-activedescendant");
  };
  element.onkeydown = (event) => {
    if (disabled) return;
    const rows = visible(),
      current = rows.findIndex((n) => n.id === focus),
      item = rows[current];
    let index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? rows.length - 1
          : event.key === "ArrowDown"
            ? Math.min(rows.length - 1, current + 1)
            : event.key === "ArrowUp"
              ? Math.max(0, current - 1)
              : -1;
    if (event.key === "ArrowRight" && item) {
      event.preventDefault();
      if (!expanded.has(item.id) && nodes.some((n) => n.parent === item.id)) options.expand(item.id, true);
      else index = Math.min(rows.length - 1, current + 1);
    }
    if (event.key === "ArrowLeft" && item) {
      event.preventDefault();
      if (expanded.has(item.id)) options.expand(item.id, false);
      else index = rows.findIndex((n) => n.id === item.parent);
    }
    if (index >= 0) {
      event.preventDefault();
      focus = rows[index]?.id ?? focus;
      element.setAttribute("aria-activedescendant", ids.get(focus) ?? "");
      document.getElementById(ids.get(focus) ?? "")?.scrollIntoView?.({ block: "nearest" });
    }
    if (["Enter", " "].includes(event.key) && focus) {
      event.preventDefault();
      options.select(focus);
    }
  };
  return {
    element,
    update(items: TreeItem[], selection: string, open: ReadonlySet<string>, blocked: boolean) {
      nodes = items;
      selected = selection;
      expanded = new Set(open);
      disabled = blocked;
      element.setAttribute("aria-disabled", String(blocked));
      render();
    },
    disable(value: boolean) {
      disabled = value;
      element.setAttribute("aria-disabled", String(value));
    },
  };
}
