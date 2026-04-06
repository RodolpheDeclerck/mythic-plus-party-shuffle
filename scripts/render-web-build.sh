#!/usr/bin/env bash
# Run from repo root (Root Directory empty) or via render-web-build-entry.sh from UI folder.
set -euo pipefail
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=4096"
cd "$(dirname "$0")/.."
npm ci
npm run build -w mythic-plus-party-shuffle
