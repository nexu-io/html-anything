# Install OpenMotion {{VERSION}}

This guide pins the complete npm application `{{PACKAGE_SPEC}}` on the **{{CHANNEL}}** software channel. It includes MCP, the built Studio and production Skills. The default template environment is **{{TEMPLATE_ENVIRONMENT}}**: new test versions embed DEV defaults, stable versions embed prod, and previously published versions keep their original environment.

If you are reading this file in the source repository and see `{{...}}`, it is a template, not a published installation instruction. Do not guess a package name or version.

## Instructions for the Agent

1. Collect OS/CPU, Node.js/npm versions and the current Agent identity together, using the host's supplied context where available. Node.js 22.18+ with npm and the Agent must already be installed. Supported native targets: {{TARGETS}}. If a macOS target has no declared minimum version, proceed with setup and native executable checks; do not infer a minimum from the build/test machine's OS version. Do not claim support for another target from package-download success.
2. Select the current host explicitly: `codex` (Codex), `claude` (Claude Code), `deepseek` (DeepSeek Harness) or `workbuddy` (WorkBuddy). An explicit user selection takes precedence. Do not infer the current host from which CLIs happen to be installed. Ask only when the current host or required profile cannot be established. Configure only that host; preserve projects, credentials and unrelated MCP/Skills settings.
3. For a test candidate, use a separate host profile, application home, project data and Skills directory. Keep those paths and reuse them for prepare and future reconnects. The [platform installation recipes]({{DETAILS_URL}}) describe the actual supported options. Do not run a test candidate into the user's daily profile by default.
4. Choose exactly one setup command below, applying the test isolation paths first when required. Setup starts checked video-component downloads in the background. Do not wait for prepare to connect MCP, create/edit projects or open ordinary preview. Studio shows preparation status and retry; media import, automated capture and export require their respective components. Compatible phase-one updates can keep existing connections; reconnect closed or incompatible transports. When the current host can discover the public Tools and production Skills, verify the version/environment and make an actual `openmotion_get_project` call. If this chat has not loaded them or still points at another installation, use `onboarding.directAccess` below; registration alone does not prove native loading. Do not postpone the installation reply or template library opening until a new chat or the first MCP call.
5. On successful setup, follow the installation-success reply below in this same conversation. Open the template library without creating a project. Installation does not authorize downloading template project source, rendering or calling a paid model. Report a failed installation honestly; do not claim success until it is fixed.

For npm network failures, automatically try `https://registry.npmjs.org` then `https://registry.npmmirror.com`, at most once per registry, counting the initial failed attempt. Respect an explicitly selected registry and host policy. Set `npm_config_registry` and `npm_config_fetch_retries=0` only for that attempt, including setup's npm child process. Keep the exact version; verify any mirrored tgz against the matching immutable guide's SHA256 before executing it. If both fail, follow [npm download recovery]({{DETAILS_URL}}#npm-download-failures) for network checks and a terminal handoff. Permission or checksum failures stop immediately. A local tgz still needs npm access for setup's production dependencies.

<!-- installation-onboarding:start -->
## Installation-success reply

Every successful Agent-led OpenMotion installation opens the editor's template library in the current conversation. Do not ask whether to experience a recommended template or wait for a yes/no reply before opening the library. Respect an explicit request not to open it, or a previous refusal/deferment. If the user already explicitly requested creation with an exact template, continue that authorized task directly.

Codex plugin setup reaches this same contract through the packaged `extensions.com.openai.onboardingSkill` entry. Reuse the installed connection; onboarding does not run setup again.

### Open the library without creating a project

1. If the current chat has loaded MCP, call `openmotion_open_preview({target: "templates"})`. Do not supply a projectId/sessionId or create a placeholder project. The result is a page handoff without a project revision/version.
2. Otherwise use `onboarding.preview.previewUrl` and its `previewHandoff` from setup. The installer prepares the same local page independently of current-chat MCP discovery. Do not require a new chat, repeat installation, or create a project to obtain a link. `onboarding.catalog` is compatibility data, not a required recommendation or creation step.
3. Follow the returned handoff to present the exact URL in the host's built-in browser/panel in the calling chat. In Codex, use `open_in_codex` with `placement: "right"` and the exact browser URL, without another threadId. If no inspectable tab appears, use the calling chat’s IAB tab list to find the library (its URL may gain saved-project parameters); if absent, create an IAB tab for the same real previewUrl with `visible: true`. Check browser visibility and the actual library content. Native Codex app automation is unnecessary. Preserve embed/query parameters. Queue when the chat is inactive; only an explicit show-now request permits switching chats. Observe that the template library is visible before saying it opened. A prepared URL or queued acknowledgment does not establish visibility. Do not submit project `record_display` receipts for the library.
4. If the host has no browser/panel, provide the actual library link and explain that it could not be opened automatically. If setup returned `onboarding.preview.status=unavailable`, report the installation result and the concrete preview failure; retry with the templates target when MCP is available. Never claim opening succeeded or silently create a fallback project.

### Optional native recommendations in Codex

After the library is visibly open, if this Codex chat **natively discovers** `openmotion_show_template_recommendations`, call it once with `templateIds: ["product-promo", "nyt-graph", "decision-tree"], onboarding: true, language: "zh"` (set `language` from the latest user request, not the host UI). Supported language codes are `zh`, `en`, `ja`, `ko`, `fr`, `es` and `pt`; use the user’s explicit output-language preference when given and `en` for unsupported languages. Always supply `language` for ordinary recommendations too. This first-run component owns the persistent welcome above three approved full-video cards. The Agent does not send that welcome as commentary or final text: Codex collapses commentary after the turn. The ordinary recommendation call omits `onboarding` and keeps its existing cards-only behavior. Preserve the returned card order and exact titles. A numbered reply selects the corresponding card and authorizes the offered editable sample copy unless the user supplies a different scope; carry any requirements forward. A generic yes still needs an exact selection.

The optional presentation is available only when this connection declares the MCP Apps MIME capability and its bundled resources pass verification. Installation registration, the direct CLI client or another chat's successful call does not establish availability in this chat. If the tool is absent, disabled, fails or has not visibly appeared, keep the existing library and text guidance; do not force a reconnect/new chat or delay the installation reply, repeat the presentation call, render a preview or create a placeholder project. Never claim video playback from a cover alone.

The card's **Recreate template** button (Chinese: **复刻模板**) prepares an editable prompt in the active composer, with the selected template title/ID and space for requirements. It uses the negotiated `openai/message` extension with `target: "active", send: false`, preserving the existing draft and attachments. Clicking the button does not submit a task or authorize creation/export. Unsupported clients show a copyable prompt instead of sending. Wait for the user to edit and send their brief, then continue the existing template Skill with the complete requirements and requested delivery. Do not replace a customized brief with the legacy frozen sample `createArgs`. For an explicitly accepted unchanged sample copy, retain the returned stable `requestId` and complete unchanged inputs on retry; do not append a current `sessionId`. Reuse a confirmed project from this experience, and never create a duplicate merely because cards were redisplayed.

For native onboarding, the component renders the installation/library heading, the first-person product introduction, library search/browse guidance, the recommendation invitation and the card-button guidance, followed by three cards. Do not add a Motion.md explanation or numbered-reply invitation. Template titles and descriptions appear only in the cards, without a second numbered description list. The card button fills an unsent draft; a later user-sent brief starts creation. The separate Studio **Open and edit** action remains unchanged.

After a successful native presentation, end without an additional text reply. Keep verification notes, tool visibility uncertainty, acknowledgments and duplicated invitations out of the user-facing onboarding. Verify inline behavior in the test report, not under the cards. Report an actual tool/presentation error briefly when it occurs; do not convert inability to inspect an inline widget into an unsolicited error message. For a non-UI host, use the library-only fallback below. Omit version/environment, configuration paths, MCP/Skill/tool counts, probe results and background preparation. Installation alone does not prove current-chat connection.

Do not ask the user to refresh/reconnect, restart the host or open a new chat by default. When native tools are missing or stale, use setup’s `onboarding.directAccess`: run its `command` with `toolsArgs`, read the public input schemas, then run `callArgs` with the selected Tool and a JSON arguments file. It uses this installation’s actual registered MCP transport, version and data directory, so the current chat can continue without restarting or opening another chat. It does not refresh native discovery. Keep these technical details internal. Never bypass disabled tools, permission denials or host policy. Attempt supported host recovery only if direct access is unavailable or fails. If user action is still necessary, briefly explain the specific blocker and the minimum supported next step. Mention video-component preparation only when it blocks the requested operation. Preserve the accepted template choice and existing work across recovery.

Browsing, filtering, opening template details, playing a preview and closing the library do not authorize project creation. Selecting **Open and edit** creates an independent editable copy through Studio. Do not create a duplicate Agent project after that GUI action; continue the actual project the user selected or provide its exact project link to bind the Agent. External reference-only entries require an explicit reconstruction request rather than pretending they have editable source.

After acceptance, use openmotion-template-to-video only when the user explicitly asks the Agent to create with an exact template. Preserve that template ID, use unchanged sample content unless requested otherwise, and create one independent project with a stable requestId. A generic “yes/体验” without a selected template is insufficient; ask which template. Reuse an already created experience project and preserve existing work. Do not repeat optional material/brand/style questions or silently substitute another template on failure. Open the actual editable project and check loading/playback when the host supports it; otherwise provide its actual link and state the limitation. Export only on request. A refusal/deferment stops the experience. No invitation-state service or “invitation sent/seen” telemetry is implied.

Reference copy rendered inside the native onboarding component, not a separate Agent message:

```text
🎉 **OpenMotion 安装好啦，右侧就是模板库！**

我是你的开源视频创作搭档，我有丰富的高水准视频模板，也支持从参考视频或一个灵感出发，和你一起创作精彩的视频。

模板库支持搜索，也可以随意浏览，找到喜欢的点击「复刻模板」就能开始你的创作！

**不想自己找？先看看我挑的这 3 个 👇**

你可以点击下方卡片上的「复刻模板」，然后补充「我的要求」或添加附件，发送后就开始创作！
```

Example when the right-hand library is visible but native cards are unavailable:

```text
🎉 OpenMotion 安装好啦，右侧就是模板库！

我是你的开源视频创作搭档，我有丰富的高水准视频模板，也支持从参考视频或一个灵感出发，和你一起创作精彩的视频。

模板库支持搜索，也可以随意浏览，找到喜欢的点击「复刻模板」就能开始你的创作！
```

The first example documents component-owned content; never paste it into an Agent progress message. Use the library-only fallback when native presentation is unavailable. If the library is queued, blocked, declined or cannot be observed, replace the opening claim with that actual result and an exact usable link when available. If native presentation is unavailable before the welcome, use the library-only fallback without a card invitation.
<!-- installation-onboarding:end -->

## Choose the selected host's setup command

The commands below show normal installations. For test candidates, apply the separate configuration/profile, home, data and Skills paths from the [platform recipes]({{DETAILS_URL}}) first. Run only the selected row.

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

There is no persisted switch-environment command in this version. Test versions embed DEV defaults and use an environment-specific installation; stable versions embed prod. DEV access still requires the service network/authentication. A public npm package does not grant access or bundle private catalog contents. When changing environment, use a separate home/data/profile; merely setting an environment variable while running setup does not configure a later desktop Agent. Do not silently fall back from one environment to another.

## Upgrade, recovery and feedback

Pin this exact version when reproducing an issue. Before an upgrade, back up project data and preserve the same installation/data paths. Compatible phase-one updates retain existing connections and active exports. For an incompatible protocol, finish active exports before updating only this installation's connection and idle backend together; reconnect after setup/prepare. Refresh host discovery for new Tools or Skills, and preserve unrelated settings. Older applications may not read newer data formats: compatible reinstall or backup restoration requires separate verification. Moving a server-side default does not downgrade installed clients.

Include the exact version, OS/CPU, Node/Agent versions, template environment, project/revision, reproduction and redacted logs in a report. Installation, real Agent creation, technical MP4 export and human audiovisual acceptance are separate results.

Release identity: source `{{COMMIT}}`; npm tgz SHA256 `{{TGZ_SHA256}}`. [Source and installation details]({{DETAILS_URL}}).
