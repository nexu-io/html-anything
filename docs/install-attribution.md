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
3. Verify the independent workers.dev endpoint against both attributed and direct requests.
4. Attach only `releases.open-design.ai/open-motion/install.md*` and `releases.open-design.ai/open-motion/dev/install.md*` after installer publication. Other release paths remain on R2. Remove these two routes to roll back.

An older guide without the marker is served unchanged, even when a source query is supplied. Transformed responses use `Cache-Control: no-store` to prevent channel mixing. Unrecognized paths return 404; GET and HEAD are supported.

## Measurement

Filter Motion events by `product=openmotion`, environment, date and `od_utm_source`. Count successful installation devices by distinct `installation_id`; count project-creating devices and projects using successful `project_create_result` events. Reinstalls are events, not additional devices. Website copy success is a separate measurement and does not prove installation. There is no cross-device or website-to-client person matching.
