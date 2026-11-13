// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import * as icons from "./RemixIcons";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("bundles a real vector for every exported editor icon and its filled state", () => {
  const sprite = new DOMParser().parseFromString(readFileSync(path.resolve(import.meta.dirname, "../../../packages/design-system/icons.svg"), "utf8"), "image/svg+xml");
  const host = document.createElement("div");
  const root = createRoot(host);
  const components = Object.entries(icons).filter(([name]) => name !== "RemixIcon");
  try {
    for (const weight of ["regular", "fill"] as const) {
      act(() => root.render(<>{components.map(([name, Component]) => <Component key={name} weight={weight} />)}</>));
      for (const use of host.querySelectorAll("use")) {
        const id = use.getAttribute("href")!.split("#")[1];
        expect(sprite.getElementById(id)?.querySelector("path"), id).toBeTruthy();
      }
    }
  } finally { act(() => root.unmount()); }
});

it("preserves refs, accessible labels, sizing, and distinct visibility states", () => {
  const host = document.createElement("div");
  const root = createRoot(host);
  const ref = createRef<SVGSVGElement>();
  try {
    act(() => root.render(<icons.Eye ref={ref} size={20} alt="Show layer" />));
    expect(ref.current?.getAttribute("width")).toBe("20");
    expect(ref.current?.getAttribute("aria-label")).toBe("Show layer");
    expect(ref.current?.querySelector("use")?.getAttribute("href")).toContain("#ri-eye-line");
    act(() => root.render(<icons.EyeSlash ref={ref} />));
    expect(ref.current?.getAttribute("aria-hidden")).toBe("true");
    expect(ref.current?.querySelector("use")?.getAttribute("href")).toContain("#ri-eye-off-line");
  } finally { act(() => root.unmount()); }
});
