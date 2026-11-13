# Install OpenMotion from source

For the local Agent reading this guide: clone the public repository's `main` branch, build OpenMotion on this machine, connect it to the current Agent, and open its template library. Use the same checkout for Studio and MCP. This installs the current source, not the npm stable version; record the actual Git commit for troubleshooting.

## Prepare the environment

1. Identify OS/CPU, Node/npm, the current Agent and existing installation/data paths. Use Git, npm and the Node.js version pinned for source validation in the selected checkout's `.github/workflows/ci.yml` (currently 26.11.1). Source requirements and runtime compatibility are separate from real-host acceptance; do not claim Windows installation/export was tested merely because a build passed.
2. Locate working Chrome/Chromium, FFmpeg and FFprobe executables. Source setup does not run the npm installer's managed native downloads or create `run-mcp.mjs`. Reuse suitable installed tools, or install missing tools from their official distributions into the user's selected persistent location. The [runtime lock](https://github.com/nexu-io/openmotion/blob/main/scripts/runtime-lock.json) records the versions used for packaged validation.
3. Use actual absolute paths. Verify Node with `--version`, the browser with `--version`, and FFmpeg/FFprobe with `-version`. On Windows, verify the actual `.exe` files. Stop and diagnose a failed check before reporting readiness.
4. Preserve existing projects, credentials, host configuration and customized Skills. Keep project data outside the checkout and preserve an existing `MOTION_DATA_DIR`; honor selected application/data drives. Installing from source does not repair render-time browser resource failures.

## Clone and build

Choose a persistent parent directory for the checkout. If the destination already exists, inspect its remote, branch and local changes before reusing it, or choose a separate directory. Do not reset or overwrite an existing checkout or reuse another installation's data without checking it.

```sh
git clone --depth 1 --single-branch --branch main https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
git rev-parse HEAD
```

Run each command only after the preceding command succeeds. In Windows PowerShell, use `npm.cmd ci` and `npm.cmd run build:studio` if `npm.ps1` is blocked by execution policy; this does not require changing that policy. Record the full output of `git rev-parse HEAD` as the installed source identity. Keep the checkout in place after registration.

The shallow clone selects the current main snapshot. Optional reference videos and template archives stay excluded by default; pull only the assets needed for an explicit task. Do not download every optional showcase asset to install the application. See [clone size and scoped media](https://github.com/nexu-io/openmotion/blob/main/docs/repository-storage.md).

## Connect the current Agent

Read the checkout's `AGENTS.md`. Configure the current client's **local stdio MCP** connection directly; do not run `openmotion setup --host` or borrow another Agent's adapter for this source installation.

Use the actual absolute Node executable (`node -p "process.execPath"` reports it), the absolute checkout path, and the selected data/native-tool paths. For clients with an `mcpServers` object, merge this entry while preserving other servers:

```json
{
  "mcpServers": {
    "openmotion": {
      "command": "D:/Node/node.exe",
      "args": ["--experimental-strip-types", "D:/OpenMotion/source/mcp.ts"],
      "cwd": "D:/OpenMotion/source",
      "env": {
        "MOTION_DATA_DIR": "D:/OpenMotion/data",
        "HYPERFRAMES_BROWSER_PATH": "D:/Tools/Chrome/chrome.exe",
        "HYPERFRAMES_FFMPEG_PATH": "D:/Tools/ffmpeg/bin/ffmpeg.exe",
        "HYPERFRAMES_FFPROBE_PATH": "D:/Tools/ffmpeg/bin/ffprobe.exe"
      }
    }
  }
}
```

These Windows paths are examples: replace every path with a verified location. JSON accepts forward slashes. On macOS/Linux use their actual executable and directory paths instead. Other clients require their own schema; do not paste `mcpServers` into an incompatible format. For OpenCode V2, use `mcp.servers.openmotion`, `type: "local"`, `command: [NODE, "--experimental-strip-types", MCP_TS]`, `cwd` and `environment`; OpenCode V1 puts the server directly under `mcp`. Follow the [client's MCP documentation](https://opencode.ai/docs/mcp-servers/) for its installed version and preserve its permissions.

The host starts the stdio process. A separately running `npm run mcp` terminal does not establish that connection. On Windows, start `node.exe` directly, without `claude.cmd`, `npm.cmd`, a shell command string or another host's CLI. Source installations have no npm-generated launcher; explicit environment paths replace that launcher's native-tool configuration.

Install the five production Skills from this checkout's `skills/` directory using the current client's supported layout. Preserve relative references and shared documentation; use the [source plugin/adapter instructions](https://github.com/nexu-io/openmotion/blob/main/docs/agent-adapters.md), or MCP workflow resources where the client cannot load Skills. Do not copy repository contributor Skills from `.agents/skills/` into a product installation. Report unavailable host capabilities accurately.

Source checkouts default to the repository template catalog. To use the published production catalog explicitly, set `MOTION_TEMPLATE_SOURCE=cms` and `MOTION_TEMPLATE_ENV=prod` in the actual MCP process and any separately started Studio process. Do not silently change catalog sources or data directories to work around a failure.

## Verify and open

Discover the advertised public Tools and workflow resources through the actual host connection. Call `openmotion_get_project` and confirm the expected data directory before editing. Registration, a running process and tool discovery are distinct checks; do not claim the current chat is connected without a real host call.

Call `openmotion_open_preview` with `{"target":"templates"}` and present its actual URL in the current conversation. If the host cannot display it, provide the real link and state that limitation. If starting Studio separately with `npm start` (`npm.cmd start` in Windows PowerShell), use the same checkout, `MOTION_DATA_DIR` and native-tool environment as MCP. Use the returned `studioUrl`/`previewUrl`, not a guessed port. MCP starts/reuses its backend on demand; a separate terminal server is optional.

Follow the [installation-success reply and template-selection rules](https://github.com/nexu-io/openmotion/blob/main/docs/install.md#installation-success-reply). That section is shared first-run guidance; the npm setup commands and release placeholders elsewhere in that document do not apply to this source path. Browsing the library does not authorize creating a project, rendering a video or calling a paid model. Preserve an explicitly selected template and continue only the work the user requested.

An update to this guide or the npm latest tag does not update an installed checkout. Before an explicit source update, inspect local changes, back up user data as needed, and retain the prior commit. Never discard work or blindly replay project mutations. Record unverified Windows/native/host/rendering results separately.
