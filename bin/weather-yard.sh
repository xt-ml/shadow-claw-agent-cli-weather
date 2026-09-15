#!/usr/bin/env bash
# weather-yard.sh — Outdoor and yard work advice (location-agnostic)
# Usage:
#   ./bin/weather-yard.sh [optional task]
#   ./bin/weather-yard.sh "lawn seeding" "Toronto, Ontario, Canada"
#   ./bin/weather-yard.sh "fence painting" --location "Chicago, Illinois, United States of America"
# Output: reports/weather-yard.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-yard.md"

TASK=""
LOCATION_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    *)
      if [[ -z "$TASK" ]]; then
        TASK="$1"
      else
        LOCATION_ARG="$1"
      fi
      shift
      ;;
  esac
done

TASK="${TASK:-general yard and outdoor work}"

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

echo "🌿  Getting outdoor/yard advice for: ${TASK} in ${LOC_NAME}..." >&2

# Get current month for seasonal context
MONTH=$(date +%B)
YEAR=$(date +%Y)

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --tools "fetch_url" \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "Use fetch_url to call https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&hourly=temperature_2m,dew_point_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${LOC_TZ_ENCODED}&forecast_days=7

It is currently ${MONTH} ${YEAR} in ${LOC_NAME}.
The user wants advice about: ${TASK}

Based on the 7-day forecast data:
1. Identify the BEST day(s) and specific time windows this week to do this work (low wind, no precipitation, comfortable temps)
2. Identify which days to AVOID and why (e.g. rain, high winds >30km/h, frost risk, excessive heat)
3. Give specific, practical advice for the task given current soil/moisture and temperature conditions
4. Highlight any safety considerations (wind gusts, sun exposure, lightning risk if thunderstorms forecasted)

Format as a clean, actionable markdown briefing."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
