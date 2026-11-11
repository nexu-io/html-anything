# Install OpenMotion {{VERSION}}

This guide pins the complete npm application `{{PACKAGE_SPEC}}` on the **{{CHANNEL}}** channel: MCP, the built Studio and five Skills. Its embedded template environment is **{{TEMPLATE_ENVIRONMENT}}**. By default, new test versions embed DEV defaults; stable versions embed prod. Previously published versions keep their original environment.

If you are reading this file in the source repository and see `{{...}}`, it is an unpublished template. Do not guess a package name or version.

## Normal installation

1. Collect OS/CPU, Node.js/npm versions and the current Agent identity together, using supplied host context. Node.js 22.18+ with npm and the Agent must already be available. Supported native targets: {{TARGETS}}. Select that host explicitly; an explicit user choice takes precedence. Do not infer the current host from installed CLIs. Ask only for a host or required profile that context cannot establish. Apply the test isolation rule below when installing a test candidate.
2. Run **one** matching setup command from the table. Preserve unrelated configuration, credentials, Skills and projects. Setup handles application verification and starts video-component preparation in the background. Continue immediately to host loading; do not run `prepare` or wait for downloads during normal installation.
3. Use the current host's supported discovery/reload mechanism. Check the application version, template environment, eleven public Tools and five Skills in that host, then make one actual `motion_get_project` call and verify its data directory. Registration alone does not prove loading. If this chat cannot reconnect, report that host loading remains pending; a separate probe or another session cannot establish this chat's connection.
4. Give a short result: installed version/environment, host loading result, any failed step and the installation/data paths needed for reuse. Introduce creation, template adaptation, reference recreation, editing, preview and export, then wait for the user's request. Do not create a video or call a paid model during installation. A successful install needs no diagnostic probe, repeated preparation polling or separate report files.

| Current Agent | Setup command | Host configuration |
| --- | --- | --- |
| Codex | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host codex` | Keep the selected `CODEX_HOME` and Skills root. |
| Claude Code | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host claude` | Keep the selected `CLAUDE_CONFIG_DIR` and Skills root. |
| DeepSeek Harness | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host deepseek --profile PROFILE` | Use the actual selected profile; do not guess `web` or `desktop`. The standard macOS Desktop CLI is detected without `dsh` on PATH; another location uses `--dsh`. |
| WorkBuddy | `npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host workbuddy` | Keep the selected `WORKBUDDY_CONFIG_DIR` and Skills root. |

### Test candidates only

Use a separate host profile, application home, project data and Skills directory, following the [platform recipes]({{DETAILS_URL}}). Apply these paths before setup and reuse them for reconnects, preparation and upgrades. Do not install a test candidate into the daily profile by default. This isolation requirement does not add another installer or require a second setup.

## What is ready after setup

New packages include locked production npm dependencies assembled at build time for the declared targets. Setup verifies and extracts the application into its managed writable home; it does not install dependencies or run the application from the temporary npx cache. Older packages retain their original setup behavior. Node remains user-provided.

MCP, editing and ordinary preview do not wait for video components. Browser, FFmpeg and ffprobe archives prepare independently in the background (Windows combines the media tools). Studio shows progress and retry; media import, automated capture and export require their respective components. Preparation never starts an export. This is not an offline package.

DEV templates still require service network/authentication. Public installation grants no private catalog access. There is no persisted switch-environment command or automatic fallback: use a separate home/data/profile for a different embedded environment. Setting an environment variable only during setup does not configure a later GUI Agent.

## Only when a step fails

For npm network failures, automatically try `https://registry.npmjs.org` then `https://registry.npmmirror.com`, at most once per registry, counting the initial failed attempt. Respect an explicitly selected registry and host policy. Set `npm_config_registry` and `npm_config_fetch_retries=0` only for that attempt, including setup's npm child process. Keep the exact version; verify any mirrored tgz against the matching immutable guide's SHA256 before executing it. If both fail, follow [npm download recovery]({{DETAILS_URL}}#npm-download-failures) for network checks and a terminal handoff. Permission or checksum failures stop immediately. A local tgz still needs npm access for legacy packages that install production dependencies during setup. New bundled-dependency packages skip that npm step; native components still require network access.

Use `openmotion --help` or the affected command's `--help` for missing option information; inspect source or host internals only for a concrete unresolved failure. A missing CLI on PATH alone does not require a wrapper.

For missing Tools or a failed MCP connection, diagnose the same installation, keeping its host configuration and any explicit `--home`:

```sh
npx --yes --package "{{PACKAGE_SPEC}}" openmotion diagnose --host HOST
```

Replace `HOST` with the selected host. Diagnosis is an independent probe, not proof that this chat loaded MCP. Correct the reported cause, use that host's refresh/reconnect action and retry the actual project read.

For failed video preparation, retry in Studio. Use the following optional command only to retry or explicitly wait for all video components; repeat the exact `--home` used for setup:

```sh
npx --yes --package "{{PACKAGE_SPEC}}" openmotion prepare
```

Record exact version, OS/CPU, Node/Agent versions, environment, failure and redacted logs when reporting a defect. Keep successful components and live cache locks; do not reinstall unrelated hosts or replace projects.

## Upgrades

Back up projects before upgrading and reuse the same installation/data/Skills paths. Compatible phase-one updates retain active connections and exports; refresh host discovery for changed Tools or Skills. Reconnect closed transports. For an incompatible protocol, finish exports before updating that connection and its idle backend together. An old binary directory does not establish safe data downgrade.

Release identity: source `{{COMMIT}}`; npm tgz SHA256 `{{TGZ_SHA256}}`. [Installation details]({{DETAILS_URL}}).
