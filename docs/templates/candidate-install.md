# Install the OpenMotion {{VERSION}} candidate

This is a **local candidate installation guide**. It installs the complete `{{TGZ}}` next to this file, not an unpublished npm registry version. The application, MCP, built Studio and five Skills are embedded. Native browser/FFmpeg/ffprobe and locked npm dependencies still need network access when prepared. This candidate defaults to **{{TEMPLATE_ENVIRONMENT}} templates** (test uses DEV; stable uses prod). The source address is public configuration; service access still requires the appropriate network/authentication. The package contains no private catalog snapshot or credentials.

## Frozen identity

- Version: `{{VERSION}}`
- Source: `{{SOURCE_SHA}}`
- Local file: `{{TGZ}}`
- TGZ SHA256: `{{SHA256}}`

## Instructions for the Agent

1. Read `candidate.json` in this extracted directory. Require its version, source commit, tgz filename and hash to match the identity above. Calculate the local tgz SHA256 before running it. Stop on a missing file or any mismatch; do not substitute npm `test`, `latest` or another candidate.
2. Collect OS/CPU, Node/npm and the actual Agent host once. Apply the supported [isolated platform recipes]({{DETAILS_URL}}): separate the host profile/configuration, application home, project data and Skills directory. Preserve existing projects, credentials, MCP entries and daily Skills. `--home` alone does not isolate host configuration. Ask for a missing host/profile when it cannot be established reliably.
3. Use the **local tgz** with the selected host, with the isolation settings applied first:

   ```sh
   npx --yes --package "./{{TGZ}}" -- openmotion setup --host HOST
   ```

   Replace `HOST` with `codex`, `claude`, `deepseek` or `workbuddy`. Carry the explicit `--home`, `--data-dir`, `--skills-dir` and host-specific options from the platform recipe. Setup starts checked video-component downloads in the background. Do not run or wait for prepare to connect MCP, create/edit projects or open ordinary preview. Keep using this local package; no sidecar application/manifest download or source build is required.
4. Keep verification internal. Use working native tools or setup's `onboarding.directAccess` commands in this same chat; do not default to a new chat or restart. Verify the actual application version, **{{TEMPLATE_ENVIRONMENT}} template environment**, eleven MCP Tools, resources and five Skills, including a `openmotion_get_project` call against the isolated data directory. Direct access verifies the installed MCP, not native host discovery or creative acceptance. Follow setup's installation-success reply: confirm installation, then invite an eligible experience.

Keep installation/host loading and video-component readiness as separate internal evidence; include those details only in an explicitly requested acceptance report or when needed to resolve a blocked operation. Installation alone does not authorize creating a video or exporting an MP4.

## Video preparation and requested acceptance

1. Run the blocking prepare command only when the tester explicitly asks to wait for all video components or before requested acceptance cases that need media import, automated capture or export:

   ```sh
   npx --yes --package "./{{TGZ}}" -- openmotion prepare
   ```

   Repeat the same explicit `--home` used for setup. Studio shows component preparation status and retry; successful checked components are reused. Preparing dependencies does not run an export or complete acceptance.
2. Follow the tester's requested acceptance cases in `acceptance.md`: use an independent test project for template creation, editing, save/reopen and MP4 export. Do not modify an existing user project or start a paid provider call without its separate authorization. Retain technical export checks separately from real Agent creation and human audio/video playback.
3. Fill a **private copy** of `acceptance.md` with actual PASS / FAIL / NOT RUN results and evidence. Report failures and retain the generated candidate identity. Do not edit/re-upload the frozen candidate artifact. Do not publish npm, upload a guide or change a tag as part of installation/testing.

The sibling `install.md` is frozen for **after npm publication** and points at the exact registry version. Before publication, use this `candidate-install.md` and local tgz. Successful installation does not authorize release.
