const paths = {
  sidebar: "M3 3h18v18H3ZM9 3v18M5 7h2M5 11h2",
  conversation: "M3 3h18v18H3ZM11 3v18M5 8h4M5 12h4",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  home: "m3 10 9-7 9 7v11h-7v-7h-4v7H3Z",
  folder: "M3 6h7l2 3h9v12H3Z",
  file: "M5 3h9l5 5v13H5ZM14 3v6h5",
  text: "M4 5h16M12 5v15M8 20h8",
  layers: "m12 3 10 5-10 5L2 8Zm-9 10 9 5 9-5M3 18l9 5 9-5",
  play: "m8 4 12 8-12 8Z",
  pause: "M8 4v16M16 4v16",
  undo: "m8 3-5 5 5 5M3 8h11a7 7 0 0 1 0 14",
  redo: "m16 3 5 5-5 5M21 8H10a7 7 0 0 0 0 14",
  save: "M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  sun: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  chevron: "m6 9 6 6 6-6",
  refresh: "M20 9a8 8 0 1 0 0 6M20 3v6h-6",
  check: "m4 12 5 5L20 6",
  alert: "m12 3 10 18H2ZM12 9v5M12 17v1",
  code: "m8 5-7 7 7 7M16 5l7 7-7 7M14 2l-4 20",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  close: "m6 6 12 12M6 18 18 6",
  send: "M12 20V4M5 11l7-7 7 7",
  more: "M5 12h1M11 12h1M17 12h1",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2",
  image: "M3 3h18v18H3Zm0 14 6-6 5 5 3-3 4 4M16 7h1",
  message: "M3 3h18v14H9l-6 4ZM7 8h10M7 12h6",
  pencil: "m4 16-1 5 5-1L21 7l-5-5ZM13 5l6 6",
  film: "M3 3h18v18H3ZM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4",
} as const;
export type Icon = keyof typeof paths;
export function icon(document: Document, name: Icon): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svg.classList.add("om-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  path.setAttribute("d", paths[name]);
  svg.append(path);
  return svg;
}
