# Install OpenMotion {{VERSION}}

This guide pins the complete npm application `{{PACKAGE_SPEC}}` on the **{{CHANNEL}}** software channel. It includes MCP, the built Studio and five Skills. The default template environment is **{{TEMPLATE_ENVIRONMENT}}**; a software test version does not select DEV templates.

If you are reading this file in the source repository and see `{{...}}`, it is a template, not a published installation instruction. Do not guess a package name or version.

## Instructions for the Agent

1. Check the user's OS/CPU, Node.js and npm, and selected Agent. Node.js 22.18+ with npm and the Agent must already be installed. Supported native targets: {{TARGETS}}. Do not claim support for another target from package-download success.
2. Use the current host if it is supported; otherwise ask the user to select one. Setup supports `codex`, `claude`, `deepseek` and `workbuddy`. Configure only that host. Preserve existing projects, credentials and unrelated MCP/Skills settings.
3. For a test candidate, use a separate host profile, application home, project data and Skills directory. Keep those paths and reuse them for prepare and future reconnects. The [platform installation recipes]({{DETAILS_URL}}) describe the actual supported options. Do not run a test candidate into the user's daily profile by default.
4. Install the exact package version below, run prepare, then reconnect/reload that host. Confirm the application version, template environment, eleven public Tools and five Skills. A registration entry alone does not prove the host has loaded them.
5. Report the result and any failed step. Introduce the available capabilities and wait for the user's next request. Installation does not authorize generating a video or calling a paid model.

For a normal Codex installation, the command shape is:

```sh
npx --yes --package "{{PACKAGE_SPEC}}" openmotion setup --host codex
npx --yes --package "{{PACKAGE_SPEC}}" openmotion prepare
```

For test installations, add the isolated paths/profile from step 3 before executing. For another supported host, use its setup `--host` value and documented profile settings. Setup installs the selected host's MCP and Skills; a second installer or application/manifest download is unnecessary.

## Runtime and environment

Setup copies the checked application into a managed writable directory and installs its locked production npm dependencies. The application and user projects do not run from the temporary npx cache. FFmpeg, ffprobe and the browser are downloaded and verified by prepare or first native use; this is not an offline package.

There is no persisted switch-environment command in this version. Internal DEV testing uses its separately configured installation; merely setting an environment variable while running setup does not configure a later desktop Agent. Do not silently fall back from one environment to another.

## Upgrade, recovery and feedback

Pin this exact version when reproducing an issue. Before an upgrade, finish active exports, back up project data and close only this installation's old MCP/backend connections; reconnect after setup/prepare. Preserve unrelated settings. Older applications may not read newer data formats: compatible reinstall or backup restoration requires separate verification. Moving a server-side default does not downgrade installed clients.

Include the exact version, OS/CPU, Node/Agent versions, template environment, project/revision, reproduction and redacted logs in a report. Installation, real Agent creation, technical MP4 export and human audiovisual acceptance are separate results.

Release identity: source `{{COMMIT}}`; npm tgz SHA256 `{{TGZ_SHA256}}`. [Source and installation details]({{DETAILS_URL}}).
