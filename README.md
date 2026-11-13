# OpenMotion · odsuite

An isolated engineering and product workspace for OpenMotion. Engineering mechanisms use `@odsuite/*`; carriers, applications and product domains use `@open-motion/*`. All modules are private and internal dependencies are `workspace:*`; no adjacent checkout or external engineering-suite registry is required.

```text
suites/     engineering contracts, tools and resource lifecycles
carriers/   standalone and Codex host composition
apps/       Web and Daemon product applications
packages/   shared product domains, theme and components
```

`refactor/odsuite` is an independent construction line. The current product reference is [`main`](https://github.com/nexu-io/openmotion/tree/main). This workspace does not yet replace its full editor, production Skills, media generation, templates or export capabilities. Product comparisons pin an exact main commit and distinguish visible MVP behavior from retained or unpublished code.

## Develop locally

Use Node24 and pnpm11.13.0. Linux requires `ps` (`procps` on Debian); containers need init for child-process reaping.

```sh
pnpm install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH=0 pnpm --filter @open-motion/web exec playwright install chromium
pnpm build
pnpm test
pnpm lint
pnpm exec biome check .
pnpm exec odsuite guard
```

The only CLI is `odsuite`; its configuration is `odsuite.yaml`. After installation and build:

```sh
pnpm exec odsuite dev start --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev status --channel=dev --namespace=default
pnpm exec odsuite dev restart --carrier=standalone --channel=dev --namespace=default
pnpm exec odsuite dev stop --channel=dev --namespace=default
```

`start` returns the actual Web URL. It watches source by default; use `restart` to activate rebuilt code. Codex uses the same entry point. Sidecar owns control state, process identity, ports, paths and lifecycle; no global bin or shortcut scripts are installed.

The current product supports sessions/artifacts, native source editing and source-file creation/copy/rename/removal with persistent history, text/appearance/numeric animation, bounded key/clip timing, canvas movement, persistent history, external-file composition navigation/shared-source editing with numeric local clocks and bounded parent-host movement/right-edge trim, bounded binary media upload/read links, persistent PNG/PCM16 WAV import/insertion with native playback and independent fixed-rate audio source-in-point/rate/gain/mute controls, single-face TTF/OTF/WOFF/WOFF2 font import/selection, source-local aligned PNG/WAV link/unlink with linked timing and history, and isolated native previews. Unresolved composition clocks remain read-only; broader media/audio editing, additional codecs, layouts/preferences, production generation providers still need implementation and their own acceptance. Fixed-revision native MP4 export is available on the qualified platform. Both carriers build independent Node closures. A local npm kit installs both closures and optionally registers Codex MCP/Skills; see [installation](docs/operations.md#local-npm-installation). Registry publication and automatic updates remain separate delivery work.

## Try a local installation

Use the exact `application.tgz` from the owning candidate record; that record pins its source, version, digest and qualification. No registry publication or global bin is required. Keep the npm cache separate from the installation home: setup must claim an empty home itself.

```sh
OM_KIT=/absolute/path/to/application.tgz
OM_REVIEW="$PWD/.artifacts/review"
npm exec --yes --ignore-scripts --cache "$OM_REVIEW/npm-cache" --package "$OM_KIT" -- odsuite setup --carrier standalone --home "$OM_REVIEW/installation" --data "$OM_REVIEW/data" --channel beta --namespace review
npm exec --yes --ignore-scripts --cache "$OM_REVIEW/npm-cache" --package "$OM_KIT" -- odsuite start --home "$OM_REVIEW/installation" --data "$OM_REVIEW/data" --channel beta --namespace review
```

Use the kit's actual channel. Open the returned `result.runtime.web` URL yourself; startup does not open a browser. Replace `start` with `status`, `restart` or `stop` to control this same installation and identity. `result.root` identifies its actual sidecar runtime root. Restart replaces the managed runtime and requires attached MCP clients to reconnect; committed projects, history and films persist. This directory contains user data: do not treat it as a disposable build cache.

For Codex, run the same setup with `--carrier codexplugin` and explicit isolated `--profile` / `--skills` paths, then use that profile in the intended workspace. The registered transport uses the installed closure outside the npm cache and shares a matching standalone instance. A self-hosted Codex runtime closes with its stdio connection; operator stop/restart asks you to detach it first. See [installation and host approval](docs/operations.md#local-npm-installation) for discovery, native preparation, update and recovery boundaries. Development watchers remain the separate repository `pnpm exec odsuite dev` flow above.

## Read and contribute

Start with [AGENTS.md](AGENTS.md), [the documentation index](docs/README.md) and [contribution guidance](CONTRIBUTING.md). Use independent topic worktrees and squash PRs into `refactor/odsuite`; integration into `main` requires separate acceptance and authorization. All repository collaboration is in English.

Docs hold durable architecture, operations and conventions. Plans, business-coverage gaps, progress and evidence belong in PRs/issues/delivery records. No package, storage or release publication is enabled. Preserve disabled telemetry, finite artifact manifests, user-data separation and [third-party notices](NOTICE).

Licensed under [Apache-2.0](LICENSE). Dependencies and bundled fonts retain their own licenses.
