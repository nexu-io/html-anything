# Engineering and contribution conventions

## Source, directories and dependencies

Guard configuration in `odsuite.yaml` is authoritative. Use finite directory patterns, with no implicit descendant permission; hidden/empty/test directories count too. Maximum source size is 500 lines, module depth 5 and width 8. Components have only the configured exact-path width exemption.

Source belongs in `src`; tests in sibling `tests/**/*.test.ts`. Each has its own tsconfig; tests map `@` to src. Use TS7/Vitest/Biome. Styles are denied in every module by default. Exact theme/components grants authorize only `src/**/*.less`, not scripts/HTML/CSS/tests or a rule-disable exception. Typed product/third-party resources need declared ownership and lifecycle rather than an unmanaged static tree.

Engineering scope is `@odsuite`, product carriers/apps/domains `@open-motion`; all packages are private. Dependencies are exact x.y.z externally and workspace:* internally. Scripts are only lint/test/build and root recursive distribution; `odsuite`/`odsuite.yaml` are the only entry/config, without aliases or hooks.

## Theme, fonts and BEM

Theme owns primitive Less values, semantic aliases and light/dark mappings. Expose only declared `--om-*` tokens to components; both themes share the same key set. Theme owns raw colors, sizes and font values. Structural zero/layout keywords may live in components. Theme switching sets data-om-theme, never CSSOM/inline styles.

Fonts live in a closed `packages/theme/src/fonts` manifest: family, TrueType/license files, SHA256 for both and weight ranges. Guard grants that exact resource role; style validates regular files, closure, hashes and license without network URLs/arbitrary paths/CSS snippets. Theme builds fonts+manifest; Web's explicit documentStyles composition verifies/copies them and generates finite @font-face rules. Ship fonts/licenses together without CDN or runtime style injection; preserve copyright/source in OFL notices.

Components owns atoms and Less. Declare BEM through native Less parent selectors (`&__label`, `&--primary`, `&:disabled`) rather than a custom DSL. Consume declared tokens without duplicating colors/sizes, defining tokens or fallback literals. New CSS capabilities require explicit role-level expansion.

Web business components compose atoms/domains and define no styles. Current DOM atoms do not imply unimplemented framework adapters. Theme/components export built CSS; Web uses style's documentStyles at build time to compose/link its generated stylesheet. Source HTML and runtime stylesheet imports do not bypass guard.

Style owns Less compilation and compiled-contract validation. Guard supplies explicitly licensed regular source files. Reject Less JavaScript/plugins, escaping imports, orphan/unimported Less, unmanaged resource URLs and unknown at-rules. Components permits finite top-level max-width media queries with the same BEM/token checks; nested queries/import/supports remain rejected. Grid minmax uses zero/token lower bounds and token upper bounds. Known hidden/focus-within/placeholder states are allowed, unknown attributes rejected. Breakpoints are structural thresholds; other nonzero values use theme tokens. Numeric SVG geometry is temporal/spatial data; Less owns its appearance.

Anonymous layouts expose generic containers. Studio panel registry/composition belongs to Web, not atom layouts. Menu/popover/tooltip/tabs/number/tree own keyboard, focus and BEM state; product callbacks own business behavior. Popovers use native anchors with fixed block identifiers. Numeric drafts may be empty until submission; don't coerce emptiness to zero. Tree parents come from native models; expansion/focus is view state.

Preserve input DOM, cursor, selection and unfinished drafts during ordinary updates. Scope drafts by session/artifact/element owner. WebView.dispose drains commands/previews/listeners, retaining root ownership on failure for retry; success permits remount. It never implicitly saves user drafts.

## Product visual contract

These are current visual constraints, not proof of full reference-product parity.

| Role            | Light   | Dark    |
| --------------- | ------- | ------- |
| Workspace       | #ededed | #202020 |
| Panel           | #fafafa | #353535 |
| Overlay         | #ffffff | #353535 |
| Input           | #f5f5f5 | #292929 |
| Text            | #494949 | #ededed |
| Secondary text  | #696969 | #c0c0c0 |
| Selection/focus | #007106 | #adf788 |
| Main action     | #202020 | #ededed |

Product comparison pins a freshly fetched main SHA in the owning work item. Inspect actual MVP visibility and the published protocol profile; keep visible, public, retained/hidden, proposed and excluded capabilities distinct. Review new main changes between slices and record the chosen next pin without relabelling prior evidence.

The browser reference contract pins source SHA/paths. Validate screenshots and actual interaction before changing it; don't mechanically re-record. A same-run theme round-trip proves restoration, not complete pixel parity. Compare the same native source, viewport, theme, playback time and selection, including loaded fonts/styles and interactions. Layout presence alone is insufficient; unimplemented features must not have fake success controls.

Brand green is #87ea5c for selection/focus/creative assistance; primary actions are neutral. Use flat surfaces and 1px separators, text contrast at least 4.5:1. Body/control/description/dense sizes are 14/13/12/11px; headings 16/20/24/32px; spacing 4/8/12/16/24/32px; control/panel radii 4 and 12/16px. Feedback is typically 150/200ms and respects reduced motion. Keyboard/focus/theme states cannot depend only on animation or color. Local licensed fonts are Albert Sans and IBM Plex Mono, with platform/CJK fallbacks; serif guidance may use Georgia/platform serif.

## Durable guidance and collaboration

Before adding a document, identify its lasting topic and owning source module. Update an existing topic when possible; a necessary new document must also receive exact directory/name grants and index/link updates. Responsibilities, architectural rationale, operations, recovery and conventions belong in docs. Goals, plans, migration coverage, logs, acceptance runs and task status belong in PRs/issues/delivery records. Do not keep process archives under renamed legacy folders or retain obsolete commands as current guidance.

Keep contracts and related operations accurate in the same delivery. Distinguish constraints, implemented support and missing capabilities, and never substitute reference tests for real product/platform/distribution evidence. Collaboration content is English. Preserve public licenses, disabled telemetry, finite resource manifests and credential/user-data separation.

## Runtime acceptance fixtures

Resolve retained fixture evidence under the repository's `.artifacts` using the test module URL. A package runner's current directory is not the repository root. Preserve failed authority/ledger layouts at their original paths; correct future output locations rather than expanding the directory whitelist to normalize accidental locations. A clean source-policy check and retained local-evidence findings must be reported separately.

Publish a checkpoint observed by another process through a completed temporary file and same-directory atomic rename. Flushing a directly visible file does not make its publication atomic; existence alone cannot prove that JSON or other readiness evidence is complete. Keep readers strict and retain the original failure instead of masking partial publication with parse-error retries or longer deadlines.

## Worktrees and PRs

Branch from a freshly fetched pinned origin/refactor/odsuite into an owned topic worktree. Install/build/test/generate only there, never in a baseline or integration checkout. Describe the trigger, resulting behavior, owner/dependency/lifecycle changes and actual validation in an English PR targeting refactor/odsuite. Verify base/head/checks and squash only; never direct-push implementation or merge/rebase-merge.

The primary product reference is main; refactor/odsuite remains the independent delivery line until separate acceptance. No main change, repository rename or package/storage/release publication follows automatically. Keep unmerged/unpublished worktrees and record their recoverable state. Cleanup is separately scoped; routine implementation authorization is not a reason for repeated confirmation, while a real unresolved ownership/dependency/lifecycle change needs discussion.

When concurrent delivery is authorized, each independently accepted unit has its own owner, worktree and PR. Agree shared contracts and file responsibilities before implementation. A coordinator reviews cross-layer changes and integrates serially; dependent branches incorporate the accepted integration base and validate that actual combined head. Commit/check receipts distinguish superseded candidates and original failures from the final verified source.
