#!/bin/bash
# Run from a normal user terminal. Only registers OpenDesign; does not restart Codex.
set -euo pipefail

motion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
motion_logs="$motion_root/.artifacts/install"

command -v node >/dev/null || { echo '需要先安装 Node.js 22.18+'; exit 1; }
command -v npm >/dev/null || { echo '需要先安装 npm'; exit 1; }
command -v codex >/dev/null || { echo '未找到 codex CLI，请在能运行 codex 的终端执行此脚本。'; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<22||(major===22&&minor<18)){console.error("需要 Node.js 22.18+");process.exit(1)}'
codex plugin add --help >/dev/null || { echo '当前 Codex CLI 不支持插件安装，请升级后重试。'; exit 1; }

mkdir -p "$motion_root/.agents/plugins" "$motion_logs"
motion_catalog="$motion_root/.agents/plugins/marketplace.json"
if [ -e "$motion_catalog" ]; then
  node --input-type=module - "$motion_catalog" <<'JS'
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (catalog.name !== 'motion-local' || !catalog.plugins?.some(p => p.name === 'motion' && p.source?.source === 'local' && p.source.path === './')) {
  console.error('已有不同的 marketplace 配置，已停止，未覆盖该文件。'); process.exit(1);
}
JS
else
  cp "$motion_root/marketplace.example.json" "$motion_catalog"
fi

# Git checkouts omit studio/build; release ZIPs already contain the editor.
if [ ! -f "$motion_root/studio/build/index.html" ]; then
  echo '首次从源码安装：下载锁定依赖并构建编辑器。'
  (
    cd "$motion_root"
    npm ci --include=dev
    npm run build:studio
  )
fi

# Prepare the shared handoff before changing host registration.
motion_onboarding="$(node --experimental-strip-types "$motion_root/scripts/install-onboarding.mjs" "$motion_root")"

echo '只注册 motion-local 并安装 OpenMotion，不升级或移除其他插件。'
codex plugin marketplace add "$motion_root"
codex plugin add motion@motion-local
codex plugin list --marketplace motion-local
node "$motion_root/scripts/check-installed-mcp.mjs"

printf '%s\n' 'OpenMotion registration and independent MCP preflight succeeded; current-chat loading is not verified.' "$motion_onboarding"
