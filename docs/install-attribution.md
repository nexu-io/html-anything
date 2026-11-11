# Installation attribution

Website URL `?utm_source=producthunt` → copied guide URL with the same query → Worker adds `--utm-source producthunt` to setup commands → installer saves the source → subsequent events carry `od_utm_source`.

## Compatibility

- No source: the original guide and setup command work unchanged; a new identity has an unknown source.
- Untagged upgrade: keep the saved source and installation ID.
- Explicit new source: update the source while retaining the installation ID.
- Existing telemetry opt-outs apply. Reporting failure never fails installation.
- Website current-visit attribution is separate from the existing first-touch cookie. Existing page/tab prompts do not change when another tab arrives from another campaign.

## Deployment order

1. Merge and publish the installer supporting `--utm-source`. The generated guide includes `<!-- openmotion-utm-source-supported -->` only with that source version.
2. Deploy `wrangler deploy --config workers/install-guide/wrangler.toml` in the Powerformer account. The binding reads the existing `open-design-releases` bucket; it does not upload or modify release objects.
3. Verify the test entry `https://open-design.powerformer.net/motion/install.md` against both attributed and direct requests. The Worker maps this host to `open-motion/dev/install.md`.
4. After validation, enable `https://open-design.ai/motion/install.md` separately; it maps to `open-motion/install.md`. The checked-in route activates only the test host. Other website and R2 paths remain unchanged. Removing the added route rolls back the new entry; existing R2 links remain available.

Both entries may serve older guides without injecting a parameter; injection starts only after a supporting installer and marked guide are published. Website feature previews use the test installation entry, while their Pages deployment stays on the feature branch. R2 upload/readback origins are not installation entry URLs.

An older guide without the marker is served unchanged, even when a source query is supplied. Transformed responses use `Cache-Control: no-store` to prevent channel mixing. Unrecognized paths return 404; GET and HEAD are supported.

## Measurement

Filter Motion events by `product=openmotion`, environment, date and `od_utm_source`. Count successful installation devices by distinct `installation_id`; count project-creating devices and projects using successful `project_create_result` events. Reinstalls are events, not additional devices. Website copy success is a separate measurement and does not prove installation. There is no cross-device or website-to-client person matching.
