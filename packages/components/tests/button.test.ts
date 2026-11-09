import { expect, it, vi } from "vitest";
import { button } from "@";

it("renders safe text, primary state and the caller's behavior; disabled blocks activation", () => {
  const onClick = vi.fn();
  const element = button(document, { label: "<script>literal</script>", primary: true, onClick });
  document.body.append(element);
  expect(element.classList.contains("om-button--primary")).toBe(true);
  expect(element.querySelector(".om-button__label")?.textContent).toBe("<script>literal</script>");
  expect(element.querySelector("script")).toBeNull();
  element.click();
  expect(onClick).toHaveBeenCalledTimes(1);
  element.disabled = true;
  element.click();
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(element.hasAttribute("style")).toBe(false);
});
