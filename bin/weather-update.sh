#!/usr/bin/env bash
# weather-update.sh — Comprehensive daily weather briefing (location-agnostic)
# Usage:
#   ./bin/weather-update.sh
#   ./bin/weather-update.sh "Toronto, Ontario, Canada"
#   ./bin/weather-update.sh --location "Chicago, Illinois, United States of America"
# Output: reports/weather-update.md (and stdout)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"
mkdir -p "$REPORTS_DIR"

SC="npx shadow-claw"
OUT="$REPORTS_DIR/weather-update.md"
DATE_STR=$(date '+%A, %B %d %Y — %H:%M %Z')

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

echo "🌤️  Building daily weather briefing for ${LOC_NAME}..." >&2
echo "    ${DATE_STR}" >&2
echo "" >&2

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
  "Use fetch_url to call BOTH of these URLs and incorporate all data into your report:

URL 1 — Current conditions + 7-day forecast:
https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&hourly=temperature_2m,dew_point_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,snowfall,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,visibility,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=${LOC_TZ_ENCODED}&forecast_days=7

URL 2 — Air quality:
https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=european_aqi,pm10,pm2_5,uv_index&timezone=${LOC_TZ_ENCODED}

Location: ${LOC_NAME}
Heading: Weather Briefing — ${LOC_NAME} — ${DATE_STR}

Report structure:
## 1. 🌡️ Current Conditions
- Temperature & feels-like, condition description, humidity, dew point, wind (speed, gusts, direction), precipitation today

## 2. 🌬️ Air Quality & UV
- European AQI, PM2.5, PM10, UV index (and sun protection advice if applicable)

## 3. 📅 7-Day Forecast Highlights
- A clean markdown table: Date | Condition | High | Low | Rain/Snow (mm) | Wind/Gusts (km/h)
- Notable weather events (cold snaps, heavy rain/snow, high wind days)

## 4. 🚜 Practical Living Advice (${LOC_NAME} — ${MONTH} ${YEAR})
- Yard & garden advice (soil condition, frost risk, watering needs)
- Travel & driving outlook (highway conditions, wind/ice/fog watch)
- Clothing recommendation for today

Format as clean, well-spaced markdown."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
