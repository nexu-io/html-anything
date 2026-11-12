import postcss from "postcss";

/** Theme definitions are custom properties only, mapped identically for light and dark. */
export function theme(css: string, prefix: string): Set<string> {
  const root = postcss.parse(css);
  const modes = new Map<string, Set<string>>();
  root.walkAtRules(() => {
    throw new Error("theme at-rules are not authorized");
  });
  root.walkRules((rule) => {
    const selectors = rule.selector.split(",").map((value) => value.trim());
    const mode = selectors.includes(`[data-${prefix}-theme="light"]`)
      ? "light"
      : selectors.includes(`[data-${prefix}-theme="dark"]`)
        ? "dark"
        : undefined;
    if (
      !mode ||
      selectors.some(
        (value) => !(mode === "light" && value === ":root") && value !== `[data-${prefix}-theme="${mode}"]`,
      )
    )
      throw new Error(`theme selector is not authorized: ${rule.selector}`);
    if (modes.has(mode)) throw new Error(`duplicate theme mapping: ${mode}`);
    const tokens = new Set<string>();
    rule.walkDecls((declaration) => {
      if (!declaration.prop.startsWith(`--${prefix}-`) || tokens.has(declaration.prop))
        throw new Error(`invalid or duplicate theme token: ${declaration.prop}`);
      if (/url\s*\(/i.test(declaration.value)) throw new Error("theme assets need an explicit resource contract");
      tokens.add(declaration.prop);
    });
    modes.set(mode, tokens);
  });
  const light = modes.get("light"),
    dark = modes.get("dark");
  if (!light?.size || !dark || light.size !== dark.size || [...light].some((token) => !dark.has(token)))
    throw new Error("light/dark theme token sets must match and be nonempty");
  return light;
}

/** Validate compiled selectors, so native Less nesting/mixins remain available. */
export function components(css: string, prefix: string, tokens: ReadonlySet<string>): void {
  const root = postcss.parse(css);
  root.walkAtRules((rule) => {
    if (
      rule.name !== "media" ||
      rule.parent?.type !== "root" ||
      !/^\(max-width:\s*[1-9][0-9]{2,3}px\)$/.test(rule.params)
    )
      throw new Error("only top-level max-width media queries are authorized in components");
  });
  root.walkRules((rule) => {
    for (const selector of rule.selector.split(",")) {
      if (
        /\[open\]|::backdrop/.test(selector) &&
        !new RegExp(`^\\.${prefix}-dialog(?:\\[open\\]|::backdrop)$`).test(selector.trim())
      )
        throw new Error("native modal states belong to the dialog component");
      const classes = selector.match(/\.[a-zA-Z_][\w-]*/g) ?? [];
      const blocks = classes.map((name) => name.slice(1).split(/__|--/)[0]);
      const rest = selector
        .replace(/\.[a-zA-Z_][\w-]*/g, "")
        .replace(/\[(?:hidden|open)\]/g, "")
        .replace(/::(?:placeholder|backdrop|-webkit-outer-spin-button|-webkit-inner-spin-button)\b/g, "")
        .replace(/:(?:hover|active|focus-within|focus-visible|focus|disabled|checked|first-child|last-child)\b/g, "");
      if (
        !classes.length ||
        !/^[\s>+~]*$/.test(rest) ||
        new Set(blocks).size !== 1 ||
        classes.some(
          (name) =>
            !new RegExp(`^\\.${prefix}-[a-z][a-z0-9-]*(?:__[a-z][a-z0-9-]*)?(?:--[a-z][a-z0-9-]*)?$`).test(name),
        )
      )
        throw new Error(`component selector must use one BEM block: ${selector}`);
    }
  });
  root.walkDecls((declaration) => {
    if (["anchor-scope", "anchor-name", "position-anchor"].includes(declaration.prop)) {
      const parent = declaration.parent;
      if (
        parent?.type !== "rule" ||
        !new RegExp(`^\\.${prefix}-popup(?:__[a-z-]+)?$`).test(parent.selector) ||
        declaration.value !== `--${prefix}-popup-anchor`
      )
        throw new Error("anchor must belong to the popup component");
      return;
    }
    if (declaration.prop.startsWith("--")) throw new Error("component token definitions belong to theme");
    let value = declaration.value.replace(/var\((--[a-z0-9-]+)\)/g, (_match, token: string) => {
      if (!tokens.has(token)) throw new Error(`unknown semantic token: ${token}`);
      return "";
    });
    value = value.replace(/minmax\((?:0)?\s*,\s*\)/g, "");
    value = value.replace(
      /\b(?:auto|none|inherit|initial|unset|currentColor|transparent|solid|flex|grid|block|inline-flex|inline-block|center|start|end|stretch|normal|hidden|visible|relative|absolute|pointer|not-allowed|border-box|column|row|wrap|nowrap|anywhere|vertical|ew-resize|grab|ellipsis|nowrap|space-between|pre-wrap|fixed|bottom|span-right|textfield|hidden|non-scaling-stroke)\b/g,
      "",
    );
    if (!/^[\s0%,/.-]*$/.test(value))
      throw new Error(`use semantic tokens for ${declaration.prop}: ${declaration.value}`);
  });
}
