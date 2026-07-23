// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { injectPreviewBase } from "../extract-html";

afterEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  window.location.hash = "";
});

describe("project preview fragment navigation", () => {
  it("keeps dynamically created fragment links inside the preview", () => {
    const rendered = injectPreviewBase(
      "<html><head></head><body></body></html>",
      "/api/projects/project-id/",
    );
    document.open();
    document.write(rendered);
    document.close();
    const script = document.querySelector<HTMLScriptElement>(
      "script[data-html-anything-fragment-navigation]",
    );
    window.eval(script?.textContent ?? "");
    const link = document.createElement("a");
    link.href = "#later";
    document.body.append(link);
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(event);

    expect(script).not.toBeNull();
    expect(event.defaultPrevented).toBe(true);
  });

  it.each(["#missing", "#bad%percent"])(
    "keeps unresolved fragment %s inside the preview",
    (href) => {
      const rendered = injectPreviewBase(
        `<html><head></head><body><a href="${href}">Link</a></body></html>`,
        "/api/projects/project-id/",
      );
      document.open();
      document.write(rendered);
      document.close();
      const script = document.querySelector<HTMLScriptElement>(
        "script[data-html-anything-fragment-navigation]",
      );
      window.eval(script?.textContent ?? "");
      const link = document.querySelector<HTMLAnchorElement>("a")!;
      const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });

      link.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(window.location.hash).toBe(href);
    },
  );
});
