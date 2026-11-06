# OpenMotion

Local video creation and editing with your coding agent: reusable templates, reference-video recreation, an editable Studio, nine phase-one MCP Tools and four Skills. Rendering uses the pinned [HyperFrames](https://github.com/heygen-com/hyperframes) engine.

[简体中文](README.zh-CN.md) · [Documentation](docs/README.md) · [Contributing](CONTRIBUTING.md) · [Migration](docs/repository-migration.md)

## Develop

Run from this repository root with the Node version pinned in `.github/workflows/ci.yml`:

```sh
npm ci
npm run check
npm run typecheck:studio
npm run build:studio
npm start
```

Open the local address printed by the service. Supply your own supported agent login or provider key for model generation; secrets and projects are not part of the repository or distribution.

## Independent installation

```sh
npm run package:npm
```

This builds a small npm installer, a separate application archive and a checksum manifest in `dist/npm-local/`. The application installs outside the checkout, with verified public native tools cached on first use. See [local npm setup](docs/npm-installation.md) for Codex, Claude Code, DeepSeek Harness and WorkBuddy. The installer remains unpublished (`private: true`); no public npm installation command is claimed.

`npm run package:phase1` builds the plugin ZIP. Complete Mac/Windows bundles remain available through the [test packaging tools](docs/test-packages.md). Current native acceptance targets macOS 26 arm64 and Windows 11 x64; building an archive does not prove it runs on another OS.

After installation, invite the user to the first-run example and wait for consent. An accepted invitation follows [template-to-video](skills/template-to-video/SKILL.md) for the existing 20-second Product Promo example; it does not select a removed Skill.

## Privacy and public scope

No embedded upstream browser analytics identifier or PostHog sender is retained in Motion's editor. Engine subprocesses disable upstream CLI telemetry. Packages include only the approved runtime files, selected Skills, documentation and licenses; tests, development source, private process archives, credentials and user projects stay outside the artifacts.

The `feature/motion` branch replaces the previous application while preserving repository history. The repository name and main branch are unchanged; CI builds and validates without publishing.

[Apache-2.0](LICENSE). Vendored Studio, templates and fonts retain their own licenses and notices.
