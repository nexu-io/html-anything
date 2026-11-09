import { expect, it } from "vitest";
import { setTheme } from "@";

it("selects themes through the owned attribute without defining inline styles", () => {
  setTheme(document.documentElement, "dark");
  expect(document.documentElement.getAttribute("data-om-theme")).toBe("dark");
  setTheme(document.documentElement, "light");
  expect(document.documentElement.getAttribute("data-om-theme")).toBe("light");
  expect(document.documentElement.hasAttribute("style")).toBe(false);
});
