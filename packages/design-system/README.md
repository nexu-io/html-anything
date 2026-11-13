# OpenMotion Design System

This package is the maintained source for OpenMotion's interface appearance and brand resources. A shared theme decision flows from this package into the editor, startup screen, workspace, connection UI, template browser and component catalog.

It is a private source package in the standalone root application. The visual workbench runs independently with Node built-ins and needs no installation or Studio build. Application installation and builds remain at the repository root; no workspace dependency, separate lockfile or package publication is required.

## Sources and entry points

| Source | Responsibility |
| --- | --- |
| `tokens.json` | Shared typography, spacing, radii, motion, light/dark semantic colors and Studio aliases. |
| `tokens.css`, `studio/tokens.css` | Generated browser variables and Tailwind theme declarations; never edit directly. |
| `ui.css` | Scoped styles for ordinary HTML pages: tokens, fonts, base, controls and materials. |
| `tailwind.css` | Studio's token/utility adapter; import after Tailwind, with source discovery owned by the consumer. |
| `studio.css` | Editor control states, materials, feedback and adapter recipes. |
| `loading.css` | Startup shell and loading-boundary appearance. |
| `index.js` | Shared brand identity, asset URLs, icon sprite and positive public-asset list. |
| `react/RemixIcons.tsx`, `loading.ts` | Shared React icons and loading artwork behavior. |
| `brand/` | [Brandkit](brand/BRANDKIT.md), [motion art direction](brand/MOTION_DESIGN.md), logos and loading artwork. |
| `index.html`, `catalog.*`, `token-model.js` | Standalone visual workbench and browser-safe token metadata. |
| `generate.js`, `workbench/` | Package-owned token generation, local source-save server and deterministic tests. |

## Visual editing and Agent editing

From the repository root, run `npm run design:dev` and open `http://127.0.0.1:4187`. Alternatively, copy this entire package directory and run `npm run dev` inside it. Neither route starts or imports Studio, the application server, project data, MCP, React or any business module. Use `npm run dev -- --port=4188` inside the package to select another port.

The workbench presents brand resources, colors, radii, typography, spacing, components, icons, materials and motion. Select a token or a component's **Edit styles** action to edit its shared variables in the inspector. Changes preview immediately in the page; **Save to source** opens a before/after review, then writes `tokens.json` and regenerates `tokens.css` and `studio/tokens.css`. Component fields change existing shared roles, so every consumer of those roles inherits the decision. The UI edits existing token values; new roles, component structure, fonts and artwork are maintained by an Agent in the package sources. JSON and CSS export include the current draft. No private reference-site assets are needed.

An Agent edits the same source and runs `npm run design:tokens` from the repository root. While the standalone page is visible, it polls the package source every two seconds, refreshes clean previews and regenerates stale token outputs. With a browser draft, external updates require synchronization: disjoint token changes merge automatically, and overlapping changes require an explicit source/draft choice. Drafts remain in memory until saved or discarded; leaving with unsaved work triggers the browser's standard warning. They are not a persistent history store.

The source-save API is confined to this loopback server and accepts only existing shared/light/dark token IDs. It validates values, checks the source hash, serializes writes and stages outputs before replacing them; symlink targets and arbitrary paths are rejected. Its advisory lock coordinates workbench processes. Arbitrary file editors do not participate in that lock, so the final revision recheck is not a cross-tool, multi-file transaction; avoid simultaneous writes during a save. After a process crash, stop all workbench instances before removing a leftover `.workbench.lock`. No save commits, pushes or publishes Git content.

Application-hosted `/design-system` remains a read-only static presentation of the same package, with draft preview/export but no source-write API. Saved styles reach downstream source consumers through their normal refresh, hot reload or rebuild; the workbench does not control those applications. Prebuilt installations require a new application build to incorporate source changes.

Run `npm run design:test` at the repository root, or `npm test` inside this package, for source-save, conflict, HTTP boundary and standalone-copy checks. Also run `npm run design:check` and the applicable repository validation before submitting changes; contrast acceptance and browser inspection remain separate from source-save validation.

## Consume the system

Ordinary HTML pages load `/design-system/ui.css` and set `data-motion-ui` on their theme root. Set `data-theme="light"` or `"dark"`; an omitted theme follows system appearance.

```html
<link rel="stylesheet" href="/design-system/ui.css">
<section data-motion-ui data-theme="light">
  <button class="ui-button ui-button--primary">Create project</button>
</section>
```

Studio imports `tailwind.css` from its stylesheet and `studio.css` from its application entry. Its existing `data-motion-studio` root maps `paper` to light and the default to dark. Both adapters consume the same `--motion-*` roles. For example, `--color-surface`, catalog surfaces and ordinary control backgrounds derive from shared surface roles; they do not carry separate palettes. Theme-specific recipes belong here, not in component overrides.

Use relative source imports from the application; the package exports document its public API without requiring a workspace link. Use `designSystemAsset()`, `brand` and `iconSprite` from `index.js` for dynamic asset references. Static HTML may use the stable `/design-system/` URLs. The HTTP layer exposes only the explicit asset list and retains `/web/design-system/` as a URL alias. Runtime distribution includes these files and licenses without bundling development source.

## Change a visual decision

1. Find the existing semantic role in `tokens.json` or the existing recipe in package CSS. Reuse it. Add a shared role here when necessary.
2. Change the maintained source and run `npm run design:tokens`. Both browser and Studio styles are generated from it. The same command refreshes stable README logo, favicon and font-license mirrors.
3. Keep feature CSS focused on layout and behavior. Reference package variables for appearance; do not copy tokens, hard-code a new interface palette or override shared roles at a feature root.
4. Run `npm run design:check`, affected tests and the repository's Studio checks. Inspect the affected pages in both themes and at relevant widths. The automated propagation test changes a shared token and checks ordinary controls and compiled Studio/catalog utilities against it.

Changing the package changes application chrome. Timeline coordinates, user-selected colors, template source, project iframes, screenshots and exported films remain independent content. Existing legacy utility names and upstream compatibility entry points forward to this package; they are not new authoring APIs. The legacy color-literal ratchet still tracks older domain code, and does not authorize new hard-coded interface values.

The Library's old Brandkit and art-direction paths are navigation entries. Brand art direction is creative context supplied explicitly to an Agent, not an automatically applied video theme. Public README artwork and editor identity remain distinct documented brand roles; this extraction does not redesign either mark.

## Acknowledgements

The interface retains the OpenDesign source attribution in [tokens.json](tokens.json) and [logo provenance](opendesign-logo-SOURCE.md). Studio-specific recipes retain their Hyperframes source history and [license](../../studio/LICENSE). [Remix Icon notice](remix-icon-NOTICE.txt), [icon license](remix-icon-LICENSE.txt) and [font notices](fonts/NOTICES.txt) remain alongside the original assets. Tailwind is the existing root application's CSS compiler; this extraction adds no runtime dependency.
