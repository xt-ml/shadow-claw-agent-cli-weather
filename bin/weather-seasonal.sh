#!/usr/bin/env bash
# weather-seasonal.sh — Seasonal weather and property advice (location-agnostic)
# Usage:
#   ./bin/weather-seasonal.sh
#   ./bin/weather-seasonal.sh "Toronto, Ontario, Canada"
#   ./bin/weather-seasonal.sh --location "Chicago, Illinois, United States of America"
# Output: reports/weather-seasonal.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-seasonal.md"

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

echo "🍂  Generating seasonal advice for ${LOC_NAME}..." >&2

MONTH=$(date +%B)
YEAR=$(date +%Y)
DAY=$(date +%d)

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --tools "fetch_url" \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "Use fetch_url to call this URL:

https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,dew_point_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${LOC_TZ_ENCODED}&forecast_days=14

Today is ${DAY} ${MONTH} ${YEAR}. Location: ${LOC_NAME}.

Write a detailed seasonal property & garden advice report covering:

## 🗓️ Where We Are in the Season
- What stage of the growing/dormancy cycle this is for the ${LOC_NAME} climate
- Key milestones to watch for (first frost, last frost, freeze-up, green-up, etc.)
- How this year's current conditions compare to typical expectations for this date

## 🏡 Property & Infrastructure Checklist
- Outdoor water lines / hoses (drain before first hard freeze: < -2°C)
- Gutters & drainage (before freeze-up in late autumn)
- Snow/winter prep (driveway markers, snowblower/shovels, store outdoor furniture)
- Heating / draft proofing (filter changes, weather stripping)
- Vehicle prep (tires, winter fluids, battery/block heater if applicable)

## 🌱 Garden & Yard Transition
- What can still be harvested or planted now (if anything)
- Perennial and shrub protection (fall watering before ground freeze, mulching)
- Pest & rodent prevention (rodent control before mice move indoors with cool weather)

## 🌡️ Temperature Trends & Outlook
- Looking at the 14-day data: are we above/below normal, and is a sharp freeze incoming?

Format as clear, well-structured markdown."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
