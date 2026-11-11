// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import { resolveMasterCompositionPath } from "../../utils/studioUrlState";
import { mountCompositionsTab } from "./compositionsTabTestUtils";

const mount = (compositions: string[], masterCompositionPath: string | null) =>
  mountCompositionsTab({ compositions, masterCompositionPath });

describe("CompositionsTab root badge", () => {
  it("marks the composition matching masterCompositionPath as root", () => {
    const compositions = ["compositions/headline.html", "compositions/outro.html", "index.html"];
    const host = mount(compositions, resolveMasterCompositionPath(compositions));
    const cards = host.querySelectorAll<HTMLElement>('[draggable="true"]');
    expect(cards).toHaveLength(3);
    expect(cards[1]?.textContent).toContain("headline");
    expect(cards[2]?.textContent).toContain("outro");
    expect(compositions[0]).toBe("compositions/headline.html");
    expect(cards[0]?.textContent).toContain("Root");
    expect(cards[1]?.textContent).not.toContain("Root");
  });

  it("marks nothing as root when masterCompositionPath is null", () => {
    const compositions = ["compositions/hero.html", "compositions/outro.html"];
    const host = mount(compositions, null);
    const cards = host.querySelectorAll<HTMLElement>('[draggable="true"]');
    expect(cards[0]?.textContent).not.toContain("Root");
    expect(cards[1]?.textContent).not.toContain("Root");
  });
});
