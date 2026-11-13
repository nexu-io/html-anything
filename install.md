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

Configure the current host only, preserving unrelated MCP servers, Skills and credentials. Read the checkout's `AGENTS.md` before continuing.

For Codex with plugin support, run from the checkout:

```sh
bash scripts/install-motion.command
```

This registers this checkout's plugin, Skills and MCP server and performs an independent MCP preflight. It does not verify that the current chat has loaded the tools.

For another local client, use its supported local stdio MCP configuration to launch this checkout's `mcp.ts` with Node and `--experimental-strip-types`. Resolve Node and the checkout to absolute paths, and use the same `MOTION_DATA_DIR` as Studio. Follow the [manual MCP configuration](README.md#manual-mcp) and [agent connection guide](docs/agent-adapters.md). MCP clients can read the production guidance through resources on the same server.

Verify the real connection by discovering the OpenMotion tools and calling `openmotion_get_project` to read workspace state. Registration alone is not proof that this chat is connected. If current-chat discovery is unavailable, report that limitation and provide the working local library URL; do not claim a connection you have not verified.

## First run

Open the local template library at the startup URL, or call `openmotion_open_preview` with `{"target":"templates"}` when MCP is available. Browse with `openmotion_list_templates` and inspect a candidate with `openmotion_get_template`.

Tell the user setup is complete, provide the actual library link and suggest a template. Ask them to confirm the choice before creating a project. Browsing and installation do not authorize project creation, rendering or paid model calls.
