#!/usr/bin/env bash
# weather-now.sh — Current conditions (location-agnostic)
# Usage:
#   ./bin/weather-now.sh
#   ./bin/weather-now.sh "Chicago, Illinois, United States"
#   ./bin/weather-now.sh --location "New York, New York, United States"
# Output: reports/weather-now.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-now.md"

LOCATION_ARG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    *)
      LOCATION_ARG="$1"
      shift
      ;;
  esac
done

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

READING_TIME=$(TZ="$LOC_TZ" date '+%I:%M %p %Z on %A, %B %d, %Y')

echo "🌤️  Fetching current weather for ${LOC_NAME}..." >&2
echo "    Observation Time: ${READING_TIME}" >&2

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --tools "fetch_url" \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "Use fetch_url to call https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${LOC_TZ_ENCODED} and then write a clear, friendly current weather report for ${LOC_NAME}. State the station observation time as **${READING_TIME}** (local time, never UTC). All measurements must be in US English units: temperature and dew point in Fahrenheit (°F), wind speed and gusts in mph, and precipitation in inches (in). Do not use metric units. Include: conditions summary, temperature and feels-like, humidity, dew point, wind speed and direction, any precipitation, and a short 1-2 sentence outlook note. Format as clean markdown with Current Conditions — ${LOC_NAME} — ${READING_TIME} as the heading."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
