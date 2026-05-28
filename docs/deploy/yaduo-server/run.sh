#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/apps/html-anything}"
DATA_DIR="${DATA_DIR:-/opt/apps/html-anything-data}"
IMAGE="${IMAGE:-html-anything:local}"
CONTAINER="${CONTAINER:-html-anything}"
PORT="${PORT:-3100}"

mkdir -p "$DATA_DIR/codex" "$DATA_DIR/state"

if [ ! -f "$DATA_DIR/codex/config.toml" ]; then
  cat > "$DATA_DIR/codex/config.toml" <<'EOF'
model_provider = "codexzh"
model = "gpt-5.5"

[model_providers.codexzh]
name = "codexzh"
base_url = "http://host.docker.internal:2345/v1"
wire_api = "responses"
requires_openai_auth = true
web_search = "live"
EOF
fi

docker build -f "$APP_DIR/next/Dockerfile" -t "$IMAGE" "$APP_DIR"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  --add-host host.docker.internal:host-gateway \
  -p "$PORT:3000" \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e CODEX_HOME=/root/.codex \
  -e CODEX_BIN=/usr/local/bin/codex \
  -e HTML_ANYTHING_ALLOW_ANY_HOST=1 \
  -v "$DATA_DIR/codex:/root/.codex" \
  -v "$DATA_DIR/state:/root/.html-anything" \
  "$IMAGE"
