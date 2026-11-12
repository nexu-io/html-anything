// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { assertSafeElementDeletion, SCRIPT_DEPENDENCY_DELETE_MESSAGE } from "./deleteScriptDependencies";

function composition(script: string, markup = '<div id="mk-ch-center" data-hf-id="hf-center"><div id="mk-ch-box" class="word"></div></div>') {
  return `<html><body>${markup}<div id="other"></div><script>${script}</script></body></html>`;
}

describe("script dependencies when deleting elements", () => {
  it("protects the callout's descendant text box before its initialization would dereference null", () => {
    const source = composition(`const box = document.getElementById("mk-ch-box");
      box.style.fontSize = "60px"; const tl = gsap.timeline({paused:true}); tl.to(box, {opacity:1});`);
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-center" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it.each([
    'document.querySelector("#mk-ch-box").style.color = "red";',
    'document["getElementById"](`mk-ch-box`).remove();',
    'document.querySelectorAll(".word").forEach(el => el.remove());',
    'document.getElementsByClassName("word")[0].style.color = "red";',
    'document.getElementsByTagName("div")[0].remove();',
    'const find = document.getElementById; find("mk-ch-box").remove();',
    'document.querySelector(window.selectedElement).remove();',
  ])("protects DOM lookup dependencies: %s", (script) => {
    expect(() => assertSafeElementDeletion(composition(script), [{ id: "mk-ch-center" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("allows GSAP selector deletion and lookups that only use surviving nodes", () => {
    const source = composition(`// document.getElementById("mk-ch-box")
      const note = 'document.querySelector("#mk-ch-box")';
      document.getElementById("other").style.color = "red";
      gsap.to("#mk-ch-box", {opacity:0});`);
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-center" }])).not.toThrow();
  });

  it("does not inspect scripts removed with their owning subtree", () => {
    const source = composition("", '<div id="mk-ch-center"><script>document.getElementById("mk-ch-box").remove();</script><div id="mk-ch-box"></div></div>');
    expect(() => assertSafeElementDeletion(source, [{ id: "mk-ch-center" }])).not.toThrow();
  });

  it("checks scripts and descendants inside native composition templates", () => {
    const source = `<template><div data-composition-id="scene"><div id="mk-ch-center"><div id="mk-ch-box"></div></div><script>document.querySelector('#mk-ch-box').remove();</script></div></template>`;
    expect(() => assertSafeElementDeletion(source, [{ id: "mk-ch-center" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("respects hf-id precedence and selector indices in a selection", () => {
    const source = composition('document.getElementById("mk-ch-box").remove();', '<div data-hf-id="hf-other" class="item"></div><div id="mk-ch-box" class="item"></div>');
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-other", id: "mk-ch-box" }])).not.toThrow();
    expect(() => assertSafeElementDeletion(source, [{ selector: ".item", selectorIndex: 1 }])).toThrow();
  });

  it("ignores data scripts and refuses unparseable executable scripts before deletion", () => {
    expect(() => assertSafeElementDeletion('<div id="box"></div><script type="application/json">{"id":"box"}</script>', [{ id: "box" }])).not.toThrow();
    expect(() => assertSafeElementDeletion('<div id="box"></div><script>const = invalid</script>', [{ id: "box" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });
});
