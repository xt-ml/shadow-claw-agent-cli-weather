#!/usr/bin/env bash
# weather-ask.sh — Ask follow-up weather questions via unix pipes with ZERO tool noise (location-agnostic)
#
# Usage:
#   ./bin/weather-ask.sh "<question>"
#   ./bin/weather-ask.sh "<question>" "Toronto, Ontario, Canada"
#   ./bin/weather-ask.sh "<question>" --location "Chicago, Illinois, United States of America"
#   cat reports/weather-now.md | ./bin/weather-ask.sh "<question>"
#   cat reports/weather-forecast.md | ./bin/weather-ask.sh "What is the best day for yard work?"
#   ./bin/weather-now.sh | ./bin/weather-ask.sh "Do I need a jacket?"
#
# Context noise is kept to absolute zero by passing `--tools none`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORTS_DIR="$ROOT_DIR/reports"

SC="npx shadow-claw"

QUESTION=""
LOCATION_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--location)
      LOCATION_ARG="$2"
      shift 2
      ;;
    *)
      if [[ -z "$QUESTION" ]]; then
        QUESTION="$1"
      else
        LOCATION_ARG="$1"
      fi
      shift
      ;;
  esac
done

QUESTION="${QUESTION:-What are the key weather highlights and what should I prepare for?}"

eval "$(node "$SCRIPT_DIR/resolve-location.mjs" ${LOCATION_ARG:+"$LOCATION_ARG"})"

# Check if data is piped via stdin
PIPED_INPUT=""
if [ ! -t 0 ]; then
  PIPED_INPUT="$(cat)"
fi

# If no data piped via stdin, pull from existing weather report files
CONTEXT=""
if [[ -n "$PIPED_INPUT" ]]; then
  CONTEXT="$PIPED_INPUT"
else
  # Combine available reports so forecast is not shadowed by current conditions
  if [[ -f "$REPORTS_DIR/weather-now.md" ]]; then
    CONTEXT+="### Current Conditions (reports/weather-now.md):"$'\n'"$(cat "$REPORTS_DIR/weather-now.md")"$'\n\n'
  fi
  if [[ -f "$REPORTS_DIR/weather-forecast.md" ]]; then
    CONTEXT+="### Forecast (reports/weather-forecast.md):"$'\n'"$(cat "$REPORTS_DIR/weather-forecast.md")"$'\n\n'
  fi
  if [[ -f "$REPORTS_DIR/weather-window.md" ]]; then
    CONTEXT+="### Condition Window Analysis (reports/weather-window.md):"$'\n'"$(cat "$REPORTS_DIR/weather-window.md")"$'\n\n'
  fi
fi

if [[ -n "$CONTEXT" ]]; then
  PROMPT="Here is the weather context for ${LOC_NAME}:

${CONTEXT}

Question: ${QUESTION}
Please provide a direct, helpful answer based on the weather data above."
else
  PROMPT="Question about ${LOC_NAME}: ${QUESTION}"
fi

$SC agent run \
  --workspace "$ROOT_DIR/.cache" \
  --database-dir "$ROOT_DIR/.cache/database" \
  --tools none \
  --no-stream \
  -y \
  "$PROMPT"
