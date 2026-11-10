# OpenMotion · odsuite

An isolated engineering and product workspace for OpenMotion. Engineering mechanisms use `@odsuite/*`; carriers, applications and product domains use `@open-motion/*`. All modules are private and internal dependencies are `workspace:*`; no adjacent checkout or external engineering-suite registry is required.

```text
suites/     engineering contracts, tools and resource lifecycles
carriers/   standalone and Codex host composition
apps/       Web and Daemon product applications
packages/   shared product domains, theme and components
```

`refactor/odsuite` is an independent construction line. The complete existing product remains on [`feature/motion`](https://github.com/nexu-io/html-anything/tree/feature/motion). This workspace does not yet replace its full editor, production Skills, media generation, templates or export capabilities. `main` and `legacy` retain their own history.

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

The current product supports sessions/artifacts, native source editing, text/appearance/numeric animation, bounded key/clip timing, canvas movement, persistent history, external-file composition navigation/shared-source editing with numeric local clocks and bounded parent-host movement/right-edge trim, persistent PNG/PCM16 WAV import/insertion with native playback and independent fixed-rate audio source-in-point/rate/gain/mute controls, source-local aligned PNG/WAV link/unlink with linked timing and history, and isolated native previews. Unresolved composition clocks remain read-only; broader media/audio editing, additional codecs, layouts/preferences, production generation providers still need implementation and their own acceptance. Fixed-revision native MP4 export is available on the qualified platform. Both carriers build independent Node closures; npx installation and publication remain separate delivery work.

## Read and contribute

Start with [AGENTS.md](AGENTS.md), [the documentation index](docs/README.md) and [contribution guidance](CONTRIBUTING.md). Use independent topic worktrees and squash PRs into `refactor/odsuite`; the complete result requires acceptance before integration into `feature/motion`. All repository collaboration is in English.

Docs hold durable architecture, operations and conventions. Plans, business-coverage gaps, progress and evidence belong in PRs/issues/delivery records. No package, storage or release publication is enabled. Preserve disabled telemetry, finite artifact manifests, user-data separation and [third-party notices](NOTICE).

Licensed under [Apache-2.0](LICENSE). Dependencies and bundled fonts retain their own licenses.
