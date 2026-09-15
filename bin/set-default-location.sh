#!/usr/bin/env bash
# set-default-location.sh — View or set the persistent default weather location
# Usage:
#   ./bin/set-default-location.sh [location-string]
#   ./bin/set-default-location.sh --reset
#   ./bin/set-default-location.sh (prints current default)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache"
DEFAULT_FILE="$CACHE_DIR/default-location.json"

if [[ "${1:-}" == "--reset" ]]; then
  if [[ -f "$DEFAULT_FILE" ]]; then
    rm -f "$DEFAULT_FILE"
    echo "Reset default location back to hardcoded fallback: Chicago, Illinois, United States"
  else
    echo "Default location is already the fallback (Chicago, Illinois, United States)."
  fi
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  node "$SCRIPT_DIR/resolve-location.mjs" --set-default "$1"
else
  echo "Current default location:"
  node "$SCRIPT_DIR/resolve-location.mjs" --json
fi
