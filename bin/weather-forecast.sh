#!/usr/bin/env bash
# weather-forecast.sh — Multi-day forecast (location-agnostic)
# Usage:
#   ./bin/weather-forecast.sh [days]
#   ./bin/weather-forecast.sh 5 "Chicago, Illinois, United States"
#   ./bin/weather-forecast.sh --location "New York, New York, United States"
# Output: reports/weather-forecast.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-forecast.md"

DAYS=7
LOCATION_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    [0-9]*)
      DAYS="$1"
      shift
      ;;
    *)
      LOCATION_ARG="$1"
      shift
      ;;
  esac
done

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

echo "📅  Fetching ${DAYS}-day forecast for ${LOC_NAME}..." >&2

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --tools "fetch_url" \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "Use fetch_url to call https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&hourly=temperature_2m,dew_point_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,visibility,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,snowfall_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${LOC_TZ_ENCODED}&forecast_days=${DAYS} then write a clear ${DAYS}-day forecast report for ${LOC_NAME}. For each day: show the date, high/low temp, feels-like range, weather description (translate the WMO code), precipitation total, max wind with gusts, and sunrise/sunset times. End with a brief summary paragraph noting any significant weather events in the period. Format as clean markdown."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
