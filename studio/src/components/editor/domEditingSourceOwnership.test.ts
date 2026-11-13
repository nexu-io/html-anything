import { afterEach, describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { getSourceFileForElement, setCompositionSourceMap } from "./domEditingDom";
import { resolveDomEditSelection } from "./domEditingLayers";

afterEach(() => {
  setCompositionSourceMap(new Map());
  vi.unstubAllGlobals();
});

function fixture(attributes: string) {
  const window = new Window();
  Object.assign(window, { SyntaxError });
  window.document.body.innerHTML = `<div data-composition-id="main">
    <div id="glitch" data-hf-id="host" ${attributes}>
      <div id="inner-root" data-composition-file="compositions/glitch.html">
        <span id="pixel">Pixel</span>
        <div id="nested" data-composition-src="compositions/nested.html"></div>
      </div>
    </div></div>`;
  return (id: string) => window.document.getElementById(id)! as unknown as HTMLElement;
}

describe("composition source ownership", () => {
  it.each([
    'data-composition-src="compositions/glitch.html" data-composition-id="glitch"',
    'data-composition-file="compositions/glitch.html" data-hf-scene="glitch" data-composition-id="glitch"',
    'data-composition-file="compositions/glitch.html" data-hf-scene="glitch" data-composition-id="glitch" data-hf-parked-scene',
  ])("keeps a host in its parent file and inner content in the child file: %s", (attributes) => {
    setCompositionSourceMap(new Map([["glitch", "compositions/glitch.html"]]));
    const el = fixture(attributes);
    expect(getSourceFileForElement(el("glitch"), null).sourceFile).toBe("index.html");
    for (const id of ["inner-root", "pixel", "nested"]) {
      expect(getSourceFileForElement(el(id), null).sourceFile).toBe("compositions/glitch.html");
    }
    expect(getSourceFileForElement(el("glitch"), "compositions/parent.html").sourceFile)
      .toBe("compositions/parent.html");
  });

  it("probes the authored host in the parent file instead of declaring it script-generated", async () => {
    const el = fixture('data-composition-file="compositions/glitch.html" data-hf-scene="glitch" data-composition-id="glitch"');
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ exists: [url.endsWith("/index.html")] }),
    }));
    vi.stubGlobal("fetch", fetch);
    const selection = await resolveDomEditSelection(el("glitch"), {
      activeCompositionPath: null, projectId: "source-ownership", exactTarget: true,
    });
    expect(selection?.sourceFile).toBe("index.html");
    expect(selection?.existsInSource).toBe(true);
    expect(selection?.capabilities.reasonIfDisabled).toBe("Select an internal layer to transform it.");
    expect(fetch.mock.calls[0]?.[0]).toContain("/probe-elements/index.html");
  });
});
