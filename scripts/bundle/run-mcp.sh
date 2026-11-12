#!/bin/sh
set -eu
openmotion_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$openmotion_root"
exec "$openmotion_root/runtime/node/bin/node" --experimental-strip-types --import "$openmotion_root/bootstrap.mjs" "$openmotion_root/mcp.ts"
