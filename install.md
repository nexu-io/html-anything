# Install OpenMotion from source

For the local agent reading this guide: install and connect the public repository's `main` branch on this machine, then open its local template library. Use the same checkout for Studio and MCP.

## Clone and start

Use Git, npm and Node.js 26.11.1, the version pinned for source validation. Choose a persistent parent directory for the checkout and run:

```sh
git clone --depth 1 --single-branch --branch main https://github.com/nexu-io/openmotion.git
cd openmotion
npm ci
npm run build:studio
npm start
```

`--depth 1` downloads only the latest snapshot and `--single-branch --branch main` selects main. Optional reference videos and template archives stay excluded by default; download them only when needed. See [clone size and optional media](docs/repository-storage.md).

If the destination already exists, check its remote and local changes before reusing it, or choose another directory. Preserve existing work. Keep user projects and credentials outside the checkout, and preserve an existing `MOTION_DATA_DIR`. Studio and MCP must use the same data directory. Source preview and export use local Chrome/Chromium and FFmpeg/FFprobe; see [runtime setup](README.md#technical-guide) for requirements.

Use the actual `studioUrl` or `previewUrl` printed by startup. Keep this checkout in place after registration because the agent connection uses it.

## Connect the current agent

Read the checkout's `AGENTS.md`, then follow the existing [source plugin setup](README.md#agent-setup) for Codex or [manual MCP configuration](README.md#manual-mcp) for another local stdio client. The [agent connection guide](docs/agent-adapters.md) describes other host integrations. Connect this checkout's `mcp.ts` and the same data directory as Studio; configure only the current host and preserve unrelated MCP servers, Skills and credentials.

Discover the OpenMotion tools and call `openmotion_get_project` to verify the workspace. Registration alone does not prove that this chat is connected; report any actual connection limitation honestly.

## First run

Open the startup URL and choose **Template library**, or call `openmotion_open_preview` with `{"target":"templates"}` when MCP is available.

Follow the [installation-success contract](docs/install.md#installation-success-reply): open the template library in the calling chat's right panel, use native recommendations with `onboarding: true` when available so the component owns the persistent welcome, and otherwise use the library-only welcome copy. That section is the shared first-run contract; the npm setup commands and release placeholders elsewhere in that document apply to published applications. A card button fills an unsent draft; wait for the user's submitted requirements before creating a project.
