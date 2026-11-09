import { describe, expect, it } from "vitest";
import { compile, components, theme } from "@";

const mappings = ':root,[data-om-theme="light"] {--om-text:#494949} [data-om-theme="dark"] {--om-text:#ededed}';
describe("Less style contracts", () => {
  it("compiles native parent selectors and validates the emitted BEM/token contract", async () => {
    const result = await compile(
      "src/index.less",
      new Map([
        ["src/index.less", '@import "button.less";'],
        [
          "src/button.less",
          ".om-button { color:var(--om-text); &__label { color:inherit } &--primary { color:var(--om-text) } &:disabled { cursor:not-allowed } }",
        ],
      ]),
    );
    expect(result.css).toContain(".om-button__label");
    expect(result.css).toContain(".om-button--primary");
    expect(result.imports).toEqual(["src/button.less"]);
    expect(() => components(result.css, "om", theme(mappings, "om"))).not.toThrow();
  });
  it.each([
    '@import "../../private.less";',
    '@import "https://example.com/style.less";',
    '@plugin "./execute.js";',
    ".om-x { color: `process.cwd()`; }",
    '.om-x { background: data-uri("/etc/passwd"); }',
  ])("refuses code execution or imports outside the supplied file set: %s", async (source) => {
    await expect(compile("src/index.less", new Map([["src/index.less", source]]))).rejects.toBeDefined();
  });
  it.each([
    "body { color:var(--om-text) }",
    ".om-button .om-other { color:var(--om-text) }",
    ".om-button { color:red }",
    ".om-button { padding:12px }",
    ".om-button { color:var(--om-unknown) }",
    ".om-button { color:var(--om-text, red) }",
    ".om-button { --om-text:red }",
    '@import "https://example.com/a.css";',
  ])("rejects selector/token leaks: %s", (css) => {
    expect(() => components(css, "om", theme(mappings, "om"))).toThrow();
  });
  it("rejects incomplete theme mappings and non-token declarations", () => {
    expect(() => theme(mappings.replace("--om-text:#ededed", "--om-other:#ededed"), "om")).toThrow();
    expect(() => theme(mappings.replace("--om-text:#494949", "color:red"), "om")).toThrow();
    expect(() => theme(mappings.replace('[data-om-theme="dark"]', ':root,[data-om-theme="dark"]'), "om")).toThrow();
  });
});

it("allows bounded responsive component structure while rejecting nested or non-width at-rules", () => {
  const tokens = theme(':root,[data-om-theme="light"]{--om-track:1fr}[data-om-theme="dark"]{--om-track:1fr}', "om");
  expect(() =>
    components(
      "@media (max-width: 760px){.om-shell{display:grid;grid-template-columns:minmax(0,var(--om-track))}}",
      "om",
      tokens,
    ),
  ).not.toThrow();
  for (const css of [
    "@supports(display:grid){.om-shell{display:grid}}",
    "@media (orientation:portrait){.om-shell{display:grid}}",
    "@media (max-width:760px){@media (max-width:640px){.om-shell{display:grid}}}",
  ])
    expect(() => components(css, "om", tokens)).toThrow();
});

it("supports native hidden/focus/placeholder states within BEM while rejecting arbitrary attributes", () => {
  const tokens = theme(mappings, "om");
  expect(() =>
    components(
      ".om-grid{grid-template-columns:minmax(var(--om-text),var(--om-text))}.om-view[hidden]{display:none}.om-input:focus-within{color:var(--om-text)}.om-input::placeholder{color:var(--om-text)}",
      "om",
      tokens,
    ),
  ).not.toThrow();
  expect(() => components(".om-view[data-anything]{display:none}", "om", tokens)).toThrow();
});

it("scopes native anchors to the popup block without permitting arbitrary component custom properties", () => {
  const tokens = theme(mappings, "om");
  expect(() =>
    components(
      ".om-popup{anchor-scope:--om-popup-anchor}.om-popup__trigger{anchor-name:--om-popup-anchor}.om-popup__surface{position-anchor:--om-popup-anchor;position-area:bottom span-right}.om-number__input::-webkit-inner-spin-button{appearance:none}",
      "om",
      tokens,
    ),
  ).not.toThrow();
  for (const css of [
    ".om-other{anchor-name:--om-popup-anchor}",
    ".om-popup{anchor-name:--other}",
    ".om-popup{--om-popup-anchor:red}",
    ".om-number__input::-webkit-scrollbar{display:none}",
  ])
    expect(() => components(css, "om", tokens)).toThrow();
});
