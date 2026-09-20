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
LOCATION_ARG=""
MODEL_ARG=""
PROVIDER_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    -m|--model)
      MODEL_ARG="$2"
      shift 2
      ;;
    -p|--provider)
      PROVIDER_ARG="$2"
      shift 2
      ;;
    *)
      LOCATION_ARG="$1"
      shift
      ;;
  esac
done

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

# Ensure all timestamps use local time for the weather station location (e.g. America/Chicago)
DATE_STR=$(TZ="$LOC_TZ" date '+%A, %B %d, %Y — %I:%M %p %Z')
MONTH=$(TZ="$LOC_TZ" date +%B)
YEAR=$(TZ="$LOC_TZ" date +%Y)
READING_TIME=$(TZ="$LOC_TZ" date '+%I:%M %p %Z on %A, %B %d, %Y')

echo "🌤️  Building daily weather briefing for ${LOC_NAME}..." >&2
echo "    Observation Time: ${READING_TIME}" >&2
echo "" >&2

URL_FORECAST="https://api.open-meteo.com/v1/forecast?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${LOC_TZ_ENCODED}&forecast_days=7&forecast_hours=48"
URL_AIR_QUALITY="https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LOC_LAT}&longitude=${LOC_LON}&current=european_aqi,pm10,pm2_5,uv_index&timezone=${LOC_TZ_ENCODED}"
RAW_DATA_OUT="$REPORTS_DIR/weather-data.json"

# Retain raw weather metrics to reports/weather-data.json
node --input-type=module -e '
  import fs from "node:fs";
  const [url1, url2, outPath, locName, locTz, readingTime] = process.argv.slice(1);
  try {
    const [forecast, airQuality] = await Promise.all([
      fetch(url1).then(r => r.json()),
      fetch(url2).then(r => r.json())
    ]);
    const payload = {
      location: locName,
      timezone: locTz,
      observationTime: readingTime,
      retrievedAtUtc: new Date().toISOString(),
      units: {
        temperature: "fahrenheit",
        windSpeed: "mph",
        precipitation: "inch"
      },
      forecast,
      airQuality
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
  } catch (err) {
    console.error("Warning: Failed to save raw weather data:", err.message);
    process.exit(1);
  }
' "$URL_FORECAST" "$URL_AIR_QUALITY" "$RAW_DATA_OUT" "$LOC_NAME" "$LOC_TZ" "$READING_TIME"

EXTRA_AGENT_ARGS=()
if [[ -n "$PROVIDER_ARG" ]]; then
  EXTRA_AGENT_ARGS+=(--provider "$PROVIDER_ARG")
fi
if [[ -n "$MODEL_ARG" ]]; then
  EXTRA_AGENT_ARGS+=(--model "$MODEL_ARG")
fi

export TRANSFORMERS_JS_REQUEST_TIMEOUT_MS="${TRANSFORMERS_JS_REQUEST_TIMEOUT_MS:-600000}"

cat "$RAW_DATA_OUT" | $SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  "${EXTRA_AGENT_ARGS[@]}" \
  --allow-internet \
  --tools none \
  --system-prompt-file "$ROOT_DIR/.cache/MEMORY.md" \
  --no-stream \
  -y \
  -o "$OUT" \
  "You are an expert meteorological advisor. Standard input contains the latest Open-Meteo weather forecast and air quality JSON metrics for ${LOC_NAME} in US English customary units (Fahrenheit, mph, inches).

Synthesize this data into a comprehensive daily weather briefing for ${LOC_NAME}.

IMPORTANT INSTRUCTIONS:
- Station Observation Time: You MUST state the exact weather station observation date and time in ${LOC_NAME} local time (${READING_TIME}). Never display UTC.
- Units: ALL temperatures MUST be in Fahrenheit (°F), wind speeds in miles per hour (mph), and precipitation/snow in inches (in). Do NOT use metric units (no Celsius, km/h, or mm).

Heading: Weather Briefing — ${LOC_NAME} — ${DATE_STR}

Report structure:
## 1. 🌡️ Current Conditions
- Station Observation Time: **${READING_TIME}** (local time)
- Temperature & feels-like (°F), condition description, humidity, dew point (°F), wind (speed and gusts in mph, direction), precipitation today (inches)

## 2. 🌬️ Air Quality & UV
- European AQI, PM2.5, PM10, UV index (and sun protection advice if applicable)

## 3. 📅 7-Day Forecast Highlights
- A clean markdown table: Date | Condition | High (°F) | Low (°F) | Precip (in) | Wind / Gusts (mph)
- Notable weather events (cold snaps, heavy rain/snow, high wind days)

## 4. 🚜 Practical Living Advice (${LOC_NAME} — ${MONTH} ${YEAR})
- Yard & garden advice (soil condition, frost risk, watering needs)
- Travel & driving outlook (highway conditions, wind/ice/fog watch)
- Clothing recommendation for today

Format as clean, well-spaced markdown."

echo ""
echo "✅ Saved to: $OUT"
cat "$OUT"
