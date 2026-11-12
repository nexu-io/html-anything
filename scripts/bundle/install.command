#!/bin/bash
set -euo pipefail
openmotion_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
"$openmotion_root/runtime/node/bin/node" "$openmotion_root/scripts/configure-plugin.mjs"
codex plugin marketplace add "$openmotion_root"
codex plugin add openmotion@openmotion-test
codex plugin list --marketplace openmotion-test
