#!/usr/bin/env bash
# weather-window.sh — Find the next operational time window meeting specific conditions
# Usage:
#   ./bin/weather-window.sh "<condition description>"
#   ./bin/weather-window.sh "<condition description>" "Toronto, Ontario, Canada"
#   ./bin/weather-window.sh "<condition description>" --location "Chicago, Illinois, United States of America"
#
# Examples:
#   ./bin/weather-window.sh "temperature above 2C and at least 3C above the dew point for 24 hours"
#   ./bin/weather-window.sh "no precipitation and wind under 20 km/h" "Toronto, Ontario, Canada"
#
# Output: reports/weather-window.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

OUT="$REPORTS_DIR/weather-window.md"

CONDITION=""
LOCATION_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    *)
      if [[ -z "$CONDITION" ]]; then
        CONDITION="$1"
      else
        LOCATION_ARG="$1"
      fi
      shift
      ;;
  esac
done

CONDITION="${CONDITION:-temperature above 2C and at least 3C above the dew point for 24 hours}"

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

echo "🔍  Searching for next window in ${LOC_NAME} where: ${CONDITION}" >&2

# Run deterministic hourly scanner
node "$SCRIPT_DIR/scan-window.mjs" \
  --lat "$LOC_LAT" \
  --lon "$LOC_LON" \
  --tz "$LOC_TZ" \
  --location "$LOC_NAME" \
  "$CONDITION" > "$OUT"

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
