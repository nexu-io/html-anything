#!/bin/bash
# Run from a normal user terminal. Only registers OpenMotion; does not restart Codex.
set -euo pipefail

openmotion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
openmotion_logs="$openmotion_root/.artifacts/install"

command -v node >/dev/null || { echo '需要先安装 Node.js 22.18+'; exit 1; }
command -v npm >/dev/null || { echo '需要先安装 npm'; exit 1; }
command -v codex >/dev/null || { echo '未找到 codex CLI，请在能运行 codex 的终端执行此脚本。'; exit 1; }
node -e 'const [major,minor]=process.versions.node.split(".").map(Number);if(major<22||(major===22&&minor<18)){console.error("需要 Node.js 22.18+");process.exit(1)}'
codex plugin add --help >/dev/null || { echo '当前 Codex CLI 不支持插件安装，请升级后重试。'; exit 1; }

mkdir -p "$openmotion_root/.agents/plugins" "$openmotion_logs"
openmotion_catalog="$openmotion_root/.agents/plugins/marketplace.json"
if [ -e "$openmotion_catalog" ]; then
  node --input-type=module - "$openmotion_catalog" <<'JS'
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (catalog.name !== 'openmotion-local' || !catalog.plugins?.some(p => p.name === 'openmotion' && p.source?.source === 'local' && p.source.path === './')) {
  console.error('已有不同的 marketplace 配置，已停止，未覆盖该文件。'); process.exit(1);
}
JS
else
  cp "$openmotion_root/marketplace.example.json" "$openmotion_catalog"
fi

# Git checkouts omit studio/build; release ZIPs already contain the editor.
if [ ! -f "$openmotion_root/studio/build/index.html" ]; then
  echo '首次从源码安装：下载锁定依赖并构建编辑器。'
  (
    cd "$openmotion_root"
    npm ci --include=dev
    npm run build:studio
  )
fi

# Validate the contract before registration; prepare the live page only after success.
node --experimental-strip-types "$openmotion_root/scripts/install-onboarding.mjs" "$openmotion_root" --check-contract

echo '只注册 openmotion-local 并安装 OpenMotion，不升级或移除其他插件。'
codex plugin marketplace add "$openmotion_root"
codex plugin add openmotion@openmotion-local
codex plugin list --marketplace openmotion-local
node "$openmotion_root/scripts/check-installed-mcp.mjs"

openmotion_onboarding="$(node --experimental-strip-types "$openmotion_root/scripts/install-onboarding.mjs" "$openmotion_root")"
printf '%s\n' 'OpenMotion registration and independent MCP preflight succeeded; current-chat loading is not verified.' "$openmotion_onboarding"
