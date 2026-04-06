#!/usr/bin/env bash
# When Render "Root Directory" is mythic-plus-party-shuffle-ui, cwd is this folder; repo root is parent.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$REPO_ROOT/scripts/render-web-build.sh"
