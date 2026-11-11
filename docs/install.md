# Install OpenMotion {{VERSION}}

This guide pins the complete npm application `{{PACKAGE_SPEC}}` on the **{{CHANNEL}}** software channel. It includes MCP, the built Studio and five Skills. The default template environment is **{{TEMPLATE_ENVIRONMENT}}**: new test versions embed DEV defaults, stable versions embed prod, and previously published versions keep their original environment.

If you are reading this file in the source repository and see `{{...}}`, it is a template, not a published installation instruction. Do not guess a package name or version.

## Instructions for the Agent

1. Collect OS/CPU, Node.js/npm versions and the current Agent identity together, using the host's supplied context where available. Node.js 22.18+ with npm and the Agent must already be installed. Supported native targets: {{TARGETS}}. Do not claim support for another target from package-download success.
2. Select the current host explicitly: `codex` (Codex), `claude` (Claude Code), `deepseek` (DeepSeek Harness) or `workbuddy` (WorkBuddy). An explicit user selection takes precedence. Do not infer the current host from which CLIs happen to be installed. Ask only when the current host or required profile cannot be established. Configure only that host; preserve projects, credentials and unrelated MCP/Skills settings.
3. Install into the current Agent's existing profile and Skills root by default, including published test/DEV versions. Reuse its login and any compatible OpenMotion connection. Do not create a separate host profile, change `CODEX_HOME` or another host configuration root, or require a second login merely because this is a test version. Keep DEV and production application homes and project data separate; reuse the selected environment's existing installation paths. Use a fully isolated host profile only when the user explicitly requests an isolated installation test. The [platform installation recipes]({{DETAILS_URL}}) explain both paths. If setup reports an existing connection owned by another installation, report that conflict instead of silently switching profiles or deleting the connection.
4. Choose exactly one setup command below for the current Agent. Setup starts checked video-component downloads in the background. Do not wait for prepare to connect MCP, create/edit projects or open ordinary preview. Studio shows preparation status and retry; media import, automated capture and export require their respective components. Follow the selected host's discovery/reload mechanism. Compatible phase-one updates can keep existing connections; reconnect closed or incompatible transports. Confirm the application version, template environment, eleven public Tools and five Skills through that host, including an actual `motion_get_project` call. Registration alone does not prove loading. Verify in the current host/session when possible. If it cannot reload MCP or Skills in this conversation, report registration as complete but current-session loading as pending, and tell the user the minimum refresh or reopen step. Do not substitute a separately logged-in CLI session for connecting the current Agent.
5. Report the result and any failed step. Introduce the available capabilities and wait for the user's next request. Installation does not authorize generating a video or calling a paid model.

## Choose the selected host's setup command

The commands below install into the current Agent configuration. Published test/DEV versions follow the same flow; a separate Agent profile is not required. Preserve any existing host configuration environment variables and selected Skills root. Run only the selected row.

| Current Agent | Setup command | Host-specific selection |
| --- | --- | --- |
| Codex | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host codex` | Preserve the selected `CODEX_HOME` and Skills root. |
| Claude Code | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host claude` | Preserve the selected `CLAUDE_CONFIG_DIR` and Skills root. |
| DeepSeek Harness | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host deepseek --profile PROFILE` | Replace `PROFILE` with the actual selected profile from the host context; do not guess `web` or `desktop`. The standard macOS Desktop CLI is detected even when `dsh` is absent from PATH; use `--dsh` for another executable location. |
| WorkBuddy | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host workbuddy` | Preserve the selected `WORKBUDDY_CONFIG_DIR` and Skills root. |

Optional: explicitly wait for all video components or retry preparation for the same installation:

```sh
npx --yes --package "{{PACKAGE_SPEC}}" openmotion prepare
```

Repeat an explicit `--home` from setup on prepare. Setup installs the selected host's MCP and Skills; a second installer or application/manifest download is unnecessary. Use `openmotion --help`, `setup --help` or `prepare --help` from this exact package for supported options. Inspect installer source or host internals only to investigate a concrete failure; a missing CLI on PATH alone is not a reason to create a wrapper.

## Runtime and environment

Setup copies the checked application into a managed writable directory and installs its locked production npm dependencies. The application and user projects do not run from the temporary npx cache. Setup starts a detached preparation worker for the platform's independent native archives concurrently: browser/FFmpeg/ffprobe separately on macOS, browser/combined media on Windows. The local backend and Studio start without waiting. Studio displays per-component download/verification/extraction/checking status and retries failed components. Installers, MCP and Studio join shared cache locks rather than downloading again. An explicit prepare waits for all components and reports failure; successful checked components remain reusable. No export starts automatically after preparation. This is not an offline package.

There is no persisted switch-environment command in this version. Test versions embed DEV defaults and use an environment-specific installation; stable versions embed prod. DEV access still requires the service network/authentication. A public npm package does not grant access or bundle private catalog contents. When changing environment, use separate application home and project data paths while keeping the current Agent profile; merely setting an environment variable while running setup does not configure a later desktop Agent. Do not silently fall back from one environment to another.

## Upgrade, recovery and feedback

Pin this exact version when reproducing an issue. Before an upgrade, back up project data and preserve the same installation/data paths. Compatible phase-one updates retain existing connections and active exports. For an incompatible protocol, finish active exports before updating only this installation's connection and idle backend together; reconnect after setup/prepare. Refresh host discovery for new Tools or Skills, and preserve unrelated settings. Older applications may not read newer data formats: compatible reinstall or backup restoration requires separate verification. Moving a server-side default does not downgrade installed clients.

Include the exact version, OS/CPU, Node/Agent versions, template environment, project/revision, reproduction and redacted logs in a report. Installation, real Agent creation, technical MP4 export and human audiovisual acceptance are separate results.

Release identity: source `{{COMMIT}}`; npm tgz SHA256 `{{TGZ_SHA256}}`. [Source and installation details]({{DETAILS_URL}}).
