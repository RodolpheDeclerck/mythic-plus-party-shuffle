#!/usr/bin/env bash
# Run from repo root (Root Directory empty) or via render-web-build-entry.sh from UI folder.
set -euo pipefail
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"
cd "$(dirname "$0")/.."
# UI deploy only: skip mythic-plus-party-shuffle-api-nest (saves ~800 packages vs full monorepo npm ci).
npm ci -w mythic-plus-party-shuffle
npm run build -w mythic-plus-party-shuffle
