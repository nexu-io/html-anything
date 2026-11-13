// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { removeElementsFromHtml } from "@hyperframes/studio-server/source-mutation";
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
    'document[`getElementById`]("mk-ch-box").style.color = "red";',
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

  it.each(["c", "b"])("checks the backend's sequential batch targets when a script uses %s", (id) => {
    const source = composition(`document.getElementById("${id}").style.color = "red";`,
      '<div class="item">A</div><div class="item" id="b">B</div><div class="item" id="c">C</div>');
    const targets = [{ selector: ".item", selectorIndex: 0 }, { selector: ".item", selectorIndex: 1 }];
    const after = new DOMParser().parseFromString(removeElementsFromHtml(source, targets), "text/html");
    expect(after.querySelectorAll(".item")).toHaveLength(1);
    expect(after.getElementById("b")).not.toBeNull();
    expect(after.getElementById("c")).toBeNull();
    const check = () => assertSafeElementDeletion(source, targets);
    if (id === "c") expect(check).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
    else expect(check).not.toThrow();
  });

  it("retains original ancestor context when matching script selectors against removed nodes", () => {
    const source = composition('document.querySelector(".group > .item").style.color = "red";',
      '<div class="group" id="group"><div class="item"></div></div>');
    expect(() => assertSafeElementDeletion(source, [{ id: "group" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("matches REST template ordering when resolving selector targets", () => {
    const source = composition('document.getElementById("mk-ch-box").style.color = "red";',
      '<template><div data-composition-id="scene"><div class="group" id="tpl-group"></div></div></template><div class="group" id="outer-group"><div id="mk-ch-box"></div></div>');
    const after = new DOMParser().parseFromString(removeElementsFromHtml(source, [{ selector: ".group", selectorIndex: 0 }]), "text/html");
    expect(after.getElementById("outer-group")).toBeNull();
    expect(after.querySelector("template").content.querySelector("#tpl-group")).not.toBeNull();
    expect(() => assertSafeElementDeletion(source, [{ selector: ".group", selectorIndex: 0 }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
    expect(() => assertSafeElementDeletion(source, [{ selector: ".group", selectorIndex: 1 }])).not.toThrow();
  });

  it("resolves selector targets inside templates when no outer match exists", () => {
    const source = composition('document.getElementById("tpl-box").style.color = "red";',
      '<template><div data-composition-id="scene"><div class="group" id="tpl-group"><div id="tpl-box"></div></div></div></template>');
    const targets = [{ selector: ".group", selectorIndex: 0 }];
    const after = new DOMParser().parseFromString(removeElementsFromHtml(source, targets), "text/html");
    expect(after.querySelector("template").content.querySelector("#tpl-box")).toBeNull();
    expect(() => assertSafeElementDeletion(source, targets)).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("checks receiver-relative selectors against the lookup container", () => {
    const source = composition('document.getElementById("container").querySelector(":scope > .word").style.color = "red";',
      '<div id="container"><div class="word" data-hf-id="hf-word"></div></div>');
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-word" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("allows receiver-relative selectors that resolve outside the removed subtree", () => {
    const source = composition('document.getElementById("container").querySelector(":scope > .word");',
      '<div id="container"></div><div id="mk-ch-center" data-hf-id="hf-center"><div id="mk-ch-box" class="word"></div></div>');
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-center" }])).not.toThrow();
  });

  it("refuses scoped selectors whose lookup receiver cannot be resolved", () => {
    const source = composition('const root = document.getElementById("container"); root.querySelector(":scope > .word");',
      '<div id="container"></div><div id="mk-ch-center" data-hf-id="hf-center"><div id="mk-ch-box" class="word"></div></div>');
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-center" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it.each(["hf-box", "hf-host/hf-box"])("refuses ambiguous or scoped handles before SDK and server resolution can disagree: %s", (hfId) => {
    const source = composition('document.getElementById("box").style.color = "red";',
      '<div data-hf-id="hf-host" data-composition-file="nested.html"><div data-hf-id="hf-box" id="nested-box"></div></div><div data-hf-id="hf-box" id="box"></div>');
    expect(() => assertSafeElementDeletion(source, [{ hfId }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("ignores data scripts and refuses unparseable executable scripts before deletion", () => {
    expect(() => assertSafeElementDeletion('<div id="box"></div><script type="application/json">{"id":"box"}</script>', [{ id: "box" }])).not.toThrow();
    expect(() => assertSafeElementDeletion('<div id="box"></div><script>const = invalid</script>', [{ id: "box" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it.each(["application/x-javascript", "text/javascript1.5", "text/jscript", "text/x-ecmascript"])("checks executable legacy script types: %s", (type) => {
    const source = `<div data-hf-id="hf-box" id="box"></div><script type="${type}">document.getElementById("box").style.color = "red";</script>`;
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-box" }])).toThrow(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  });

  it("does not block ambiguous handles when the file contains only data scripts", () => {
    const source = '<div data-hf-id="hf-box"></div><div data-hf-id="hf-box"></div><script type="application/json">{"id":"hf-box"}</script>';
    expect(() => assertSafeElementDeletion(source, [{ hfId: "hf-box" }])).not.toThrow();
  });
});
