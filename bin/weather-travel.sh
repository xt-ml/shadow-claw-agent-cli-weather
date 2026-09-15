#!/usr/bin/env bash
# weather-travel.sh — Highway travel and driving advice (location-agnostic)
# Usage:
#   ./bin/weather-travel.sh [optional destination/route]
#   ./bin/weather-travel.sh "drive to Indianapolis via I-65" "Chicago, Illinois, United States of America"
#   ./bin/weather-travel.sh "drive to Milwaukee via I-94" --location "Chicago, Illinois, United States of America"
# Output: reports/weather-travel.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-travel.md"

TRIP=""
LOCATION_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    *)
      if [[ -z "$TRIP" ]]; then
        TRIP="$1"
      else
        LOCATION_ARG="$1"
      fi
      shift
      ;;
  esac
done

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

TRIP="${TRIP:-general driving conditions from ${LOC_NAME} this week}"

echo "🚗  Checking travel conditions for: ${TRIP} (Origin: ${LOC_NAME})..." >&2

FORECAST_SUMMARY="$(node "$SCRIPT_DIR/summarize-forecast.mjs" --lat "$LOC_LAT" --lon "$LOC_LON" --tz "$LOC_TZ" --days 7)"

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "Here is the verified 7-day weather forecast for ${LOC_NAME}:
${FORECAST_SUMMARY}

The user is planning: ${TRIP}
Origin / Area: ${LOC_NAME}

Based strictly on the forecast data above, provide a travel conditions report:

## 🚦 Overall Travel Verdict
- State Go, Caution, or Avoid with a clear one-line reason based on the actual weather data.

## ⚠️ Hazard Watch (next 7 days)
- Identify any notable driving hazards present in the forecast (such as heavy rain, reduced visibility/fog, or high wind gusts). If a hazard category is not indicated by the data, do not list it.

## 📅 Day-by-Day Travel Windows
- Provide driving guidance for each of the next 3 days based on the forecast.

## 🎒 Local Travel Tips
- 2-3 specific seasonal tips for driving in the ${LOC_NAME} region right now.

Format as clean, readable markdown."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
