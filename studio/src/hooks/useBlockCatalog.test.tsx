// @vitest-environment happy-dom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { I18nProvider, useI18n } from "../i18n/I18n";
import { useBlockCatalog } from "./useBlockCatalog";

vi.mock("../utils/studioApiFetch", () => ({
  studioApiFetch: vi.fn(async () => ({
    ok: true,
    json: async () => [
      { name: "caption-one", title: "Word Reveal", description: "Animated words", tags: ["captions", "kinetic"] },
      { name: "scene-one", title: "Landscape", description: "Mountain view", tags: ["scenes"] },
    ],
  })),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let host: HTMLDivElement;
let catalog: ReturnType<typeof useBlockCatalog>;
let language: ReturnType<typeof useI18n>;
function Harness() {
  catalog = useBlockCatalog();
  language = useI18n();
  return null;
}

beforeEach(async () => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<I18nProvider initialLocale="zh-CN"><Harness /></I18nProvider>);
  });
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  localStorage.clear();
});

it("finds captions by their visible Chinese category and trims the query", () => {
  act(() => catalog.setSearch("  字幕  "));
  expect(catalog.filteredBlocks.map((block) => block.name)).toEqual(["caption-one"]);
  act(() => catalog.setSearch(""));
  expect(catalog.filteredBlocks).toHaveLength(2);
});

it("retains category filtering, English search, titles, descriptions and tags", () => {
  act(() => { catalog.setCategory("scenes"); catalog.setSearch("字幕"); });
  expect(catalog.filteredBlocks).toHaveLength(0);
  act(() => catalog.setCategory(null));
  for (const query of ["CAPTIONS", "Word Reveal", "Animated words", "kinetic"]) {
    act(() => catalog.setSearch(query));
    expect(catalog.filteredBlocks.map((block) => block.name)).toEqual(["caption-one"]);
  }
});

it("updates category matching when the interface language changes without remounting", () => {
  act(() => catalog.setSearch("字幕"));
  expect(catalog.filteredBlocks).toHaveLength(1);
  act(() => language.setLocale("en"));
  expect(catalog.filteredBlocks).toHaveLength(0);
  act(() => catalog.setSearch("Captions"));
  expect(catalog.filteredBlocks).toHaveLength(1);
  act(() => language.setLocale("zh-CN"));
  expect(catalog.filteredBlocks).toHaveLength(1);
});
